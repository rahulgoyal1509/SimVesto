import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { updatePricesRandomly } from './controllers/stockController.js';

import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import riskRoutes from './routes/riskRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import fearRoutes from './routes/fearRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/fear', fearRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('SimVesto API is running...');
});

// Update stock prices randomly every minute for the simulation aspect
setInterval(updatePricesRandomly, 60000);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
