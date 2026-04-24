import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { getFearColor, getFearLabel } from '../engine/fearEngine';
import Logo from '../components/Logo';

const STORAGE_KEY = 'simvesto_profilePic';

function loadProfilePic() {
  try { return localStorage.getItem(STORAGE_KEY) || null; } catch { return null; }
}
function saveProfilePic(data) {
  try { localStorage.setItem(STORAGE_KEY, data); } catch (e) { console.warn('Profile pic save failed', e); }
}

export default function Profile() {
  const user = useStore(s => s.user);
  const updateUser = useStore(s => s.updateUser);
  const fearScore = useStore(s => s.fearScore);
  const orders = useStore(s => s.orders);
  const holdings = useStore(s => s.holdings);
  const milestones = useStore(s => s.milestones);
  const logout = useStore(s => s.logout);
  const navigate = useNavigate();

  const [showCard, setShowCard] = useState(false);
  const [profilePic, setProfilePic] = useState(loadProfilePic);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const fileInputRef = useRef(null);
  const cardRef = useRef(null);

  const fearColor = getFearColor(fearScore.score);
  const fearLabel = getFearLabel(fearScore.fearClass);
  const canShowCard = fearScore.score < 40;
  const totalPnL = orders.filter(o => o.pnl).reduce((s, o) => s + o.pnl, 0);

  const handlePicUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      setProfilePic(data);
      saveProfilePic(data);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== user?.name) {
      updateUser({ name: trimmed });
    }
    setEditingName(false);
  };

  const exportCard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 600; canvas.height = 400;
      const grad = ctx.createLinearGradient(0, 0, 600, 400);
      grad.addColorStop(0, '#0c0c12'); grad.addColorStop(1, '#1c1c28');
      ctx.fillStyle = grad; ctx.roundRect(0, 0, 600, 400, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(16,185,129,0.4)'; ctx.lineWidth = 2;
      ctx.roundRect(0, 0, 600, 400, 20); ctx.stroke();
      ctx.fillStyle = '#f0f0f5'; ctx.font = '700 28px Inter';
      ctx.fillText('SimVesto Confidence Card', 40, 60);
      ctx.fillStyle = '#a0a0b8'; ctx.font = '400 14px Inter';
      ctx.fillText(user?.name || 'Investor', 40, 90);
      ctx.fillStyle = fearColor; ctx.font = '700 64px monospace';
      ctx.fillText(fearScore.score.toString(), 40, 180);
      ctx.fillStyle = '#a0a0b8'; ctx.font = '400 14px Inter';
      ctx.fillText('Fear Score', 40, 200);
      ctx.fillStyle = '#f0f0f5'; ctx.font = '500 16px Inter';
      ctx.fillText(`${orders.length} trades · ${holdings.length} holdings`, 40, 250);
      ctx.fillText(`${milestones.length} milestones unlocked`, 40, 275);
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = 'simvesto-confidence-card.png'; a.click();
        URL.revokeObjectURL(url);
      });
    } catch (err) { console.error('Export failed:', err); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const STAT_ITEMS = [
    { label: 'Fear Score', value: fearScore.score, valueColor: fearColor, sub: fearLabel,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg> },
    { label: 'Literacy', value: `${user?.literacyScore || 5}/10`, sub: 'Financial literacy',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { label: 'Coins', value: (user?.iqCoins || 0).toLocaleString(), valueColor: 'var(--amber)', sub: 'Available balance',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/></svg> },
    { label: 'Total P&L', value: `${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toFixed(0)}`, valueColor: totalPnL >= 0 ? 'var(--green)' : 'var(--red)', sub: 'Realized gains',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { label: 'Trades', value: orders.length, sub: `${holdings.length} active holdings`,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg> },
    { label: 'Milestones', value: milestones.length, sub: 'Achievements unlocked',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Your account, stats, and settings</p>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div className="profile-header-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-header-inner">
          {/* Avatar */}
          <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current?.click()} title="Click to change photo">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-initial">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="profile-avatar-overlay">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePicUpload} style={{ display: 'none' }} />
          </div>

          {/* Name + Email */}
          <div className="profile-header-info">
            {editingName ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  style={{ fontSize: '18px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', width: '200px' }}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleSaveName}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-serif)', margin: 0 }}>{user?.name}</h2>
                <button className="profile-edit-btn" onClick={() => { setNameInput(user?.name || ''); setEditingName(true); }} title="Edit name">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
              </div>
            )}
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>{user?.email}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
              Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
            </div>
          </div>

          {/* Actions */}
          <div className="profile-header-actions">
            {canShowCard && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowCard(true)}>View Confidence Card</button>
            )}
            <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ color: 'var(--red)', borderColor: 'var(--red-dim)' }}>
              Log Out
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        {STAT_ITEMS.map((item, i) => (
          <motion.div key={item.label} className="profile-stat-card"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}>
            <div className="profile-stat-icon" style={{ color: item.valueColor || 'var(--accent-purple)' }}>
              {item.icon}
            </div>
            <div className="profile-stat-label">{item.label}</div>
            <div className="profile-stat-value" style={{ color: item.valueColor || 'var(--text-primary)' }}>
              {item.value}
            </div>
            {item.sub && <div className="profile-stat-sub">{item.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Confidence Card */}
      {(showCard || canShowCard) && (
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: '24px', overflow: 'hidden' }}>
          <div ref={cardRef} style={{
            background: 'linear-gradient(135deg, #0c0c12, #1c1c28)',
            border: '2px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-xl)', padding: '32px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-50px', right: '-50px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-serif)' }}>SimVesto Confidence Card</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.name}</div>
                </div>
                <Logo width="36" height="36" />
              </div>
              <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '48px', fontWeight: 800, color: fearColor }}>{fearScore.score}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fear Score</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { v: orders.length, l: 'Trades' }, { v: holdings.length, l: 'Holdings' },
                    { v: milestones.length, l: 'Milestones' }, { v: (user?.iqCoins || 0).toLocaleString(), l: 'Coins', c: 'var(--amber)' },
                  ].map(s => (
                    <div key={s.l}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 800, color: s.c || 'var(--text-primary)' }}>{s.v}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--accent-purple-light)', lineHeight: 1.7, fontStyle: 'italic', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                "You've traded {orders.length} times, faced the market's ups and downs, and kept going. That's what a confident investor looks like."
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-primary btn-sm" onClick={exportCard}>Export as PNG</button>
            <button className="btn btn-outline btn-sm" onClick={() => {
              navigator.clipboard?.writeText('Check out my SimVesto Confidence Card!');
            }}>Copy Share Text</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
