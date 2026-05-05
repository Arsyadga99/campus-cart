import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getMlRecommendationsEndpoint,
  getRecommendations
} from '../controllers/recommendationController.js';

const router = Router();

router.get('/', authenticateToken, getRecommendations);
router.get('/ml', authenticateToken, getMlRecommendationsEndpoint);

export default router;
