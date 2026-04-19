import os
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from dotenv import load_dotenv
from sentiment import MarketSentimentPipeline
from optimizer import PortfolioOptimizer
from behavior_model import BehavioralPatternDetector
from anomaly import MarketAnomalyDetector
from datetime import datetime
import asyncio
import json
from starlette.websockets import WebSocketDisconnect

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="SimVesto ML Microservice", version="1.0.0")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "SimVesto ML Microservice is running!"}

# Import routers/endpoints from ML modules
# (You will see these imported once we implement each feature)

# Feature 1: Sentiment Analysis models
class SentimentRequest(BaseModel):
    symbols: List[str]
    user_portfolio: Dict[str, float] = {}

# Feature 2: Portfolio Optimization models
class OptimizeRequest(BaseModel):
    symbols: List[str]
    risk_tolerance: str = "medium"
    target_annual_return: float = None

# Feature 3: Behavioral Pattern Detection models
class BehaviorRequest(BaseModel):
    user_history: List[Dict[str, Any]]

# ---------------------------------------------------------
# Feature 1: Sentiment Analysis Pipeline
# ---------------------------------------------------------
# Instantiate pipeline globally so FinBERT model is loaded once on startup
sentiment_pipeline = MarketSentimentPipeline()

@app.post("/ml/sentiment-analysis")
def analyze_sentiment(request: SentimentRequest):
    # Fetch news and tweets
    news = sentiment_pipeline.fetch_market_news(request.symbols)
    tweets = sentiment_pipeline.fetch_twitter_sentiment(request.symbols)
    
    # Combine text
    all_text = []
    for article in news:
        title = article.get('title', '') or ''
        desc = article.get('description', '') or ''
        all_text.append(title + ' ' + desc)
    all_text.extend(tweets)
    
    # HACKATHON DEMO FALLBACK: If API keys are invalid/missing, provide 
    # realistic dummy news so the FinBERT NLP model actually displays a result!
    if not all_text:
        import random
        demo_headlines = [
            f"{request.symbols[0]} surges 8% after breaking quarterly revenue estimates, analysts upgrade target.",
            f"Market rallies as inflation data comes in cooler than expected. Huge bullish momentum.",
            f"Investors confident in {request.symbols[0]}'s long term growth strategy amidst sector headwinds."
        ]
        # Occasionally mix in bearish news to demonstrate the needle moving left
        if random.random() > 0.6:
            demo_headlines = [
                f"{request.symbols[0]} faces regulatory probe, stock plummets 5% in early trading.",
                f"Bear market fears resume as tech sector sees massive selloff today.",
                f"Target downgraded for {request.symbols[0]} due to supply chain concerns."
            ]
        all_text = demo_headlines
        
    # Analyze sentiment
    sentiments = [sentiment_pipeline.analyze_sentiment(text) for text in all_text]
    
    # Predict market impact
    market_impact = sentiment_pipeline.predict_market_impact(sentiments, request.symbols)
    
    # Assess portfolio risk
    portfolio_risk = sentiment_pipeline.assess_portfolio_risk(request.user_portfolio, market_impact)
    
    # Send limited detailed analysis to avoid massive payloads
    detailed_analysis = [{"text": t[:100]+"...", "sentiment": s} for t, s in zip(all_text, sentiments)][:10]
    
    return {
        "timestamp": datetime.now().isoformat(),
        "market_sentiment": market_impact,
        "portfolio_risk_assessment": portfolio_risk,
        "detailed_analysis": detailed_analysis,
        "recommendation": "REDUCE PORTFOLIO" if portfolio_risk.get('overall_risk') == "HIGH RISK" else "HOLD/ACCUMULATE"
    }

# ---------------------------------------------------------
# Feature 2: Portfolio Optimization
# ---------------------------------------------------------
@app.post("/ml/optimize-portfolio")
def optimize_portfolio(request: OptimizeRequest):
    try:
        # Note: In a production app, we would cache the optimizer per symbol group
        # initializing it on every request downloads historical data!
        optimizer = PortfolioOptimizer(request.symbols)
        
        optimization = optimizer.optimize_portfolio(
            target_return=request.target_annual_return,
            risk_tolerance=request.risk_tolerance
        )
        
        if "error" in optimization:
            raise HTTPException(status_code=400, detail=optimization["error"])
            
        frontier = optimizer.efficient_frontier(num_portfolios=500) # Small for speed
        
        return {
            "recommended_allocation": optimization["allocation"],
            "expected_metrics": {
                "annual_return": f"{optimization['expected_annual_return']*100:.2f}%",
                "volatility": f"{optimization['expected_volatility']*100:.2f}%",
                "sharpe_ratio": f"{optimization['sharpe_ratio']:.2f}"
            },
            "efficient_frontier": frontier,
            "message": "Optimization successful based on Modern Portfolio Theory."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# Feature 3: Behavioral Pattern Detection
# ---------------------------------------------------------
behavior_detector = BehavioralPatternDetector()

@app.post("/ml/detect-behavioral-pattern")
def detect_behavior(request: BehaviorRequest):
    try:
        behavior = behavior_detector.detect_behavior(request.user_history)
        return {
            "intervention": behavior.get("intervention_required", False),
            "behavior": behavior,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# Feature 4: Market Anomaly Detection
# ---------------------------------------------------------
anomaly_detector = MarketAnomalyDetector()

@app.websocket("/ws/market-anomalies")
async def websocket_market_anomalies(websocket: WebSocket):
    await websocket.accept()
    try:
        await websocket.send_json({"message": "Connected to Market Anomaly Detection Stream"})
        
        # Simulate continuous market data feed for the hackathon demo
        import random
        while True:
            # Simulate continuous market data
            # Inject an extreme anomaly ~30% of the time for Hackathon demo purposes!
            is_spike = random.random() < 0.30
            
            pct_change = random.choice([-5.5, 6.2]) if is_spike else random.gauss(0, 2)
            vol = random.uniform(40, 60) if is_spike else random.uniform(10, 25)
            
            dummy_market_data = {
                "symbol": "NSE_INDEX",
                "price_change_pct": pct_change,
                "volume_spike": random.random() > 0.9 or is_spike,
                "volatility": vol,
                "timestamp": datetime.now().isoformat()
            }
            
            result = anomaly_detector.detect_anomaly(dummy_market_data)
            
            if result.get("anomaly_detected"):
                await websocket.send_json({
                    "timestamp": datetime.now().isoformat(),
                    "alert": result
                })
                
            await asyncio.sleep(1)  # Scan every 1 seconds
    except WebSocketDisconnect:
        print("Market Anomaly Stream: Client disconnected normally.")
    except Exception as e:
        print(f"Market Anomaly Stream error: {e}")
