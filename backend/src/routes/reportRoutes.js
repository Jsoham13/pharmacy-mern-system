import express from 'express';
import { getDashboardMetrics, getTopSellingMedicines } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, getDashboardMetrics);
router.get('/top-medicines', authenticate, getTopSellingMedicines);

export default router;
