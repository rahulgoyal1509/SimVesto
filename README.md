# SimVesto — AI-Powered Investment Simulation Platform

> **Trade Without Fear. Learn Without Risk.**

SimVesto is an advanced, gamified trading simulation constructed to conquer the psychological barriers young investors face. It provides a real-time, zero-risk environment augmented by Monte Carlo probability models and AI (Google Gemini & Groq) to teach financial literacy.

---

## 🛑 Problem Statement
The modern stock market is highly accessible, yet fundamentally intimidating for beginners. Young and first-time investors face severe financial anxiety, leading to "analysis paralysis" or dangerous, uneducated gambles. They lack a safe, realistic environment to practice managing emotions, understanding market indicators (like NIFTY/SENSEX), and building a fundamentally sound portfolio without risking real capital losses. The primary obstacle to wealth generation is not access to platforms, but the **fear of execution** stemming from a lack of practical experience.

---

## 🎯 Solution Overview
SimVesto eliminates financial anxiety by providing a **zero-risk, highly realistic virtual trading terminal.** 
Users are given 100,000 "IQ Coins" and thrown into a highly sophisticated, classic 3D-styled dashboard to trade against simulated assets tracking Geometric Brownian Motion. 

**Key Differentiators:**
1. **Behavioral "Fear Score" Engine:** Automatically tracks hesitation, panic-selling, and erratic scrolling to generate a psychological profile that evolves as confidence grows.
2. **Monte Carlo AI Advisor:** Simulates 1,000 distinct future pricing paths whenever a user clicks "Buy/Sell," warning them if the trade statistically carries an extreme risk of loss.
3. **AI Narrator:** Gemini actively narrates portfolio performance based on the user's active Fear Score, and a localized Groq Chatbot is available for contextual deep dives into complex financial strategies.
4. **Glossary Mechanics:** Integrated "Gen-Z" accessible tooltips across the website translating strict market terminology (like Sensex, Holding, Compound) into digestible language natively while reading.

---

## 🛠 Technical Details (Tech Stack)
This application employs a modern **MERN (React/Node) Architecture**:

- **Frontend Environment**: React 19, Vite V8
- **Global State Management**: Zustand (Persists local simulated holdings)
- **Styling Architecture**: Vanilla CSS deploying custom `145deg` Neumorphic 3D rendering for high-end "Trading Terminal" aesthetics.
- **Charts & Data Visualization**: Recharts (Performance, Asset Allocation), and Framer Motion for micro-animations.
- **Backend API & Processing**: Node.js & Express Architecture (Located in `/backend` serving the LLM chat capabilities).
- **AI Integration Logic**: Google Gemini API configured for the Portfolio Narrator, and **Groq Cloud (Llama 3.3 70B)** providing ultra low-latency intelligent chat within the backend configuration.
- **Simulated Engine**: Custom built `stockEngine.js` using Geometric Brownian Motion (`dS = S * (mu*dt + sigma*epsilon*sqrt(dt))`), updating prices dynamically every 1.5 seconds.

---

## 🚀 Execution Commands (How to Run Locally)

Follow these exact steps to instantly boot both the Core Simulation Client and the AI Backend Server locally.

### 1. Requirements Validation
Ensure your system possesses:
- **Node.js** (v18 or higher)
- **Git**

### 2. Booting the Application
Open your terminal and execute the following setup commands:

```bash
# 1. Clone the repository
git clone https://github.com/mukul1421/SimVesto.git

# 2. Navigate into the folder
cd SimVesto

# 3. Setup and Boot the Backend 
cd backend
npm install
npm run dev
pip install yfinance 
pip install uvicorn
# The backend will boot securely on http://localhost:5000 
```

**Open a NEW Terminal Window (Leave backend running):**

```bash
# 4. Boot the Interactive Frontend
cd SimVesto
npm install
npm run dev
```

**Accessing the Platform:**
Navigate to `http://localhost:5173` in your browser. 
The entire simulation suite is now live!

### 3. API Key Configurations (Optional)

The simulation engine is designed to operate seamlessly **offline** using intelligent fallback responses if you do not supply an AI Key. To unlock full AI Narration from Gemini and Groq:

- **Frontend (Gemini)**: Grab a free key at [Google AI Studio](https://aistudio.google.com/apikey). Navigate to the "Profile -> Settings" page within the localized SimVesto Dashboard and paste it instantly.
- **Backend (Groq)**: Formulate a `.env` file within the `/backend` folder:
  ```env
  GROQ_API_KEY=your_key_here
  GROQ_MODEL=llama-3.3-70b-versatile
  ```
  *(Restart the backend instance if actively running).*

---

## Project Structure
```
SimVesto/
├── backend/               # Node/Express Groq Model Processor
├── src/
│   ├── engine/            # The Brain (GBM, Monte Carlo, Fear Engine)
│   ├── store/             # Zustand State Configuration
│   ├── pages/             # Neumorphic Dashboard, Explore, AI Engine Views
│   ├── components/        # Toolbars, Glossary Highlighters, App Layouts
│   ├── App.jsx            # Dynamic Router 
│   └── index.css          # Core "Classic 3D Dashboard" Typography and Layout Engine
└── vite.config.js
```
