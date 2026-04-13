import express from 'express';
import { awardCoins, getCoinLedger, getWalletBalance, resetWallet } from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getWalletBalance);
router.route('/reset').post(protect, resetWallet);
router.route('/ledger').get(protect, getCoinLedger);
router.route('/reward').post(protect, awardCoins);

export default router;
