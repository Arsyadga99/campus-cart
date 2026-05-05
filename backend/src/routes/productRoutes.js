import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createProduct, deleteProduct, listProducts, updateProduct } from '../controllers/productController.js';

const router = Router();

router.get('/', listProducts);
router.post('/', authenticateToken, requireRole('admin'), createProduct);
router.patch('/:id', authenticateToken, requireRole('admin'), updateProduct);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteProduct);

export default router;
