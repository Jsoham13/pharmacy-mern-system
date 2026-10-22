import Medicine from '../models/Medicine.js';
import Batch from '../models/Batch.js';
import AuditLog from '../models/AuditLog.js';

export const getMedicines = async (req, res) => {
  try {
    const { search, category, scheduleH, prescriptionRequired, isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    } else {
      filter.isActive = true;
    }

    if (category) {
      filter.category = category;
    }

    if (scheduleH !== undefined) {
      filter.isScheduleH = scheduleH === 'true';
    }

    if (prescriptionRequired !== undefined) {
      filter.isPrescriptionRequired = prescriptionRequired === 'true';
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { genericName: regex },
        { brand: regex },
        { barcode: regex },
        { manufacturer: regex },
      ];
    }

    const medicines = await Medicine.find(filter).sort({ name: 1 });

    // Aggregate available stock and active batches per medicine
    const medicineIds = medicines.map((m) => m._id);
    const batchAgg = await Batch.aggregate([
      {
        $match: {
          medicine: { $in: medicineIds },
          status: 'ACTIVE',
          availableQuantity: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$medicine',
          totalStock: { $sum: '$availableQuantity' },
          batchesCount: { $sum: 1 },
          nearestExpiry: { $min: '$expiryDate' },
          minSellingPrice: { $min: '$sellingPrice' },
        },
      },
    ]);

    const batchMap = new Map();
    batchAgg.forEach((b) => batchMap.set(b._id.toString(), b));

    const enriched = medicines.map((med) => {
      const bInfo = batchMap.get(med._id.toString()) || {
        totalStock: 0,
        batchesCount: 0,
        nearestExpiry: null,
        minSellingPrice: med.sellingPrice,
      };
      return {
        ...med.toObject(),
        totalStock: bInfo.totalStock,
        batchesCount: bInfo.batchesCount,
        nearestExpiry: bInfo.nearestExpiry,
        activePrice: bInfo.minSellingPrice || med.sellingPrice,
      };
    });

    return res.json({ success: true, count: enriched.length, medicines: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const batches = await Batch.find({ medicine: medicine._id }).sort({ expiryDate: 1 });
    return res.json({ success: true, medicine, batches });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const {
      name,
      genericName,
      brand,
      category,
      dosageForm,
      strength,
      manufacturer,
      hsnCode,
      barcode,
      rackLocation,
      purchasePrice,
      sellingPrice,
      mrp,
      gstRate,
      reorderLevel,
      isPrescriptionRequired,
      isScheduleH,
      isColdChain,
    } = req.body;

    const medicine = await Medicine.create({
      name,
      genericName,
      brand,
      category,
      dosageForm,
      strength,
      manufacturer,
      hsnCode,
      barcode,
      rackLocation,
      purchasePrice,
      sellingPrice,
      mrp,
      gstRate,
      reorderLevel,
      isPrescriptionRequired,
      isScheduleH,
      isColdChain,
    });

    await AuditLog.create({
      action: 'MEDICINE_CREATED',
      performedBy: req.user._id,
      entityType: 'Medicine',
      entityId: medicine._id,
      details: { name: medicine.name, brand: medicine.brand },
    });

    return res.status(201).json({ success: true, medicine });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    await AuditLog.create({
      action: 'MEDICINE_UPDATED',
      performedBy: req.user._id,
      entityType: 'Medicine',
      entityId: medicine._id,
      details: req.body,
    });

    return res.json({ success: true, medicine });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleMedicineStatus = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    medicine.isActive = !medicine.isActive;
    await medicine.save();

    await AuditLog.create({
      action: medicine.isActive ? 'MEDICINE_ACTIVATED' : 'MEDICINE_DEACTIVATED',
      performedBy: req.user._id,
      entityType: 'Medicine',
      entityId: medicine._id,
    });

    return res.json({ success: true, message: `Medicine ${medicine.isActive ? 'activated' : 'deactivated'}`, medicine });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
