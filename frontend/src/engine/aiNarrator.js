// AI Narrator — Gemini API integration
// Generates personalized trade/portfolio analysis

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generateNarration({ apiKey, context, onToken }) {
  if (!apiKey) {
    // Fallback: simulated streaming narration
    return simulateNarration(context, onToken);
  }

  const prompt = buildPrompt(context);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        }
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis unavailable.';

    // Simulate streaming by revealing char by char
    if (onToken) {
      for (let i = 0; i < text.length; i++) {
        await new Promise(r => setTimeout(r, 15 + Math.random() * 15));
        onToken(text.slice(0, i + 1));
      }
    }

    return text;
  } catch (err) {
    console.error('Gemini API error:', err);
    return simulateNarration(context, onToken);
  }
}

function buildPrompt(context) {
  const { type, fearScore, fearClass, literacyScore, stockName, stockSymbol, mcResult, portfolio, tradeHistory, currentPnL } = context;

  const tone = fearClass === 'HIGH' 
    ? 'Be reassuring and supportive. Emphasize safety and downside protection. Use simple language.' 
    : fearClass === 'LOW' 
    ? 'Be data-driven and growth-focused. Use precise numbers and percentages.'
    : 'Be balanced and educational. Mix encouragement with honest data.';

  if (type === 'trade_suggestion') {
    return `You are SimVesto's AI trading advisor. The user has a fear score of ${fearScore}/100 (${fearClass} fear), literacy level ${literacyScore}/10.

They are considering trading ${stockName} (${stockSymbol}).

Monte Carlo simulation results (1000 scenarios):
- Best case (P95): ₹${mcResult?.bestCase}
- Expected (P50): ₹${mcResult?.expectedCase}  
- Worst case (P5): ₹${mcResult?.worstCase}
- Loss probability: ${mcResult?.lossProbability}%
- AI suggestion: ${mcResult?.suggestion}
- Investment amount: ₹${mcResult?.investment}

${tone}

Generate exactly 3 concise sentences: 
1. Anchor the expected outcome
2. Honestly address the risk
3. Give a forward-looking recommendation
Keep it under 60 words total. Use ₹ for currency.`;
  }

  if (type === 'portfolio_analysis') {
    return `You are SimVesto's AI portfolio analyst. The user has a fear score of ${fearScore}/100 (${fearClass} fear).

Current portfolio: ${JSON.stringify(portfolio)}
Recent trades: ${JSON.stringify(tradeHistory?.slice(-5))}
Current P&L: ₹${currentPnL}

${tone}

Analyze their portfolio in 4-5 sentences:
1. Overall portfolio health
2. Diversification assessment
3. Risk pattern from recent trades
4. One specific, actionable suggestion
Keep it under 80 words. Use ₹ for currency.`;
  }

  return `You are SimVesto's AI investment advisor. ${tone} Provide a brief, helpful insight about investing for someone with a ${fearClass} fear level. Keep it under 50 words.`;
}

async function simulateNarration(context, onToken) {
  const { type, fearClass, mcResult, stockName } = context;
  let text = '';

  if (type === 'trade_suggestion' && mcResult) {
    if (mcResult.suggestion === 'GOOD') {
      if (fearClass === 'HIGH') {
        text = `Even in the most cautious scenario, your investment in ${stockName || 'this stock'} would retain about ${Math.round(mcResult.worstCase / mcResult.investment * 100)}% of its value. The expected return of ₹${mcResult.expectedCase.toLocaleString()} shows solid potential. This looks like a measured, well-reasoned trade.`;
      } else {
        text = `The Monte Carlo analysis projects a median return to ₹${mcResult.expectedCase.toLocaleString()}, with only ${mcResult.lossProbability}% loss probability. Your upside potential reaches ₹${mcResult.bestCase.toLocaleString()} in the best scenario. This is a statistically favorable trade.`;
      }
    } else if (mcResult.suggestion === 'RISKY') {
      if (fearClass === 'HIGH') {
        text = `This trade carries ${mcResult.lossProbability}% loss probability — that means roughly ${Math.round(mcResult.lossProbability / 10)} out of 10 scenarios show a loss. The worst case could bring your value to ₹${mcResult.worstCase.toLocaleString()}. Consider starting with a smaller amount to test the waters safely.`;
      } else {
        text = `With ${mcResult.lossProbability}% loss probability, this is a high-volatility trade. Worst case: ₹${mcResult.worstCase.toLocaleString()}, but best case reaches ₹${mcResult.bestCase.toLocaleString()}. Only proceed if this fits your risk allocation strategy.`;
      }
    } else {
      text = `The simulation suggests moderate risk-reward for ${stockName || 'this stock'}. Expected value: ₹${mcResult.expectedCase.toLocaleString()} with ${mcResult.lossProbability}% loss probability. This is a balanced trade — consider your current portfolio exposure before deciding.`;
    }
  } else if (type === 'portfolio_analysis') {
    text = `Your portfolio shows a developing investment strategy. Focus on diversification across sectors to reduce risk. Track your trades closely — each one teaches you something about your risk tolerance. Keep simulating before committing to large positions.`;
  } else {
    text = 'Welcome to SimVesto. Start by exploring stocks and running simulations to build your confidence. Remember — every great investor started exactly where you are now.';
  }

  if (onToken) {
    for (let i = 0; i < text.length; i++) {
      await new Promise(r => setTimeout(r, 12 + Math.random() * 18));
      onToken(text.slice(0, i + 1));
    }
  }

  return text;
}

export { buildPrompt, simulateNarration };
