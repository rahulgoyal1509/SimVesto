import { useEffect, useRef, useState } from 'react';

export default function ParallaxBg() {
  const containerRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="parallax-bg" ref={containerRef}>
      {/* Layer 1 — Large, slow orb */}
      <div
        className="parallax-orb orb-1"
        style={{
          transform: `translate(${offset.x * 12}px, ${offset.y * 12}px)`,
        }}
      />
      {/* Layer 2 — Medium orb, faster */}
      <div
        className="parallax-orb orb-2"
        style={{
          transform: `translate(${offset.x * -20}px, ${offset.y * -18}px)`,
        }}
      />
      {/* Layer 3 — Small accent orb */}
      <div
        className="parallax-orb orb-3"
        style={{
          transform: `translate(${offset.x * 25}px, ${offset.y * 15}px)`,
        }}
      />
      {/* Grid dot pattern */}
      <div
        className="parallax-grid"
        style={{
          transform: `translate(${offset.x * 4}px, ${offset.y * 4}px)`,
        }}
      />
    </div>
  );
}
