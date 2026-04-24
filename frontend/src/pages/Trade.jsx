import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import useStore from '../store/useStore';
import { runMonteCarlo } from '../engine/monteCarlo';
import { generateNarration } from '../engine/aiNarrator';
import { findCounterpartyMatch } from '../engine/counterpartyEngine';
import CounterpartyMatchModal from '../components/CounterpartyMatchModal';
import MatchingImpactPanel from '../components/MatchingImpactPanel';
import TradeAnalysisPanel from '../components/TradeAnalysisPanel';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'];
const QTY_STEP = 1;

const normalizeQty = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return QTY_STEP;
  return Math.max(QTY_STEP, Math.floor(n));
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString()}`;
const formatSymbol = (value) => String(value || '').replace(/^IQ/, '');

const buildChartSlices = (stock, timeframe) => {
  if (!stock) return [];
  const history = stock.priceHistory || [];
  let filteredHistory = [];
  const now = Date.now();

  // Filter and aggregate data based on timeframe
  switch (timeframe) {
    case '1D': {
      // Last 24 hours, show hourly candles
      const oneDayAgo = now - 86400000;
      filteredHistory = history.filter(h => h.time >= oneDayAgo);
      break;
    }
    case '1W': {
      // Last 7 days, show 4-hourly candles (combine 4 hourly points into one)
      const oneWeekAgo = now - 7 * 86400000;
      filteredHistory = history.filter(h => h.time >= oneWeekAgo);
      // Aggregate into 4-hour candles
      filteredHistory = aggregateCandles(filteredHistory, 4);
      break;
    }
    case '1M': {
      // Last 30 days, show daily candles
      const oneMonthAgo = now - 30 * 86400000;
      filteredHistory = history.filter(h => h.time >= oneMonthAgo);
      // Aggregate into daily candles
      filteredHistory = aggregateCandles(filteredHistory, 24);
      break;
    }
    case '3M': {
      // Last 90 days, show daily candles
      const threeMonthsAgo = now - 90 * 86400000;
      filteredHistory = history.filter(h => h.time >= threeMonthsAgo);
      filteredHistory = aggregateCandles(filteredHistory, 24);
      break;
    }
    case '1Y': {
      // Last 365 days, show daily candles
      const oneYearAgo = now - 365 * 86400000;
      filteredHistory = history.filter(h => h.time >= oneYearAgo);
      filteredHistory = aggregateCandles(filteredHistory, 24);
      break;
    }
    default:
      filteredHistory = history.slice(-24);
  }

  return filteredHistory.map((point, index, slice) => {
    const previous = slice[index - 1]?.price ?? point.price;
    const timeDate = new Date(point.time);

    let timeString = '';
    if (timeframe === '1D') {
      // Show HH:MM
      timeString = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1W') {
      // Show MMM DD HH:MM
      timeString = timeDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
        timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Show MMM DD for 1M, 3M, 1Y
      timeString = timeDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    return {
      idx: index,
      time: timeString,
      open: point.open,
      close: point.close,
      high: point.high,
      low: point.low,
      price: point.price,
      volume: point.volume,
      change: point.close - previous,
      changePct: previous ? ((point.close - previous) / previous) * 100 : 0,
    };
  });
};

// Helper function to aggregate candles
const aggregateCandles = (data, intervalsToAggregate) => {
  const aggregated = [];
  for (let i = 0; i < data.length; i += intervalsToAggregate) {
    const batch = data.slice(i, i + intervalsToAggregate);
    if (batch.length === 0) continue;

    const open = batch[0].open;
    const close = batch[batch.length - 1].close;
    const high = Math.max(...batch.map(b => b.high));
    const low = Math.min(...batch.map(b => b.low));
    const volume = batch.reduce((sum, b) => sum + b.volume, 0);
    const time = batch[batch.length - 1].time;

    aggregated.push({
      open,
      close,
      high,
      low,
      price: close,
      volume,
      time,
    });
  }
  return aggregated;
};

function CandleChart({ data, holding, isUp }) {
  const width = 900;
  const height = 320;
  const padding = { top: 18, right: 24, bottom: 34, left: 72 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const prices = data.flatMap(point => [point.high, point.low, point.open, point.close]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1);
  const barWidth = Math.max(5, plotWidth / Math.max(data.length * 1.6, 1));

  const scaleY = (value) => padding.top + ((max - value) / range) * plotHeight;
  const scaleX = (index) => padding.left + ((index + 0.5) / Math.max(data.length, 1)) * plotWidth;

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id="candleUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="candleDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="candleBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0.12" />
            <stop offset="100%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} fill="url(#candleBg)" rx="12" />

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + ratio * plotHeight;
          return <line key={ratio} x1={padding.left} x2={padding.left + plotWidth} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })}

        {data.map((point, index) => {
          const x = scaleX(index);
          const highY = scaleY(point.high);
          const lowY = scaleY(point.low);
          const openY = scaleY(point.open);
          const closeY = scaleY(point.close);
          const isGreen = point.close >= point.open;
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

          return (
            <g key={`${point.time}-${index}`}>
              <line x1={x} x2={x} y1={highY} y2={lowY} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="1.4" opacity="0.9" />
              <rect
                x={x - barWidth / 2}
                y={bodyTop}
                width={barWidth}
                height={bodyHeight}
                rx="2"
                fill={isGreen ? 'url(#candleUp)' : 'url(#candleDown)'}
                stroke={isGreen ? '#10b981' : '#ef4444'}
                strokeWidth="1"
              />
            </g>
          );
        })}

        {holding && (
          <line
            x1={padding.left}
            x2={padding.left + plotWidth}
            y1={scaleY(holding.avgBuyPrice)}
            y2={scaleY(holding.avgBuyPrice)}
            stroke="#a855f7"
            strokeDasharray="5 5"
            strokeWidth="1.5"
          />
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 'auto 12px 10px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>{data[0]?.time}</span>
        <span>{data[data.length - 1]?.time}</span>
      </div>
    </div>
  );
}

function WaterfallChart({ data, holding, isUp }) {
  const width = 900;
  const height = 320;
  const padding = { top: 18, right: 24, bottom: 34, left: 72 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = data.map(point => point.change);
  const maxAbs = Math.max(...values.map(v => Math.abs(v)), 1);
  const scaleX = (index) => padding.left + ((index + 0.5) / Math.max(data.length, 1)) * plotWidth;
  const scaleY = (value) => padding.top + ((maxAbs - value) / (maxAbs * 2)) * plotHeight;
  const baseline = scaleY(0);
  const barWidth = Math.max(5, plotWidth / Math.max(data.length * 1.8, 1));

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waterfallGain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="waterfallLoss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + ratio * plotHeight;
          return <line key={ratio} x1={padding.left} x2={padding.left + plotWidth} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })}

        <line x1={padding.left} x2={padding.left + plotWidth} y1={baseline} y2={baseline} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

        {data.map((point, index) => {
          const x = scaleX(index);
          const magnitude = Math.max(Math.abs(point.change), 1);
          const barHeight = Math.max((magnitude / (maxAbs || 1)) * (plotHeight / 2), 3);
          const y = point.change >= 0 ? baseline - barHeight : baseline;
          return (
            <g key={`${point.time}-${index}`}>
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="3"
                fill={point.change >= 0 ? 'url(#waterfallGain)' : 'url(#waterfallLoss)'}
                stroke={point.change >= 0 ? '#10b981' : '#ef4444'}
                strokeWidth="1"
              />
            </g>
          );
        })}

        {holding && (
          <line
            x1={padding.left}
            x2={padding.left + plotWidth}
            y1={baseline}
            y2={baseline}
            stroke="#a855f7"
            strokeDasharray="5 5"
            strokeWidth="1.5"
          />
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 'auto 12px 10px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>{data[0]?.time}</span>
        <span>{data[data.length - 1]?.time}</span>
      </div>
    </div>
  );
}

export default function Trade() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const stocks = useStore(s => s.stocks);
  const user = useStore(s => s.user);
  const holdings = useStore(s => s.holdings);
  const buyStock = useStore(s => s.buyStock);
  const sellStock = useStore(s => s.sellStock);
  const fearScore = useStore(s => s.fearScore);
  const geminiApiKey = useStore(s => s.geminiApiKey);
  const addSimulation = useStore(s => s.addSimulation);
  const updateFearScore = useStore(s => s.updateFearScore);
  const matchedTrades = useStore(s => s.matchedTrades);
  const addMatchedTrade = useStore(s => s.addMatchedTrade);
  const refreshRealtimeStocks = useStore(s => s.refreshRealtimeStocks);
  const companyNotes = useStore(s => s.companyNotes);
  const saveCompanyNote = useStore(s => s.saveCompanyNote);

  // Counterparty matching state
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [pendingMatch, setPendingMatch] = useState(null);   // match result from engine
  const pendingTradeRef = useRef(null);                      // { side, priceOverride }

  // entryTime tracks when user CLICKED the buy/sell button — reset there, not on mount
  const [entryTime, setEntryTime] = useState(null);

  const stock = useMemo(() => {
    const routeSymbol = String(symbol || '').toUpperCase();
    return stocks.find((s) => s.symbol === routeSymbol || `IQ${s.symbol}` === routeSymbol);
  }, [stocks, symbol]);
  const holding = useMemo(() => holdings.find(h => h.stockId === stock?.id), [holdings, stock]);

  const [tab, setTab] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('area');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  // Monte Carlo state
  const [mcResult, setMcResult] = useState(null);
  const [mcLoading, setMcLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const chartData = useMemo(() => buildChartSlices(stock, timeframe), [stock, timeframe]);

  const isUp = stock?.dayChangePct >= 0;
  const totalCost = stock ? parseFloat((stock.currentPrice * quantity).toFixed(2)) : 0;
  const maxBuyQuantity = stock ? Math.floor((user?.iqCoins || 0) / stock.currentPrice) : 0;
  const maxSellQuantity = holding?.quantity || 0;
  const canBuy = quantity <= maxBuyQuantity && totalCost <= (user?.iqCoins || 0);
  const canSell = Boolean(holding && quantity <= holding.quantity);

  // ── Run Monte Carlo (no fear score here — that's deferred to mood submission) ──
  const runMC = useCallback(() => {
    if (!stock) return;
    setMcLoading(true);
    setAiText('');
    setTimeout(() => {
      const result = runMonteCarlo({
        currentPrice: stock.currentPrice,
        drift: stock.drift,
        volatility: stock.volatility,
        horizonDays: 63,
        investment: totalCost || stock.currentPrice,
      });
      setMcResult(result);
      setMcLoading(false);

      addSimulation({
        stockId: stock.id, symbol: stock.symbol, name: stock.name,
        ...result, timestamp: Date.now(),
      });

      // NO fear score update here — it fires after the user submits mood below

      setAiLoading(true);
      generateNarration({
        apiKey: geminiApiKey,
        context: {
          type: 'trade_suggestion',
          fearScore: fearScore.score,
          fearClass: fearScore.fearClass,
          literacyScore: user?.literacyScore || 5,
          stockName: stock.name,
          stockSymbol: stock.symbol,
          mcResult: result,
        },
        onToken: (text) => setAiText(text),
      }).then(() => setAiLoading(false));
    }, 500);
  }, [stock, totalCost, fearScore, geminiApiKey, user]);

  // ── Mood submit: NOW we update fear score (primary) + save note ──
  const handleMoodSubmit = useCallback((payload) => {
    // MOOD_REPORT triggers the fear score modal (unlike QUIZ_RESULT which suppresses it)
    updateFearScore('MOOD_REPORT', 0, payload.fearDelta <= 0, payload.fearDelta);
    if (stock) saveCompanyNote(stock.symbol, payload);
  }, [stock, updateFearScore, saveCompanyNote]);

  // ── Inner function that actually runs the trade (after match decision) ──
  const runTrade = useCallback(async (priceOverride = null) => {
    if (!stock) return;

    let result;
    if (tab === 'BUY') {
      // buyStock/sellStock only take (stockId, quantity) — price is determined by the store
      result = await buyStock(stock.id, quantity);
    } else {
      result = await sellStock(stock.id, quantity);
    }

    if (result?.success) {
      if (priceOverride && pendingMatch) {
        // Matched trade — reward with fear reduction, no hesitation penalty
        updateFearScore('MATCHED_TRADE_ACCEPTED', 0, true);
      } else {
        // Normal trade — measure hesitation only from when they clicked Buy/Sell
        const hesMs = entryTime != null ? Date.now() - entryTime : 2000;
        const isPositive = result?.pnl !== undefined ? result.pnl >= 0 : true;
        updateFearScore('TRADE_DECISION', hesMs, isPositive);
      }
      setEntryTime(null); // reset for next trade

      // If this came from a matched trade, record the savings
      if (priceOverride && pendingMatch) {
        const savingsPerShare = parseFloat(Math.abs(
          tab === 'BUY'
            ? stock.buyPrice - priceOverride
            : priceOverride - stock.sellPrice
        ).toFixed(2));
        addMatchedTrade({
          id: Date.now(),
          symbol: stock.symbol,
          side: tab,
          quantity,
          matchedPrice: priceOverride,
          marketPrice: tab === 'BUY' ? stock.buyPrice : stock.sellPrice,
          savingsPerShare,
          totalSavings: parseFloat((savingsPerShare * quantity).toFixed(2)),
          priceImprovementPct: pendingMatch.priceImprovementPct,
          matchType: pendingMatch.matchType,
          counterparty: pendingMatch.counterparty,
          timestamp: Date.now(),
        });
      }
    }

    // Attach match savings info to result so the success modal can display it
    const enrichedResult = priceOverride && pendingMatch && result?.success
      ? {
        ...result,
        matchSavings: parseFloat((Math.abs(
          tab === 'BUY'
            ? stock.buyPrice - priceOverride
            : priceOverride - stock.sellPrice
        ) * quantity).toFixed(2)),
        matchedPrice: priceOverride,
        counterparty: pendingMatch.counterparty,
      }
      : result;

    setPendingMatch(null);
    pendingTradeRef.current = null;
    setOrderResult(enrichedResult);
    setShowOrderModal(true);
    setQuantity(1);
  }, [stock, tab, quantity, buyStock, sellStock, entryTime, updateFearScore, addMatchedTrade, pendingMatch]);

  // ── executeTrade: stamp entry time, then attempt counterparty match ──
  const executeTrade = useCallback(async () => {
    if (!stock) return;

    // Stamp NOW as the decision moment — so page-reading time is NOT counted as hesitation
    setEntryTime(Date.now());

    const match = findCounterpartyMatch({
      symbol: stock.symbol,
      side: tab,
      userFearScore: fearScore?.score ?? 50,
      stockVolatility: stock.volatility,
      currentPrice: stock.currentPrice,
      buyPrice: stock.buyPrice,
      sellPrice: stock.sellPrice,
    });

    if (match) {
      // Show the matching modal; actual trade runs after user decision
      setPendingMatch(match);
      pendingTradeRef.current = { side: tab };
      setShowMatchModal(true);
    } else {
      // No match — execute at market price immediately
      await runTrade(null);
    }
  }, [stock, tab, fearScore, runTrade]);

  // Called when user accepts the counterparty match
  const handleMatchAccept = useCallback(async (matchedPrice) => {
    setShowMatchModal(false);
    await runTrade(matchedPrice);
  }, [runTrade]);

  // Called when user skips the match
  const handleMatchSkip = useCallback(async () => {
    setShowMatchModal(false);
    setPendingMatch(null);
    pendingTradeRef.current = null;
    await runTrade(null);
  }, [runTrade]);

  useEffect(() => {
    setQuantity(1);
  }, [symbol]);

  useEffect(() => {
    refreshRealtimeStocks().catch(() => { });
  }, [refreshRealtimeStocks]);

  if (!stock) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h2>Stock not found</h2>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/app/explore')}>
          Browse Stocks
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stock Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div className="stock-icon" style={{ background: `${stock.color}20`, color: stock.color, width: '40px', height: '40px', fontSize: '14px' }}>
              {stock.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0])
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{stock.name}</h1>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {formatSymbol(stock.symbol)} · {stock.sector}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700 }}>
            ₹{stock.currentPrice.toLocaleString()}
          </div>
          <div className={`price-change ${isUp ? 'up' : 'down'}`} style={{ fontSize: '14px' }}>
            {isUp ? '▲' : '▼'} ₹{Math.abs(stock.dayChange).toFixed(2)} ({Math.abs(stock.dayChangePct).toFixed(2)}%)
          </div>
        </div>
      </motion.div>

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left — Chart */}
        <div style={{ minWidth: 0 }}>
          <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px', marginBottom: '16px' }}>
            {/* Timeframe + Chart type */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {TIMEFRAMES.map(tf => (
                  <button key={tf} className="btn btn-sm"
                    onClick={() => setTimeframe(tf)}
                    style={timeframe === tf ? {
                      background: 'var(--accent-purple-dim)', color: 'var(--accent-purple-light)',
                      borderRadius: 'var(--radius-sm)', padding: '4px 12px', fontSize: '11px', fontWeight: 600,
                    } : {
                      color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', fontSize: '11px',
                    }}>
                    {tf}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn btn-sm btn-ghost" onClick={() => setChartType('area')}
                  style={{ fontSize: '11px', color: chartType === 'area' ? 'var(--accent-purple-light)' : 'var(--text-muted)' }}>Area</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setChartType('line')}
                  style={{ fontSize: '11px', color: chartType === 'line' ? 'var(--accent-purple-light)' : 'var(--text-muted)' }}>Line</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setChartType('candle')}
                  style={{ fontSize: '11px', color: chartType === 'candle' ? 'var(--accent-purple-light)' : 'var(--text-muted)' }}>Candles</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setChartType('waterfall')}
                  style={{ fontSize: '11px', color: chartType === 'waterfall' ? 'var(--accent-purple-light)' : 'var(--text-muted)' }}>Waterfall</button>
              </div>
            </div>

            {chartType === 'candle' ? (
              <CandleChart data={chartData} holding={holding} isUp={isUp} />
            ) : chartType === 'waterfall' ? (
              <WaterfallChart data={chartData} holding={holding} isUp={isUp} />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                {chartType === 'area' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false} width={60}
                      tickFormatter={v => `₹${v.toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                      formatter={(v) => [`₹${v.toLocaleString()}`, 'Price']}
                    />
                    {holding && <ReferenceLine y={holding.avgBuyPrice} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: `Avg: ₹${holding.avgBuyPrice}`, position: 'right', fill: '#7c3aed', fontSize: 10 }} />}
                    <Area type="monotone" dataKey="price" stroke={isUp ? '#10b981' : '#ef4444'}
                      fill="url(#stockGrad)" strokeWidth={2} dot={false} animationDuration={800} />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false} width={60}
                      tickFormatter={v => `₹${v.toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                      formatter={(v) => [`₹${v.toLocaleString()}`, 'Price']}
                    />
                    <Line type="monotone" dataKey="price" stroke={isUp ? '#10b981' : '#ef4444'}
                      strokeWidth={2} dot={false} animationDuration={800} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}

            {/* Stock stats */}
            <div className="grid-4" style={{ marginTop: '16px', gap: '12px' }}>
              {[
                { label: 'Open', value: `₹${stock.dayOpen?.toFixed(2)}` },
                { label: 'High', value: `₹${stock.dayHigh?.toFixed(2)}` },
                { label: 'Low', value: `₹${stock.dayLow?.toFixed(2)}` },
                { label: 'Volume', value: stock.priceHistory.slice(-1)[0]?.volume?.toLocaleString() },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Trade Analysis Panel (replaces old MC section) */}
          <TradeAnalysisPanel
            stock={stock}
            mcResult={mcResult}
            mcLoading={mcLoading}
            aiText={aiText}
            aiLoading={aiLoading}
            onRunAnalysis={runMC}
            onMoodSubmit={handleMoodSubmit}
            previousNotes={companyNotes[stock.symbol] || []}
          />
        </div>

        {/* Right — Trade Panel */}
        <div style={{ width: '100%' }}>
          {/* Counterparty Match Modal */}
          <CounterpartyMatchModal
            isOpen={showMatchModal}
            match={pendingMatch}
            stock={stock}
            quantity={quantity}
            userFearScore={fearScore?.score ?? 50}
            onAccept={handleMatchAccept}
            onSkip={handleMatchSkip}
            onClose={() => { setShowMatchModal(false); setPendingMatch(null); }}
          />

          <div className="card" style={{ padding: '20px' }}>

            {/* Buy/Sell Tabs */}
            <div className="tab-group" style={{ marginBottom: '20px' }}>
              <button className={`tab-btn ${tab === 'BUY' ? 'active' : ''}`}
                onClick={() => setTab('BUY')}
                style={tab === 'BUY' ? { background: 'var(--green)', color: 'white' } : {}}>
                Buy
              </button>
              <button className={`tab-btn ${tab === 'SELL' ? 'active' : ''}`}
                onClick={() => setTab('SELL')}
                style={tab === 'SELL' ? { background: 'var(--red)', color: 'white' } : {}}>
                Sell
              </button>
            </div>

            {/* Current Price */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Market Price</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color: isUp ? 'var(--green)' : 'var(--red)' }}>
                ₹{stock.currentPrice.toLocaleString()}
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                QUANTITY
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-ghost btn-icon" onClick={() => setQuantity(normalizeQty(quantity - QTY_STEP))}
                  style={{ border: '1px solid var(--border-default)', fontSize: '18px' }}>−</button>
                <input type="number" min={QTY_STEP} step={QTY_STEP} value={quantity} onChange={e => setQuantity(normalizeQty(parseInt(e.target.value, 10) || QTY_STEP))}
                  style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, flex: 1 }} />
                <button className="btn btn-ghost btn-icon" onClick={() => setQuantity(normalizeQty(quantity + QTY_STEP))}
                  style={{ border: '1px solid var(--border-default)', fontSize: '18px' }}>+</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {tab === 'BUY' ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setQuantity(normalizeQty(maxBuyQuantity || 1))}
                    disabled={!maxBuyQuantity}
                    style={{ flex: 1, fontSize: '11px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}
                  >
                    MAX
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setQuantity(normalizeQty(maxSellQuantity || 1))}
                    disabled={!maxSellQuantity}
                    style={{ flex: 1, fontSize: '11px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}
                  >
                    MAX
                  </button>
                )}
              </div>
              {tab === 'BUY' && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {[1, 5, 10, 25].map(n => (
                    <button key={n} className="btn btn-ghost btn-sm" onClick={() => setQuantity(normalizeQty(n))}
                      style={{ flex: 1, fontSize: '11px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div style={{
              background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{quantity} × ₹{stock.currentPrice.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '18px' }}>₹{totalCost.toLocaleString()}</span>
              </div>

              {/* Bid-Ask Spread row — shows WHY counterparty matching saves money */}
              {stock.buyPrice && stock.sellPrice && (
                <div style={{
                  marginTop: '10px', paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
                }}>
                  <div style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'rgba(239,68,68,0.07)' }}>
                    <div style={{ fontSize: '9px', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bid (Sell)</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>₹{stock.sellPrice.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'rgba(16,185,129,0.07)' }}>
                    <div style={{ fontSize: '9px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ask (Buy)</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#10b981' }}>₹{stock.buyPrice.toLocaleString()}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Spread: ₹{stock.spread?.toFixed(2)} ({stock.spreadPct?.toFixed(3)}%) · Match saves you this
                  </div>
                </div>
              )}

              {tab === 'BUY' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Available</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(user?.iqCoins || 0).toLocaleString()} Coins</span>
                </div>
              )}
              {tab === 'BUY' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Max buy</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{maxBuyQuantity} shares</span>
                </div>
              )}
              {tab === 'SELL' && holding && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Available to sell</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{holding.quantity} shares</span>
                </div>
              )}
            </div>

            {/* Trade button */}
            <button className={`btn ${tab === 'BUY' ? 'btn-green' : 'btn-red'}`}
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700 }}
              disabled={tab === 'BUY' ? !canBuy : !canSell}
              onClick={executeTrade}>
              {tab === 'BUY' ? `Buy ${formatSymbol(stock.symbol)}` : `Sell ${formatSymbol(stock.symbol)}`}
            </button>

            {tab === 'BUY' && !canBuy && (
              <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--red)', marginTop: '8px' }}>
                Insufficient Coins
              </div>
            )}

            {/* Current Holding */}
            {holding && (
              <div style={{ marginTop: '16px', padding: '14px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Your Position</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>{holding.quantity} shares</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{holding.currentValue?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Avg: ₹{holding.avgBuyPrice?.toFixed(2)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: (holding.pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {(holding.pnl || 0) >= 0 ? '+' : ''}₹{(holding.pnl || 0).toFixed(2)} ({(holding.pnlPct || 0).toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Animated Fear Score widget — fills gap, always visible */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{
              marginTop: 14, padding: '14px 16px', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))',
              border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Animated background blob */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', right: -20, top: -20, width: 80, height: 80,
                borderRadius: '50%',
                background: fearScore?.score >= 65 ? '#ef4444' : fearScore?.score >= 35 ? '#f59e0b' : '#10b981',
                filter: 'blur(28px)', pointerEvents: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div>
                <div style={{
                  fontSize: 9, fontWeight: 800, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4
                }}>Fear Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 900, lineHeight: 1,
                    color: fearScore?.score >= 65 ? '#ef4444' : fearScore?.score >= 35 ? '#f59e0b' : '#10b981',
                  }}>{fearScore?.score ?? 50}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.6 }}>/100</span>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, marginTop: 3,
                  color: fearScore?.score >= 65 ? '#ef4444' : fearScore?.score >= 35 ? '#f59e0b' : '#10b981'
                }}>
                  {fearScore?.fearClass === 'HIGH' ? 'HIGH FEAR · Stay calm' :
                    fearScore?.fearClass === 'LOW' ? 'LOW FEAR · Well composed' : 'MEDIUM FEAR · Keep learning'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {/* Pulsing live dot */}
                <div style={{ position: 'relative', width: 36, height: 36 }}>
                  <motion.div
                    animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: fearScore?.score >= 65 ? '#ef4444' : fearScore?.score >= 35 ? '#f59e0b' : '#10b981',
                    }}
                  />
                  <div style={{
                    position: 'absolute', inset: 6, borderRadius: '50%',
                    background: fearScore?.score >= 65 ? '#ef4444' : fearScore?.score >= 35 ? '#f59e0b' : '#10b981',
                  }} />
                </div>
                <div style={{
                  fontSize: 9, color: 'var(--text-muted)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>LIVE</div>
              </div>
            </div>

            {/* Score bar */}
            <div style={{
              marginTop: 10, height: 4, borderRadius: 99, background: 'var(--bg-surface)',
              overflow: 'hidden'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fearScore?.score ?? 50}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{
                  height: '100%', borderRadius: 99,
                  background: `linear-gradient(90deg, #10b981, #f59e0b, #ef4444)`,
                }}
              />
            </div>
          </motion.div>

          {/* Matching Impact Panel — shown after first match */}
          <MatchingImpactPanel matchedTrades={matchedTrades.filter(t => t.symbol === stock.symbol)} />
        </div>
      </div>

      {/* Order Confirmation Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowOrderModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              {orderResult?.success ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                    {orderResult.matchSavings ? '🤝' : '✅'}
                  </div>
                  <h3 style={{ marginBottom: '6px' }}>
                    {orderResult.matchSavings ? 'Matched Trade Executed!' : 'Order Executed!'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '14px' }}>
                    {orderResult.order?.type === 'BUY' ? 'Bought' : 'Sold'} {orderResult.order?.quantity} shares of {stock.name} at ₹{orderResult.order?.price?.toLocaleString()}
                  </p>

                  {/* Match savings banner */}
                  {orderResult.matchSavings > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        padding: '14px 16px', borderRadius: 12, marginBottom: 14,
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.35)',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                        🎯 Counterparty Match Savings
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 800, color: '#10b981', marginBottom: 4 }}>
                        +₹{orderResult.matchSavings.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Matched with <strong>{orderResult.counterparty?.name}</strong> ({orderResult.counterparty?.archetype})<br />
                        You avoided the market maker spread!
                      </div>
                    </motion.div>
                  )}

                  {orderResult.pnl !== undefined && (
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700,
                      color: orderResult.pnl >= 0 ? 'var(--green)' : 'var(--red)', marginBottom: '16px',
                    }}>
                      P&L: {orderResult.pnl >= 0 ? '+' : ''}₹{orderResult.pnl.toFixed(2)}
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={() => setShowOrderModal(false)} style={{ width: '100%' }}>
                    Continue Trading
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                  <h3 style={{ marginBottom: '8px' }}>Order Failed</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{orderResult?.message}</p>
                  <button className="btn btn-outline" onClick={() => setShowOrderModal(false)} style={{ width: '100%' }}>
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
