import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { getFearColor, getFearLabel } from '../engine/fearEngine';

export default function Profile() {
  const user = useStore(s => s.user);
  const fearScore = useStore(s => s.fearScore);
  const orders = useStore(s => s.orders);
  const holdings = useStore(s => s.holdings);
  const milestones = useStore(s => s.milestones);
  const logout = useStore(s => s.logout);
  const navigate = useNavigate();

  const [showCard, setShowCard] = useState(false);
  const cardRef = useRef(null);

  const fearColor = getFearColor(fearScore.score);
  const fearLabel = getFearLabel(fearScore.fearClass);
  const canShowCard = fearScore.score < 40;

  const totalPnL = orders.filter(o => o.pnl).reduce((s, o) => s + o.pnl, 0);

  const exportCard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 400;

      // Draw card background
      const grad = ctx.createLinearGradient(0, 0, 600, 400);
      grad.addColorStop(0, '#0c0c12');
      grad.addColorStop(1, '#1c1c28');
      ctx.fillStyle = grad;
      ctx.roundRect(0, 0, 600, 400, 20);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(124,58,237,0.4)';
      ctx.lineWidth = 2;
      ctx.roundRect(0, 0, 600, 400, 20);
      ctx.stroke();

      // Text
      ctx.fillStyle = '#f0f0f5';
      ctx.font = '700 28px Inter';
      ctx.fillText('SimVesto Confidence Card', 40, 60);

      ctx.fillStyle = '#a0a0b8';
      ctx.font = '400 14px Inter';
      ctx.fillText(user?.name || 'Investor', 40, 90);

      ctx.fillStyle = fearColor;
      ctx.font = '700 64px JetBrains Mono';
      ctx.fillText(fearScore.score.toString(), 40, 180);
      ctx.fillStyle = '#a0a0b8';
      ctx.font = '400 14px Inter';
      ctx.fillText('Fear Score', 40, 200);

      ctx.fillStyle = '#f0f0f5';
      ctx.font = '500 16px Inter';
      ctx.fillText(`${orders.length} trades · ${holdings.length} holdings`, 40, 250);
      ctx.fillText(`${milestones.length} milestones unlocked`, 40, 275);

      ctx.fillStyle = '#7c3aed';
      ctx.font = '400 13px Inter';
      const statement = `You've traded ${orders.length} times, faced the market's ups and downs, and kept going. That's what a confident investor looks like.`;
      const words = statement.split(' ');
      let line = '';
      let y = 320;
      words.forEach(word => {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > 520) {
          ctx.fillText(line, 40, y);
          line = word + ' ';
          y += 20;
        } else {
          line = test;
        }
      });
      ctx.fillText(line, 40, y);

      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'simvesto-confidence-card.png';
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your account and settings</p>
      </motion.div>

      <div className="grid-2" style={{ gap: '20px' }}>
        {/* User Info */}
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--accent-purple), #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 700, color: 'white',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.email}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Fear Score</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: fearColor }}>{fearScore.score}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fearLabel}</div>
            </div>
            <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Literacy</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700 }}>{user?.literacyScore || 5}/10</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Financial literacy</div>
            </div>
            <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Coins</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>{(user?.iqCoins || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total P&L</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: totalPnL >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(0)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>⚙️ Settings</h3>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {canShowCard && (
              <button className="btn btn-primary" onClick={() => setShowCard(true)} style={{ width: '100%' }}>
                🏆 View Confidence Card
              </button>
            )}
            <button className="btn btn-outline" onClick={handleLogout} style={{ width: '100%', color: 'var(--red)' }}>
              Log Out
            </button>
          </div>
        </motion.div>
      </div>

      {/* Confidence Card */}
      {(showCard || canShowCard) && (
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: '24px', overflow: 'hidden' }}>
          <div ref={cardRef} style={{
            background: 'linear-gradient(135deg, #0c0c12, #1c1c28)',
            border: '2px solid rgba(124,58,237,0.3)',
            borderRadius: 'var(--radius-xl)', padding: '32px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative glow */}
            <div style={{
              position: 'absolute', top: '-50px', right: '-50px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>SimVesto Confidence Card</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.name}</div>
                </div>
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--accent-purple), #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 800, color: 'white',
                }}>SV</div>
              </div>

              <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '48px', fontWeight: 700, color: fearColor }}>
                    {fearScore.score}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fear Score</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700 }}>{orders.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trades</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700 }}>{holdings.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Holdings</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700 }}>{milestones.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Milestones</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>
                      {(user?.iqCoins || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Coins</div>
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: '14px', color: 'var(--accent-purple-light)', lineHeight: 1.7,
                fontStyle: 'italic', borderTop: '1px solid var(--border-default)', paddingTop: '16px',
              }}>
                "You've traded {orders.length} times, faced the market's ups and downs, and kept going. That's what a confident investor looks like."
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-primary btn-sm" onClick={exportCard}>📸 Export as PNG</button>
            <button className="btn btn-outline btn-sm" onClick={() => {
              navigator.clipboard?.writeText('Check out my SimVesto Confidence Card! 🏆📈');
            }}>📋 Copy Share Text</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
