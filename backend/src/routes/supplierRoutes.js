import express from 'express';
import { getSuppliers, createSupplier, updateSupplier } from '../controllers/supplierController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getSuppliers);
router.post('/', authenticate, authorize('OWNER_ADMIN'), createSupplier);
router.put('/:id', authenticate, authorize('OWNER_ADMIN'), updateSupplier);

export default router;
