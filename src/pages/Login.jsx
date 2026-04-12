import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useStore(s => s.setUser);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);

    try {
      const { api } = await import('../services/api.js');
      const data = await api.login(email, password);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Sync wallet
        const wallet = await api.getWallet();
        setUser({
          _id: data._id, name: email.split('@')[0], email,
          iqCoins: wallet.balance || 10000, fearScore: 65, fearClass: 'MEDIUM', literacyScore: 5,
          totalTrades: 0, totalPnL: 0, sessionCount: 1, createdAt: Date.now(),
        });
        navigate('/app');
      } else {
        setError(data.message || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Server connection failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div className="auth-left"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <div className="auth-form">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
            ← Back to home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div className="landing-nav-brand-icon">IQ</div>
            <span style={{ fontSize: '18px', fontWeight: 700 }}>InvestIQ</span>
          </div>
          <h1>Welcome back</h1>
          <p>Log in to continue your trading journey.</p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

            <button className="btn btn-primary" type="submit"
              style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '8px' }}
              disabled={loading}>
              {loading ? <span className="spinner" /> : 'Log In'}
            </button>
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-purple-light)', fontWeight: 500 }}>Sign up free</Link>
          </p>
        </div>
      </motion.div>

      <div className="auth-right">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📈</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, marginBottom: '12px' }}>
            Trade smarter,<br /><em style={{ fontStyle: 'italic', color: 'var(--accent-purple)' }}>fear less</em>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
            Your AI-powered simulation is waiting. Pick up right where you left off.
          </p>
        </div>
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-100px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-purple-dim) 0%, transparent 70%)',
        }} />
      </div>
    </div>
  );
}
