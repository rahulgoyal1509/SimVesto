import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// ── 3D COMPONENTS ──

function FloatingCoin({ position }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.3;
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[1, 1, 0.15, 32]} />
        <meshStandardMaterial
          color="#fbbf24"
          metalness={0.9}
          roughness={0.1}
          emissive="#f59e0b"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.01, 32]} />
        <meshStandardMaterial color="#fde68a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function GlowingSphere() {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.x = state.clock.elapsedTime * 0.1;
    ref.current.rotation.z = state.clock.elapsedTime * 0.15;
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={ref} args={[2.5, 64, 64]} position={[3, 0, -5]}>
        <MeshDistortMaterial
          color="#7c3aed"
          attach="material"
          distort={0.3}
          speed={1.5}
          roughness={0.2}
          metalness={0.8}
          opacity={0.15}
          transparent
        />
      </Sphere>
    </Float>
  );
}

function ParticleField() {
  const count = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);

  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = state.clock.elapsedTime * 0.01;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#7c3aed"
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

function ChartMesh() {
  const ref = useRef();
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 50; i++) {
      const x = (i / 50) * 8 - 4;
      const y = Math.sin(i * 0.3) * 0.8 + Math.cos(i * 0.15) * 0.4 + (i / 50) * 1.5;
      pts.push(new THREE.Vector3(x, y - 1, 0));
    }
    return pts;
  }, []);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame((state) => {
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
  });

  return (
    <group ref={ref} position={[-2, 0, -3]}>
      <line geometry={geometry}>
        <lineBasicMaterial color="#10b981" linewidth={2} opacity={0.6} transparent />
      </line>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#7c3aed" />
      <pointLight position={[-10, -10, 5]} intensity={0.5} color="#10b981" />
      <spotLight position={[0, 10, 0]} intensity={0.8} color="#fbbf24" angle={0.3} />
      <ParticleField />
      <GlowingSphere />
      <FloatingCoin position={[4, 2, -2]} />
      <FloatingCoin position={[-4, -1, -4]} />
      <ChartMesh />
      <fog attach="fog" args={['#06060a', 5, 25]} />
    </>
  );
}

// ── LANDING PAGE ──

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const FEATURES = [
  { icon: '📈', title: 'Real-Time Trading', desc: 'Experience live stock price movements with simulated markets that behave like real exchanges. Buy and sell with IQ Coins.', color: 'var(--green)' },
  { icon: '🤖', title: 'Monte Carlo AI Advisor', desc: 'Every trade gets evaluated through 1000 simulated scenarios. Know if your decision is good, average, or risky before you commit.', color: 'var(--accent-purple)' },
  { icon: '🧠', title: 'Behavioral Intelligence', desc: 'The platform silently learns from your interaction patterns to personalize suggestions and track your confidence growth.', color: 'var(--amber)' },
  { icon: '💬', title: 'AI Portfolio Narrator', desc: 'Get plain-English explanations of your portfolio performance, calibrated to your comfort level and financial literacy.', color: 'var(--blue)' },
  { icon: '🪙', title: 'IQ Coin Economy', desc: 'Start with 1,00,000 IQ Coins. Earn more through profitable trades and milestones. Lose them on bad trades — just like real money.', color: 'var(--gold)' },
  { icon: '🏆', title: 'Confidence Journey', desc: 'Watch your fear score drop as you gain experience. Unlock achievements and shareable confidence cards as you grow.', color: 'var(--green)' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* 🔥 BACKGROUND BLOBS (THIS WAS MISSING) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-purple-600/20 blur-3xl rounded-full"></div>
        <div className="absolute top-[100px] right-[-150px] w-[400px] h-[400px] bg-purple-500/10 blur-3xl rounded-full"></div>
      </div>

      {/* Nav */}
      {/* Nav */}
      <nav className="landing-nav glass-nav">
        {/* Glass highlight layer */}
        <div className="glass-highlight"></div>

        <div className="landing-nav-brand">
          <div className="landing-nav-brand-icon">IQ</div>
          <span>SimVesto</span>
        </div>

        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it Works</a>
          <a href="#start">Get Started</a>
        </div>

        <div className="landing-nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>
            Log In
          </button>

          <button
            className="btn btn-primary btn-sm glass-btn"
            onClick={() => navigate('/signup')}
          >
            Start Trading
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-bg" style={{ position: 'absolute', inset: 0 }}>
          <Canvas camera={{ position: [0, 0, 8], fov: 60 }} style={{ background: 'transparent' }}>
            <Scene />
          </Canvas>
        </div>

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px',
          background: 'linear-gradient(transparent, var(--bg-primary))', zIndex: 5,
        }} />

        <motion.div className="landing-hero-content" initial="initial" animate="animate" variants={stagger}>
          <motion.div className="landing-badge" variants={fadeUp}>
            ✨ AI-Powered Investment Simulation
          </motion.div>

          <motion.h1 className="landing-title" variants={fadeUp}>
            Trade Without <em>Fear</em>
          </motion.h1>

          <motion.p className="landing-subtitle" variants={fadeUp}>
            Practice trading with IQ Coins in a simulated market that mirrors reality.
            AI evaluates every move, builds your confidence, and prepares you to invest for real.
          </motion.p>

          <motion.div className="landing-cta-row" variants={fadeUp}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', fontSize: '16px' }}>
              Start Trading Free →
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
              I have an account
            </button>
          </motion.div>

          <motion.div className="landing-stats" variants={fadeUp}>
            <div className="landing-stat">
              <div className="landing-stat-num">1,00,000</div>
              <div className="landing-stat-label">Starting IQ Coins</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">20</div>
              <div className="landing-stat-label">Simulated Stocks</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">1,000</div>
              <div className="landing-stat-label">MC Sim Paths</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">₹0</div>
              <div className="landing-stat-label">Real Money Needed</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="landing-section" id="features">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="landing-section-label">Platform Features</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Everything you need to<br /><em style={{ fontStyle: 'italic', color: 'var(--accent-purple)' }}>learn investing</em> safely
          </h2>
          <p>A complete trading simulation that feels real, teaches what matters, and tracks your growth.</p>
        </motion.div>

        <div className="features-grid-landing">
          {FEATURES.map((f, i) => (
            <motion.div key={i} className="feature-card-landing"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}>
              <div className="feature-card-icon" style={{ background: `${f.color}15`, fontSize: '24px' }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" id="how" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="landing-section-label">How It Works</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            From zero to <em style={{ fontStyle: 'italic', color: 'var(--green)' }}>confident investor</em>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '48px' }}>
          {[
            { step: '01', title: 'Sign Up & Profile', desc: 'Answer a quick questionnaire about your investment knowledge and comfort level. Get 1,00,000 IQ Coins.' },
            { step: '02', title: 'Explore & Trade', desc: 'Browse simulated stocks with real-time prices. Buy and sell using your IQ Coins—no real money.' },
            { step: '03', title: 'Get AI Analysis', desc: 'Every trade gets Monte Carlo simulation—1000 scenarios showing if your choice is smart.' },
            { step: '04', title: 'Build Confidence', desc: 'Watch your fear score drop as you learn. Earn milestones, unlock achievements, and become ready for real investing.' },
          ].map((item, i) => (
            <motion.div key={i} className="card" style={{ position: 'relative' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 700,
                color: 'var(--accent-purple-dim)', marginBottom: '12px',
              }}>{item.step}</div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-section" id="start" style={{
        textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingBottom: '100px'
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '36px', marginBottom: '16px' }}>
            Ready to start your <em style={{ fontStyle: 'italic', color: 'var(--accent-purple)' }}>journey</em>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 32px', fontSize: '16px' }}>
            Join thousands learning to invest without risking a single rupee.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', fontSize: '16px' }}>
            Create Free Account →
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)', padding: '32px',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <div className="landing-nav-brand-icon" style={{ width: '24px', height: '24px', fontSize: '10px', borderRadius: '6px' }}>IQ</div>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>SimVesto</span>
        </div>
        Built for learning. No real money. No real risk. © 2026
      </footer>
    </div>
  );
}
