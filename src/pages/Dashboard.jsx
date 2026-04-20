import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import useStore from '../store/useStore';
import { getFearColor, getFearLabel } from '../engine/fearEngine';
import FearBadge from '../components/fear/FearBadge';
import { api } from '../services/api';

const INITIAL_CAPITAL = 100000;

const QUICK_PROMPTS = [
  'Should I buy now or wait?',
  'How can I reduce risk?',
  'Explain diversification.',
];

const STAT_TAGLINES = {
  netWorth: [
    'Your whole bag, no cap',
    'Stack check activated',
    'Net flex, literally',
    'Building generational wealth',
  ],
  coins: [
    'Liquid funds, ready to deploy',
    'Cash on standby',
    'Dry powder loaded',
    'Ready when opportunity knocks',
  ],
  invested: [
    'Money that is working for you',
    'Capital in the trenches',
    'Deployed and earning',
    'Skin in the game',
  ],
  trades: [
    'Every move counts',
    'Active player energy',
    'Trades logged, lessons earned',
    'Building the track record',
  ],
};

function RotatingTagline({ lines }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % lines.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [lines.length]);

  return (
    <div style={{ height: '16px', overflow: 'hidden', position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, fontStyle: 'italic' }}
        >
          {lines[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
);

const CoinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
  </svg>
);

const ActivityIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const user = useStore(s => s.user);
  const stocks = useStore(s => s.stocks);
  const holdings = useStore(s => s.holdings);
  const orders = useStore(s => s.orders);
  const fearScore = useStore(s => s.fearScore);
  const portfolioHistory = useStore(s => s.portfolioHistory);
  const milestones = useStore(s => s.milestones);
  const navigate = useNavigate();

  // Chatbot state
  const [chatExpanded, setChatExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => ([{
    id: Date.now(),
    role: 'assistant',
    content: `Hi ${user?.name || 'there'}, I am your SimVesto market assistant. Ask me anything about stocks, risk, or strategy.`,
    createdAt: Date.now(),
  }]));
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatListRef = useRef(null);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  const chatHistoryForApi = useMemo(() => (
    chatMessages
      .filter(m => m.role === 'assistant' || m.role === 'user')
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-10)
  ), [chatMessages]);

  const sendChatMessage = useCallback(async (raw) => {
    const text = (raw ?? chatInput).trim();
    if (!text || chatLoading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text, createdAt: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.askAdvisor(
        text,
        [...chatHistoryForApi, { role: 'user', content: text }],
        {
          holdingsSnapshot: holdings.map(h => ({
            symbol: h.symbol,
            quantity: Number(h.quantity || 0),
            avgBuyPrice: Number(h.avgBuyPrice || 0),
          })),
        }
      );
      const replyText = response?.reply || response?.message || 'I could not generate a response right now.';
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant', content: replyText, createdAt: Date.now(),
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant', content: 'Unable to reach chatbot service. Please try again.', createdAt: Date.now(),
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatHistoryForApi, holdings]);

  const totalValue = useMemo(() => holdings.reduce((s, h) => s + (h.currentValue || 0), 0), [holdings]);
  const investedAmount = useMemo(() => holdings.reduce((s, h) => s + ((h.quantity || 0) * (h.avgBuyPrice || 0)), 0), [holdings]);
  const unrealizedPnL = useMemo(() => holdings.reduce((s, h) => s + (h.pnl || 0), 0), [holdings]);
  const realizedPnL = useMemo(() => orders.reduce((s, o) => s + (o.type === 'SELL' ? (o.pnl || o.realizedPnl || 0) : 0), 0), [orders]);
  const totalPnL = realizedPnL + unrealizedPnL;
  const netWorth = (user?.iqCoins || 0) + totalValue;
  const baselineNetWorth = useMemo(() => {
    if (portfolioHistory.length > 0 && Number.isFinite(Number(portfolioHistory[0]?.netWorth))) {
      return Number(portfolioHistory[0].netWorth);
    }
    return INITIAL_CAPITAL;
  }, [portfolioHistory]);
  const overallNetWorthPnL = netWorth - baselineNetWorth;

  const topGainers = useMemo(() => [...stocks].sort((a, b) => b.dayChangePct - a.dayChangePct).slice(0, 5), [stocks]);
  const topLosers = useMemo(() => [...stocks].sort((a, b) => a.dayChangePct - b.dayChangePct).slice(0, 5), [stocks]);
  const formatSymbol = (value) => String(value || '').replace(/^IQ/, '');

  const portfolioChartData = useMemo(() => {
    const snapshots = portfolioHistory.slice(-60);
    if (snapshots.length >= 2) {
      return snapshots.map((p, i) => ({
        time: i, netWorth: p.netWorth, invested: p.investedAmount ?? 0,
      }));
    }
    if (orders.length > 0) {
      const sortedOrders = [...orders].filter(o => o && o.timestamp)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      let runningNetWorth = baselineNetWorth;
      let runningInvested = 0;
      const points = [{ time: 0, netWorth: runningNetWorth, invested: runningInvested }];
      sortedOrders.forEach((order, index) => {
        if (order.type === 'BUY') runningInvested += Number(order.totalCost || 0);
        if (order.type === 'SELL') {
          const tradePnl = Number(order.pnl || order.realizedPnl || 0);
          const saleTotal = Number(order.totalCost || 0);
          runningInvested = Math.max(0, runningInvested - (saleTotal - tradePnl));
          runningNetWorth += tradePnl;
        }
        points.push({ time: index + 1, netWorth: runningNetWorth, invested: runningInvested });
      });
      return points;
    }
    return Array.from({ length: 20 }, (_, i) => ({ time: i, netWorth, invested: investedAmount }));
  }, [portfolioHistory, orders, netWorth, investedAmount, baselineNetWorth]);

  const trendChange = useMemo(() => {
    if (portfolioChartData.length < 2) return 0;
    return Number(portfolioChartData[portfolioChartData.length - 1].netWorth || 0) - Number(portfolioChartData[0].netWorth || 0);
  }, [portfolioChartData]);
  const trendPositive = trendChange >= 0;

  const greeting = fearScore.fearClass === 'HIGH'
    ? "Let's explore safely—no real money involved."
    : fearScore.fearClass === 'LOW'
      ? "You're building real confidence. Ready for the next trade?"
      : "Welcome back! Keep learning, keep growing.";

  const STAT_CARDS = [
    { label: 'Net Worth', value: `₹${netWorth.toLocaleString()}`, change: overallNetWorthPnL, Icon: WalletIcon, taglines: STAT_TAGLINES.netWorth, accent: 'var(--green)' },
    { label: 'Coins', value: `₹${(user?.iqCoins || 0).toLocaleString()}`, Icon: CoinIcon, taglines: STAT_TAGLINES.coins, accent: 'var(--amber)' },
    { label: 'Invested Capital', value: `₹${investedAmount.toLocaleString()}`, Icon: ChartIcon, taglines: STAT_TAGLINES.invested, accent: 'var(--blue)' },
    { label: 'Total Trades', value: orders.length.toString(), sub: `${holdings.length} holdings`, Icon: ActivityIcon, taglines: STAT_TAGLINES.trades, accent: 'var(--accent-purple)' },
  ];

  return (
    <div>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif)' }}>
          Welcome back, {user?.name || 'Investor'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>{greeting}</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {STAT_CARDS.map((stat, i) => (
          <motion.div key={i} className="stat-card"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value">{stat.value}</div>
                {stat.change !== undefined && (
                  <div className="stat-card-change" style={{ color: stat.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {stat.change >= 0 ? '▲' : '▼'} ₹{Math.abs(stat.change).toLocaleString()}
                  </div>
                )}
                {stat.sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{stat.sub}</div>}
                <div style={{ marginTop: '8px' }}>
                  <RotatingTagline lines={stat.taglines} />
                </div>
              </div>
              <div style={{
                width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: stat.accent,
                flexShrink: 0,
              }}>
                <stat.Icon />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Portfolio Chart + Chatbot Card */}
      <div className="dashboard-chart-row" style={{ marginBottom: '24px' }}>
        <motion.div className="card dashboard-chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-serif)' }}>Portfolio Performance</h3>
            <span className={`badge ${totalPnL >= 0 ? 'badge-green' : 'badge-red'}`}>
              {trendPositive ? '▲' : '▼'} ₹{Math.abs(trendChange).toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '10px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Realized: <strong style={{ color: realizedPnL >= 0 ? 'var(--green)' : 'var(--red)' }}>{realizedPnL >= 0 ? '+' : ''}₹{realizedPnL.toFixed(2)}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>Unrealized: <strong style={{ color: unrealizedPnL >= 0 ? 'var(--green)' : 'var(--red)' }}>{unrealizedPnL >= 0 ? '+' : ''}₹{unrealizedPnL.toFixed(2)}</strong></span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={portfolioChartData}>
              <defs>
                <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendPositive ? '#10b981' : '#ef4444'} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={trendPositive ? '#10b981' : '#ef4444'} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <XAxis hide /><YAxis hide />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ display: 'none' }}
                formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'netWorth' ? 'Net Worth' : 'Invested']}
              />
              <Area type="monotone" dataKey="netWorth" stroke={trendPositive ? '#10b981' : '#ef4444'} fill="url(#trendArea)" strokeWidth={2.5} dot={false} name="netWorth" />
              <Line type="monotone" dataKey="invested" stroke="#7fb3e6" strokeWidth={1.7} strokeDasharray="5 4" dot={false} name="invested" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Chatbot Card */}
        <motion.div className={`chatbot-dashboard-card ${chatExpanded ? 'expanded' : ''}`}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }} layout>
          <div className="chatbot-particles">
            <span className="particle p1">$</span><span className="particle p2">₹</span>
            <span className="particle p3">%</span><span className="particle p4">+</span>
            <span className="particle p5">$</span><span className="particle p6">₹</span>
          </div>
          <AnimatePresence mode="wait">
            {!chatExpanded ? (
              <motion.div key="collapsed" className="chatbot-collapsed"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setChatExpanded(true)} style={{ cursor: 'pointer' }}>
                <div className="chatbot-icon-ring">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
                  </svg>
                </div>
                <h3 className="chatbot-cta-title">Ask me anything</h3>
                <p className="chatbot-cta-sub">Your market assistant is ready</p>
                <div className="chatbot-pulse-ring" />
              </motion.div>
            ) : (
              <motion.div key="expanded" className="chatbot-expanded"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="chatbot-exp-header">
                  <span style={{ fontWeight: 800, fontSize: '14px', fontFamily: 'var(--font-serif)' }}>Market Assistant</span>
                  <button className="chatbot-shrink-btn" onClick={() => setChatExpanded(false)} title="Minimize">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                </div>
                <div className="chatbot-quick-prompts">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} className="chatbot-quick-btn" onClick={() => sendChatMessage(p)} disabled={chatLoading}>{p}</button>
                  ))}
                </div>
                <div ref={chatListRef} className="chatbot-messages">
                  {chatMessages.map((m, i) => (
                    <div key={m.id + i} className={`chatbot-msg ${m.role === 'user' ? 'user' : 'bot'}`}>
                      <div className="chatbot-msg-bubble">
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '13px' }}>{m.content}</div>
                        <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>{formatTime(m.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="chatbot-msg bot"><div className="chatbot-msg-bubble"><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Thinking...</span></div></div>}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="chatbot-input-row">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about stocks, strategy..." maxLength={500} disabled={chatLoading} />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={chatLoading || !chatInput.trim()}>Send</button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Market Movers */}
      <div className="grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-serif)' }}>Top Gainers</h3>
          {topGainers.map(stock => (
            <div key={stock.id} onClick={() => navigate(`/app/trade/${stock.symbol}`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{stock.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{formatSymbol(stock.symbol)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px' }}>₹{stock.currentPrice.toLocaleString()}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>▲ {stock.dayChangePct.toFixed(2)}%</div>
              </div>
            </div>
          ))}
        </motion.div>
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-serif)' }}>Top Losers</h3>
          {topLosers.map(stock => (
            <div key={stock.id} onClick={() => navigate(`/app/trade/${stock.symbol}`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{stock.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{formatSymbol(stock.symbol)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px' }}>₹{stock.currentPrice.toLocaleString()}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)', fontWeight: 700 }}>▼ {Math.abs(stock.dayChangePct).toFixed(2)}%</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-serif)' }}>Achievements</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {milestones.map(m => (
              <div key={m.id} className="badge badge-purple" style={{ fontSize: '12px', padding: '6px 14px' }}>{m.label} — +{m.reward} Coins</div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
