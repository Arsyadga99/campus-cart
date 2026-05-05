import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createOrder, listOrders, payOrder, updateOrderStatus } from '../controllers/orderController.js';

const router = Router();

router.get('/', authenticateToken, listOrders);
router.post('/', authenticateToken, createOrder);
router.post('/:id/pay', authenticateToken, payOrder);
router.patch('/:id/status', authenticateToken, requireRole('admin'), updateOrderStatus);

export default router;
