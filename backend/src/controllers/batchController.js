import Batch from '../models/Batch.js';
import Medicine from '../models/Medicine.js';
import StockMovement from '../models/StockMovement.js';
import AuditLog from '../models/AuditLog.js';
import { emitInventoryAlert } from '../config/socket.js';

export const getBatches = async (req, res) => {
  try {
    const { status, nearExpiryDays, lowStock, medicineId } = req.query;
    const filter = {};

    if (medicineId) {
      filter.medicine = medicineId;
    }

    if (status) {
      filter.status = status;
    }

    if (nearExpiryDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(nearExpiryDays, 10));
      filter.expiryDate = { $gte: new Date(), $lte: futureDate };
      filter.status = 'ACTIVE';
      filter.availableQuantity = { $gt: 0 };
    }

    let batches = await Batch.find(filter)
      .populate('medicine', 'name genericName brand category reorderLevel rackLocation')
      .populate('supplier', 'name phone')
      .sort({ expiryDate: 1 });

    if (lowStock === 'true') {
      batches = batches.filter(
        (b) => b.medicine && b.availableQuantity <= (b.medicine.reorderLevel || 10)
      );
    }

    return res.json({ success: true, count: batches.length, batches });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBatchesByMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    // FEFO order: First Expiry First Out
    const batches = await Batch.find({
      medicine: medicineId,
      status: 'ACTIVE',
      availableQuantity: { $gt: 0 },
      expiryDate: { $gt: new Date() },
    })
      .populate('medicine', 'name genericName mrp sellingPrice gstRate isScheduleH isPrescriptionRequired')
      .sort({ expiryDate: 1 });

    return res.json({ success: true, count: batches.length, batches });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { batchId, adjustedQuantity, reason, remarks } = req.body;

    const batch = await Batch.findById(batchId).populate('medicine');
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const previousQty = batch.availableQuantity;
    const newQty = parseInt(adjustedQuantity, 10);
    const diff = newQty - previousQty;

    batch.availableQuantity = newQty;
    if (newQty === 0) {
      batch.status = 'OUT_OF_STOCK';
    } else if (batch.status === 'OUT_OF_STOCK' && newQty > 0) {
      batch.status = 'ACTIVE';
    }
    await batch.save();

    // Ledger record
    await StockMovement.create({
      batch: batch._id,
      medicine: batch.medicine._id,
      movementType: 'ADJUSTMENT',
      quantityDelta: diff,
      previousQuantity: previousQty,
      newQuantity: newQty,
      reason: reason || 'Physical count verification',
      referenceModel: 'User',
      referenceId: req.user._id,
      performedBy: req.user._id,
    });

    // Audit log
    await AuditLog.create({
      action: 'STOCK_ADJUSTMENT',
      performedBy: req.user._id,
      entityType: 'Batch',
      entityId: batch._id,
      details: {
        medicine: batch.medicine.name,
        batchNumber: batch.batchNumber,
        previousQty,
        newQty,
        reason,
        remarks,
      },
    });

    // Socket alert if low stock
    if (newQty <= (batch.medicine.reorderLevel || 10)) {
      emitInventoryAlert({
        type: 'LOW_STOCK',
        medicineName: batch.medicine.name,
        batchNumber: batch.batchNumber,
        availableQuantity: newQty,
        threshold: batch.medicine.reorderLevel || 10,
      });
    }

    return res.json({ success: true, message: 'Stock adjusted successfully', batch });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
