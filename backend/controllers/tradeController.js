import Wallet from '../models/Wallet.js';
import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';
import Stock from '../models/Stock.js';
import { fetchLiveByFrontendSymbol } from './stockController.js';
import { recordCoinLedgerEntry } from '../utils/coinLedger.js';

const round2 = (value) => Number(Number(value).toFixed(2));
const roundQty = (value) => Math.floor(Number(value || 0));
const QTY_EPSILON = 0.0001;
const TEMP_TEST_BALANCE = 100000;
const SYMBOL_ALIASES = {
  IQTCS: 'TCS',
  IQREL: 'RELIANCE',
  IQHDFC: 'HDFCBANK',
  IQINFY: 'INFY',
  IQTAT: 'TATAMOTORS',
  IQSBI: 'SBIN',
  IQWIP: 'WIPRO',
  IQSUN: 'SUNPHARMA',
  IQAIR: 'BHARTIARTL',
  IQITC: 'ITC',
  IQADNI: 'ADANIPORTS',
  IQMRF: 'MRF',
  IQLTM: 'LTIM',
  IQDRR: 'DRREDDY',
  IQNTPC: 'NTPC',
  IQBAJ: 'BAJFINANCE',
  IQNEST: 'NESTLEIND',
  IQZOM: 'ZOMATO',
  IQPAY: 'PAYTM',
  IQCRYP: 'CRYPTO',
};

const normalizeTradeSymbol = (symbol = '') => SYMBOL_ALIASES[symbol] || symbol;

const parseQuantity = (value) => {
  const qty = Number(value);
  if (!Number.isInteger(qty) || qty <= 0) {
    return null;
  }
  return qty;
};

const parseTradePrice = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return round2(n);
};

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: TEMP_TEST_BALANCE });
  }
  return wallet;
};

const getOrCreatePortfolio = async (userId) => {
  let portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    portfolio = await Portfolio.create({ userId, assets: [] });
  }
  return portfolio;
};

const resolveTradeStock = async (symbol) => {
  const incomingSymbol = symbol.toUpperCase();
  const normalizedSymbol = normalizeTradeSymbol(incomingSymbol);
  let stock = await Stock.findOne({ symbol: normalizedSymbol }) || await Stock.findOne({ symbol: incomingSymbol });

  if (stock && Number.isFinite(Number(stock.currentPrice))) {
    return stock;
  }

  try {
    const live = await fetchLiveByFrontendSymbol(normalizedSymbol);
    const livePrice = round2(Number(live.price));

    stock = await Stock.findOneAndUpdate(
      { symbol: normalizedSymbol },
      { symbol: normalizedSymbol, currentPrice: livePrice, lastUpdated: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return stock;
  } catch {
    if (stock) return stock;
    return null;
  }
};

export const buyStock = async (req, res) => {
  try {
    const { symbol, quantity, price } = req.body;
    const qty = parseQuantity(quantity);
    if (!qty) return res.status(400).json({ message: 'Invalid quantity' });
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ message: 'Invalid symbol' });
    }

    const stock = await resolveTradeStock(symbol);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    const clientTradePrice = parseTradePrice(price);
    const tradePrice = clientTradePrice ?? round2(stock.currentPrice);
    const totalCost = round2(tradePrice * qty);

    const wallet = await getOrCreateWallet(req.user._id);
    if (wallet.balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    const walletBefore = wallet.balance;

    // Deduct from wallet
    wallet.balance = round2(wallet.balance - totalCost);
    await wallet.save();

    // Update portfolio
    const portfolio = await getOrCreatePortfolio(req.user._id);
    const incomingSymbol = symbol.toUpperCase();
    const normalizedSymbol = normalizeTradeSymbol(incomingSymbol);
    const assetIndex = portfolio.assets.findIndex(a => a.symbol === normalizedSymbol || a.symbol === incomingSymbol);
    let quantityAfter = qty;
    let avgBuyPriceAfter = tradePrice;

    if (assetIndex > -1) {
      const asset = portfolio.assets[assetIndex];
      const newTotalQuantity = roundQty(asset.quantity + qty);
      const newTotalValue = (asset.quantity * asset.avgBuyPrice) + totalCost;
      asset.avgBuyPrice = newTotalValue / newTotalQuantity;
      asset.quantity = newTotalQuantity;
      quantityAfter = asset.quantity;
      avgBuyPriceAfter = round2(asset.avgBuyPrice);
    } else {
      portfolio.assets.push({ symbol: normalizedSymbol, quantity: roundQty(qty), avgBuyPrice: tradePrice });
    }
    await portfolio.save();

    // Create transaction log
    await Transaction.create({
      userId: req.user._id,
      type: 'BUY',
      symbol: normalizedSymbol,
      quantity: qty,
      price: tradePrice,
      totalAmount: totalCost,
      balanceAfter: wallet.balance,
      quantityAfter,
      avgBuyPriceAfter,
    });

    await recordCoinLedgerEntry({
      userId: req.user._id,
      sourceType: 'TRADE',
      sourceId: `BUY:${normalizedSymbol}:${Date.now()}`,
      label: `Bought ${normalizedSymbol}`,
      amount: -totalCost,
      balanceBefore: walletBefore,
      balanceAfter: wallet.balance,
      referenceType: 'TRANSACTION',
      referenceId: normalizedSymbol,
      note: `Purchased ${qty} share${qty === 1 ? '' : 's'} of ${normalizedSymbol}`,
    });

    res.json({
      message: 'Purchase successful',
      balance: wallet.balance,
      trade: {
        type: 'BUY',
        symbol: normalizedSymbol,
        quantity: qty,
        price: tradePrice,
        totalAmount: totalCost,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sellStock = async (req, res) => {
  try {
    const { symbol, quantity, price } = req.body;
    const qty = parseQuantity(quantity);
    if (!qty) return res.status(400).json({ message: 'Invalid quantity' });
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ message: 'Invalid symbol' });
    }

    const incomingSymbol = symbol.toUpperCase();
    const normalizedSymbol = normalizeTradeSymbol(incomingSymbol);
    const portfolio = await getOrCreatePortfolio(req.user._id);
    const assetIndex = portfolio.assets.findIndex(a => a.symbol === normalizedSymbol || a.symbol === incomingSymbol);

    if (assetIndex === -1 || (portfolio.assets[assetIndex].quantity + QTY_EPSILON) < qty) {
      return res.status(400).json({ message: 'Insufficient asset quantity' });
    }

    const stock = await resolveTradeStock(normalizedSymbol);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    const clientTradePrice = parseTradePrice(price);
    const tradePrice = clientTradePrice ?? round2(stock.currentPrice);
    const totalRevenue = round2(tradePrice * qty);
    const avgBuyPrice = round2(portfolio.assets[assetIndex].avgBuyPrice || 0);
    const realizedPnl = round2((tradePrice - avgBuyPrice) * qty);

    // Update portfolio
    portfolio.assets[assetIndex].quantity = roundQty(portfolio.assets[assetIndex].quantity - qty);
    const quantityAfter = portfolio.assets[assetIndex].quantity;
    if (portfolio.assets[assetIndex].quantity <= QTY_EPSILON) {
      portfolio.assets.splice(assetIndex, 1);
    }
    await portfolio.save();

    // Add to wallet
    const wallet = await getOrCreateWallet(req.user._id);
    const walletBefore = wallet.balance;
    wallet.balance = round2(wallet.balance + totalRevenue);
    await wallet.save();

    // Create transaction log
    await Transaction.create({
      userId: req.user._id,
      type: 'SELL',
      symbol: normalizedSymbol,
      quantity: qty,
      price: tradePrice,
      totalAmount: totalRevenue,
      balanceAfter: wallet.balance,
      quantityAfter,
      avgBuyPriceAfter: quantityAfter > 0 ? avgBuyPrice : 0,
      realizedPnl,
    });

    await recordCoinLedgerEntry({
      userId: req.user._id,
      sourceType: 'TRADE',
      sourceId: `SELL:${normalizedSymbol}:${Date.now()}`,
      label: `Sold ${normalizedSymbol}`,
      amount: totalRevenue,
      balanceBefore: walletBefore,
      balanceAfter: wallet.balance,
      referenceType: 'TRANSACTION',
      referenceId: normalizedSymbol,
      note: `Sold ${qty} share${qty === 1 ? '' : 's'} of ${normalizedSymbol}`,
    });

    res.json({
      message: 'Sale successful',
      balance: wallet.balance,
      trade: {
        type: 'SELL',
        symbol: normalizedSymbol,
        quantity: qty,
        price: tradePrice,
        totalAmount: totalRevenue,
        realizedPnl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTradeHistory = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({ count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
