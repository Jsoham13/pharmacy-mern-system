import express from 'express';
import {
  createSale,
  verifyPayment,
  getSales,
  getSaleById,
  downloadInvoice,
  emailInvoice,
  updateDeliveryStatus,
  createReturn,
} from '../controllers/saleController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getSales);
router.get('/:id', authenticate, getSaleById);
router.post('/', authenticate, createSale);
router.post('/verify-payment', authenticate, verifyPayment);
router.get('/:id/invoice', authenticate, downloadInvoice);
router.post('/:id/email-invoice', authenticate, emailInvoice);
router.patch('/:id/delivery-status', authenticate, updateDeliveryStatus);
router.post('/return', authenticate, authorize('OWNER_ADMIN', 'PHARMACIST'), createReturn);

export default router;
