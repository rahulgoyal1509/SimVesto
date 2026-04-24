import { useMemo, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GLOSSARY_TERMS } from '../data/glossaryTerms';

function TiltCard({ children, className }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 8;
    const rotateX = ((centerY - y) / centerY) * 6;
    setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(12px)`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transition: 'transform 0.2s ease-out' }}
    >
      {children}
    </div>
  );
}

export default function Glossary() {
  const [query, setQuery] = useState('');

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter((item) => {
      const haystack = [item.term, item.meaning, item.relevance, ...(item.aliases || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.01em' }}>Market Glossary</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
          Decode market terms in simple language so you can trade with more confidence.
        </p>
      </motion.div>

      <motion.div className="card glossary-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h3 style={{ fontWeight: 800 }}>Switch on Glossary Mode in the sidebar menu</h3>
          <p>
            Once enabled, key finance words across the app get highlighted. Hover on any highlighted term for an instant explain-like-I-am-new pop-up.
          </p>
        </div>
        <div className="glossary-hero-chip">{GLOSSARY_TERMS.length} terms live</div>
      </motion.div>

      <div className="card" style={{ marginTop: '16px', marginBottom: '20px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search terms like volatility, P&L, Nifty..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div className="glossary-grid-3d">
        {filteredTerms.map((term, idx) => (
          <motion.div
            key={term.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <TiltCard className="glossary-card-3d">
              <div className="glossary-card-3d-inner">
                <div className="glossary-card-3d-header">
                  <h3>{term.term}</h3>
                  {term.aliases?.length > 0 && (
                    <span className="glossary-card-3d-alias">{term.aliases.slice(0, 2).join(' / ')}</span>
                  )}
                </div>
                <p className="glossary-card-3d-meaning">{term.meaning}</p>
                <div className="glossary-card-3d-divider" />
                <p className="glossary-card-3d-relevance">{term.relevance}</p>
                {term.quip && (
                  <>
                    <div className="glossary-card-3d-divider" />
                    <p className="glossary-card-3d-quip">"{term.quip}"</p>
                  </>
                )}
              </div>
              <div className="glossary-card-3d-shine" />
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="card" style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
          No matches found. Try a broader term.
        </div>
      )}
    </div>
  );
}
