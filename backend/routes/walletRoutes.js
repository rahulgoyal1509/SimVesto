import express from 'express';
import { getWalletBalance, resetWallet } from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getWalletBalance);
router.route('/reset').post(protect, resetWallet);

export default router;
