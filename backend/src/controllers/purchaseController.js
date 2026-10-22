import Purchase from '../models/Purchase.js';
import Batch from '../models/Batch.js';
import Medicine from '../models/Medicine.js';
import StockMovement from '../models/StockMovement.js';
import AuditLog from '../models/AuditLog.js';

export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplier', 'name gstin phone')
      .populate('receivedBy', 'name')
      .sort({ purchaseDate: -1 });

    return res.json({ success: true, count: purchases.length, purchases });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchase = async (req, res) => {
  try {
    const {
      supplierId,
      invoiceNumber,
      invoiceDate,
      items,
      paymentMethod,
      paymentStatus,
      paidAmount,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Purchase must contain at least one item' });
    }

    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const lineSubtotal = item.quantity * item.purchaseCost;
      const gst = item.gstRate || 12;
      const taxHalf = (lineSubtotal * (gst / 2)) / 100;
      const totalAmount = lineSubtotal + taxHalf * 2;

      subtotal += lineSubtotal;
      cgstTotal += taxHalf;
      sgstTotal += taxHalf;

      processedItems.push({
        medicine: item.medicineId,
        medicineName: item.medicineName,
        batchNumber: item.batchNumber.trim().toUpperCase(),
        expiryDate: new Date(item.expiryDate),
        quantity: item.quantity,
        freeQuantity: item.freeQuantity || 0,
        purchaseCost: item.purchaseCost,
        sellingPrice: item.sellingPrice,
        mrp: item.mrp,
        gstRate: gst,
        totalAmount,
      });
    }

    const totalTax = cgstTotal + sgstTotal;
    const grandTotal = Math.round(subtotal + totalTax);

    const purchase = await Purchase.create({
      supplier: supplierId,
      invoiceNumber,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      items: processedItems,
      subtotal,
      cgstTotal,
      sgstTotal,
      totalTax,
      grandTotal,
      paymentMethod: paymentMethod || 'CREDIT',
      paymentStatus: paymentStatus || 'UNPAID',
      paidAmount: paidAmount || 0,
      notes,
      receivedBy: req.user._id,
    });

    // Process batches and stock movements
    for (const item of processedItems) {
      const totalUnits = item.quantity + (item.freeQuantity || 0);

      let batch = await Batch.findOne({
        medicine: item.medicine,
        batchNumber: item.batchNumber,
      });

      let previousQty = 0;
      if (batch) {
        previousQty = batch.availableQuantity;
        batch.quantityReceived += totalUnits;
        batch.availableQuantity += totalUnits;
        batch.purchaseCost = item.purchaseCost;
        batch.sellingPrice = item.sellingPrice;
        batch.mrp = item.mrp;
        batch.expiryDate = item.expiryDate;
        batch.status = 'ACTIVE';
        await batch.save();
      } else {
        batch = await Batch.create({
          medicine: item.medicine,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          quantityReceived: totalUnits,
          availableQuantity: totalUnits,
          purchaseCost: item.purchaseCost,
          sellingPrice: item.sellingPrice,
          mrp: item.mrp,
          supplier: supplierId,
          purchaseInvoiceNumber: invoiceNumber,
          status: 'ACTIVE',
        });
      }

      // Record immutable stock movement
      await StockMovement.create({
        batch: batch._id,
        medicine: item.medicine,
        movementType: 'PURCHASE',
        quantityDelta: totalUnits,
        previousQuantity: previousQty,
        newQuantity: previousQty + totalUnits,
        reason: `Goods receipt from supplier bill ${invoiceNumber}`,
        referenceModel: 'Purchase',
        referenceId: purchase._id,
        performedBy: req.user._id,
      });

      // Update medicine default prices
      await Medicine.findByIdAndUpdate(item.medicine, {
        purchasePrice: item.purchaseCost,
        sellingPrice: item.sellingPrice,
        mrp: item.mrp,
      });
    }

    await AuditLog.create({
      action: 'PURCHASE_CREATED',
      performedBy: req.user._id,
      entityType: 'Purchase',
      entityId: purchase._id,
      details: { invoiceNumber, supplierId, grandTotal, itemsCount: items.length },
    });

    return res.status(201).json({ success: true, purchase });
  } catch (error) {
    console.error('Purchase creation error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
