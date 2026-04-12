import Wallet from '../models/Wallet.js';
import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';
import Stock from '../models/Stock.js';

export const buyStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (quantity <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    const stock = await Stock.findOne({ symbol });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    const totalCost = stock.currentPrice * quantity;

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet.balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Deduct from wallet
    wallet.balance -= totalCost;
    await wallet.save();

    // Update portfolio
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    const assetIndex = portfolio.assets.findIndex(a => a.symbol === symbol);

    if (assetIndex > -1) {
      const asset = portfolio.assets[assetIndex];
      const newTotalQuantity = asset.quantity + quantity;
      const newTotalValue = (asset.quantity * asset.avgBuyPrice) + totalCost;
      asset.avgBuyPrice = newTotalValue / newTotalQuantity;
      asset.quantity = newTotalQuantity;
    } else {
      portfolio.assets.push({ symbol, quantity, avgBuyPrice: stock.currentPrice });
    }
    await portfolio.save();

    // Create transaction log
    await Transaction.create({
      userId: req.user._id,
      type: 'BUY',
      symbol,
      quantity,
      price: stock.currentPrice
    });

    res.json({ message: 'Purchase successful', balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sellStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (quantity <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    const assetIndex = portfolio.assets.findIndex(a => a.symbol === symbol);

    if (assetIndex === -1 || portfolio.assets[assetIndex].quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient asset quantity' });
    }

    const stock = await Stock.findOne({ symbol });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    const totalRevenue = stock.currentPrice * quantity;

    // Update portfolio
    portfolio.assets[assetIndex].quantity -= quantity;
    if (portfolio.assets[assetIndex].quantity === 0) {
      portfolio.assets.splice(assetIndex, 1);
    }
    await portfolio.save();

    // Add to wallet
    const wallet = await Wallet.findOne({ userId: req.user._id });
    wallet.balance += totalRevenue;
    await wallet.save();

    // Create transaction log
    await Transaction.create({
      userId: req.user._id,
      type: 'SELL',
      symbol,
      quantity,
      price: stock.currentPrice
    });

    res.json({ message: 'Sale successful', balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
