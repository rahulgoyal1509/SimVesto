import express from 'express';
import { getPortfolio } from '../controllers/portfolioController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getPortfolio);

export default router;
