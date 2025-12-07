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
  const hasInteractedRef = useRef(false);

  // Initialize sound mode from localStorage, defaulting to 'all'
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('soundMode') as SoundMode;
      if (savedMode && ['all', 'effects', 'none'].includes(savedMode)) {
        setSoundMode(savedMode);
      } else {
        // Set default to 'all' and save it
        setSoundMode('all');
        localStorage.setItem('soundMode', 'all');
      }
    }
  }, []);

  // Set up a one-time listener for any user interaction to enable audio
  useEffect(() => {
    const enableAudio = () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        // Try to start ambient audio if mode is 'all'
        if (soundMode === 'all' && ambientAudioRef.current) {
          ambientAudioRef.current.play().catch(err => {
            console.log('Audio play prevented:', err);
          });
        }
      }
    };

    // Listen for first user interaction
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });

    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, [soundMode]);

  // Cycle through sound modes: all -> effects -> none -> all
  const toggleSound = () => {
    setSoundMode(prev => {
      const newMode = prev === 'all' ? 'effects' : prev === 'effects' ? 'none' : 'all';
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('soundMode', newMode);
      }
      return newMode;
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
      if (soundMode === 'all' && hasInteractedRef.current) {
        ambientAudioRef.current.play().catch(err => {
          console.log('Audio play prevented:', err);
        });
      } else {
        ambientAudioRef.current.pause();
      }
    }
  }, [soundMode]);

  // Play click sound effect
  const playClickSound = () => {
    // Play click sound for effects and all modes
    if (soundMode === 'all' || soundMode === 'effects') {
      const clickAudio = new Audio('/sounds/click.wav');
      clickAudio.volume = 0.5; // 50% volume for click
      clickAudio.play().catch(err => {
        console.log('Click sound prevented:', err);
      });
    }
  };

  // Handle clicking on a specific mode
  const handleModeClick = (mode: SoundMode, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only change if clicking a different mode
    if (mode !== soundMode) {
      playClickSound();
      setSoundMode(mode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('soundMode', mode);
      }
    }
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
        userSelect: 'none',
      }}
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
          onClick={(e) => handleModeClick('all', e)}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: soundMode === 'all' ? 'white' : 'transparent',
            border: '1px solid white',
            transition: 'background-color 0.3s ease',
            cursor: 'pointer'
          }}
        />
        
        {/* Middle Circle - Effects only */}
        <div
          onClick={(e) => handleModeClick('effects', e)}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: soundMode === 'effects' ? 'white' : 'transparent',
            border: '1px solid white',
            transition: 'background-color 0.3s ease',
            cursor: 'pointer'
          }}
        />
        
        {/* Right Circle - No sound */}
        <div
          onClick={(e) => handleModeClick('none', e)}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: soundMode === 'none' ? 'white' : 'transparent',
            border: '1px solid white',
            transition: 'background-color 0.3s ease',
            cursor: 'pointer'
          }}
        />
      </div>
    </div>
  );
}