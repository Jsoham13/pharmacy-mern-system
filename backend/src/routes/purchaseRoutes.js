import express from 'express';
import { getPurchases, createPurchase } from '../controllers/purchaseController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getPurchases);
router.post('/', authenticate, authorize('OWNER_ADMIN', 'PHARMACIST'), createPurchase);

export default router;
