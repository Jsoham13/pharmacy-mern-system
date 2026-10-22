import nodemailer from 'nodemailer';

let transporter = null;

const initTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (e) {
      console.warn('[Nodemailer] Initialization error:', e.message);
    }
  }
};

initTransporter();

/**
 * Send Tax Invoice PDF via Email to Customer
 * @param {string} recipientEmail
 * @param {string} customerName
 * @param {string} invoiceNumber
 * @param {Buffer} pdfBuffer
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendInvoiceEmail = async (recipientEmail, customerName, invoiceNumber, pdfBuffer) => {
  if (!recipientEmail) {
    return { success: false, message: 'No recipient email provided' };
  }

  const subject = `Your Medicine Tax Invoice - ${invoiceNumber} | Shree Ganesh Medical`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #2563eb;">Thank you for your purchase with Shree Ganesh Medical!</h2>
      <p>Dear ${customerName || 'Customer'},</p>
      <p>Please find attached your digital GST tax invoice <strong>${invoiceNumber}</strong>.</p>
      <p>For any queries or refill assistance, reach out at <strong>+91 98220 12345</strong>.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777;">
        Shree Ganesh Medical & General Stores, Shop No. 4, Shivaji Chowk, Miraj - Sangli Road, Sangli, Maharashtra.<br/>
        Valid Drug License: 20B/21B.
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Shree Ganesh Medical" <invoices@shreeganeshmedical.com>',
        to: recipientEmail,
        subject,
        html,
        attachments: [
          {
            filename: `Invoice_${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      return { success: true, message: `Email sent successfully to ${recipientEmail}` };
    } catch (err) {
      console.warn('[Nodemailer] Failed to send live email:', err.message);
    }
  }

  // Simulated email dispatch log for testing/demo
  console.log(`[Email Simulation] Generated invoice ${invoiceNumber} for ${recipientEmail}. Length: ${pdfBuffer.length} bytes.`);
  return {
    success: true,
    message: `[Demo Mode] Simulated email invoice delivery to ${recipientEmail}`,
  };
};
