import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },
  medicineName: {
    type: String,
    required: true,
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
  },
  batchNumber: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: Date,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  mrp: {
    type: Number,
    required: true,
  },
  discountPercent: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  gstRate: {
    type: Number,
    default: 12,
  },
  cgstAmount: {
    type: Number,
    default: 0,
  },
  sgstAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      default: 'Cash Customer',
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    doctorName: {
      type: String,
      trim: true,
    },
    doctorRegNo: {
      type: String,
      trim: true,
    },
    hasScheduleH: {
      type: Boolean,
      default: false,
    },
    orderType: {
      type: String,
      enum: ['IN_STORE', 'DELIVERY', 'ONLINE_PICKUP'],
      default: 'IN_STORE',
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'PREPARING', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      default: 'DELIVERED',
      index: true,
    },
    deliveryAddress: {
      type: String,
      trim: true,
    },
    deliveryLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date,
    },
    deliveredAt: {
      type: Date,
    },
    items: [saleItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    cgstTotal: {
      type: Number,
      default: 0,
    },
    sgstTotal: {
      type: Number,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'RAZORPAY_ONLINE', 'CREDIT'],
      default: 'CASH',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'FAILED', 'REFUNDED'],
      default: 'PAID',
      index: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    notes: {
      type: String,
    },
    billedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

saleSchema.index({ createdAt: -1 });

export default mongoose.model('Sale', saleSchema);
