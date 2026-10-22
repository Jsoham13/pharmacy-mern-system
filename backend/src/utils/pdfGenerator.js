import PDFDocument from 'pdfkit';

/**
 * Generate PDF Tax Invoice buffer for a completed sale.
 * @param {Object} sale - Sale mongoose document with populated items
 * @param {Object} store - StoreSettings document
 * @returns {Promise<Buffer>}
 */
export const generateInvoicePDF = (sale, store = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const storeName = store.storeName || 'Shree Ganesh Medical & General Stores';
      const address = store.address || 'Shop No. 4, Shivaji Chowk, Miraj - Sangli Road, Sangli, Maharashtra 416416';
      const gstin = store.gstin || '27AABCU9603R1ZM';
      const dl20B = store.drugLicense20B || 'MH-SAN-20B-11428';
      const dl21B = store.drugLicense21B || 'MH-SAN-21B-11429';
      const phone = store.phone || '+91 98220 12345';
      const pharmacist = store.pharmacistName || 'D. M. Patil, D.Pharm (Reg. 98452)';

      // Header Banner
      doc.fontSize(16).font('Helvetica-Bold').text(storeName, { align: 'center' });
      doc.fontSize(9).font('Helvetica').text(address, { align: 'center' });
      doc.text(`Phone: ${phone} | GSTIN: ${gstin}`, { align: 'center' });
      doc.text(`Drug License Nos: 20B: ${dl20B} | 21B: ${dl21B}`, { align: 'center' });
      doc.moveDown(0.5);

      // Line
      doc.moveTo(30, doc.y).lineTo(565, doc.y).stroke('#333333');
      doc.moveDown(0.5);

      // Title
      doc.fontSize(12).font('Helvetica-Bold').text('TAX INVOICE / RETAIL BILL', { align: 'center' });
      doc.moveDown(0.5);

      const billY = doc.y;

      // Left Column: Customer details
      doc.fontSize(9).font('Helvetica-Bold').text('Bill To:', 30, billY);
      doc.font('Helvetica');
      doc.text(`Customer Name: ${sale.customerName || 'Cash Customer'}`);
      if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`);
      if (sale.doctorName) doc.text(`Doctor: Dr. ${sale.doctorName}`);
      if (sale.doctorRegNo) doc.text(`Doctor Reg: ${sale.doctorRegNo}`);

      // Right Column: Invoice Details
      doc.font('Helvetica-Bold').text('Invoice Details:', 350, billY);
      doc.font('Helvetica');
      doc.text(`Invoice No: ${sale.invoiceNumber}`, 350);
      doc.text(`Date: ${new Date(sale.createdAt || Date.now()).toLocaleString('en-IN')}`, 350);
      doc.text(`Payment Mode: ${sale.paymentMethod} (${sale.paymentStatus})`, 350);
      if (sale.orderType) doc.text(`Order Channel: ${sale.orderType}`, 350);

      doc.moveDown(1.5);

      // Items Table Header
      const tableTop = doc.y + 10;
      doc.rect(30, tableTop, 535, 20).fill('#2563eb');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 35, tableTop + 5, { width: 20 });
      doc.text('Medicine / Generic', 60, tableTop + 5, { width: 140 });
      doc.text('Batch', 205, tableTop + 5, { width: 55 });
      doc.text('Expiry', 265, tableTop + 5, { width: 45 });
      doc.text('Qty', 315, tableTop + 5, { width: 25, align: 'right' });
      doc.text('MRP', 345, tableTop + 5, { width: 40, align: 'right' });
      doc.text('Rate', 390, tableTop + 5, { width: 40, align: 'right' });
      doc.text('Disc%', 435, tableTop + 5, { width: 30, align: 'right' });
      doc.text('GST%', 470, tableTop + 5, { width: 30, align: 'right' });
      doc.text('Amount', 505, tableTop + 5, { width: 55, align: 'right' });

      let currentY = tableTop + 24;
      doc.fillColor('#000000').font('Helvetica').fontSize(8);

      sale.items.forEach((item, index) => {
        const itemY = currentY;
        const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(30, itemY - 2, 535, 18).fill(bg);
        doc.fillColor('#1e293b');

        doc.text(String(index + 1), 35, itemY, { width: 20 });
        doc.text(item.medicineName, 60, itemY, { width: 140, height: 12, ellipsis: true });
        doc.text(item.batchNumber, 205, itemY, { width: 55 });
        const expStr = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : '-';
        doc.text(expStr, 265, itemY, { width: 45 });
        doc.text(String(item.quantity), 315, itemY, { width: 25, align: 'right' });
        doc.text(`₹${(item.mrp || item.unitPrice).toFixed(2)}`, 345, itemY, { width: 40, align: 'right' });
        doc.text(`₹${item.unitPrice.toFixed(2)}`, 390, itemY, { width: 40, align: 'right' });
        doc.text(`${item.discountPercent || 0}%`, 435, itemY, { width: 30, align: 'right' });
        doc.text(`${item.gstRate || 12}%`, 470, itemY, { width: 30, align: 'right' });
        doc.text(`₹${item.totalAmount.toFixed(2)}`, 505, itemY, { width: 55, align: 'right' });

        currentY += 18;
      });

      // Total summary box
      doc.moveDown(1);
      const summaryY = currentY + 10;
      doc.moveTo(30, summaryY).lineTo(565, summaryY).stroke('#cccccc');

      const sumDetailsY = summaryY + 8;
      doc.fontSize(8).font('Helvetica');
      doc.text(`Total Items: ${sale.items.length}`, 35, sumDetailsY);
      doc.text(`Total Units: ${sale.items.reduce((acc, it) => acc + it.quantity, 0)}`, 35, sumDetailsY + 12);
      doc.text(`Schedule H Drugs Verified: ${sale.hasScheduleH ? 'YES (Prescription Verified)' : 'NO'}`, 35, sumDetailsY + 24);

      // Right calculations
      const rightColLabel = 400;
      const rightColVal = 490;
      doc.text('Subtotal:', rightColLabel, sumDetailsY);
      doc.text(`₹${(sale.subtotal || 0).toFixed(2)}`, rightColVal, sumDetailsY, { width: 70, align: 'right' });

      doc.text('Total Discount:', rightColLabel, sumDetailsY + 12);
      doc.text(`- ₹${(sale.discountTotal || 0).toFixed(2)}`, rightColVal, sumDetailsY + 12, { width: 70, align: 'right' });

      doc.text('CGST:', rightColLabel, sumDetailsY + 24);
      doc.text(`₹${(sale.cgstTotal || 0).toFixed(2)}`, rightColVal, sumDetailsY + 24, { width: 70, align: 'right' });

      doc.text('SGST:', rightColLabel, sumDetailsY + 36);
      doc.text(`₹${(sale.sgstTotal || 0).toFixed(2)}`, rightColVal, sumDetailsY + 36, { width: 70, align: 'right' });

      if (sale.roundOff !== 0 && sale.roundOff !== undefined) {
        doc.text('Round Off:', rightColLabel, sumDetailsY + 48);
        doc.text(`₹${(sale.roundOff || 0).toFixed(2)}`, rightColVal, sumDetailsY + 48, { width: 70, align: 'right' });
      }

      // Grand Total Highlight
      const grandTotalY = sumDetailsY + 62;
      doc.rect(390, grandTotalY - 4, 175, 22).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold');
      doc.text('Grand Total:', rightColLabel, grandTotalY);
      doc.text(`₹${(sale.grandTotal || 0).toFixed(2)}`, rightColVal, grandTotalY, { width: 70, align: 'right' });

      // Footer: Pharmacist & Terms
      const footerY = grandTotalY + 50;
      doc.fontSize(7).font('Helvetica').fillColor('#64748b');
      doc.text('Terms & Conditions:', 35, footerY);
      doc.text('1. Goods once sold will be accepted for return only within 7 days with original invoice.', 35, footerY + 10);
      doc.text('2. Refrigerated medicines (Cold Chain) are strictly non-returnable.', 35, footerY + 18);
      doc.text('3. Consult doctor before taking medicines. Keep out of reach of children.', 35, footerY + 26);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text('For ' + storeName, 400, footerY);
      doc.text('Registered Pharmacist', 400, footerY + 35);
      doc.font('Helvetica').fontSize(7).text(pharmacist, 400, footerY + 46);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
