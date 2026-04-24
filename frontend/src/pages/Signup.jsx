import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import BackgroundGrid from '../components/BackgroundGrid';
import Logo from '../components/Logo';

const QUESTIONS = [
  {
    id: 1,
    text: "If your investment dropped 15% in a month, what would you do?",
    options: [
      { label: '😰 Sell immediately to prevent more loss', value: 'sell', fearWeight: 3 },
      { label: '⏳ Wait and see what happens', value: 'wait', fearWeight: 2 },
      { label: '💪 Buy more at the lower price', value: 'buy_more', fearWeight: 1 },
    ]
  },
  {
    id: 2,
    text: "What's your primary goal with investing?",
    options: [
      { label: '⚡ Quick short-term gains', value: 'short', fearWeight: 2 },
      { label: '🌱 Long-term wealth growth', value: 'long', fearWeight: 1 },
      { label: '📚 Just learning, no real plans yet', value: 'learning', fearWeight: 3 },
    ]
  },
  {
    id: 3,
    text: "How much do you know about the stock market?",
    options: [
      { label: '🆕 Complete beginner', value: 'beginner', fearWeight: 3, litScore: 2 },
      { label: '📖 I know the basics', value: 'basics', fearWeight: 2, litScore: 5 },
      { label: '🎓 I understand technical analysis', value: 'advanced', fearWeight: 1, litScore: 8 },
    ]
  },
  {
    id: 4,
    text: "What scares you most about investing?",
    options: [
      { label: '💸 Losing my hard-earned money', value: 'losing', fearWeight: 3 },
      { label: '🤔 Not understanding what I\'m doing', value: 'understanding', fearWeight: 2 },
      { label: '😤 Missing out on opportunities', value: 'fomo', fearWeight: 1 },
    ]
  },
  {
    id: 5,
    text: "How much are you thinking of starting with?",
    type: 'slider',
    min: 500,
    max: 100000,
    step: 500,
    default: 5000,
  },
];

export default function Signup() {
  const [step, setStep] = useState('form'); // form | quiz | analyzing
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registeredUserId, setRegisteredUserId] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sliderValue, setSliderValue] = useState(5000);
  const setUser = useStore(s => s.setUser);
  const updateFearScore = useStore(s => s.updateFearScore);
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setError('');
    
    try {
      const { api } = await import('../services/api.js');
      const data = await api.register(email, password);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        setRegisteredUserId(data._id || null);
        setStep('quiz');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server connection failed');
    }
  };

  const selectOption = (qIndex, option) => {
    setAnswers({ ...answers, [qIndex]: option });
    setTimeout(() => {
      if (qIndex < QUESTIONS.length - 1) {
        setCurrentQ(qIndex + 1);
      } else {
        finishQuiz();
      }
    }, 300);
  };

  const handleSliderSubmit = () => {
    setAnswers({ ...answers, [currentQ]: { value: sliderValue } });
    finishQuiz();
  };

  const finishQuiz = () => {
    setStep('analyzing');

    let totalFear = 0;
    let litScore = 5;
    let count = 0;
    Object.values(answers).forEach(a => {
      if (a.fearWeight) { totalFear += a.fearWeight; count++; }
      if (a.litScore) litScore = a.litScore;
    });
    const avgFear = count > 0 ? totalFear / count : 2;
    const fearScore = Math.min(100, Math.round(avgFear / 3 * 100));

    setTimeout(async () => {
      let walletBalance = 100000;
      try {
        const { api } = await import('../services/api.js');
        const wallet = await api.getWallet();
        if (Number.isFinite(Number(wallet?.balance))) {
          walletBalance = Number(wallet.balance);
        }
      } catch { }

      const user = {
        _id: registeredUserId || undefined,
        id: Date.now(), name, email,
        iqCoins: walletBalance, fearScore, fearClass: fearScore >= 65 ? 'HIGH' : fearScore >= 35 ? 'MEDIUM' : 'LOW',
        literacyScore: litScore, totalTrades: 0, totalPnL: 0, sessionCount: 1,
        startingAmount: sliderValue, questionnaireAnswers: answers, createdAt: Date.now(),
      };
      setUser(user);
      updateFearScore({ quizFearAnswers: avgFear, sessionCount: 1 });
      navigate('/app');
    }, 2500);
  };

  // Base Layout Shell that houses the 3D canvas globally for all signup states
  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
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
        key={step}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}
        style={{
          position: 'relative', zIndex: 10,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '48px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          width: '100%', maxWidth: step === 'quiz' ? '600px' : '440px'
        }}
      >
        {step === 'form' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
              <Logo width="48" height="48" className="mb-4" />
              <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '16px', letterSpacing: '-0.02em' }}>Create account</h1>
              <p style={{ color: 'var(--text-muted)' }}>Start trading fearlessly in under 60 seconds.</p>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Name</label>
                <input className="form-input" type="text" placeholder="Your name"
                  value={name} onChange={e => setName(e.target.value)} 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff' }}/>
              </div>
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
                style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
                Start Profile Quiz →
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px' }}>
               <Link to="/" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                 ← Home
               </Link>
               <span style={{ color: 'rgba(0,0,0,0.1)' }}>|</span>
               <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Have an account? <Link to="/login" style={{ color: 'var(--groww-teal)', fontWeight: 600 }}>Log in</Link>
               </span>
            </div>
          </div>
        )}

        {step === 'quiz' && (
          <div className="questionnaire" style={{ padding: '0' }}>
            <AnimatePresence mode="wait">
              <motion.div key={currentQ} className="question-card"
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}
                style={{ background: 'transparent', boxShadow: 'none', padding: '0' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--groww-teal)', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  QUESTION {currentQ + 1} OF {QUESTIONS.length}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '32px', color: 'var(--groww-text)' }}>
                  {QUESTIONS[currentQ].text}
                </div>

                {QUESTIONS[currentQ].type === 'slider' ? (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 700, color: 'var(--groww-teal)', marginBottom: '24px' }}>
                      ₹{sliderValue.toLocaleString()}
                    </div>
                    <input type="range" className="question-slider" min={QUESTIONS[currentQ].min} max={QUESTIONS[currentQ].max} step={QUESTIONS[currentQ].step}
                      value={sliderValue} onChange={e => setSliderValue(Number(e.target.value))} 
                      style={{ width: '100%', accentColor: 'var(--groww-teal)' }}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px', marginTop: '8px' }}>
                      <span style={{ fontWeight: 600 }}>₹500</span><span style={{ fontWeight: 600 }}>₹1,00,000</span>
                    </div>
                    <button className="btn-groww" onClick={handleSliderSubmit} style={{ width: '100%', padding: '14px' }}>
                      Complete Profile →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {QUESTIONS[currentQ].options.map((opt, i) => (
                      <motion.button key={i}
                        style={{
                          width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: '12px',
                          border: answers[currentQ]?.value === opt.value ? '2px solid var(--groww-teal)' : '1px solid rgba(0,0,0,0.1)',
                          background: answers[currentQ]?.value === opt.value ? 'var(--groww-teal-dim)' : '#fff',
                          color: 'var(--groww-text)', fontWeight: '600', cursor: 'pointer', fontSize: '16px'
                        }}
                        onClick={() => selectOption(currentQ, opt)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              {QUESTIONS.map((_, i) => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: i === currentQ ? 'var(--groww-teal)' : i < currentQ ? 'var(--groww-teal-dim)' : 'rgba(0,0,0,0.1)'
                }} />
              ))}
            </div>
          </div>
        )}

        {step === 'analyzing' && (
           <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="analyzing-spinner" style={{ width: '64px', height: '64px', borderWidth: '3px', margin: '0 auto 24px', borderTopColor: 'var(--groww-teal)' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Analyzing profile...</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Building your AI investment sandbox</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              {['Fear Matrix', 'Literacy Level', 'Risk Engine'].map((item, i) => (
                <motion.div key={i} style={{
                  padding: '6px 12px', borderRadius: '100px',
                  background: 'var(--groww-teal-dim)', border: '1px solid rgba(0,D0,9C,0.2)',
                  fontSize: '12px', color: 'var(--groww-teal)', fontWeight: '600'
                }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.4 }}>
                  ✓ {item}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
