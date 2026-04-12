import express from 'express';
import { getFearScore, getFearHistory, logBehavior, getPortfolioRecommendations } from '../controllers/fearController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:userId', protect, getFearScore);
router.get('/:userId/history', protect, getFearHistory);
router.post('/behavior/log', protect, logBehavior);
router.post('/portfolio/recommendations', protect, getPortfolioRecommendations);

export default router;
