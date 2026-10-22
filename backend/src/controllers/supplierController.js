import Supplier from '../models/Supplier.js';
import AuditLog from '../models/AuditLog.js';

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    return res.json({ success: true, count: suppliers.length, suppliers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, gstin, drugLicenseNumber, paymentTerms } = req.body;

    const supplier = await Supplier.create({
      name,
      contactPerson,
      phone,
      email,
      address,
      gstin,
      drugLicenseNumber,
      paymentTerms,
    });

    await AuditLog.create({
      action: 'SUPPLIER_CREATED',
      performedBy: req.user._id,
      entityType: 'Supplier',
      entityId: supplier._id,
      details: { name: supplier.name, gstin: supplier.gstin },
    });

    return res.status(201).json({ success: true, supplier });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    return res.json({ success: true, supplier });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
