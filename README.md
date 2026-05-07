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

**Core ML & AI Features (The 4 Pillars):**
1. **Market Intel News Sentinel:** A dedicated Python microservice utilizing `ProsusAI/finbert` to scan live global news feeds and calculate real-time market sentiment (bullish/bearish) dynamically.
2. **AI Portfolio Optimizer:** Leverages `scipy.optimize` and Modern Portfolio Theory (MPT) to calculate algorithmically balanced "Conservative," "Moderate," and "Aggressive" asset allocations explicitly tailored to the user's current risk appetite.
3. **Behavioral "Fear Score" Engine:** Automatically analyzes user behavior to generate a psychological profile and quantifiable "Fear Score," triggering personalized badges and ML-driven advice.
4. **Market Anomaly Detection:** An `IsolationForest` ML model evaluating live multi-variate metrics over an active WebSocket stream to instantly detect and inject real-time market anomalies and visual alerts into the simulation.

**UX/UI Innovations:**
- **Global Dark/Light Theme System:** Engineered using centralized CSS variables and Zustand state generation for instant, professional UI transition.
- **Market Glossary Mode:** "Gen-Z" accessible tooltips across the application that automatically highlight finance jargon, presenting digestible float-up unwrap explanations.

---

## 🛠 Technical Details (Tech Stack)
This application employs a modern **MERN + Python Microservices Architecture**:

- **Frontend Environment**: React 19, Vite V8, Zustand (State), Recharts (Data Analytics).
- **Styling Architecture**: Vanilla CSS deploying custom `145deg` Neumorphic 3D rendering for high-end "Trading Terminal" aesthetics with real-time CSS variable-driven Dark/Light modes.
- **Node Backend REST API**: Node.js & Express Architecture (Located in `/backend` serving the LLM interactive Chatbot).
- **ML Microservice (Python)**: Configured FastAPI Server processing `transformers` (FinBERT), `scikit-learn` (IsolationForest), and `scipy` optimization calculations broadcasted over WebSocket & REST.
- **Simulated Engine**: Custom built `stockEngine.js` leveraging Geometric Brownian Motion to manipulate mock asset prices safely independent of external walls.

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

# 3. Setup and Boot the Node Backend 
cd backend
npm install
npm run dev
# The backend will boot securely on https://simvesto-b0mg.onrender.com
```

**Open a NEW Terminal Window (Leave Node backend running):**

```bash
# 4. Boot the ML Python Microservice
cd ml_service
.\setup_ml.bat (if u have Python 3.11 or Python 3.12 version then skip this) #this is to download the perfect python version.


**Open a NEW Terminal Window (Leave both backends running):**

```bash
# 5. Boot the ML Python Microservice
cd ml_service
python -m uvicorn main:app --reload
# The ML service actively boots on https://simvesto-c67n.onrender.com
```

**Open a NEW Terminal Window (Leave both backends running):**

```bash
# 6. Boot the Interactive Frontend
# (If inside ml_service, go back to SimVesto root folder)
cd SimVesto
cd frontend
npm install
npm run dev
# The frontend actively boots on https://sim-vesto-xwbj.vercel.app/
```

**Accessing the Platform:**
Navigate to `http://localhost:5173` in your browser. or navigate to 'https://sim-vesto-xwbj.vercel.app/' in browser
The entire simulation suite is now entirely live!

### 3. API Key Configurations (Optional)

The simulation engine is designed to operate seamlessly **offline** using intelligent fallback responses (Mock Data Generators) during hackathon presentations. To unlock full real data API flows:

- **Frontend (Gemini)**: Grab a free key at [Google AI Studio](https://aistudio.google.com/apikey). Navigate to the "Profile -> Settings" page within the SimVesto Dashboard and paste it instantly.
- **Backend (Groq)**: Formulate a `.env` file within the `/backend` folder:
  ```env
  GROQ_API_KEY=your_key_here
  GROQ_MODEL=llama-3.3-70b-versatile
  ```
- **ML Service (News API)**: Formulate a `.env` file within the `/ml_service` folder for live global news analysis:
  ```env
  NEWS_API_KEY=01c5c651841440f3ae52ff4bbaa63ff5
  ```

---

## Project Structure
```
SimVesto/
├── backend/               # Node/Express Groq Model Processor
├── ml_service/            # Python FastAPI ML Processing (FinBERT, Scipy, IsolationForest)
├── src/
│   ├── engine/            # The Brain (GBM, Monte Carlo, Fear Engine)
│   ├── store/             # Zustand State Configuration
│   ├── pages/             # Neumorphic Dashboard, Explore, AI Engine Views
│   ├── components/        # Toolbars, Glossary Highlighters, App Layouts
│   ├── App.jsx            # Dynamic Router 
│   └── index.css          # Core Global CSS variables, Dark Mode styles & Components
└── vite.config.js
```
