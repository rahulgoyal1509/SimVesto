import asyncio
import os

# Prevent Transformers from crashing during TensorFlow 2.16 imports
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

import re
import numpy as np
from typing import List, Dict, Any
from transformers import pipeline

# You'll need to pip install these and configure API keys in .env
from newsapi import NewsApiClient
try:
    from tweepy import Client
except ImportError:
    pass

class MarketSentimentPipeline:
    def __init__(self):
        # Load API keys from environment
        news_api_key = os.getenv("NEWS_API_KEY", "")
        twitter_bearer = os.getenv("TWITTER_BEARER_TOKEN", "")
        
        self.news_client = NewsApiClient(api_key=news_api_key) if news_api_key else None
        self.twitter_client = Client(bearer_token=twitter_bearer) if twitter_bearer else None
        
        # Load the FinBERT model
        # Using ProsusAI/finbert as it is specifically fine-tuned for financial sentiment
        try:
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="ProsusAI/finbert",
                # device=0 if you have a GPU, otherwise -1 for CPU
                device=-1 
            )
        except Exception as e:
            print(f"Failed to load FinBERT model: {e}")
            self.sentiment_pipeline = None

    def fetch_market_news(self, symbols: List[str]) -> List[Dict[str, str]]:
        """Fetch real market news for given symbols."""
        if not self.news_client:
            print("News API key not configured. Using mocked news data.")
            return [{"title": f"{sym} stock surges on strong earnings report", "description": "Investors are optimistic."} for sym in symbols]

        all_articles = []
        try:
            # Note: NewsAPI get_everything is blocking, so we'd normally wrap in run_in_executor
            for symbol in symbols:
                response = self.news_client.get_everything(
                    q=symbol,
                    sort_by='publishedAt',
                    language='en',
                    page_size=10
                )
                if response.get('status') == 'ok':
                    for article in response.get('articles', []):
                        if article.get('title') and article.get('description'):
                            all_articles.append({
                                "title": article['title'],
                                "description": article['description']
                            })
        except Exception as e:
            print(f"Error fetching news: {e}")
            
        return all_articles

    def fetch_twitter_sentiment(self, symbols: List[str]) -> List[str]:
        """Fetch recent tweets mentioning the symbols."""
        if not self.twitter_client:
            return []
            
        tweets = []
        try:
            for symbol in symbols:
                query = f"{symbol} -is:retweet lang:en"
                response = self.twitter_client.search_recent_tweets(
                    query=query,
                    max_results=10
                )
                if response.data:
                    tweets.extend([t.text for t in response.data])
        except Exception as e:
            print(f"Error fetching tweets: {e}")
            
        return tweets
        
    def preprocess_text(self, text: str) -> str:
        """Clean and prepare text for sentiment analysis."""
        # Remove URLs and mentions
        text = re.sub(r'http\S+|@\S+|#\S+', '', text)
        return text.strip()

    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Run text through FinBERT."""
        if not self.sentiment_pipeline:
            return {"label": "NEUTRAL", "score": 0.5, "confidence": 0.5}
            
        cleaned_text = self.preprocess_text(text)
        if not cleaned_text:
            return {"label": "NEUTRAL", "score": 0.5, "confidence": 0.5}
            
        try:
            # Truncate to avoid max length issues with BERT
            result = self.sentiment_pipeline(cleaned_text[:512])[0]
            
            # FinBERT returns labels: positive, negative, neutral
            label = result['label'].upper()
            score = result['score']
            
            # Normalize score from -1 (very negative) to 1 (very positive)
            normalized_score = 0
            if label == 'POSITIVE':
                normalized_score = score
            elif label == 'NEGATIVE':
                normalized_score = -score
                
            return {
                "label": label,
                "score": normalized_score,
                "confidence": score
            }
        except Exception as e:
            print(f"Error analyzing sentiment: {e}")
            return {"label": "NEUTRAL", "score": 0.0, "confidence": 0.5}

    def predict_market_impact(self, sentiments: List[Dict[str, Any]], symbols: List[str]) -> Dict[str, Any]:
        """Calculate market impact based on aggregated sentiment scores."""
        if not sentiments:
            return {
                "sentiment_score": 0,
                "predicted_direction": "NEUTRAL",
                "confidence": 0,
                "expected_market_move": "0%",
                "affected_sectors": symbols
            }
            
        scores = [s['score'] for s in sentiments]
        avg_sentiment = float(np.mean(scores))
        
        direction = "NEUTRAL"
        if avg_sentiment > 0.2:
            direction = "BULLISH"
        elif avg_sentiment < -0.2:
            direction = "BEARISH"
            
        # Expected move is a mock heuristic based on sentiment intensity
        expected_move = avg_sentiment * 2.5 
        
        return {
            "sentiment_score": avg_sentiment,
            "predicted_direction": direction,
            "confidence": float(abs(avg_sentiment)),
            "expected_market_move": f"{expected_move:+.2f}%",
            "affected_sectors": symbols
        }

    def assess_portfolio_risk(self, user_portfolio: Dict[str, float], market_impact: Dict[str, Any]) -> Dict[str, Any]:
        """Assess risk levels for current portfolio holdings given market sentiment."""
        direction = market_impact["predicted_direction"]
        
        risk_level = "LOW RISK"
        if direction == "BEARISH":
            risk_level = "HIGH RISK"
        elif direction == "NEUTRAL":
            risk_level = "MEDIUM RISK"
            
        affected_holdings = []
        for symbol, allocation in user_portfolio.items():
            if symbol in market_impact["affected_sectors"]:
                rec = "HOLD"
                if direction == "BEARISH":
                    rec = "REDUCE"
                elif direction == "BULLISH":
                    rec = "ACCUMULATE"
                    
                affected_holdings.append({
                    "stock": symbol,
                    "exposure": allocation,
                    "expected_change": market_impact["expected_market_move"],
                    "recommendation": rec
                })
                
        return {
            "overall_risk": risk_level,
            "sentiment": market_impact["sentiment_score"],
            "affected_holdings": affected_holdings,
            "portfolio_impact": f"Your portfolio may move {market_impact['expected_market_move']}"
        }
