import express from 'express';
import { chatWithAdvisor } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/message', protect, chatWithAdvisor);

export default router;
