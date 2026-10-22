import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
      index: true,
    },
    strength: {
      type: String,
      trim: true,
    },
    dosageForm: {
      type: String,
      default: 'Tablet',
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    hsnCode: {
      type: String,
      default: '30049099',
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    rackLocation: {
      type: String,
      default: 'Rack A-1',
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstRate: {
      type: Number,
      default: 12,
    },
    reorderLevel: {
      type: Number,
      default: 15,
      min: 0,
    },
    isPrescriptionRequired: {
      type: Boolean,
      default: false,
    },
    isScheduleH: {
      type: Boolean,
      default: false,
    },
    isScheduleH1: {
      type: Boolean,
      default: false,
    },
    isScheduleX: {
      type: Boolean,
      default: false,
    },
    isColdChain: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

medicineSchema.index({ name: 'text', genericName: 'text', brand: 'text' });

export default mongoose.model('Medicine', medicineSchema);
