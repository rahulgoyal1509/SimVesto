// Global state store using Zustand
// Manages user, stocks, portfolio, orders, and behavior

import { create } from 'zustand';
import { initializeStocks, tickPrice } from '../engine/stockEngine';
import { computeFearScore } from '../engine/fearEngine';

const INITIAL_COINS = 10000;

// Load state from localStorage
function loadState(key, defaultValue) {
  try {
    const saved = localStorage.getItem(`investiq_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveState(key, value) {
  try {
    localStorage.setItem(`investiq_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

const useStore = create((set, get) => ({
  // ── USER STATE ──
  user: loadState('user', null),
  isAuthenticated: loadState('isAuthenticated', false),
  geminiApiKey: loadState('geminiApiKey', ''),

  setUser: (user) => {
    set({ user, isAuthenticated: true });
    saveState('user', user);
    saveState('isAuthenticated', true);
  },

  updateUser: (updates) => {
    const newUser = { ...get().user, ...updates };
    set({ user: newUser });
    saveState('user', newUser);
  },

  setGeminiApiKey: (key) => {
    set({ geminiApiKey: key });
    saveState('geminiApiKey', key);
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    saveState('user', null);
    saveState('isAuthenticated', false);
  },

  // ── STOCKS STATE ──
  stocks: initializeStocks(),
  tickInterval: null,

  startStockTicker: () => {
    const interval = setInterval(() => {
      set(state => ({
        stocks: state.stocks.map(s => tickPrice(s))
      }));
      // Update holdings P&L
      get().updateHoldingsPnL();
    }, 1500);
    set({ tickInterval: interval });
  },

  stopStockTicker: () => {
    const { tickInterval } = get();
    if (tickInterval) clearInterval(tickInterval);
    set({ tickInterval: null });
  },

  // ── HOLDINGS STATE ──
  holdings: loadState('holdings', []),

  updateHoldingsPnL: () => {
    const { holdings, stocks } = get();
    if (holdings.length === 0) return;

    const updated = holdings.map(h => {
      const stock = stocks.find(s => s.id === h.stockId);
      if (!stock) return h;
      const currentValue = h.quantity * stock.currentPrice;
      const investedValue = h.quantity * h.avgBuyPrice;
      return {
        ...h,
        currentPrice: stock.currentPrice,
        currentValue: parseFloat(currentValue.toFixed(2)),
        pnl: parseFloat((currentValue - investedValue).toFixed(2)),
        pnlPct: parseFloat(((currentValue - investedValue) / investedValue * 100).toFixed(2)),
      };
    });

    set({ holdings: updated });
  },

  // ── TRADING ──
  buyStock: async (stockId, quantity) => {
    const { stocks, user, holdings } = get();
    const stock = stocks.find(s => s.id === stockId);
    if (!stock || !user) return { success: false, message: 'Stock not found' };

    try {
      const { api } = await import('../services/api.js');
      const response = await api.buyStock(stock.symbol, quantity);
      
      if (!response.message || response.message !== 'Purchase successful') {
         return { success: false, message: response.message || 'Server error' };
      }

      // Update local coins from server
      const newCoins = response.balance;

      const totalCost = parseFloat((stock.currentPrice * quantity).toFixed(2));
      const existingIdx = holdings.findIndex(h => h.stockId === stockId);
      let newHoldings = [...holdings];

      if (existingIdx >= 0) {
        const existing = newHoldings[existingIdx];
        const totalQty = existing.quantity + quantity;
        const newAvg = (existing.avgBuyPrice * existing.quantity + stock.currentPrice * quantity) / totalQty;
        newHoldings[existingIdx] = {
          ...existing,
          quantity: totalQty,
          avgBuyPrice: parseFloat(newAvg.toFixed(2)),
          currentPrice: stock.currentPrice,
          currentValue: parseFloat((totalQty * stock.currentPrice).toFixed(2)),
          pnl: parseFloat((totalQty * stock.currentPrice - totalQty * newAvg).toFixed(2)),
          pnlPct: parseFloat(((stock.currentPrice - newAvg) / newAvg * 100).toFixed(2)),
        };
      } else {
        newHoldings.push({
          stockId, symbol: stock.symbol, name: stock.name, quantity,
          avgBuyPrice: stock.currentPrice, currentPrice: stock.currentPrice,
          currentValue: totalCost, pnl: 0, pnlPct: 0, boughtAt: Date.now(),
        });
      }

      const order = {
        id: Date.now(), stockId, symbol: stock.symbol, name: stock.name,
        type: 'BUY', quantity, price: stock.currentPrice, totalCost,
        timestamp: Date.now(), status: 'COMPLETED',
      };

      const newOrders = [order, ...get().orders];

      set({ holdings: newHoldings, orders: newOrders });
      get().updateUser({ iqCoins: newCoins, totalTrades: (user.totalTrades || 0) + 1 });
      saveState('holdings', newHoldings);
      saveState('orders', newOrders);
      get().checkMilestones();

      return { success: true, order };
    } catch (err) {
      return { success: false, message: 'Server connection failed' };
    }
  },

  sellStock: async (stockId, quantity) => {
    const { stocks, user, holdings } = get();
    const stock = stocks.find(s => s.id === stockId);
    if (!stock || !user) return { success: false, message: 'Stock not found' };

    const holdingIdx = holdings.findIndex(h => h.stockId === stockId);
    if (holdingIdx < 0) return { success: false, message: 'No holdings found' };

    const holding = holdings[holdingIdx];
    if (quantity > holding.quantity) return { success: false, message: 'Insufficient shares' };

    try {
      const { api } = await import('../services/api.js');
      const response = await api.sellStock(stock.symbol, quantity);

      if (!response.message || response.message !== 'Sale successful') {
         return { success: false, message: response.message || 'Server error' };
      }

      const saleValue = parseFloat((stock.currentPrice * quantity).toFixed(2));
      const costBasis = parseFloat((holding.avgBuyPrice * quantity).toFixed(2));
      const tradePnL = parseFloat((saleValue - costBasis).toFixed(2));

      // Add coins
      const newCoins = response.balance;

      let newHoldings = [...holdings];
      if (quantity >= holding.quantity) {
        newHoldings.splice(holdingIdx, 1);
      } else {
        newHoldings[holdingIdx] = {
          ...holding,
          quantity: holding.quantity - quantity,
          currentValue: parseFloat(((holding.quantity - quantity) * stock.currentPrice).toFixed(2)),
        };
      }

      const order = {
        id: Date.now(), stockId, symbol: stock.symbol, name: stock.name,
        type: 'SELL', quantity, price: stock.currentPrice, totalCost: saleValue,
        pnl: tradePnL, timestamp: Date.now(), status: 'COMPLETED',
      };

      const newOrders = [order, ...get().orders];

      set({ holdings: newHoldings, orders: newOrders });
      get().updateUser({
        iqCoins: newCoins,
        totalTrades: (user.totalTrades || 0) + 1,
        totalPnL: (user.totalPnL || 0) + tradePnL,
      });

      saveState('holdings', newHoldings);
      saveState('orders', newOrders);
      get().checkMilestones();

      return { success: true, order, pnl: tradePnL };
    } catch (err) {
      return { success: false, message: 'Server connection failed' };
    }
  },

  // ── ORDERS ──
  orders: loadState('orders', []),

  // ── FEAR SCORE ──
  fearScore: loadState('fearScore', { score: 80, fearClass: 'HIGH' }),
  fearHistory: loadState('fearHistory', []),
  fearModalData: null, // used to trigger the modal

  fetchFearData: async () => {
    const { user } = get();
    if (!user) return;
    try {
       const { api } = await import('../services/api.js');
       const scoreRes = await api.getFearScore(user._id);
       const historyRes = await api.getFearHistory(user._id);
       
       set({ 
         fearScore: { score: scoreRes.score, fearClass: scoreRes.classification },
         fearHistory: historyRes
       });
    } catch(e) { console.error('Failed to fetch fear data', e); }
  },

  updateFearScore: async (action, hesitationMs = 0, isPositiveOutcome = true, manualDelta = 0) => {
    try {
      const { api } = await import('../services/api.js');
      const result = await api.logBehavior(action, hesitationMs, isPositiveOutcome, manualDelta);
      
      const newScore = { score: result.score, fearClass: result.classification };
      const historyUpdate = [...get().fearHistory, { timestamp: Date.now(), score: result.score, action }].slice(-50);
      
      set({ 
        fearScore: newScore, 
        fearHistory: historyUpdate,
        // Trigger modal only if delta is non-zero and action is simulation
        fearModalData: (result.delta !== 0 && action !== 'QUIZ_RESULT') ? result : null
      });

      saveState('fearScore', newScore);
      saveState('fearHistory', historyUpdate);
      get().updateUser({ fearScore: result.score, fearClass: result.classification });
      get().checkMilestones();
    } catch(e) { console.error('Fear log failed', e); }
  },

  clearFearModal: () => set({ fearModalData: null }),

  // ── MILESTONES ──
  milestones: loadState('milestones', []),

  checkMilestones: () => {
    const { user, orders, milestones, holdings } = get();
    if (!user) return;
    const newMilestones = [...milestones];
    let bonusCoins = 0;

    const checks = [
      { id: 'first_trade', label: 'First Trade', condition: orders.length >= 1, reward: 200 },
      { id: '10_trades', label: '10 Trades', condition: orders.length >= 10, reward: 500 },
      { id: '25_trades', label: '25 Trades', condition: orders.length >= 25, reward: 1000 },
      { id: 'first_profit', label: 'First Profit', condition: orders.some(o => o.pnl > 0), reward: 300 },
      { id: 'diversified', label: 'Diversified Portfolio', condition: holdings.length >= 5, reward: 400 },
      { id: 'fearless', label: 'Fearless', condition: (user.fearScore || 65) < 40, reward: 1000 },
    ];

    checks.forEach(m => {
      if (!newMilestones.find(nm => nm.id === m.id) && m.condition) {
        newMilestones.push({ ...m, unlockedAt: Date.now() });
        bonusCoins += m.reward;
      }
    });

    if (bonusCoins > 0) {
      set({ milestones: newMilestones });
      saveState('milestones', newMilestones);
      get().updateUser({ iqCoins: (user.iqCoins || 0) + bonusCoins });
    }
  },

  // ── SIMULATIONS ──
  simulations: loadState('simulations', []),

  addSimulation: (sim) => {
    const newSims = [sim, ...get().simulations].slice(0, 50);
    set({ simulations: newSims });
    saveState('simulations', newSims);
  },

  // ── PORTFOLIO VALUE HISTORY ──
  portfolioHistory: loadState('portfolioHistory', []),

  recordPortfolioSnapshot: () => {
    const { holdings, user } = get();
    if (!user) return;
    const totalValue = holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
    const snapshot = {
      timestamp: Date.now(),
      totalValue: parseFloat(totalValue.toFixed(2)),
      coinBalance: user.iqCoins,
      netWorth: parseFloat((totalValue + user.iqCoins).toFixed(2)),
      holdingsCount: holdings.length,
    };
    const history = [...get().portfolioHistory, snapshot].slice(-200);
    set({ portfolioHistory: history });
    saveState('portfolioHistory', history);
  },
}));

export default useStore;
