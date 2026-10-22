import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'EXPIRED_SCRAP', 'DAMAGE'],
      required: true,
    },
    quantityDelta: {
      type: Number,
      required: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    referenceModel: {
      type: String,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

stockMovementSchema.index({ createdAt: -1 });

export default mongoose.model('StockMovement', stockMovementSchema);
