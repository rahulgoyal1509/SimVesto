import { useEffect, useState } from 'react';

export default function AffirmationToast({ message, id }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [message, id]);

  if (!message) return null;

  return (
    <div className={`arena-affirmation ${visible ? 'show' : 'hide'}`}>
      <div className="arena-affirmation-halo" />
      <span className="arena-affirmation-icon">✨</span>
      <span className="arena-affirmation-text">{message}</span>
    </div>
  );
}
