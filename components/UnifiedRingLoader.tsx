'use client';

import React, { useEffect, useState, useRef } from 'react';

interface UnifiedRingLoaderProps {
  onContentShow?: () => void;
  onTransitionComplete?: () => void;
  onCenterComplete?: () => void;
  moveToCorner?: boolean;
  onCornerComplete?: () => void;
}

export default function UnifiedRingLoader({ 
  onContentShow, 
  onTransitionComplete, 
  onCenterComplete,
  moveToCorner = false,
  onCornerComplete 
}: UnifiedRingLoaderProps) {
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [fadeProgress, setFadeProgress] = useState(0);
  
  // Use refs to store callbacks and prevent re-running the effect
  const onContentShowRef = useRef(onContentShow);
  const onTransitionCompleteRef = useRef(onTransitionComplete);
  const onCenterCompleteRef = useRef(onCenterComplete);
  const onCornerCompleteRef = useRef(onCornerComplete);
  
  // Update refs when callbacks change
  useEffect(() => {
    onContentShowRef.current = onContentShow;
    onTransitionCompleteRef.current = onTransitionComplete;
    onCenterCompleteRef.current = onCenterComplete;
    onCornerCompleteRef.current = onCornerComplete;
  }, [onContentShow, onTransitionComplete, onCenterComplete, onCornerComplete]);

  useEffect(() => {
    let animationId: number;
    let hasStarted = false; // Prevent double execution
    
    // Start times for different phases
    const fadeStartTime = Date.now() + 2000; // Start fade at 2s
    const morphStartTime = Date.now() + 5000; // Start morph at 5s
    const fadeDuration = 2000; // 2 second fade
    const morphDuration = 5000; // 5 second morph

    const animate = () => {
      if (!hasStarted) hasStarted = true;
      
      const now = Date.now();
      
      // Phase 1: Fade in progress (2-4 seconds)
      const fadeElapsed = Math.max(0, now - fadeStartTime);
      const fadeProgressValue = Math.min(fadeElapsed / fadeDuration, 1);
      setFadeProgress(fadeProgressValue);
      
      // Phase 2: Morph progress (5-10 seconds)
      const morphElapsed = Math.max(0, now - morphStartTime);
      const morphProgressValue = Math.min(morphElapsed / morphDuration, 1);
      const easedMorphProgress = 1 - Math.pow(1 - morphProgressValue, 3);
      setTransitionProgress(easedMorphProgress);

      if (morphProgressValue < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Animation complete - ring is now in center, ready for initial load
        setIsComplete(true);
        if (onCenterCompleteRef.current) onCenterCompleteRef.current();
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  useEffect(() => {
    if (moveToCorner && isComplete) {
      setTimeout(() => {
        if (onCornerCompleteRef.current) onCornerCompleteRef.current();
      }, 3000);
    }
  }, [moveToCorner, isComplete]);

  // Calculate position and size based on whether moving to corner
  const getTransformStyle = () => {
    if (!moveToCorner || !isComplete) {
      // Stay in center
      return {
        position: 'absolute' as const,
        left: '50vw',
        top: '50vh',
        transform: `translate(-50%, -50%) scale(${scale})`
      };
    }
    
    // Transitioning to corner
    return {
      position: 'absolute' as const,
      left: '50px', // Final corner position
      top: '35px',
      width: '30px',
      height: '30px',
      transform: 'translate(0, 0)',
      transition: 'all 3s cubic-bezier(0.4, 0.0, 0.2, 1)',
      border: '3px solid rgba(255, 255, 255, 1)'
    };
  };

  // Interpolate all values based on progress
  const size = 600 - (transitionProgress * 324); // 600px -> 276px (smaller initial size)
  const blur = 60 * (1 - transitionProgress); // 60px -> 0px (reduced blur for performance)
  const scale = size / 600; // Calculate scale factor instead of recalculating size
  
  // Create a strong gradient background for initial state that fades as ring becomes defined
  const gradientOpacity = (1 - transitionProgress) * 0.8;
  
  // Calculate final opacity combining fade-in and transition
  const finalOpacity = fadeProgress * (0.6 + (transitionProgress * 0.4));

  // Get transform style based on current state
  const transformStyle = getTransformStyle();
  
  return (
    <div className={`unified-ring-container ${isComplete ? 'completed' : ''}`}>
      {/* Ring with gradual fade-in and morphing transition */}
      <div 
        className="unified-ring"
        style={{
          width: moveToCorner && isComplete ? '30px' : '600px', // Dynamic size
          height: moveToCorner && isComplete ? '30px' : '600px',
          ...transformStyle,
          filter: blur > 0 ? `blur(${blur}px)` : 'none',
          opacity: finalOpacity,
          border: moveToCorner && isComplete ? '3px solid rgba(255, 255, 255, 1)' : '56px solid rgba(255, 255, 255, 1)',
          boxShadow: transitionProgress >= 0.95 || (moveToCorner && isComplete)
            ? 'none' 
            : `
              0 0 180px 60px rgba(255, 255, 255, ${gradientOpacity * 0.4}),
              0 0 360px 120px rgba(255, 255, 255, ${gradientOpacity * 0.2})
            `
        }}
      />
      
      <style jsx>{`
        .unified-ring-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: black;
          z-index: 9999;
          pointer-events: none;
          transition: background-color 1s ease;
          transform: none;
          margin: 0;
          padding: 0;
        }
        
        .unified-ring-container.completed {
          background-color: transparent;
        }
        
        .unified-ring {
          border-radius: 50%;
          background: transparent;
          z-index: 1;
          will-change: transform, filter, opacity;
          transform-origin: center center;
        }
      `}</style>
    </div>
  );
}
