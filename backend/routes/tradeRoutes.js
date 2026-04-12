import express from 'express';
import { buyStock, sellStock } from '../controllers/tradeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/buy').post(protect, buyStock);
router.route('/sell').post(protect, sellStock);

export default router;
