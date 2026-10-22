import mongoose from 'mongoose';

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      default: 'Shree Ganesh Medical & General Stores',
    },
    address: {
      type: String,
      required: true,
      default: 'Shop No. 4, Shivaji Chowk, Miraj - Sangli Road, Sangli, Maharashtra 416416',
    },
    phone: {
      type: String,
      default: '+91 98220 12345',
    },
    email: {
      type: String,
      default: 'contact@shreeganeshmedical.com',
    },
    gstin: {
      type: String,
      default: '27AABCU9603R1ZM',
    },
    drugLicense20B: {
      type: String,
      default: 'MH-SAN-20B-11428',
    },
    drugLicense21B: {
      type: String,
      default: 'MH-SAN-21B-11429',
    },
    pharmacistName: {
      type: String,
      default: 'D. M. Patil, D.Pharm (Reg. 98452)',
    },
    invoicePrefix: {
      type: String,
      default: 'SGM-26-',
    },
    lowStockThresholdDefault: {
      type: Number,
      default: 15,
    },
    nearExpiryDaysThreshold: {
      type: Number,
      default: 60,
    },
    enableSocketAlerts: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('StoreSettings', storeSettingsSchema);
