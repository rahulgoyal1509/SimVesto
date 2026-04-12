import express from 'express';
import { runSimulation } from '../controllers/simulationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/run').post(protect, runSimulation);

export default router;
