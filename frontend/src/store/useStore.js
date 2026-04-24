// Global state store using Zustand
// Manages user, stocks, portfolio, orders, and behavior

import { create } from "zustand";
import { initializeStocks, tickPrice } from "../engine/stockEngine.js";
import { computeFearScore } from "../engine/fearEngine.js";

const INITIAL_COINS = 100000;
const round2 = (v) => parseFloat(Number(v || 0).toFixed(2));
const STORAGE_PREFIX = "simvesto_";
const LEGACY_STORAGE_PREFIX = "investiq_";

// ── Stock price persistence helpers ──────────────────────────────────────────
const STOCK_PRICES_KEY = `${STORAGE_PREFIX}stockPrices`;

function loadSeedPrices() {
  try {
    const saved = localStorage.getItem(STOCK_PRICES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveStockPrices(stocks) {
  try {
    const priceMap = {};
    stocks.forEach((s) => {
      priceMap[s.symbol] = s.currentPrice;
    });
    localStorage.setItem(STOCK_PRICES_KEY, JSON.stringify(priceMap));
  } catch (e) {
    console.warn("Failed to persist stock prices:", e);
  }
}

// Initialize stocks with persisted seed prices so they survive page refreshes
const _seedPrices = loadSeedPrices();
const _initialStocks = initializeStocks(_seedPrices);
// Immediately persist the prices so refreshes land at the same prices
saveStockPrices(_initialStocks);

// Load state from localStorage
function loadState(key, defaultValue) {
  try {
    const saved =
      localStorage.getItem(`${STORAGE_PREFIX}${key}`) ??
      localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveState(key, value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage save failed:", e);
  }
}

function getUserIdentities(user) {
  const identities = [user?._id, user?.id, user?.email, "guest"]
    .map((value) =>
      value === null || value === undefined ? "" : String(value).trim(),
    )
    .filter(Boolean);

  return [...new Set(identities)];
}

function getStorageKeysForIdentity(identity, key) {
  return [
    `${STORAGE_PREFIX}${identity}_${key}`,
    `${LEGACY_STORAGE_PREFIX}${identity}_${key}`,
  ];
}

function loadUserState(user, key, defaultValue) {
  try {
    const identities = getUserIdentities(user);
    for (const identity of identities) {
      const keys = getStorageKeysForIdentity(identity, key);
      for (const storageKey of keys) {
        const saved = localStorage.getItem(storageKey);
        if (!saved) continue;
        try {
          return JSON.parse(saved);
        } catch {
          return defaultValue;
        }
      }
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveUserState(user, key, value) {
  try {
    const serialized = JSON.stringify(value);
    const identities = getUserIdentities(user);
    for (const identity of identities) {
      localStorage.setItem(`${STORAGE_PREFIX}${identity}_${key}`, serialized);
    }
  } catch (e) {
    console.warn("localStorage save failed:", e);
  }
}

const DEFAULT_FEAR_SCORE = { score: 80, fearClass: "HIGH" };
const initialUser = loadState("user", null);

const useStore = create((set, get) => ({
  // ── USER STATE ──
  theme: loadState("theme", "light"),
  toggleTheme: () => {
    const newTheme = get().theme === "light" ? "dark" : "light";
    set({ theme: newTheme });
    saveState("theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  },
  user: initialUser,
  isAuthenticated: loadState("isAuthenticated", false),
  geminiApiKey: loadState("geminiApiKey", ""),
  glossaryEnabled: loadState("glossaryEnabled", false),

  setUser: (user) => {
    const loadedCoinHistory = loadUserState(user, "coinHistory", []);
    const coinHistory =
      loadedCoinHistory.length > 0
        ? loadedCoinHistory
        : [
            {
              id: `start-${Date.now()}`,
              type: "SYSTEM",
              subtype: "START",
              amount: INITIAL_COINS,
              source: "Starting Balance",
              label: "Initial coin grant",
              note: "You began this simulation with 100,000 coins.",
              timestamp: Date.now(),
              balanceAfter: INITIAL_COINS,
            },
          ];

    set({
      user,
      isAuthenticated: true,
      holdings: loadUserState(user, "holdings", []),
      orders: loadUserState(user, "orders", []),
      fearScore: loadUserState(user, "fearScore", DEFAULT_FEAR_SCORE),
      fearHistory: loadUserState(user, "fearHistory", []),
      milestones: loadUserState(user, "milestones", []),
      simulations: loadUserState(user, "simulations", []),
      portfolioHistory: loadUserState(user, "portfolioHistory", []),
      tradeHistory: loadUserState(user, "tradeHistory", []),
      matchedTrades: loadUserState(user, 'matchedTrades', []),
      companyNotes: loadUserState(user, 'companyNotes', {}),
      coinHistory,
      fearModalData: null,
    });
    saveState("user", user);
    saveState("isAuthenticated", true);
    if (loadedCoinHistory.length === 0) {
      saveUserState(user, "coinHistory", coinHistory);
    }
  },

  updateUser: (updates) => {
    const newUser = { ...get().user, ...updates };
    set({ user: newUser });
    saveState("user", newUser);
  },

  setGeminiApiKey: (key) => {
    set({ geminiApiKey: key });
    saveState("geminiApiKey", key);
  },

  setGlossaryEnabled: (enabled) => {
    set({ glossaryEnabled: !!enabled });
    saveState("glossaryEnabled", !!enabled);
  },

  toggleGlossary: () => {
    const nextValue = !get().glossaryEnabled;
    set({ glossaryEnabled: nextValue });
    saveState("glossaryEnabled", nextValue);
  },

  addCoinHistoryEvent: (event) => {
    const normalized = {
      id: event.id || `${event.type}-${event.source || "coin"}-${Date.now()}`,
      timestamp: event.timestamp || Date.now(),
      type: event.type || "SYSTEM",
      subtype: event.subtype || "GENERAL",
      amount: Number(event.amount || 0),
      source: event.source || "System",
      label: event.label || "Coin event",
      note: event.note || "",
      balanceAfter: event.balanceAfter,
      reference: event.reference || null,
    };
    const history = [normalized, ...get().coinHistory].slice(0, 200);
    set({ coinHistory: history });
    saveUserState(get().user, "coinHistory", history);
    return normalized;
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      holdings: [],
      orders: [],
      fearScore: DEFAULT_FEAR_SCORE,
      fearHistory: [],
      fearModalData: null,
      milestones: [],
      simulations: [],
      portfolioHistory: [],
      tradeHistory: [],
      matchedTrades: [],
      companyNotes: {},
    });
    saveState("user", null);
    saveState("isAuthenticated", false);
  },

  // ── STOCKS STATE ──
  stocks: _initialStocks,
  tickInterval: null,
  realtimeSyncInterval: null,
  realtimeLoading: false,
  realtimeError: null,

  startStockTicker: () => {
    const interval = setInterval(() => {
      set((state) => {
        const updated = state.stocks.map((s) => tickPrice(s));
        // Persist current prices every tick so refreshes stay in sync
        saveStockPrices(updated);
        return { stocks: updated };
      });
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

  refreshRealtimeStocks: async () => {
    set({ realtimeLoading: true, realtimeError: null });

    try {
      const { fetchRealtimeStocks, mergeLivePrice } =
        await import("../services/realtimeStocks.js");
      const liveMap = await fetchRealtimeStocks();

      set((state) => ({
        stocks: state.stocks.map((stock) =>
          liveMap[stock.symbol]
            ? mergeLivePrice(stock, liveMap[stock.symbol])
            : stock,
        ),
        realtimeLoading: false,
        realtimeError: null,
      }));

      get().updateHoldingsPnL();
    } catch (error) {
      set({
        realtimeLoading: false,
        realtimeError: error?.message || "Failed to fetch realtime stock data",
      });
    }
  },

  startRealtimeSync: (intervalMs = 12000) => {
    const { realtimeSyncInterval } = get();
    if (realtimeSyncInterval) clearInterval(realtimeSyncInterval);

    get().refreshRealtimeStocks();
    const intervalId = setInterval(() => {
      get().refreshRealtimeStocks();
    }, intervalMs);

    set({ realtimeSyncInterval: intervalId });
  },

  stopRealtimeSync: () => {
    const { realtimeSyncInterval } = get();
    if (realtimeSyncInterval) clearInterval(realtimeSyncInterval);
    set({ realtimeSyncInterval: null });
  },

  // ── HOLDINGS STATE ──
  holdings: loadUserState(initialUser, "holdings", []),

  // ── MATCHED TRADES (Behavioral Counterparty Matching impact) ──
  matchedTrades: loadUserState(initialUser, 'matchedTrades', []),

  addMatchedTrade: (trade) => {
    const newTrades = [trade, ...get().matchedTrades].slice(0, 100);
    set({ matchedTrades: newTrades });
    saveUserState(get().user, 'matchedTrades', newTrades);
  },

  // ── COMPANY ANALYSIS NOTES (mood + text notes per stock) ──
  companyNotes: loadUserState(initialUser, 'companyNotes', {}),

  saveCompanyNote: (symbol, note) => {
    const existing = get().companyNotes;
    const symbolNotes = existing[symbol] || [];
    const updated = { ...existing, [symbol]: [note, ...symbolNotes].slice(0, 20) };
    set({ companyNotes: updated });
    saveUserState(get().user, 'companyNotes', updated);
  },

  updateHoldingsPnL: () => {
    const { holdings, stocks } = get();
    if (holdings.length === 0) return;

    const updated = holdings.map((h) => {
      const stock = stocks.find((s) => s.id === h.stockId);
      if (!stock) return h;
      const currentValue = h.quantity * stock.currentPrice;
      const investedValue = h.quantity * h.avgBuyPrice;
      return {
        ...h,
        currentPrice: stock.currentPrice,
        currentValue: parseFloat(currentValue.toFixed(2)),
        pnl: parseFloat((currentValue - investedValue).toFixed(2)),
        pnlPct: parseFloat(
          (((currentValue - investedValue) / investedValue) * 100).toFixed(2),
        ),
      };
    });

    set({ holdings: updated });
  },

  // ── TRADING ──
  buyStock: async (stockId, quantity, executionPrice = null, metadata = {}) => {
    const { stocks, user, holdings } = get();
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock || !user) return { success: false, message: "Stock not found" };

    const price = Number.isFinite(executionPrice)
      ? executionPrice
      : stock.currentPrice;

    try {
      const { api } = await import("../services/api.js");
      const response = await api.buyStock(stock.symbol, quantity, price);

      if (!response.message || response.message !== "Purchase successful") {
        return { success: false, message: response.message || "Server error" };
      }

      // Update local coins from server
      const newCoins = response.balance;

      const executedPrice = Number(response?.trade?.price ?? price);
      const executedQty = Number(response?.trade?.quantity ?? quantity);
      const totalCost = Number(
        response?.trade?.totalAmount ?? executedPrice * executedQty,
      );
      const existingIdx = holdings.findIndex((h) => h.stockId === stockId);
      let newHoldings = [...holdings];

      if (existingIdx >= 0) {
        const existing = newHoldings[existingIdx];
        const totalQty = existing.quantity + executedQty;
        const newAvg =
          (existing.avgBuyPrice * existing.quantity +
            executedPrice * executedQty) /
          totalQty;
        newHoldings[existingIdx] = {
          ...existing,
          quantity: totalQty,
          avgBuyPrice: parseFloat(newAvg.toFixed(2)),
          currentPrice: executedPrice,
          currentValue: parseFloat((totalQty * executedPrice).toFixed(2)),
          pnl: parseFloat(
            (totalQty * executedPrice - totalQty * newAvg).toFixed(2),
          ),
          pnlPct: parseFloat(
            (((executedPrice - newAvg) / newAvg) * 100).toFixed(2),
          ),
        };
      } else {
        newHoldings.push({
          stockId,
          symbol: stock.symbol,
          name: stock.name,
          quantity: executedQty,
          avgBuyPrice: executedPrice,
          currentPrice: executedPrice,
          currentValue: totalCost,
          pnl: 0,
          pnlPct: 0,
          boughtAt: Date.now(),
        });
      }

      const order = {
        id: Date.now(),
        stockId,
        symbol: stock.symbol,
        name: stock.name,
        type: "BUY",
        quantity: executedQty,
        price: executedPrice,
        totalCost,
        balanceAfter: newCoins,
        pnl: 0,
        timestamp: Date.now(),
        status: "COMPLETED",
        ...metadata,
      };

      const newOrders = [order, ...get().orders];
      const newTradeHistory = [order, ...get().tradeHistory];

      set({
        holdings: newHoldings,
        orders: newOrders,
        tradeHistory: newTradeHistory,
      });
      get().updateUser({
        iqCoins: newCoins,
        totalTrades: (user.totalTrades || 0) + 1,
      });
      get().addCoinHistoryEvent({
        type: "TRADE",
        subtype: "BUY",
        amount: -totalCost,
        source: stock.symbol,
        label: `Bought ${executedQty} ${stock.symbol}`,
        note: `Spent ₹${totalCost.toLocaleString()} to acquire shares`,
        balanceAfter: newCoins,
        reference: order.id,
      });
      saveUserState(get().user, "holdings", newHoldings);
      saveUserState(get().user, "orders", newOrders);
      saveUserState(get().user, "tradeHistory", newTradeHistory);
      get().recordPortfolioSnapshot();
      get().checkMilestones();

      return { success: true, order };
    } catch (err) {
      return { success: false, message: "Server connection failed" };
    }
  },

  sellStock: async (
    stockId,
    quantity,
    executionPrice = null,
    metadata = {},
  ) => {
    const { stocks, user, holdings } = get();
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock || !user) return { success: false, message: "Stock not found" };

    const holdingIdx = holdings.findIndex((h) => h.stockId === stockId);
    if (holdingIdx < 0) return { success: false, message: "No holdings found" };

    const holding = holdings[holdingIdx];
    if (quantity > holding.quantity)
      return { success: false, message: "Insufficient shares" };

    const price = Number.isFinite(executionPrice)
      ? executionPrice
      : stock.currentPrice;

    try {
      const { api } = await import("../services/api.js");
      const response = await api.sellStock(stock.symbol, quantity, price);

      if (!response.message || response.message !== "Sale successful") {
        return { success: false, message: response.message || "Server error" };
      }

      const executedPrice = Number(response?.trade?.price ?? price);
      const executedQty = Number(response?.trade?.quantity ?? quantity);
      const saleValue = Number(
        response?.trade?.totalAmount ?? executedPrice * executedQty,
      );
      const costBasis = parseFloat(
        (holding.avgBuyPrice * executedQty).toFixed(2),
      );
      const tradePnL = Number(
        response?.trade?.realizedPnl ??
          parseFloat((saleValue - costBasis).toFixed(2)),
      );

      // Add coins
      const newCoins = response.balance;

      let newHoldings = [...holdings];
      if (executedQty >= holding.quantity) {
        newHoldings.splice(holdingIdx, 1);
      } else {
        newHoldings[holdingIdx] = {
          ...holding,
          quantity: holding.quantity - executedQty,
          currentValue: parseFloat(
            ((holding.quantity - executedQty) * executedPrice).toFixed(2),
          ),
        };
      }

      const order = {
        id: Date.now(),
        stockId,
        symbol: stock.symbol,
        name: stock.name,
        type: "SELL",
        quantity: executedQty,
        price: executedPrice,
        totalCost: saleValue,
        balanceAfter: newCoins,
        pnl: tradePnL,
        timestamp: Date.now(),
        status: "COMPLETED",
        ...metadata,
      };

      const newOrders = [order, ...get().orders];
      const newTradeHistory = [order, ...get().tradeHistory];

      set({
        holdings: newHoldings,
        orders: newOrders,
        tradeHistory: newTradeHistory,
      });
      get().updateUser({
        iqCoins: newCoins,
        totalTrades: (user.totalTrades || 0) + 1,
        totalPnL: (user.totalPnL || 0) + tradePnL,
      });
      get().addCoinHistoryEvent({
        type: "TRADE",
        subtype: "SELL",
        amount: saleValue,
        source: stock.symbol,
        label: `Sold ${executedQty} ${stock.symbol}`,
        note: `Received ₹${saleValue.toLocaleString()} from sale`,
        balanceAfter: newCoins,
        reference: order.id,
      });

      saveUserState(get().user, "holdings", newHoldings);
      saveUserState(get().user, "orders", newOrders);
      saveUserState(get().user, "tradeHistory", newTradeHistory);
      get().recordPortfolioSnapshot();
      get().checkMilestones();

      return { success: true, order, pnl: tradePnL };
    } catch (err) {
      return { success: false, message: "Server connection failed" };
    }
  },

  // ── ORDERS ──
  orders: loadUserState(initialUser, "orders", []),
  tradeHistory: loadUserState(initialUser, "tradeHistory", []),
  coinHistory: loadUserState(initialUser, "coinHistory", []),

  fetchTradeHistory: async (limit = 100) => {
    const { user } = get();
    if (!user) return [];

    try {
      const { api } = await import("../services/api.js");
      const response = await api.getTradeHistory(limit);
      const transactions = Array.isArray(response?.transactions)
        ? response.transactions
        : [];
      const mapped = transactions.map((tx) => ({
        id: tx._id || `${tx.type}-${tx.timestamp}`,
        symbol: tx.symbol,
        name: tx.symbol,
        type: tx.type,
        quantity: Number(tx.quantity || 0),
        price: Number(tx.price || 0),
        totalCost: Number(tx.totalAmount || 0),
        pnl: tx.type === "SELL" ? Number(tx.realizedPnl || 0) : 0,
        realizedPnl: Number(tx.realizedPnl || 0),
        balanceAfter: Number(tx.balanceAfter || 0),
        timestamp: tx.timestamp,
        status: "COMPLETED",
      }));

      set({ orders: mapped, tradeHistory: mapped });
      saveUserState(get().user, "orders", mapped);
      saveUserState(get().user, "tradeHistory", mapped);
      return mapped;
    } catch (error) {
      console.warn("Failed to fetch backend trade history", error);
      return get().orders;
    }
  },

  // ── FEAR SCORE ──
  fearScore: loadUserState(initialUser, "fearScore", DEFAULT_FEAR_SCORE),
  fearHistory: loadUserState(initialUser, "fearHistory", []),
  fearModalData: null, // used to trigger the modal

  fetchFearData: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const { api } = await import("../services/api.js");
      const scoreRes = await api.getFearScore(user._id);
      const historyRes = await api.getFearHistory(user._id);
      const syncedScore = {
        score: scoreRes.score,
        fearClass: scoreRes.classification,
      };

      set({
        fearScore: syncedScore,
        fearHistory: historyRes,
      });
      get().updateUser({
        fearScore: syncedScore.score,
        fearClass: syncedScore.fearClass,
      });
      saveUserState(user, "fearScore", syncedScore);
      saveUserState(user, "fearHistory", historyRes);
    } catch (e) {
      console.error("Failed to fetch fear data", e);
    }
  },

  updateFearScore: async (
    action,
    hesitationMs = 0,
    isPositiveOutcome = true,
    manualDelta = 0,
  ) => {
    try {
      const { api } = await import("../services/api.js");
      const result = await api.logBehavior(
        action,
        hesitationMs,
        isPositiveOutcome,
        manualDelta,
      );

      const newScore = {
        score: result.score,
        fearClass: result.classification,
      };
      const historyUpdate = [
        ...get().fearHistory,
        { timestamp: Date.now(), score: result.score, action },
      ].slice(-50);

      set({
        fearScore: newScore,
        fearHistory: historyUpdate,
        // MOOD_REPORT always shows the modal (even 0-delta Neutral is useful feedback)
        // All other actions: only show if delta is non-zero and it's not a quiz action
        fearModalData:
          action === 'MOOD_REPORT'
            ? result
            : (result.delta !== 0 && action !== 'QUIZ_RESULT' ? result : null),
      });

      saveUserState(get().user, "fearScore", newScore);
      saveUserState(get().user, "fearHistory", historyUpdate);
      get().updateUser({
        fearScore: result.score,
        fearClass: result.classification,
      });
      get().checkMilestones();
    } catch (e) {
      console.error("Fear log failed", e);
    }
  },

  clearFearModal: () => set({ fearModalData: null }),

  // ── MILESTONES ──
  milestones: loadUserState(initialUser, "milestones", []),

  checkMilestones: () => {
    const { user, orders, milestones, holdings } = get();
    if (!user) return;
    const newMilestones = [...milestones];
    const unlockedRewards = [];

    const checks = [
      {
        id: "first_trade",
        label: "First Trade",
        condition: orders.length >= 1,
        reward: 200,
      },
      {
        id: "10_trades",
        label: "10 Trades",
        condition: orders.length >= 10,
        reward: 500,
      },
      {
        id: "25_trades",
        label: "25 Trades",
        condition: orders.length >= 25,
        reward: 1000,
      },
      {
        id: "first_profit",
        label: "First Profit",
        condition: orders.some((o) => o.pnl > 0),
        reward: 300,
      },
      {
        id: "diversified",
        label: "Diversified Portfolio",
        condition: holdings.length >= 5,
        reward: 400,
      },
      {
        id: "fearless",
        label: "Fearless",
        condition: (user.fearScore || 65) < 40,
        reward: 1000,
      },
    ];

    checks.forEach((m) => {
      if (!newMilestones.find((nm) => nm.id === m.id) && m.condition) {
        newMilestones.push({ ...m, unlockedAt: Date.now() });
        unlockedRewards.push(m);
      }
    });

    if (newMilestones.length !== milestones.length) {
      set({ milestones: newMilestones });
      saveUserState(get().user, "milestones", newMilestones);
    }

    if (unlockedRewards.length > 0) {
      void (async () => {
        try {
          const { api } = await import("../services/api.js");
          for (const milestone of unlockedRewards) {
            const reward = await api.rewardCoins({
              amount: milestone.reward,
              sourceId: milestone.id,
              label: milestone.label,
              note: `Milestone unlocked: ${milestone.label}`,
            });

            if (Number.isFinite(Number(reward?.balance))) {
              get().updateUser({ iqCoins: reward.balance });
              get().addCoinHistoryEvent({
                type: "REWARD",
                subtype: "ACHIEVEMENT",
                amount: milestone.reward,
                source: milestone.label,
                label: `Achievement reward: ${milestone.label}`,
                note: `Verified reward from unlocked milestone`,
                balanceAfter: reward.balance,
                reference: milestone.id,
              });
            }
          }
        } catch (error) {
          console.warn("Failed to award milestone coins", error);
        }
      })();
    }
  },

  // ── SIMULATIONS ──
  simulations: loadUserState(initialUser, "simulations", []),

  addSimulation: (sim) => {
    const newSims = [sim, ...get().simulations].slice(0, 50);
    set({ simulations: newSims });
    saveUserState(get().user, "simulations", newSims);
  },

  // ── PORTFOLIO VALUE HISTORY ──
  portfolioHistory: loadUserState(initialUser, "portfolioHistory", []),

  recordPortfolioSnapshot: () => {
    const { holdings, user, orders } = get();
    if (!user) return;
    const totalValue = round2(
      holdings.reduce((s, h) => s + (h.currentValue || 0), 0),
    );
    const investedAmount = round2(
      holdings.reduce(
        (s, h) => s + (h.quantity || 0) * (h.avgBuyPrice || 0),
        0,
      ),
    );
    const unrealizedPnl = round2(
      holdings.reduce((s, h) => s + (h.pnl || 0), 0),
    );
    const realizedPnl = round2(
      orders.reduce(
        (s, o) => s + (o.type === "SELL" ? o.pnl || o.realizedPnl || 0 : 0),
        0,
      ),
    );
    const totalPnl = round2(realizedPnl + unrealizedPnl);
    const coinBalance = round2(user.iqCoins || 0);
    const netWorth = round2(totalValue + coinBalance);
    const snapshot = {
      timestamp: Date.now(),
      totalValue,
      investedAmount,
      coinBalance,
      realizedPnl,
      unrealizedPnl,
      totalPnl,
      netWorth,
      holdingsCount: holdings.length,
    };
    const history = [...get().portfolioHistory, snapshot].slice(-200);
    set({ portfolioHistory: history });
    saveUserState(get().user, "portfolioHistory", history);
  },
}));

export default useStore;
