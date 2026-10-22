import express from 'express';
import { getBatches, getBatchesByMedicine, adjustStock } from '../controllers/batchController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getBatches);
router.get('/medicine/:medicineId', authenticate, getBatchesByMedicine);
router.post('/adjust', authenticate, authorize('OWNER_ADMIN', 'PHARMACIST'), adjustStock);

export default router;
