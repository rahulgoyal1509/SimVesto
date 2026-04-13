import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import FearFeedbackModal from './fear/FearFeedbackModal';

const NAV_ITEMS = [
  { path: '/app', icon: '📊', label: 'Dashboard', end: true },
  { path: '/app/explore', icon: '🔍', label: 'Explore' },
  { path: '/app/holdings', icon: '💼', label: 'Holdings' },
  { path: '/app/orders', icon: '📋', label: 'Orders' },
  { path: '/app/advisor', icon: '🤖', label: 'AI Advisor' },
  { path: '/app/chat', icon: '💬', label: 'Market Chatbot' },
  { path: '/app/insights', icon: '📈', label: 'Insights' },
  { path: '/app/profile', icon: '👤', label: 'Profile' },
];

export default function AppLayout() {
  const user = useStore(s => s.user);
  const stocks = useStore(s => s.stocks);
  const startRealtimeSync = useStore(s => s.startRealtimeSync);
  const stopRealtimeSync = useStore(s => s.stopRealtimeSync);
  const recordPortfolioSnapshot = useStore(s => s.recordPortfolioSnapshot);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchReadOnly, setSearchReadOnly] = useState(true);
  
  const fearModalData = useStore(s => s.fearModalData);
  const clearFearModal = useStore(s => s.clearFearModal);

  useEffect(() => {
    startRealtimeSync(4000);
    useStore.getState().fetchFearData();
    const snapInterval = setInterval(recordPortfolioSnapshot, 30000);
    return () => {
      stopRealtimeSync();
      clearInterval(snapInterval);
    };
  }, [startRealtimeSync, stopRealtimeSync, recordPortfolioSnapshot]);

  const filteredStocks = searchQuery
    ? stocks.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setShowSearch(e.target.value.length > 0);
  };

  const goToStock = (symbol) => {
    setSearchQuery('');
    setShowSearch(false);
    navigate(`/app/trade/${symbol}`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <nav className="app-nav">
        <div className="app-nav-logo" onClick={() => navigate('/app')}>IQ</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `app-nav-item ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span className="app-nav-tooltip">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main content area */}
      <div style={{ flex: 1, marginLeft: '72px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header className="top-bar" style={{ left: '72px' }}>
          <div style={{ position: 'relative' }}>
            <div className="top-bar-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                name="stock-search-live"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                readOnly={searchReadOnly}
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => {
                  setSearchReadOnly(false);
                  if (searchQuery) setShowSearch(true);
                }}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              />
            </div>
            {showSearch && filteredStocks.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', marginTop: '4px',
                boxShadow: 'var(--shadow-lg)', zIndex: 200, maxHeight: '300px', overflow: 'auto'
              }}>
                {filteredStocks.map(stock => (
                  <div
                    key={stock.id}
                    onClick={() => goToStock(stock.symbol)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{stock.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{stock.symbol}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '13px' }}>₹{stock.currentPrice.toLocaleString()}</div>
                      <div className={`price-change ${stock.dayChangePct >= 0 ? 'up' : 'down'}`}>
                        {stock.dayChangePct >= 0 ? '▲' : '▼'} {Math.abs(stock.dayChangePct).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="top-bar-right">
            <div className="coin-display">
              <div className="coin-icon">₹</div>
              <span>{(user?.iqCoins || 0).toLocaleString()}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>IQ</span>
            </div>
            <div
              style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                background: 'var(--accent-purple-dim)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
                color: 'var(--accent-purple-light)',
              }}
              onClick={() => navigate('/app/profile')}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Ticker strip */}
        <div className="ticker-strip" style={{ marginTop: '56px', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', gap: '24px', animation: 'tickerScroll 60s linear infinite',
            whiteSpace: 'nowrap',
          }}>
            {stocks.concat(stocks).map((stock, i) => (
              <div key={`${stock.id}-${i}`} className="ticker-item" style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/app/trade/${stock.symbol}`)}>
                <span className="symbol">{stock.symbol}</span>
                <span style={{ fontWeight: 600 }}>₹{stock.currentPrice.toLocaleString()}</span>
                <span className={`price-change ${stock.dayChangePct >= 0 ? 'up' : 'down'}`}>
                  {stock.dayChangePct >= 0 ? '▲' : '▼'}{Math.abs(stock.dayChangePct).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Page content */}
        <main style={{ padding: '24px', flex: 1, minWidth: 0 }}>
          <Outlet />
        </main>
      </div>

      <FearFeedbackModal 
        isOpen={!!fearModalData} 
        onClose={clearFearModal} 
        logData={fearModalData} 
      />

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
