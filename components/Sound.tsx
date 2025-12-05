'use client';

import React, { useEffect, useState } from 'react';

interface SoundProps {
  className?: string;
  style?: React.CSSProperties;
  onToggle?: () => void;
  isEnabled?: boolean;
}

export default function Sound({ 
  className = '', 
  style,
  onToggle,
  isEnabled = true
}: SoundProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show sound component after hero text animation completes
    // Nav duration (1.2s) + Hero delay (1.5s) + Hero duration (1.2s) + buffer = 4.4s
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2700); // 2.7s delay to appear after hero text animation

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`sound-container ${className}`}
      style={{
        ...style,
        position: 'fixed',
        top: '93vh',
        left: '6vw',
        transform: 'translate(-50%, -50%)',
        zIndex: 999999999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s ease-out',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={onToggle}
    >
      {/* SOUND Text */}
      <span 
        style={{
          fontFamily: 'Be Vietnam, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 400,
          color: 'white',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}
      >
        SOUND
      </span>
      
      {/* Sound Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Filled Circle */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isEnabled ? 'white' : 'transparent',
            border: '1px solid white',
            transition: 'background-color 0.3s ease'
          }}
        />
        
        {/* Outline Circle */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: '1px solid white',
            opacity: isEnabled ? 1 : 0.5,
            transition: 'opacity 0.3s ease'
          }}
        />
        
        {/* Third Circle - Fully #242424 */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#242424',
            border: 'none',
          }}
        />
      </div>
    </div>
  );
}