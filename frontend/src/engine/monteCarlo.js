// Monte Carlo Simulation Engine
// Runs 1000 stochastic paths for portfolio projection

import { gaussianRandom } from './stockEngine';

export function runMonteCarlo({ currentPrice, drift, volatility, horizonDays = 252, numPaths = 1000, investment = 10000 }) {
  const dt = 1 / 252;
  const numShares = investment / currentPrice;
  const paths = [];
  const numPoints = Math.min(horizonDays, 252);
  const step = Math.max(1, Math.floor(horizonDays / numPoints));

  for (let p = 0; p < numPaths; p++) {
    let price = currentPrice;
    const path = [{ day: 0, value: investment }];

    for (let d = 1; d <= horizonDays; d++) {
      const epsilon = gaussianRandom();
      const dS = price * (drift * dt + volatility * epsilon * Math.sqrt(dt));
      price = Math.max(price + dS, 0.01);

      if (d % step === 0 || d === horizonDays) {
        path.push({ day: d, value: parseFloat((numShares * price).toFixed(2)) });
      }
    }
    paths.push(path);
  }

  // Compute percentiles at each time point
  const timePoints = paths[0].length;
  const percentileData = [];

  for (let t = 0; t < timePoints; t++) {
    const values = paths.map(p => p[t].value).sort((a, b) => a - b);
    percentileData.push({
      day: paths[0][t].day,
      p5: values[Math.floor(numPaths * 0.05)],
      p25: values[Math.floor(numPaths * 0.25)],
      p50: values[Math.floor(numPaths * 0.50)],
      p75: values[Math.floor(numPaths * 0.75)],
      p95: values[Math.floor(numPaths * 0.95)],
    });
  }

  // Loss probability
  const finalValues = paths.map(p => p[p.length - 1].value);
  const lossProbability = finalValues.filter(v => v < investment).length / numPaths;

  // For animation: sample 100 paths
  const animationPaths = [];
  for (let i = 0; i < Math.min(100, numPaths); i++) {
    const idx = Math.floor(i * numPaths / 100);
    animationPaths.push(paths[idx]);
  }

  const final = percentileData[percentileData.length - 1];

  return {
    percentileData,
    animationPaths,
    lossProbability: parseFloat((lossProbability * 100).toFixed(1)),
    bestCase: parseFloat(final.p95.toFixed(2)),
    expectedCase: parseFloat(final.p50.toFixed(2)),
    worstCase: parseFloat(final.p5.toFixed(2)),
    investment,
    suggestion: lossProbability < 0.25 ? 'GOOD' : lossProbability < 0.50 ? 'AVERAGE' : 'RISKY',
  };
}

export function getSuggestionColor(suggestion) {
  switch (suggestion) {
    case 'GOOD': return '#10b981';
    case 'AVERAGE': return '#f59e0b';
    case 'RISKY': return '#ef4444';
    default: return '#6b7280';
  }
}

export function getSuggestionEmoji(suggestion) {
  switch (suggestion) {
    case 'GOOD': return '🟢';
    case 'AVERAGE': return '🟡';
    case 'RISKY': return '🔴';
    default: return '⚪';
  }
}
