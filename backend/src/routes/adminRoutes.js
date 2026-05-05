import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { deleteUser, getMarketing, listBatches, listUsers, updateMarketing } from '../controllers/adminController.js';
import { getAiPerformance } from '../controllers/aiMetricsController.js';

const router = Router();

router.use(authenticateToken, requireRole('admin'));
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.get('/marketing', getMarketing);
router.put('/marketing', updateMarketing);
router.get('/batches', listBatches);
router.get('/ai-performance', getAiPerformance);

export default router;
