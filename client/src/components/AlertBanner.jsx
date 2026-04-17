import React, { useEffect, useState } from 'react';

export function AlertBanner({ active }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      background: '#A32D2D', color: 'white', textAlign: 'center',
      padding: '1rem', fontSize: '18px', fontWeight: 500,
      animation: 'pulse 0.5s ease-in-out infinite alternate'
    }}>
      ⚠ DROWSINESS DETECTED — Pull over safely
    </div>
  );
}
