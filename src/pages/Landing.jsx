import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [0.4, 0, 0.2, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const FEATURES = [
  { icon: '🪙', title: 'Virtual Capital', desc: 'Start with 100,000 Coins and practice in a zero-risk environment.' },
  { icon: '📊', title: 'Clear P&L', desc: 'See realized and unrealized profit or loss update after every trade.' },
  { icon: '📋', title: 'Transaction Ledger', desc: 'Trace every buy and sell with timestamps, balances, and trade outcome.' },
  { icon: '🤖', title: 'Fear-Aware AI', desc: 'Use guidance that helps users build confidence before trading for real.' },
];

function Bird({ index, radius, speed, height, phase, tint }) {
  const groupRef = useRef(null);
  const wingLeftRef = useRef(null);
  const wingRightRef = useRef(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime * speed + phase;
    const x = Math.cos(time) * radius;
    const z = Math.sin(time * 0.8) * radius * 0.28 - 2.2;
    const y = Math.sin(time * 1.2) * height + Math.cos(time * 0.5) * 0.12;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      groupRef.current.rotation.y = -time + Math.PI / 2;
      groupRef.current.rotation.z = Math.sin(time * 2.2) * 0.08;
    }

    const flap = Math.sin(time * 8) * 0.35;
    if (wingLeftRef.current) {
      wingLeftRef.current.rotation.z = -0.5 - flap;
    }
    if (wingRightRef.current) {
      wingRightRef.current.rotation.z = 0.5 + flap;
    }
  });

  const bodyColor = new THREE.Color(tint);
  const wingColor = bodyColor.clone().lerp(new THREE.Color('#d1f1ff'), 0.42);

  return (
    <group ref={groupRef} scale={0.34 + index * 0.008}>
      <mesh>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.35} metalness={0.55} emissive={bodyColor} emissiveIntensity={0.12} />
      </mesh>
      <mesh ref={wingLeftRef} position={[-0.28, 0.02, 0]} rotation={[0, 0, -0.8]}>
        <boxGeometry args={[0.58, 0.06, 0.28]} />
        <meshStandardMaterial color={wingColor} roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh ref={wingRightRef} position={[0.28, 0.02, 0]} rotation={[0, 0, 0.8]}>
        <boxGeometry args={[0.58, 0.06, 0.28]} />
        <meshStandardMaterial color={wingColor} roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, -0.02, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.28, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

function BirdFlock() {
  const birds = useMemo(() => {
    return [
      ['#194c98', 5.2, 0.8, 1.1, 0.2],
      ['#3d7dca', 4.5, 0.7, 0.95, 1.7],
      ['#4ea2d9', 6.1, 0.55, 1.2, 2.8],
      ['#2f6fb6', 3.8, 0.9, 0.8, 0.5],
      ['#74b8e3', 5.9, 0.6, 1.0, 3.9],
      ['#5f9dd6', 4.1, 0.75, 0.85, 1.1],
      ['#2b5ea4', 6.5, 0.65, 1.15, 2.2],
      ['#d1f1ff', 3.4, 0.95, 0.75, 4.3],
    ].map(([tint, radius, speed, height, phase], index) => ({ tint, radius, speed, height, phase, index }));
  }, []);

  return (
    <>
      {birds.map((bird) => (
        <Bird key={bird.index} {...bird} />
      ))}
    </>
  );
}

function CursorBloom() {
  const bloomRef = useRef(null);

  useFrame((state) => {
    if (!bloomRef.current) return;
    const targetX = state.mouse.x * 3.2;
    const targetY = state.mouse.y * 1.8;
    bloomRef.current.position.x = THREE.MathUtils.lerp(bloomRef.current.position.x, targetX, 0.08);
    bloomRef.current.position.y = THREE.MathUtils.lerp(bloomRef.current.position.y, targetY, 0.08);
    bloomRef.current.scale.x = bloomRef.current.scale.y = bloomRef.current.scale.z = 1 + Math.abs(state.mouse.x) * 0.4 + Math.abs(state.mouse.y) * 0.2;
  });

  return (
    <mesh ref={bloomRef} position={[0, 0, -0.8]}>
      <sphereGeometry args={[0.9, 24, 24]} />
      <meshBasicMaterial color="#194c98" transparent opacity={0.14} />
    </mesh>
  );
}

function MarketRibbon() {
  const ribbonRef = useRef(null);
  const points = useMemo(() => {
    const curvePoints = [];
    for (let i = 0; i < 28; i += 1) {
      const t = i / 27;
      curvePoints.push(new THREE.Vector3((t - 0.5) * 10, Math.sin(t * Math.PI * 2.8) * 0.45 + Math.cos(t * 1.1) * 0.22, -3.2 + t * 0.8));
    }
    return curvePoints;
  }, []);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  useFrame((state) => {
    if (!ribbonRef.current) return;
    ribbonRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.18;
    ribbonRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
  });

  return (
    <group ref={ribbonRef}>
      <line geometry={geometry}>
        <lineBasicMaterial color="#d1f1ff" transparent opacity={0.35} />
      </line>
    </group>
  );
}

function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 8]} intensity={1.15} color="#ffffff" />
      <pointLight position={[-8, -4, 6]} intensity={1.2} color="#194c98" />
      <pointLight position={[8, 3, 6]} intensity={0.8} color="#d1f1ff" />
      <fog attach="fog" args={['#081a34', 6, 18]} />
      <BirdFlock />
      <CursorBloom />
      <MarketRibbon />
    </>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, #0a2242 0%, #12376a 52%, #091b35 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top, rgba(209, 241, 255, 0.16), transparent 42%), linear-gradient(180deg, rgba(9, 27, 53, 0.12), rgba(9, 27, 53, 0.84))' }} />
        <Canvas
          camera={{ position: [0, 0, 8], fov: 52 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <HeroScene />
        </Canvas>
      </div>

      <nav className="landing-nav glass-nav">
        <div className="glass-highlight"></div>

        <div className="landing-nav-brand">
          <div className="landing-nav-brand-icon">SV</div>
          <span>SimVesto</span>
        </div>

        <div className="landing-nav-links">
          <a href="#features">Features</a>
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

      <section className="landing-hero" style={{ minHeight: '88vh' }}>
        <div style={{
          position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, var(--bg-primary) 100%)', zIndex: 5,
        }} />

        <motion.div className="landing-hero-content" initial="initial" animate="animate" variants={stagger}>
          <motion.div className="landing-badge" variants={fadeUp}>
            AI-powered trading practice
          </motion.div>

          <motion.h1 className="landing-title" variants={fadeUp}>
            Trade Without <em>Fear</em>
          </motion.h1>

          <motion.p className="landing-subtitle" variants={fadeUp}>
            Practice trading with Coins in a realistic market, track your P&L clearly, and build confidence before you ever risk real capital.
          </motion.p>

          <motion.div className="landing-cta-row" variants={fadeUp}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}
              style={{ background: 'linear-gradient(135deg, #194c98, #3d7dca)', fontSize: '16px' }}>
              Start Trading Free →
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
              I have an account
            </button>
          </motion.div>

          <motion.div className="landing-stats" variants={fadeUp}>
            <div className="landing-stat">
              <div className="landing-stat-num">1,00,000</div>
              <div className="landing-stat-label">Starting Coins</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">20</div>
              <div className="landing-stat-label">Simulated Stocks</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">₹0</div>
              <div className="landing-stat-label">Real Money</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="landing-section" id="features">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="landing-section-label">Platform Features</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
            Built to help users learn<br /><em style={{ fontStyle: 'italic', color: 'var(--accent-purple)' }}>calm trading</em>
          </h2>
          <p>A focused simulation built to make practice clear, calm, and trustworthy.</p>
        </motion.div>

        <div className="features-grid-landing">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} className="feature-card-landing"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}>
              <div className="feature-card-icon" style={{ background: 'rgba(124, 58, 237, 0.12)', fontSize: '24px' }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="start" style={{
        textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingBottom: '100px'
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '36px', marginBottom: '16px' }}>
            Ready to practice with <em style={{ fontStyle: 'italic', color: 'var(--accent-purple)' }}>zero real risk</em>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 32px', fontSize: '16px' }}>
            Join the simulation, learn how your decisions affect balance, and build confidence one trade at a time.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}
            style={{ background: 'linear-gradient(135deg, #194c98, #3d7dca)', fontSize: '16px' }}>
            Create Free Account →
          </button>
        </motion.div>
      </section>

      <footer style={{
        borderTop: '1px solid var(--border-subtle)', padding: '32px',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <div className="landing-nav-brand-icon" style={{ width: '24px', height: '24px', fontSize: '10px', borderRadius: '6px' }}>SV</div>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>SimVesto</span>
        </div>
        Built for learning. No real money. No real risk. © 2026
      </footer>
    </div>
  );
}
