'use client';

import { useState, useEffect } from 'react';

interface PermanentRingProps {
  visible: boolean;
  className?: string;
}

export default function PermanentRing({ visible, className = '' }: PermanentRingProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasTransitioned, setHasTransitioned] = useState(false);

  useEffect(() => {
    if (visible && !hasTransitioned) {
      // Start transition after a brief delay
      const timer = setTimeout(() => {
        setIsTransitioning(true);
      }, 100);

      // Complete transition after animation duration
      const completeTimer = setTimeout(() => {
        setHasTransitioned(true);
      }, 1600); // 1.5s animation + 100ms buffer

      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [visible, hasTransitioned]);

  if (!visible) return null;

  // Initial state (center, exactly matching unified ring final state)
  const initialStyle = {
    position: 'absolute' as const,
    top: '50vh',
    left: '50vw',
    width: '276px',
    height: '276px',
    border: '26px solid rgba(255, 255, 255, 1)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'all 1.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
    opacity: 1,
    boxSizing: 'border-box' as const,
    filter: 'none',
    boxShadow: 'none'
  };

  // Final state (corner, small)
  const finalStyle = {
    position: 'absolute' as const,
    top: '20px',
    left: '35px',
    width: '30px',
    height: '30px',
    border: '3px solid white',
    borderRadius: '50%',
    transform: 'none',
    transition: 'all 1.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
    opacity: 1,
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
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      <div 
        className={`permanent-ring ${visible ? 'visible' : ''}`}
        style={isTransitioning ? finalStyle : initialStyle}
      />
    </div>
  );
}
