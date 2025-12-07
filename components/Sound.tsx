'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SoundProps {
  className?: string;
  style?: React.CSSProperties;
}

type SoundMode = 'all' | 'effects' | 'none';

export default function Sound({ 
  className = '', 
  style,
}: SoundProps) {
  const [soundMode, setSoundMode] = useState<SoundMode>('all');
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const effectsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cycle through sound modes: all -> effects -> none -> all
  const toggleSound = () => {
    setSoundMode(prev => {
      if (prev === 'all') return 'effects';
      if (prev === 'effects') return 'none';
      return 'all';
    });
  };

  // Handle audio playback based on mode
  useEffect(() => {
    // Initialize audio elements
    if (typeof window !== 'undefined' && !ambientAudioRef.current) {
      ambientAudioRef.current = new Audio('/sounds/ambient.mp3');
      ambientAudioRef.current.loop = true;
      ambientAudioRef.current.volume = 0.3; // 30% volume for ambient
    }

    // Control ambient audio based on mode
    if (ambientAudioRef.current) {
      if (soundMode === 'all') {
        ambientAudioRef.current.play().catch(err => {
          console.log('Audio play prevented:', err);
        });
      } else {
        ambientAudioRef.current.pause();
      }
    }
  }, [soundMode]);

  // Play click sound effect on toggle
  const handleToggle = () => {
    // Play click sound for effects and all modes
    if (soundMode === 'all' || soundMode === 'effects') {
      const clickAudio = new Audio('/sounds/click.wav');
      clickAudio.volume = 0.5; // 50% volume for click
      clickAudio.play().catch(err => {
        console.log('Click sound prevented:', err);
      });
    }
    
    toggleSound();
  };

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
      onClick={handleToggle}
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
      
      {/* Sound Indicators - Three circles showing current mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Left Circle - All sounds (ambient + effects) */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: soundMode === 'all' ? 'white' : 'transparent',
            border: '1px solid white',
            transition: 'background-color 0.3s ease'
          }}
        />
        
        {/* Middle Circle - Effects only */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: soundMode === 'effects' ? 'white' : 'transparent',
            border: '1px solid white',
            transition: 'background-color 0.3s ease'
          }}
        />
        
        {/* Right Circle - No sound */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: soundMode === 'none' ? 'white' : 'transparent',
            border: '1px solid white',
            transition: 'background-color 0.3s ease'
          }}
        />
      </div>
    </div>
  );
}