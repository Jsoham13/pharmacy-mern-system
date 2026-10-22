import Sale from '../models/Sale.js';
import Batch from '../models/Batch.js';
import Medicine from '../models/Medicine.js';
import StockMovement from '../models/StockMovement.js';
import StoreSettings from '../models/StoreSettings.js';
import AuditLog from '../models/AuditLog.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../utils/paymentService.js';
import { sendInvoiceEmail } from '../utils/emailService.js';
import {
  emitOrderCreated,
  emitOrderStatusUpdate,
  emitDeliveryLocationUpdate,
  emitInventoryAlert,
} from '../config/socket.js';

const generateInvoiceNumber = async () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const count = await Sale.countDocuments();
  const seq = String(count + 1).padStart(4, '0');
  return `SGM-${dateStr}-${seq}`;
};

export const createSale = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      doctorName,
      doctorRegNo,
      orderType = 'IN_STORE',
      deliveryAddress,
      paymentMethod = 'CASH',
      items,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale must have at least one medicine item' });
    }

    let subtotal = 0;
    let discountTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let hasScheduleH = false;
    const processedItems = [];
    const stockAlerts = [];

    // First verify stock availability for all items before any deduction
    for (const item of items) {
      const batch = await Batch.findById(item.batchId).populate('medicine');
      if (!batch) {
        return res.status(404).json({ success: false, message: `Batch ${item.batchNumber} not found` });
      }

      if (batch.availableQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${batch.medicine.name} (Batch ${batch.batchNumber}). Available: ${batch.availableQuantity}, requested: ${item.quantity}`,
        });
      }

      if (batch.status === 'EXPIRED' || new Date(batch.expiryDate) < new Date()) {
        return res.status(400).json({
          success: false,
          message: `Cannot dispense expired batch: ${batch.medicine.name} (Batch ${batch.batchNumber})`,
        });
      }

      if (batch.medicine.isScheduleH) {
        hasScheduleH = true;
      }
    }

    if (hasScheduleH && (!doctorName || !doctorRegNo)) {
      return res.status(400).json({
        success: false,
        message: 'Prescription details (Doctor Name and Medical Council Reg No) are mandatory for Schedule H medicines',
      });
    }

    // Now process deductions and calculations
    for (const item of items) {
      const batch = await Batch.findById(item.batchId).populate('medicine');
      const unitPrice = item.unitPrice || batch.sellingPrice;
      const mrp = batch.mrp || unitPrice;
      const discountPercent = item.discountPercent || 0;
      const gstRate = item.gstRate || batch.medicine.gstRate || 12;

      const baseAmount = item.quantity * unitPrice;
      const discountAmount = (baseAmount * discountPercent) / 100;
      const taxableAmount = baseAmount - discountAmount;
      const taxHalf = (taxableAmount * (gstRate / 2)) / 100;
      const totalAmount = taxableAmount + taxHalf * 2;

      subtotal += baseAmount;
      discountTotal += discountAmount;
      cgstTotal += taxHalf;
      sgstTotal += taxHalf;

      processedItems.push({
        medicine: batch.medicine._id,
        medicineName: batch.medicine.name,
        batch: batch._id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: item.quantity,
        unitPrice,
        mrp,
        discountPercent,
        discountAmount,
        gstRate,
        cgstAmount: taxHalf,
        sgstAmount: taxHalf,
        totalAmount,
      });

      // Deduct stock
      const prevQty = batch.availableQuantity;
      const newQty = prevQty - item.quantity;
      batch.availableQuantity = newQty;
      if (newQty === 0) {
        batch.status = 'OUT_OF_STOCK';
      }
      await batch.save();

      // Log movement
      await StockMovement.create({
        batch: batch._id,
        medicine: batch.medicine._id,
        movementType: 'SALE',
        quantityDelta: -item.quantity,
        previousQuantity: prevQty,
        newQuantity: newQty,
        reason: 'Counter sale / prescription dispense',
        referenceModel: 'Sale',
        performedBy: req.user._id,
      });

      // Low stock check
      const threshold = batch.medicine.reorderLevel || 10;
      if (newQty <= threshold) {
        stockAlerts.push({
          type: 'LOW_STOCK',
          medicineName: batch.medicine.name,
          batchNumber: batch.batchNumber,
          availableQuantity: newQty,
          threshold,
        });
      }
    }

    const calculatedTotal = subtotal - discountTotal + cgstTotal + sgstTotal;
    const grandTotal = Math.round(calculatedTotal);
    const roundOff = +(grandTotal - calculatedTotal).toFixed(2);
    const invoiceNumber = await generateInvoiceNumber();

    const isOnlinePayment = paymentMethod === 'RAZORPAY_ONLINE';
    let paymentStatus = isOnlinePayment ? 'PENDING' : 'PAID';
    let razorpayDetails = {};

    if (isOnlinePayment) {
      const rzpOrder = await createRazorpayOrder(grandTotal, invoiceNumber);
      razorpayDetails = {
        razorpayOrderId: rzpOrder.orderId,
      };
    }

    const sale = await Sale.create({
      invoiceNumber,
      customerName: customerName || 'Cash Customer',
      customerPhone,
      customerEmail,
      doctorName,
      doctorRegNo,
      hasScheduleH,
      orderType,
      deliveryStatus: orderType === 'DELIVERY' ? 'PENDING' : 'DELIVERED',
      deliveryAddress,
      items: processedItems,
      subtotal,
      discountTotal,
      cgstTotal,
      sgstTotal,
      roundOff,
      grandTotal,
      paymentMethod,
      paymentStatus,
      paidAmount: paymentStatus === 'PAID' ? grandTotal : 0,
      ...razorpayDetails,
      notes,
      billedBy: req.user._id,
    });

    // Update StockMovement with the actual sale ID
    await StockMovement.updateMany(
      { movementType: 'SALE', referenceId: { $exists: false }, performedBy: req.user._id },
      { referenceId: sale._id }
    );

    // Audit Log
    await AuditLog.create({
      action: 'SALE_COMPLETED',
      performedBy: req.user._id,
      entityType: 'Sale',
      entityId: sale._id,
      details: { invoiceNumber, grandTotal, paymentMethod, orderType },
    });

    // Emit live Socket.IO events
    emitOrderCreated({
      id: sale._id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      grandTotal: sale.grandTotal,
      orderType: sale.orderType,
      deliveryStatus: sale.deliveryStatus,
      paymentStatus: sale.paymentStatus,
      createdAt: sale.createdAt,
    });

    for (const alert of stockAlerts) {
      emitInventoryAlert(alert);
    }

    return res.status(201).json({
      success: true,
      sale,
      razorpayOrder: isOnlinePayment ? razorpayDetails : null,
    });
  } catch (error) {
    console.error('Sale error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { saleId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature verification' });
    }

    sale.paymentStatus = 'PAID';
    sale.paidAmount = sale.grandTotal;
    sale.razorpayPaymentId = razorpayPaymentId;
    sale.razorpaySignature = razorpaySignature;
    await sale.save();

    emitOrderStatusUpdate({
      saleId: sale._id,
      invoiceNumber: sale.invoiceNumber,
      paymentStatus: 'PAID',
      deliveryStatus: sale.deliveryStatus,
    });

    return res.json({ success: true, message: 'Payment verified successfully', sale });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const { orderType, paymentStatus, deliveryStatus, startDate, endDate, search } = req.query;
    const filter = {};

    if (orderType) filter.orderType = orderType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (deliveryStatus) filter.deliveryStatus = deliveryStatus;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = eDate;
      }
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { invoiceNumber: regex },
        { customerName: regex },
        { customerPhone: regex },
      ];
    }

    const sales = await Sale.find(filter)
      .populate('billedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ success: true, count: sales.length, sales });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('billedBy', 'name email role');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    return res.json({ success: true, sale });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    let store = await StoreSettings.findOne();
    if (!store) {
      store = await StoreSettings.create({});
    }

    const pdfBuffer = await generateInvoicePDF(sale, store);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice_${sale.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    console.error('PDF invoice generation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const emailInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientEmail } = req.body;

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const targetEmail = recipientEmail || sale.customerEmail;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'No customer email address on record' });
    }

    let store = await StoreSettings.findOne();
    if (!store) {
      store = await StoreSettings.create({});
    }

    const pdfBuffer = await generateInvoicePDF(sale, store);
    const result = await sendInvoiceEmail(targetEmail, sale.customerName, sale.invoiceNumber, pdfBuffer);

    return res.json({ success: true, message: result.message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStatus, latitude, longitude, remarks } = req.body;

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (deliveryStatus) {
      sale.deliveryStatus = deliveryStatus;
      if (deliveryStatus === 'DELIVERED') {
        sale.deliveredAt = new Date();
      }
    }

    if (latitude !== undefined && longitude !== undefined) {
      sale.deliveryLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        updatedAt: new Date(),
      };

      emitDeliveryLocationUpdate({
        saleId: sale._id,
        invoiceNumber: sale.invoiceNumber,
        deliveryStatus: sale.deliveryStatus,
        location: sale.deliveryLocation,
      });
    }

    await sale.save();

    emitOrderStatusUpdate({
      saleId: sale._id,
      invoiceNumber: sale.invoiceNumber,
      deliveryStatus: sale.deliveryStatus,
      paymentStatus: sale.paymentStatus,
    });

    return res.json({ success: true, sale });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createReturn = async (req, res) => {
  try {
    const { saleId, items, reason, restockApproved } = req.body;

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Original sale invoice not found' });
    }

    let refundAmount = 0;

    for (const retItem of items) {
      refundAmount += retItem.refundAmount || 0;

      if (restockApproved) {
        const batch = await Batch.findById(retItem.batchId).populate('medicine');
        if (batch) {
          const prevQty = batch.availableQuantity;
          batch.availableQuantity += retItem.quantity;
          if (batch.status === 'OUT_OF_STOCK' && batch.availableQuantity > 0) {
            batch.status = 'ACTIVE';
          }
          await batch.save();

          await StockMovement.create({
            batch: batch._id,
            medicine: batch.medicine._id,
            movementType: 'RETURN',
            quantityDelta: retItem.quantity,
            previousQuantity: prevQty,
            newQuantity: prevQty + retItem.quantity,
            reason: `Customer return from invoice ${sale.invoiceNumber}: ${reason}`,
            referenceModel: 'Sale',
            referenceId: sale._id,
            performedBy: req.user._id,
          });
        }
      }
    }

    await AuditLog.create({
      action: 'SALE_RETURN',
      performedBy: req.user._id,
      entityType: 'Sale',
      entityId: sale._id,
      details: { refundAmount, reason, restockApproved },
    });

    return res.json({
      success: true,
      message: 'Return processed successfully',
      refundAmount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
