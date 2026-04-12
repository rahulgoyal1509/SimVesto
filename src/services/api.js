const BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  register: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  // Wallet
  getWallet: async () => {
    const res = await fetch(`${BASE_URL}/wallet`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Portfolio
  getPortfolio: async () => {
    const res = await fetch(`${BASE_URL}/portfolio`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Trade
  buyStock: async (symbol, quantity) => {
    const res = await fetch(`${BASE_URL}/trade/buy`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ symbol, quantity })
    });
    return res.json();
  },
  sellStock: async (symbol, quantity) => {
    const res = await fetch(`${BASE_URL}/trade/sell`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ symbol, quantity })
    });
    return res.json();
  },

  // Simulation & Risk
  runSimulation: async (investment, assets, duration) => {
    const res = await fetch(`${BASE_URL}/simulation/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ investment, assets, duration })
    });
    return res.json();
  },
  
  getRiskInsights: async (simulationId) => {
    const res = await fetch(`${BASE_URL}/risk/${simulationId}`, { headers: getAuthHeaders() });
    return res.json();
  },

  getAiExplanation: async (result) => {
    const res = await fetch(`${BASE_URL}/risk/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result })
    });
    return res.json();
  },

  // Stocks
  getStocks: async () => {
    const res = await fetch(`${BASE_URL}/stock`, { headers: getAuthHeaders() });
    return res.json();
  },
  initStocks: async () => {
    const res = await fetch(`${BASE_URL}/stock/init`, { method: 'POST', headers: getAuthHeaders() });
    return res.json();
  },

  // Fear Score
  getFearScore: async (userId) => {
    const res = await fetch(`${BASE_URL}/fear/${userId}`, { headers: getAuthHeaders() });
    return res.json();
  },
  getFearHistory: async (userId) => {
    const res = await fetch(`${BASE_URL}/fear/${userId}/history`, { headers: getAuthHeaders() });
    return res.json();
  },
  logBehavior: async (action, hesitationMs, isPositiveOutcome, delta) => {
    const res = await fetch(`${BASE_URL}/fear/behavior/log`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, hesitationMs, isPositiveOutcome, delta })
    });
    return res.json();
  },
  getPortfolioRecommendations: async () => {
    const res = await fetch(`${BASE_URL}/fear/portfolio/recommendations`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
