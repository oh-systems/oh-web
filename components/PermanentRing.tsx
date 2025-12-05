'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '../src/app/AppContent';

interface PermanentRingProps {
  visible: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function PermanentRing({ visible, className = '', style }: PermanentRingProps) {
  const [hasTransitioned, setHasTransitioned] = useState(false);
  const {} = useAppContext();

  useEffect(() => {
    if (visible && !hasTransitioned) {
      // Complete transition after a short duration for state management
      const completeTimer = setTimeout(() => {
        setHasTransitioned(true);
      }, 100);

      return () => {
        clearTimeout(completeTimer);
      };
    }
  }, [visible, hasTransitioned]);

  if (!visible) return null;

  // Ring style - starts in corner position, stays visible once it appears
  const ringStyle = {
    position: 'absolute' as const,
    top: '16px', // Align with navigation (top-4)
    left: '50px',
    width: '30px',
    height: '30px',
    border: '3px solid white',
    borderRadius: '50%',
    transform: `translateY(0px) scale(1)`, // Keep ring in fixed position and size
    transition: hasTransitioned ? 'none' : 'all 0.3s ease',
    opacity: 1, // Always visible once component is shown
    boxSizing: 'border-box' as const
  };

  return (
    <div 
      className={`permanent-ring-container ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Never block pointer events - this is just visual
        zIndex: 100, // Much lower than navigation
        ...style
      }}
    >
      <div 
        className={`permanent-ring ${visible ? 'visible' : ''}`}
        style={ringStyle}
      />
    </div>
  );
}
