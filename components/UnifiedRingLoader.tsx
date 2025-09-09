// Pure CSS/SVG loader replacing Three.js implementation for simpler layering.
// This file contains a single, self-contained implementation (no debug DOM or Three.js).
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { appLoading } from '../src/lib/three/loadingManager';
import '../src/styles/ring-loader.css';

interface UnifiedRingLoaderProps {
  onContentShow?: () => void;
  onTransitionComplete?: () => void;
}

// Development flag: when true the loader stays centered until PermanentRing takes over
// Set to false for normal behavior.
const KEEP_VISIBLE_ALWAYS = false;

export default function UnifiedRingLoader({ onContentShow, onTransitionComplete }: UnifiedRingLoaderProps) {
  const [progress, setProgress] = useState<number>(typeof appLoading !== 'undefined' ? appLoading.ratio : 0);
  const [contentShown, setContentShown] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const contentNotifiedRef = useRef(false);

  // Poll appLoading.ratio on animation frames. This is simple and avoids
  // coupling to any custom event emitter.
  useEffect(() => {
    let mounted = true;

    // Stop pulsing and start loading after initial pulse animation
    const pulseTimer = setTimeout(() => {
      if (mounted) setIsPulsing(false);
    }, 2000);

    const frame = () => {
      if (!mounted) return;
      const r = typeof appLoading !== 'undefined' ? appLoading.ratio : 0;
      setProgress(r);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      clearTimeout(pulseTimer);
    };
  }, []);

  // When progress reaches 1.0, notify that content can be shown and optionally
  // schedule the final transition complete callback. We debounce to allow
  // the rest of the page to render first.
  useEffect(() => {
    if (progress >= 1 && !contentNotifiedRef.current) {
      contentNotifiedRef.current = true;
      // small delay so layout can settle
      timeoutRef.current = window.setTimeout(() => {
        setContentShown(true);
        if (onContentShow) onContentShow();

        // Trigger transition complete immediately with content so PermanentRing shows right away
        if (onTransitionComplete) onTransitionComplete();
        // Hide the unified ring after triggering transition so PermanentRing takes over
        setShouldHide(true);
      }, 600);
    }
  }, [progress, onContentShow, onTransitionComplete]);

  const finalRadius = 120; // Final ring radius for normal state
  const initialRadius = 160; // Larger initial radius during pulse phase
  
  // Get current radius based on pulsing state
  const getCurrentRadius = () => {
    return isPulsing ? initialRadius : finalRadius;
  };
  
  const radius = getCurrentRadius();
  
  // Three distinct visual states based on progress
  // Stage 1 (0-0.4): Extremely blurry, massive soft ring with huge shadows
  // Stage 2 (0.4-0.8): Medium blur, more defined
  // Stage 3 (0.8-1.0): Sharp, fully defined ring
  const getBlurAmount = (progress: number) => {
    // If still pulsing, show maximum blur with breathing effect
    if (isPulsing) {
      return 200; // Even more expanded initial blur
    }
    
    if (progress < 0.4) {
      // Stage 1: Massive initial blur (180px blur reducing to 80px)
      return 180 - (progress / 0.4) * 100;
    } else if (progress < 0.8) {
      // Stage 2: Medium blur (80px reducing to 25px)
      return 80 - ((progress - 0.4) / 0.4) * 55;
    } else {
      // Stage 3: Sharp definition (25px reducing to 0px)
      return 25 - ((progress - 0.8) / 0.2) * 25;
    }
  };
  
  const blurPx = getBlurAmount(Math.min(Math.max(progress, 0), 1));
  
  // Dynamic viewBox - keep it fixed so ring doesn't shrink visually
  const viewBoxSize = 800; // Fixed viewBox size
  const centerPoint = viewBoxSize / 2;

  return (
    <div 
      className={`ring-loader-overlay ${contentShown ? 'ring-overlay-transparent' : ''}`} 
      aria-label="Loading" 
      role="status"
      style={{ opacity: shouldHide ? 0 : 1, transition: 'opacity 500ms ease' }}
    >
      <div className="ring-center">
        <svg 
          className="ring-svg" 
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} 
          aria-hidden
          style={{ background: 'transparent' }}
        >
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1.0" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1.0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1.0" />
            </linearGradient>
          </defs>

          {/* Main ring - complete circle, with initial pulse animation */}
          <circle
            cx={centerPoint}
            cy={centerPoint}
            r={radius}
            strokeWidth="32"
            stroke="url(#ringGrad)"
            fill="none"
            className="ring-progress"
            style={{ 
              filter: `blur(${blurPx}px)`, 
              transition: isPulsing ? 'none' : 'filter 800ms cubic-bezier(0.4, 0, 0.2, 1), r 800ms cubic-bezier(0.4, 0, 0.2, 1)',
              animation: isPulsing ? 'ringPulse 2s ease-in-out infinite' : 'none'
            }}
          />

          {/* Subtle inner glow for depth */}
          <circle 
            cx={centerPoint} 
            cy={centerPoint} 
            r={radius - 16} 
            strokeWidth="8" 
            stroke="url(#ringGrad)" 
            strokeOpacity="0.3" 
            fill="none"
            style={{ 
              filter: `blur(${Math.max(blurPx - 10, 0)}px)`, 
              transition: isPulsing ? 'none' : 'filter 800ms cubic-bezier(0.4, 0, 0.2, 1), r 800ms cubic-bezier(0.4, 0, 0.2, 1)',
              animation: isPulsing ? 'ringPulse 2s ease-in-out infinite 0.3s' : 'none'
            }}
          />
        </svg>
      </div>
    </div>
  );
}
