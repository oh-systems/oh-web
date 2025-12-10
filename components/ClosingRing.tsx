"use client";

import React, { useEffect, useState, useRef } from "react";

interface ClosingRingProps {
  className?: string;
  style?: React.CSSProperties;
  onAnimationComplete?: () => void;
  shouldReturnToCorner?: boolean; // New prop to control ring position
}

export default function ClosingRing({ className = "", style, onAnimationComplete, shouldReturnToCorner = false }: ClosingRingProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isReturningToCorner, setIsReturningToCorner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  
  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (shouldReturnToCorner) {
      // Return to corner
      setIsReturningToCorner(true);
      setIsAnimating(false);
    } else {
      // Start animation after a short delay
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setIsReturningToCorner(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldReturnToCorner]);

  // Handle three states: corner start, center, and return to corner
  const getTransformStyle = () => {
    if (isReturningToCorner) {
      // Returning to corner position (permanent ring size)
      return {
        position: 'absolute' as const,
        left: isMobile ? '20px' : '50px', // Mobile: 20px, Desktop: 50px
        top: '16px',
        width: isMobile ? '24px' : '30px', // Mobile: 24px, Desktop: 30px
        height: isMobile ? '24px' : '30px',
        border: isMobile ? '2.5px solid white' : '3px solid white', // Mobile: 2.5px, Desktop: 3px
        transform: 'translate(0, 0)',
        transition: 'all 2s cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth return transition
      };
    }
    
    if (!isAnimating) {
      // Start position: exactly like PermanentRing
      return {
        position: 'absolute' as const,
        left: isMobile ? '20px' : '50px',
        top: '16px',
        width: isMobile ? '24px' : '30px',
        height: isMobile ? '24px' : '30px',
        border: isMobile ? '2.5px solid white' : '3px solid white',
        transform: 'translate(0, 0)',
        transition: 'none',
      };
    }
    
    // Center position: exactly like UnifiedRingLoader in center
    return {
      position: 'absolute' as const,
      left: '50vw', // Center position like UnifiedRingLoader
      top: '50vh', // Center position like UnifiedRingLoader
      width: isMobile ? '120px' : '276px', // Mobile: 120px, Desktop: 276px
      height: isMobile ? '120px' : '276px',
      border: isMobile ? '12px solid rgba(255, 255, 255, 1)' : '30px solid rgba(255, 255, 255, 1)',
      transform: 'translate(-50%, -50%)', // Center like UnifiedRingLoader
      transition: 'all 3s cubic-bezier(0.4, 0.0, 0.2, 1)', // Same easing as UnifiedRingLoader corner transition
    };
  };

  const transformStyle = getTransformStyle();

  return (
    <div
      className={`closing-ring-container ${className}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "transparent",
        zIndex: 200,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        className="closing-ring"
        style={{
          ...transformStyle,
          borderRadius: "50%",
          background: "transparent",
          willChange: "transform, border",
          transformOrigin: "center center",
        }}
      />
      
      {/* Callback when animation completes */}
      {isAnimating && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
          onTransitionEnd={() => {
            if (onAnimationCompleteRef.current) {
              onAnimationCompleteRef.current();
            }
          }}
        />
      )}
    </div>
  );
}