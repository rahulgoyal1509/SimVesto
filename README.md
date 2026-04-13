# SimVesto — AI-Powered Investment Simulation Platform

> Trade Without Fear. Learn Without Risk.

SimVesto is a trading simulation platform built for young investors who want to learn investing without risking real money. Think of it as Groww or Zerodha, but with virtual tokens (IQ Coins) and an AI advisor that evaluates every trade you make using Monte Carlo simulation.

---

## What it does

Users sign up, answer a quick personality quiz, and get 10,000 IQ Coins to start trading. The platform simulates 20 Indian stocks with real-time price movement. You buy and sell just like a real trading app — except there's no real money involved.

Behind the scenes, a Monte Carlo engine runs 1,000 simulated scenarios on every trade to tell you whether your decision is likely good, average, or risky. An AI narrator (powered by Google Gemini) explains the results in plain English, adjusting its tone based on how confident or fearful you are.

The platform also tracks your behavior automatically — how long you hesitate before trades, how often you check your portfolio, whether you panic-sell — and uses that to compute a "fear score" that drops as you gain experience.

---

## Features

**Real-time trading simulation**
- 20 stocks with prices that move every 1.5 seconds using Geometric Brownian Motion
- Full buy/sell mechanics with portfolio tracking and P&L
- Scrolling live ticker strip across the top

**Monte Carlo AI Advisor**
- 1,000 simulated paths per trade analysis
- Confidence bands (P5 through P95) visualized on charts
- Clear verdict: GOOD / AVERAGE / RISKY with loss probability

**Behavioral intelligence**
- Automatic tracking — no surveys or manual input
- Captures hesitation time, scroll patterns, trade delays, page visit frequency
- Computes a fear score (0–100) that evolves over sessions

**AI Portfolio Narrator**
- Google Gemini API integration for personalized analysis
- Adapts tone based on fear level (reassuring for anxious users, data-driven for confident ones)
- Streams text character-by-character
- Works fully offline with fallback templates

**IQ Coins economy**
- Start with 10,000 free tokens
- Profit on trades = earn coins. Loss on trades = lose coins.
- Bonus coins from milestones (first trade, diversification, fear score improvement)

**Confidence journey**
- Fear score timeline showing your progress
- Achievement milestones
- Shareable confidence card (exportable as PNG)

---

## Pages

| Page | What it does |
|------|-------------|
| Landing | 3D animated hero with Three.js, feature overview |
| Signup | Account creation + 5-question personality quiz |
| Login | Email/password authentication |
| Dashboard | Portfolio performance, fear gauge, top movers |
| Explore | Browse all 20 stocks with search and sector filters |
| Trade | Full trading interface with live chart, buy/sell panel, Monte Carlo advisor |
| Holdings | Current portfolio with allocation chart and AI analysis |
| Orders | Trade history with filters |
| AI Advisor | Dedicated Monte Carlo simulation page |
| Insights | Fear score timeline, trading stats, milestones |
| Profile | Settings, API key config, confidence card |

---

## Tech stack

- **Frontend**: React 19, Vite 8
- **Routing**: React Router v7
- **State management**: Zustand
- **Charts**: Recharts
- **3D**: Three.js + React Three Fiber
- **Animations**: Framer Motion
- **AI**: Google Gemini API (free tier)
- **Styling**: Vanilla CSS, custom dark theme
- **Persistence**: localStorage (Supabase-ready)

---

## Getting started

```bash
# Clone
git clone https://github.com/mukul1421/SimVesto.git
cd SimVesto

# Install
npm install

# Run
npm run dev
```

Open http://localhost:5173 in your browser.

### Setting up AI (optional)

The app works without an API key — it uses smart fallback templates. To enable real Gemini AI narration:

1. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Go to Profile > Settings in the app
3. Paste and save your key

The free tier gives you 15 requests/minute which is plenty.

### Setting up Groq chatbot (backend)

The stock-market chatbot endpoint uses Groq via backend environment variables.

1. Create `backend/.env` (or update your existing one)
2. Add:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

3. Restart backend server
4. Open the app and use the **Market Chatbot** page (`/app/chat`)

If `GROQ_API_KEY` is missing or invalid, chatbot falls back to built-in educational responses.

---

## How the simulation works

**Stock prices** use Geometric Brownian Motion: `dS = S * (mu*dt + sigma*epsilon*sqrt(dt))` with drift and volatility parameters tuned per stock. Prices tick every 1.5 seconds.

**Monte Carlo** runs 1,000 stochastic paths forward in time, computes percentile bands, and classifies the trade: under 25% loss probability = GOOD, under 50% = AVERAGE, 50%+ = RISKY.

**Fear scoring** uses a weighted model on automatically captured signals: hover-to-click delay, trade reversals, portfolio check frequency, quiz answers, and profit/loss ratio.

---

## Project structure

```
SimVesto/
├── src/
│   ├── engine/
│   │   ├── stockEngine.js     # Stock price simulation (GBM)
│   │   ├── monteCarlo.js      # Monte Carlo analysis
│   │   ├── fearEngine.js      # Behavioral tracking
│   │   └── aiNarrator.js      # Gemini API integration
│   ├── store/
│   │   └── useStore.js        # Global state (Zustand)
│   ├── components/
│   │   └── AppLayout.jsx      # Sidebar, topbar, ticker
│   ├── pages/                 # All 11 page components
│   ├── App.jsx                # Routes
│   ├── main.jsx               # Entry point
│   └── index.css              # Design system
├── index.html
├── vite.config.js
├── package.json
└── Documentation.html         # Full technical spec
```

---

## License

MIT
