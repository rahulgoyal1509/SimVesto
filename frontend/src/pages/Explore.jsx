import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import useStore from '../store/useStore';

const SECTORS = ['All', 'Technology', 'Finance', 'Energy', 'Healthcare', 'FMCG', 'Automobile', 'Telecom', 'Infrastructure', 'Fintech', 'Crypto'];

export default function Explore() {
  const stocks = useStore(s => s.stocks);
  const realtimeError = useStore(s => s.realtimeError);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  const refreshRealtimeStocks = useStore(s => s.refreshRealtimeStocks);

  useEffect(() => {
    refreshRealtimeStocks().catch(() => {});
  }, [refreshRealtimeStocks]);

  const filtered = useMemo(() => {
    let list = [...stocks];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q));
    }
    if (sector !== 'All') list = list.filter(s => s.sector === sector);
    if (sortBy === 'gainers') list.sort((a, b) => b.dayChangePct - a.dayChangePct);
    else if (sortBy === 'losers') list.sort((a, b) => a.dayChangePct - b.dayChangePct);
    else if (sortBy === 'price') list.sort((a, b) => b.currentPrice - a.currentPrice);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [stocks, search, sector, sortBy]);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Explore Stocks</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Browse 20 simulated stocks and start trading</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
          Prices refresh live across the app. Click a stock to open the trade screen and experience behavioral counterparty matching.
        </p>
        {realtimeError && (
          <p style={{ color: 'var(--red)', fontSize: '12px', marginTop: '8px' }}>
            Live data error: {realtimeError}
          </p>
        )}
      </motion.div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)',
          padding: '8px 16px', flex: '1', maxWidth: '400px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search stocks..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', padding: '2px', flex: 1, fontSize: '13px' }} />
        </div>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', cursor: 'pointer' }}>
          <option value="name">Sort: A-Z</option>
          <option value="gainers">Top Gainers</option>
          <option value="losers">Top Losers</option>
          <option value="price">Price: High-Low</option>
        </select>
      </div>

      {/* Sector pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {SECTORS.map(s => (
          <button key={s} className={`btn btn-sm ${sector === s ? '' : 'btn-ghost'}`}
            onClick={() => setSector(s)}
            style={sector === s ? {
              background: 'var(--accent-purple-dim)', color: 'var(--accent-purple-light)',
              border: '1px solid rgba(124,58,237,0.3)', borderRadius: 'var(--radius-full)', padding: '5px 14px',
            } : { borderRadius: 'var(--radius-full)', padding: '5px 14px', border: '1px solid var(--border-default)' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Stock Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {filtered.map((stock, i) => {
          const sparkData = stock.priceHistory.slice(-48).map((h, j) => ({ i: j, p: h.price }));
          const isUp = stock.dayChangePct >= 0;
          return (
            <motion.div key={stock.id} className="card" style={{ cursor: 'pointer', padding: '16px' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              onClick={() => navigate(`/app/trade/${stock.symbol}`)}
              whileHover={{ scale: 1.01, borderColor: 'var(--border-strong)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <div className="stock-icon" style={{ background: `${stock.color}20`, color: stock.color, flexShrink: 0 }}>
                    {stock.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stock.symbol?.replace(/^IQ/, '')} · {stock.sector}
                    </div>
                  </div>
                </div>
                <span className={`badge ${isUp ? 'badge-green' : 'badge-red'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(stock.dayChangePct).toFixed(2)}%
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700 }}>
                    ₹{stock.currentPrice.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: isUp ? 'var(--green)' : 'var(--red)' }}>
                    {isUp ? '+' : ''}₹{stock.dayChange.toFixed(2)}
                  </div>
                </div>
                <div style={{ width: '80px', height: '36px' }}>
                  <ResponsiveContainer>
                    <LineChart data={sparkData}>
                      <Line type="monotone" dataKey="p" stroke={isUp ? '#10b981' : '#ef4444'}
                        strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
