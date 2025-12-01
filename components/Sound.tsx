'use client';

import React from 'react';

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
      </div>
    </div>
  );
}