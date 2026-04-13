import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import useStore from '../store/useStore';
import { runMonteCarlo, getSuggestionColor, getSuggestionEmoji } from '../engine/monteCarlo';
import { generateNarration } from '../engine/aiNarrator';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'];
const QTY_STEP = 1;

const normalizeQty = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return QTY_STEP;
  return Math.max(QTY_STEP, Math.floor(n));
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString()}`;

const buildChartSlices = (stock, timeframe) => {
  if (!stock) return [];
  const history = stock.priceHistory || [];
  let sliceCount;
  switch (timeframe) {
    case '1D': sliceCount = 24; break;
    case '1W': sliceCount = 168; break;
    case '1M': sliceCount = Math.min(history.length, 720); break;
    case '3M': sliceCount = history.length; break;
    case '1Y': sliceCount = history.length; break;
    default: sliceCount = 24;
  }

  return history.slice(-sliceCount).map((point, index, slice) => {
    const previous = slice[index - 1]?.price ?? point.price;
    return {
      idx: index,
      time: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: previous,
      close: point.price,
      high: point.high,
      low: point.low,
      price: point.price,
      volume: point.volume,
      change: point.price - previous,
      changePct: previous ? ((point.price - previous) / previous) * 100 : 0,
    };
  });
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

  const [entryTime, setEntryTime] = useState(Date.now());

  const stock = useMemo(() => stocks.find(s => s.symbol === symbol), [stocks, symbol]);
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

  // Run Monte Carlo on demand
  const runMC = useCallback(() => {
    if (!stock) return;
    setMcLoading(true);
    setAiText('');
    setTimeout(() => {
      const horizonMap = { '1M': 21, '3M': 63, '6M': 126, '1Y': 252 };
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

      // Fear Score: Practice reduces fear
      updateFearScore('SIMULATION_COMPLETED', 0, true);

      // Generate AI narration
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

  const executeTrade = async () => {
    if (!stock) return;
    let result;
    if (tab === 'BUY') {
      result = await buyStock(stock.id, quantity);
    } else {
      result = await sellStock(stock.id, quantity);
    }

    // Fear Metric Logging only for successful orders
    if (result?.success) {
      const hesitationMs = Date.now() - entryTime;
      const isPositive = result?.pnl !== undefined ? result.pnl >= 0 : true;
      updateFearScore('TRADE_DECISION', hesitationMs, isPositive);
      setEntryTime(Date.now()); // Reset hesitation timer for next trade
    }

    setOrderResult(result);
    setShowOrderModal(true);
    setQuantity(1);
  };

  useEffect(() => {
    setQuantity(1);
  }, [symbol]);

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
              {stock.symbol.slice(2, 4)}
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{stock.name}</h1>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {stock.symbol} · {stock.sector}
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

          {/* Monte Carlo Advisor Section */}
          <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🤖 Monte Carlo AI Advisor
              </h3>
              <button className="btn btn-primary btn-sm" onClick={runMC} disabled={mcLoading}>
                {mcLoading ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : '▶ Analyze Trade'}
              </button>
            </div>

            {mcResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Suggestion Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '28px', padding: '8px 20px', borderRadius: 'var(--radius-lg)',
                    background: `${getSuggestionColor(mcResult.suggestion)}15`,
                    border: `1px solid ${getSuggestionColor(mcResult.suggestion)}30`,
                    fontFamily: 'var(--font-mono)', fontWeight: 700, color: getSuggestionColor(mcResult.suggestion),
                  }}>
                    {getSuggestionEmoji(mcResult.suggestion)} {mcResult.suggestion}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>Based on 1,000 simulated scenarios</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Loss probability: {mcResult.lossProbability}%</div>
                  </div>
                </div>

                {/* Outcome Cards */}
                <div className="grid-3" style={{ gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: 'Best Case', value: mcResult.bestCase, color: 'var(--green)', icon: '🚀' },
                    { label: 'Expected', value: mcResult.expectedCase, color: 'var(--accent-purple-light)', icon: '📊' },
                    { label: 'Worst Case', value: mcResult.worstCase, color: 'var(--red)', icon: '⚠️' },
                  ].map((c, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{c.icon}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{c.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: c.color }}>
                        ₹{c.value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Narration */}
                {(aiText || aiLoading) && (
                  <div style={{
                    background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)',
                    padding: '16px', borderLeft: '3px solid var(--accent-purple)',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple-light)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      AI Analysis
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {aiText}{aiLoading && <span style={{ animation: 'pulse 1s infinite' }}>▊</span>}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Right — Trade Panel */}
        <div style={{ width: '100%' }}>
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
              {tab === 'BUY' ? `Buy ${stock.symbol}` : `Sell ${stock.symbol}`}
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
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ marginBottom: '8px' }}>Order Executed!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                    {orderResult.order?.type === 'BUY' ? 'Bought' : 'Sold'} {orderResult.order?.quantity} shares of {stock.name} at ₹{orderResult.order?.price?.toLocaleString()}
                  </p>
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
