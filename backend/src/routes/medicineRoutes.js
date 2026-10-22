import express from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  toggleMedicineStatus,
} from '../controllers/medicineController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getMedicines);
router.get('/:id', authenticate, getMedicineById);
router.post('/', authenticate, authorize('OWNER_ADMIN', 'PHARMACIST'), createMedicine);
router.put('/:id', authenticate, authorize('OWNER_ADMIN', 'PHARMACIST'), updateMedicine);
router.patch('/:id/toggle', authenticate, authorize('OWNER_ADMIN'), toggleMedicineStatus);

export default router;
