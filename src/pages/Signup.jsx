import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

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

    // Compute fear score from answers
    let totalFear = 0;
    let litScore = 5;
    let count = 0;
    Object.values(answers).forEach(a => {
      if (a.fearWeight) { totalFear += a.fearWeight; count++; }
      if (a.litScore) litScore = a.litScore;
    });
    const avgFear = count > 0 ? totalFear / count : 2;
    const fearScore = Math.min(100, Math.round(avgFear / 3 * 100));

    setTimeout(() => {
      const user = {
        id: Date.now(), name, email,
        iqCoins: 10000, fearScore, fearClass: fearScore >= 65 ? 'HIGH' : fearScore >= 35 ? 'MEDIUM' : 'LOW',
        literacyScore: litScore, totalTrades: 0, totalPnL: 0, sessionCount: 1,
        startingAmount: sliderValue, questionnaireAnswers: answers, createdAt: Date.now(),
      };
      setUser(user);
      updateFearScore({ quizFearAnswers: avgFear, sessionCount: 1 });
      navigate('/app');
    }, 2500);
  };

  // ── FORM STEP ──
  if (step === 'form') {
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
            <h1>Create your account</h1>
            <p>Start trading in under 60 seconds. No real money needed.</p>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" type="text" placeholder="Your name"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
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
                style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '8px' }}>
                Continue to Profile Quiz →
              </button>
            </form>

            <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--accent-purple-light)', fontWeight: 500 }}>Log in</Link>
            </p>
          </div>
        </motion.div>

        <div className="auth-right">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🪙</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, marginBottom: '12px' }}>
              Get <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>10,000 IQ Coins</em>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
              Free tokens to start simulating trades. Earn more through profitable decisions.
            </p>
          </div>
          <div style={{
            position: 'absolute', bottom: '-100px', right: '-100px',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, var(--gold-dim) 0%, transparent 70%)',
          }} />
        </div>
      </div>
    );
  }

  // ── QUIZ STEP ──
  if (step === 'quiz') {
    const q = QUESTIONS[currentQ];
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
        <div className="questionnaire">
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} className="question-card"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
              <div className="question-number">QUESTION {currentQ + 1} OF {QUESTIONS.length}</div>
              <div className="question-text">{q.text}</div>

              {q.type === 'slider' ? (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '24px' }}>
                    ₹{sliderValue.toLocaleString()}
                  </div>
                  <input type="range" className="question-slider" min={q.min} max={q.max} step={q.step}
                    value={sliderValue} onChange={e => setSliderValue(Number(e.target.value))} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '32px' }}>
                    <span>₹500</span><span>₹1,00,000</span>
                  </div>
                  <button className="btn btn-primary" onClick={handleSliderSubmit} style={{ width: '100%', padding: '14px' }}>
                    Complete Profile →
                  </button>
                </div>
              ) : (
                <div className="question-options">
                  {q.options.map((opt, i) => (
                    <motion.button key={i}
                      className={`question-option ${answers[currentQ]?.value === opt.value ? 'selected' : ''}`}
                      onClick={() => selectOption(currentQ, opt)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="question-progress">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`question-dot ${i === currentQ ? 'active' : i < currentQ ? 'completed' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ANALYZING STEP ──
  return (
    <div className="analyzing-screen">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}>
        <div className="analyzing-spinner" style={{ width: '80px', height: '80px', borderWidth: '3px', margin: '0 auto 24px' }} />
        <div className="analyzing-text">Analyzing your profile...</div>
        <div className="analyzing-subtext" style={{ marginTop: '8px' }}>
          Building your personalized AI investment assistant
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '32px' }}>
          {['Fear Score', 'Literacy Level', 'Risk Profile'].map((item, i) => (
            <motion.div key={i} style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              fontSize: '12px', color: 'var(--text-muted)',
            }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.4 }}>
              <span style={{ marginRight: '6px' }}>✓</span>{item}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
