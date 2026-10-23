import dns from 'node:dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Batch from '../models/Batch.js';
import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import Sale from '../models/Sale.js';
import StockMovement from '../models/StockMovement.js';
import StoreSettings from '../models/StoreSettings.js';

dotenv.config();

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // safe fallback
}

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmacy_store';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected! Dropping old database & indexes...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped cleanly.');

    console.log('Creating Store Settings...');
    await StoreSettings.create({
      storeName: 'Shree Ganesh Medical & General Stores',
      address: 'Shop No. 4, Shivaji Chowk, Miraj - Sangli Road, Sangli, Maharashtra 416416',
      phone: '+91 98220 12345',
      email: 'contact@shreeganeshmedical.com',
      gstin: '27AABCU9603R1ZM',
      drugLicense20B: 'MH-SAN-20B-11428',
      drugLicense21B: 'MH-SAN-21B-11429',
      pharmacistName: 'D. M. Patil, D.Pharm (Reg. 98452)',
      invoicePrefix: 'SGM-26-',
      lowStockThresholdDefault: 15,
      nearExpiryDaysThreshold: 60,
    });

    console.log('Creating User Accounts...');
    const salt = await bcrypt.genSalt(10);
    const [adminUser, pharmacistUser, cashierUser, deliveryUser] = await Promise.all([
      User.create({
        name: 'Ganesh Patil (Owner)',
        email: 'admin@ganeshpharmacy.com',
        password: await bcrypt.hash('admin123', salt),
        role: 'OWNER_ADMIN',
        phone: '9822012345',
      }),
      User.create({
        name: 'D. M. Patil (Reg. Pharmacist)',
        email: 'pharmacist@ganeshpharmacy.com',
        password: await bcrypt.hash('pharm123', salt),
        role: 'PHARMACIST',
        phone: '9822054321',
      }),
      User.create({
        name: 'Rohan Shinde (Cashier)',
        email: 'cashier@ganeshpharmacy.com',
        password: await bcrypt.hash('cash123', salt),
        role: 'STAFF_CASHIER',
        phone: '9822098765',
      }),
      User.create({
        name: 'Sachin Kadam (Delivery)',
        email: 'delivery@ganeshpharmacy.com',
        password: await bcrypt.hash('deliv123', salt),
        role: 'DELIVERY_PARTNER',
        phone: '9822067890',
      }),
    ]);

    console.log('Creating Suppliers...');
    const [sup1, sup2, sup3] = await Promise.all([
      Supplier.create({
        name: 'Sangli Medico Distributors',
        contactPerson: 'Vilasrao Deshmukh',
        phone: '0233-2374567',
        email: 'orders@sanglimedico.in',
        address: '14, Market Yard, Sangli, MH 416416',
        gstin: '27AACCM1234F1Z8',
        drugLicenseNumber: 'MH-SAN-20B-78901',
        paymentTerms: 'Credit 21 Days',
      }),
      Supplier.create({
        name: 'Apollo Generic Pharma Miraj',
        contactPerson: 'Mahesh Kulkarni',
        phone: '0233-2228899',
        email: 'supply@apollomiraj.com',
        address: 'Plot 55, MIDC, Miraj, MH 416410',
        gstin: '27AAGCA9988D1Z2',
        drugLicenseNumber: 'MH-SAN-20B-55441',
        paymentTerms: 'Credit 15 Days',
      }),
      Supplier.create({
        name: 'Kolhapur Health Supplies Hub',
        contactPerson: 'Sunil Jadhav',
        phone: '0231-2651122',
        email: 'info@kolhapurhealth.com',
        address: 'Shahupuri 3rd Lane, Kolhapur, MH 416001',
        gstin: '27BBKPS4433E1Z5',
        drugLicenseNumber: 'MH-KOP-20B-33214',
        paymentTerms: 'Immediate / 7 Days',
      }),
    ]);

    console.log('Creating Medicine Catalogue...');
    const medicinesData = [
      {
        name: 'Dolo 650 Tablet',
        genericName: 'Paracetamol 650mg',
        brand: 'Dolo',
        category: 'Analgesics / Antipyretics',
        dosageForm: 'Tablet',
        strength: '650mg',
        manufacturer: 'Micro Labs Ltd',
        hsnCode: '30049060',
        barcode: '890111700101',
        rackLocation: 'Rack A-1',
        purchasePrice: 24.5,
        sellingPrice: 30.0,
        mrp: 32.5,
        gstRate: 12,
        reorderLevel: 25,
        isPrescriptionRequired: false,
        isScheduleH: false,
        isColdChain: false,
      },
      {
        name: 'Augmentin 625 Duo Tablet',
        genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
        brand: 'Augmentin',
        category: 'Antibiotics',
        dosageForm: 'Tablet',
        strength: '625mg',
        manufacturer: 'GlaxoSmithKline Pharmaceuticals',
        hsnCode: '30041000',
        barcode: '890104300202',
        rackLocation: 'Rack B-2 (Schedule H)',
        purchasePrice: 155.0,
        sellingPrice: 195.0,
        mrp: 204.5,
        gstRate: 12,
        reorderLevel: 15,
        isPrescriptionRequired: true,
        isScheduleH: true,
        isColdChain: false,
      },
      {
        name: 'Azee 500 Tablet',
        genericName: 'Azithromycin 500mg',
        brand: 'Azee',
        category: 'Antibiotics',
        dosageForm: 'Tablet',
        strength: '500mg',
        manufacturer: 'Cipla Ltd',
        hsnCode: '30042019',
        barcode: '890111700303',
        rackLocation: 'Rack B-3 (Schedule H)',
        purchasePrice: 92.0,
        sellingPrice: 118.0,
        mrp: 125.0,
        gstRate: 12,
        reorderLevel: 12,
        isPrescriptionRequired: true,
        isScheduleH: true,
        isColdChain: false,
      },
      {
        name: 'Pan 40 Tablet',
        genericName: 'Pantoprazole Gastro-resistant 40mg',
        brand: 'Pan',
        category: 'Gastrointestinal',
        dosageForm: 'Tablet',
        strength: '40mg',
        manufacturer: 'Alkem Laboratories Ltd',
        hsnCode: '30049099',
        barcode: '890111700404',
        rackLocation: 'Rack C-1',
        purchasePrice: 115.0,
        sellingPrice: 145.0,
        mrp: 155.0,
        gstRate: 12,
        reorderLevel: 20,
        isPrescriptionRequired: false,
        isScheduleH: false,
        isColdChain: false,
      },
      {
        name: 'Telma 40 Tablet',
        genericName: 'Telmisartan 40mg',
        brand: 'Telma',
        category: 'Cardiovascular',
        dosageForm: 'Tablet',
        strength: '40mg',
        manufacturer: 'Glenmark Pharmaceuticals',
        hsnCode: '30049099',
        barcode: '890111700505',
        rackLocation: 'Rack D-1 (Schedule H)',
        purchasePrice: 160.0,
        sellingPrice: 205.0,
        mrp: 220.0,
        gstRate: 12,
        reorderLevel: 15,
        isPrescriptionRequired: true,
        isScheduleH: true,
        isColdChain: false,
      },
      {
        name: 'Glycomet 500 SR Tablet',
        genericName: 'Metformin Hydrochloride (Sustained Release) 500mg',
        brand: 'Glycomet',
        category: 'Anti-Diabetic',
        dosageForm: 'Tablet',
        strength: '500mg',
        manufacturer: 'USV Pvt Ltd',
        hsnCode: '30049099',
        barcode: '890111700606',
        rackLocation: 'Rack D-3',
        purchasePrice: 38.0,
        sellingPrice: 48.0,
        mrp: 52.0,
        gstRate: 12,
        reorderLevel: 30,
        isPrescriptionRequired: true,
        isScheduleH: false,
        isColdChain: false,
      },
      {
        name: 'Cetzine 10 Tablet',
        genericName: 'Cetirizine Dihydrochloride 10mg',
        brand: 'Cetzine',
        category: 'Antihistamines',
        dosageForm: 'Tablet',
        strength: '10mg',
        manufacturer: "Dr. Reddy's Laboratories",
        hsnCode: '30049099',
        barcode: '890111700707',
        rackLocation: 'Rack A-4',
        purchasePrice: 16.0,
        sellingPrice: 22.0,
        mrp: 24.5,
        gstRate: 12,
        reorderLevel: 20,
        isPrescriptionRequired: false,
        isScheduleH: false,
        isColdChain: false,
      },
      {
        name: 'Lantus Solostar Insulin Pen',
        genericName: 'Insulin Glargine 100 IU/ml',
        brand: 'Lantus',
        category: 'Anti-Diabetic (Insulin)',
        dosageForm: 'Injection',
        strength: '100 IU/ml (3ml Pen)',
        manufacturer: 'Sanofi India Ltd',
        hsnCode: '30043110',
        barcode: '890111700808',
        rackLocation: 'Refrigerator (2°C - 8°C)',
        purchasePrice: 580.0,
        sellingPrice: 710.0,
        mrp: 749.0,
        gstRate: 5,
        reorderLevel: 8,
        isPrescriptionRequired: true,
        isScheduleH: true,
        isColdChain: true,
      },
      {
        name: 'Ascoril D Plus Syrup 100ml',
        genericName: 'Dextromethorphan + Chlorpheniramine + Phenylephrine',
        brand: 'Ascoril',
        category: 'Respiratory / Cough',
        dosageForm: 'Syrup',
        strength: '100ml',
        manufacturer: 'Glenmark Pharmaceuticals',
        hsnCode: '30049099',
        barcode: '890111700909',
        rackLocation: 'Rack S-1',
        purchasePrice: 90.0,
        sellingPrice: 120.0,
        mrp: 128.0,
        gstRate: 12,
        reorderLevel: 15,
        isPrescriptionRequired: false,
        isScheduleH: false,
        isColdChain: false,
      },
      {
        name: 'Becadexamin Softgel Capsules',
        genericName: 'Multivitamins and Minerals',
        brand: 'Becadexamin',
        category: 'Nutritional / Vitamins',
        dosageForm: 'Capsule',
        strength: '30 Capsules',
        manufacturer: 'GlaxoSmithKline Pharmaceuticals',
        hsnCode: '30045020',
        barcode: '890111701010',
        rackLocation: 'Rack V-1',
        purchasePrice: 38.0,
        sellingPrice: 48.0,
        mrp: 52.0,
        gstRate: 12,
        reorderLevel: 20,
        isPrescriptionRequired: false,
        isScheduleH: false,
        isColdChain: false,
      },
    ];

    const createdMeds = await Medicine.insertMany(medicinesData);

    console.log('Creating Realistic Batches for Medicines...');
    const now = new Date();
    const batchesData = [];

    // Batch generator for each medicine
    createdMeds.forEach((med, idx) => {
      // 1. Primary fresh batch
      const exp1 = new Date(now);
      exp1.setMonth(exp1.getMonth() + 18 + idx);
      batchesData.push({
        medicine: med._id,
        batchNumber: `BAT-${2400 + idx}`,
        expiryDate: exp1,
        quantityReceived: 100,
        availableQuantity: 75,
        purchaseCost: med.purchasePrice,
        sellingPrice: med.sellingPrice,
        mrp: med.mrp,
        supplier: sup1._id,
        purchaseInvoiceNumber: `INV-SM-2026-${100 + idx}`,
        status: 'ACTIVE',
      });

      // 2. Near-Expiry batch for some medicines (e.g. idx 0 and 2)
      if (idx === 0 || idx === 2) {
        const expNear = new Date(now);
        expNear.setDate(expNear.getDate() + 35); // 35 days remaining
        batchesData.push({
          medicine: med._id,
          batchNumber: `EXP-NEAR-${idx}`,
          expiryDate: expNear,
          quantityReceived: 40,
          availableQuantity: 12,
          purchaseCost: med.purchasePrice,
          sellingPrice: med.sellingPrice,
          mrp: med.mrp,
          supplier: sup2._id,
          purchaseInvoiceNumber: `INV-AP-2025-88`,
          status: 'ACTIVE',
        });
      }

      // 3. Low-Stock batch for index 1 (Augmentin)
      if (idx === 1) {
        const exp2 = new Date(now);
        exp2.setMonth(exp2.getMonth() + 8);
        batchesData.push({
          medicine: med._id,
          batchNumber: `LOW-STK-01`,
          expiryDate: exp2,
          quantityReceived: 50,
          availableQuantity: 4, // Below reorder level (15)
          purchaseCost: med.purchasePrice,
          sellingPrice: med.sellingPrice,
          mrp: med.mrp,
          supplier: sup3._id,
          purchaseInvoiceNumber: `INV-KH-2025-45`,
          status: 'ACTIVE',
        });
      }
    });

    const createdBatches = await Batch.insertMany(batchesData);

    console.log('Generating Initial Stock Movements...');
    const movements = createdBatches.map((b) => ({
      batch: b._id,
      medicine: b.medicine,
      movementType: 'PURCHASE',
      quantityDelta: b.quantityReceived,
      previousQuantity: 0,
      newQuantity: b.quantityReceived,
      reason: 'Initial inventory seeding',
      referenceModel: 'Supplier',
      referenceId: b.supplier,
      performedBy: adminUser._id,
    }));
    await StockMovement.insertMany(movements);

    console.log('Creating Realistic Past Sales for Analytics...');
    // Create sales distributed across the past 7 days
    const pastSales = [];
    for (let day = 6; day >= 0; day--) {
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - day);

      // Create 2-3 sales per day
      const dailyBills = day === 0 ? 3 : 2;
      for (let b = 0; b < dailyBills; b++) {
        const bTime = new Date(saleDate);
        bTime.setHours(10 + b * 3, 15 + b * 10, 0, 0);

        const doloBatch = createdBatches[0];
        const panBatch = createdBatches[3];

        const saleItems = [
          {
            medicine: createdMeds[0]._id,
            medicineName: createdMeds[0].name,
            batch: doloBatch._id,
            batchNumber: doloBatch.batchNumber,
            expiryDate: doloBatch.expiryDate,
            quantity: 2,
            unitPrice: createdMeds[0].sellingPrice,
            mrp: createdMeds[0].mrp,
            discountPercent: 5,
            discountAmount: 3.0,
            gstRate: 12,
            cgstAmount: 3.42,
            sgstAmount: 3.42,
            totalAmount: 63.84,
          },
          {
            medicine: createdMeds[3]._id,
            medicineName: createdMeds[3].name,
            batch: panBatch._id,
            batchNumber: panBatch.batchNumber,
            expiryDate: panBatch.expiryDate,
            quantity: 1,
            unitPrice: createdMeds[3].sellingPrice,
            mrp: createdMeds[3].mrp,
            discountPercent: 0,
            discountAmount: 0,
            gstRate: 12,
            cgstAmount: 8.7,
            sgstAmount: 8.7,
            totalAmount: 162.4,
          },
        ];

        const subtotal = 205.0;
        const discountTotal = 3.0;
        const cgstTotal = 12.12;
        const sgstTotal = 12.12;
        const grandTotal = 226;

        pastSales.push({
          invoiceNumber: `SGM-26-${String(pastSales.length + 1001)}`,
          customerName: b === 0 ? 'Ramesh Kulkarni' : b === 1 ? 'Sunita Patil' : 'Sachin Shinde',
          customerPhone: '982200000' + b,
          customerEmail: 'patient' + b + '@gmail.com',
          orderType: b === 1 ? 'DELIVERY' : 'IN_STORE',
          deliveryStatus: b === 1 ? (day === 0 ? 'OUT_FOR_DELIVERY' : 'DELIVERED') : 'DELIVERED',
          deliveryAddress: b === 1 ? 'Flat 302, Sai Residency, Vishrambag, Sangli' : undefined,
          deliveryLocation: b === 1 ? { latitude: 16.8524, longitude: 74.5815, updatedAt: bTime } : undefined,
          items: saleItems,
          subtotal,
          discountTotal,
          cgstTotal,
          sgstTotal,
          roundOff: -0.24,
          grandTotal,
          paymentMethod: b === 0 ? 'CASH' : b === 1 ? 'UPI' : 'RAZORPAY_ONLINE',
          paymentStatus: 'PAID',
          paidAmount: grandTotal,
          billedBy: cashierUser._id,
          createdAt: bTime,
          updatedAt: bTime,
        });
      }
    }

    await Sale.insertMany(pastSales);

    console.log('===========================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('🏥 Medical Store: Shree Ganesh Medical, Sangli, MH');
    console.log('👤 Admin:      admin@ganeshpharmacy.com      / admin123');
    console.log('👤 Pharmacist: pharmacist@ganeshpharmacy.com / pharm123');
    console.log('👤 Cashier:    cashier@ganeshpharmacy.com    / cash123');
    console.log('👤 Delivery:   delivery@ganeshpharmacy.com   / deliv123');
    console.log(`📦 Seeded: ${createdMeds.length} Medicines, ${createdBatches.length} Batches, ${pastSales.length} Historical Sales`);
    console.log('===========================================================');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
