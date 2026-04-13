import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackgroundGrid from '../components/BackgroundGrid';
import Logo from '../components/Logo';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.15 } },
};

const FEATURES = [
  { icon: '🪙', title: 'Virtual Capital', desc: 'Start with 100,000 virtual coins and practice in a completely risk-free environment.' },
  { icon: '📊', title: 'Real-time P&L', desc: 'Watch your realized and unrealized profit update live after every single trade.' },
  { icon: '📋', title: 'Smart Ledger', desc: 'Trace every buy and sell with precise timestamps, balances, and outcomes.' },
  { icon: '🤖', title: 'AI Guidance', desc: 'Get intelligent insights to build your confidence before deploying real capital.' },
];

const STEPS = [
  { num: '01', title: 'Create your account', desc: 'Sign up in seconds and instantly receive your 100,000 virtual coins.' },
  { num: '02', title: 'Analyze the market', desc: 'Use our realistic charts and AI insights to find the perfect trading opportunity.' },
  { num: '03', title: 'Execute without fear', desc: 'Buy and sell simulated stocks. Learn from your wins and losses with zero financial risk.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`landing-groww ${isDark ? 'dark' : ''}`}>
      {/* Background 3D Canvas from shared component */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <BackgroundGrid isDark={isDark} />

        {/* Soft radial overlay to ensure text remains readable */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isDark 
            ? 'radial-gradient(circle at top center, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.2) 100%)'
            : 'radial-gradient(circle at top center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.2) 100%)',
          pointerEvents: 'none',
          transition: 'background 0.3s ease'
        }} />
      </div>

      {/* Premium Navbar */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <Logo width="40" height="40" />
          <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--groww-text)', letterSpacing: '-0.03em' }}>SimVesto</span>
        </div>

        <div className="nav-links" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it Works</a>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--groww-border)' }} />
          
          <button 
            onClick={() => setIsDark(!isDark)}
            style={{
              padding: '8px', 
              borderRadius: '50%', 
              background: 'var(--groww-surface)',
              border: '1px solid var(--groww-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--groww-text)'
            }}
            title="Toggle Dark Mode"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <button
            className="nav-link"
            style={{ fontWeight: '600', padding: '0', background: 'transparent' }}
            onClick={() => navigate('/login')}
          >
            Log In
          </button>
          <button className="btn-groww" style={{ padding: '12px 28px' }} onClick={() => navigate('/signup')}>
            Start Trading
          </button>
        </div>
      </nav>

      {/* Embedded Styles for Navbar states */}
      <style dangerouslySetInnerHTML={{__html: `
        .landing-nav {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 100;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 24px 48px;
          background: transparent;
          border-bottom: 1px solid transparent;
        }
        .landing-nav.scrolled {
          padding: 16px 48px;
          background: var(--groww-nav-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
          border-bottom: 1px solid var(--groww-border);
        }
        .nav-link {
          color: var(--groww-text-muted);
          font-weight: 500;
          font-size: 16px;
          position: relative;
          text-decoration: none;
          transition: color 0.2s ease;
          border: none;
          cursor: pointer;
        }
        .nav-link:hover {
          color: var(--groww-text);
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 100%;
          transform: scaleX(0);
          height: 2px;
          bottom: -4px;
          left: 0;
          background-color: var(--groww-teal);
          transform-origin: bottom right;
          transition: transform 0.3s cubic-bezier(0.86, 0, 0.07, 1);
        }
        .nav-link:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .landing-nav { padding: 16px 24px !important; }
        }
      `}} />

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        paddingTop: '20vh',
        paddingBottom: '10vh',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none' // Lets mouse interact with canvas behind text
      }}>
        <motion.div initial="initial" animate="animate" variants={stagger} style={{ width: '100%', padding: '0 24px', pointerEvents: 'auto' }}>

          <motion.div variants={fadeUp} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--groww-surface)',
            padding: '8px 16px',
            borderRadius: '100px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--groww-teal)',
            marginBottom: '32px',
            border: '1px solid var(--groww-teal-dim)'
          }}>
            <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--groww-teal)' }}></span>
            AI-Powered Trading Practice
          </motion.div>

          <motion.h1 className="landing-title" variants={fadeUp} style={{ fontSize: '72px' }}>
            Invest in your future.<br />
            Practice without <span style={{ color: 'var(--groww-teal)' }}>risk.</span>
          </motion.h1>

          <motion.p className="landing-subtitle" variants={fadeUp}>
            Experience the thrill of the market with zero real capital on the line.
            Build your confidence, track your P&L, and learn the art of calm trading.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn-groww" style={{ padding: '18px 40px', fontSize: '18px' }} onClick={() => navigate('/signup')}>
              Get Started for Free
            </button>
            <button 
              style={{
                padding: '18px 40px', fontSize: '18px', borderRadius: '8px',
                background: 'var(--groww-surface)', color: 'var(--groww-text)', fontWeight: '600',
                border: '1px solid var(--groww-border)', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}
              onClick={() => {
                document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </button>
          </motion.div>

        </motion.div>
      </section>

      {/* Spacer to allow scrolling through the 3D scene without overlapping text instantly */}
      <div style={{ height: '30vh', position: 'relative', zIndex: 10, pointerEvents: 'none' }} />

      {/* Features Section */}
      <section id="features" style={{
        position: 'relative',
        zIndex: 10,
        background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '120px 40px',
        borderTop: '1px solid var(--groww-border)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '16px' }}>
              Built for <span style={{ color: 'var(--groww-teal)' }}>learning</span>
            </h2>
            <p style={{ fontSize: '20px', color: 'var(--groww-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              A pristine simulation engine designed to replace fear with knowledge. Use enterprise tools with fake money.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="feature-card-groww"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <div className="icon" style={{ width: '64px', height: '64px', fontSize: '32px', borderRadius: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ color: 'var(--groww-text-muted)', lineHeight: '1.6', fontSize: '16px' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" style={{
        position: 'relative',
        zIndex: 10,
        background: 'var(--groww-bg)',
        padding: '120px 40px',
        borderTop: '1px solid var(--groww-border)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '16px' }}>
              How it works
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {STEPS.map((step, i) => (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '32px',
                  background: 'var(--groww-surface)',
                  padding: '40px',
                  borderRadius: '24px',
                  border: '1px solid var(--groww-border)'
                }}
              >
                <div style={{
                  fontSize: '48px',
                  fontWeight: '800',
                  color: 'var(--groww-teal)',
                  opacity: 0.2,
                  lineHeight: '1'
                }}>
                  {step.num}
                </div>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: 'var(--groww-text)' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--groww-text-muted)', fontSize: '18px', lineHeight: '1.6' }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        background: 'var(--groww-surface)',
        padding: '100px 40px',
        textAlign: 'center',
      }}>
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           style={{
             background: 'var(--groww-bg)',
             maxWidth: '900px',
             margin: '0 auto',
             padding: '80px 40px',
             borderRadius: '32px',
             boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
             border: '1px solid var(--groww-border)'
           }}
        >
          <h2 style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '24px' }}>
            Ready to make your first trade?
          </h2>
          <p style={{ fontSize: '20px', color: 'var(--groww-text-muted)', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' }}>
            Join simulated traders analyzing the market, executing orders, and building a wealthy future without the risk.
          </p>
          <button className="btn-groww" style={{ padding: '20px 48px', fontSize: '18px', borderRadius: '12px' }} onClick={() => navigate('/signup')}>
            Create Account Instantly
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        background: '#0f172a', /* deep slate for pure contrast on footer */
        padding: '60px 40px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Logo width="32" height="32" />
            <span style={{ fontWeight: '700', fontSize: '20px', color: 'white', letterSpacing: '-0.02em' }}>SimVesto</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '40px' }}>
            Built for education. No real money involved. Practice responsibly.
          </p>
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '32px' }} />
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            © 2026 SimVesto. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
