import requests
import json
import time

BASE_URL = "https://simvesto-c67n.onrender.com"

def test_sentiment():
    print("\n" + "="*50)
    print("🧪 TESTING: Real-Time Sentiment Analysis Pipeline")
    print("="*50)
    
    payload = {
        "symbols": ["Reliance", "TCS"],
        "user_portfolio": {"Reliance": 0.5, "TCS": 0.5}
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ml/sentiment-analysis", json=payload)
        response.raise_for_status()
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"❌ Failed to reach endpoint: {e}")

def test_optimizer():
    print("\n" + "="*50)
    print("🧪 TESTING: Portfolio Optimization (Modern Portfolio Theory)")
    print("="*50)
    
    payload = {
        "symbols": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "^NSEI"],
        "risk_tolerance": "medium",
        "target_annual_return": 0.12
    }
    
    try:
        print("Note: This endpoint fetches live yfinance data, so it takes ~5 seconds...")
        response = requests.post(f"{BASE_URL}/ml/optimize-portfolio", json=payload)
        response.raise_for_status()
        
        data = response.json()
        print("✅ Recommended Allocation:")
        print(json.dumps(data.get("recommended_allocation", {}), indent=2))
        print("✅ Expected Metrics:")
        print(json.dumps(data.get("expected_metrics", {}), indent=2))
    except Exception as e:
        print(f"❌ Failed to reach endpoint: {e}")

if __name__ == "__main__":
    print("Starting ML Endpoint Tests...")
    print("Make sure your FastAPI server is running! (uvicorn main:app --reload)")
    time.sleep(1)
    
    test_sentiment()
    test_optimizer()
    print("\n✅ Done testing.")
