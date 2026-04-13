import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import BackgroundGrid from '../components/BackgroundGrid';
import Logo from '../components/Logo';

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
          iqCoins: wallet.balance || 100000, fearScore: 65, fearClass: 'MEDIUM', literacyScore: 5,
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
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <BackgroundGrid cameraOffset={true} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
          pointerEvents: 'none'
        }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 10,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '48px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          width: '100%', maxWidth: '440px', margin: '24px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
          <Logo width="48" height="48" className="mb-4" />
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '16px', letterSpacing: '-0.02em' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)' }}>Log in to continue your trading journey.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Email</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff' }}/>
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff' }}/>
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

          <button className="btn-groww" type="submit"
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            disabled={loading}>
            {loading ? <span className="spinner" /> : 'Log In →'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px' }}>
           <Link to="/" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>
             ← Home
           </Link>
           <span style={{ color: 'rgba(0,0,0,0.1)' }}>|</span>
           <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            No account? <Link to="/signup" style={{ color: 'var(--groww-teal)', fontWeight: 600 }}>Sign up free</Link>
           </span>
        </div>
      </motion.div>
    </div>
  );
}
