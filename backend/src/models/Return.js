import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  quantity: {
    type: Number,
    required: true,
  },
  refundAmount: {
    type: Number,
    required: true,
  },
  isRestocked: {
    type: Boolean,
    default: true,
  },
});

const returnSchema = new mongoose.Schema(
  {
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    returnNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [returnItemSchema],
    totalRefund: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Return', returnSchema);
