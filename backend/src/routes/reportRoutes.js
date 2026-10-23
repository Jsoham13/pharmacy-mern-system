import express from 'express';
import { getDashboardMetrics, getTopSellingMedicines } from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Sensitive store revenue & gross profit analytics restricted to store staff/pharmacist/admin
router.get('/dashboard', authenticate, authorize('OWNER_ADMIN', 'PHARMACIST', 'STAFF_CASHIER'), getDashboardMetrics);
router.get('/top-medicines', authenticate, authorize('OWNER_ADMIN', 'PHARMACIST', 'STAFF_CASHIER'), getTopSellingMedicines);

export default router;
