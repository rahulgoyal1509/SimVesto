import express from 'express';
import { getStocks, getStockBySymbol, initializeStocks } from '../controllers/stockController.js';

const router = express.Router();

router.route('/init').post(initializeStocks);
router.route('/').get(getStocks);
router.route('/:symbol').get(getStockBySymbol);

export default router;
