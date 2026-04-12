import express from 'express';
import { getRiskInsights, getAiExplanation } from '../controllers/riskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/explain').post(getAiExplanation); // might not need auth in hackathon if public
router.route('/:simulationId').get(protect, getRiskInsights);

export default router;
