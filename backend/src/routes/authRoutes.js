import express from 'express';
import { login, getMe, getUsers, createUser, toggleUserStatus } from '../controllers/authController.js';
import { authenticate, authorize, loginRateLimiter } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', loginRateLimiter(15, 15 * 60 * 1000), login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, authorize('OWNER_ADMIN'), getUsers);
router.post('/users', authenticate, authorize('OWNER_ADMIN'), createUser);
router.patch('/users/:id/toggle', authenticate, authorize('OWNER_ADMIN'), toggleUserStatus);

export default router;
