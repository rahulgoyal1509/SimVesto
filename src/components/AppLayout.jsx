import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import FearFeedbackModal from './fear/FearFeedbackModal';
import Logo from './Logo';
import GlossaryHighlighter from './GlossaryHighlighter';
import Sidebar from './Sidebar';
import ParallaxBg from './ParallaxBg';

const NAV_ITEMS = [
  { path: '/app/explore', label: 'Explore' },
  { path: '/app/advisor', label: 'AI Advisor' },
  { path: '/app/analytics', label: 'Market Pulse' },
];

export default function AppLayout() {
  const user = useStore(s => s.user);
  const stocks = useStore(s => s.stocks);
  const startRealtimeSync = useStore(s => s.startRealtimeSync);
  const stopRealtimeSync = useStore(s => s.stopRealtimeSync);
  const recordPortfolioSnapshot = useStore(s => s.recordPortfolioSnapshot);
  const fetchTradeHistory = useStore(s => s.fetchTradeHistory);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchReadOnly, setSearchReadOnly] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const formatSymbol = (value) => String(value || '').replace(/^IQ/, '');
  
  const fearModalData = useStore(s => s.fearModalData);
  const clearFearModal = useStore(s => s.clearFearModal);
  const glossaryEnabled = useStore(s => s.glossaryEnabled);
  const toggleGlossary = useStore(s => s.toggleGlossary);
  const theme = useStore(s => s.theme);
  const toggleTheme = useStore(s => s.toggleTheme);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    startRealtimeSync(4000);
    useStore.getState().fetchFearData();
    fetchTradeHistory();
    const snapInterval = setInterval(recordPortfolioSnapshot, 30000);
    return () => {
      stopRealtimeSync();
      clearInterval(snapInterval);
    };
  }, [startRealtimeSync, stopRealtimeSync, recordPortfolioSnapshot, fetchTradeHistory]);

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Navigation Bar */}
      <header className="top-navbar">
        <div className="navbar-left">
          {/* Hamburger / Sidebar Toggle */}
          <button
            className="sidebar-hamburger"
            onClick={() => setSidebarOpen(prev => !prev)}
            title="Toggle menu"
            type="button"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Logo — clicks go to dashboard */}
          <div className="navbar-logo" onClick={() => navigate('/app')}>
            <Logo width="32" height="32" />
            <span>SimVesto</span>
          </div>
          
          <nav className="navbar-menu">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={{ position: 'relative', flex: 1, maxWidth: '480px', margin: '0 16px' }}>
          <div className="navbar-search">
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
            <div className="search-dropdown">
              {filteredStocks.map(stock => (
                <div
                  key={stock.id}
                  onClick={() => goToStock(stock.symbol)}
                  className="search-item"
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{stock.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{formatSymbol(stock.symbol)}</div>
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

        <div className="navbar-right">
          <div className="coin-display">
            <div className="coin-icon">₹</div>
            <span>{(user?.iqCoins || 0).toLocaleString()}</span>
          </div>
          <div
            className="navbar-profile"
            onClick={() => navigate('/app/profile')}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        glossaryEnabled={glossaryEnabled}
        toggleGlossary={toggleGlossary}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Ticker strip */}
      <div className="ticker-strip">
        <div className="ticker-content">
          {stocks.concat(stocks).map((stock, i) => (
            <div key={`${stock.id}-${i}`} className="ticker-item" style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/app/trade/${stock.symbol}`)}>
              <span className="symbol">{formatSymbol(stock.symbol)}</span>
              <span style={{ fontWeight: 600 }}>₹{stock.currentPrice.toLocaleString()}</span>
              <span className={`price-change ${stock.dayChangePct >= 0 ? 'up' : 'down'}`}>
                {stock.dayChangePct >= 0 ? '▲' : '▼'}{Math.abs(stock.dayChangePct).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <main style={{ padding: '32px 24px', flex: 1, minWidth: 0, position: 'relative' }}>
        <ParallaxBg />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Outlet />
        </div>
      </main>

      <GlossaryHighlighter enabled={glossaryEnabled} />

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
