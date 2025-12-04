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
  
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  
  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

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
        left: '50px', // PermanentRing position
        top: '16px', // PermanentRing position
        width: '30px', // PermanentRing size
        height: '30px',
        border: '3px solid white', // PermanentRing border
        transform: 'translate(0, 0)',
        transition: 'all 2s cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth return transition
      };
    }
    
    if (!isAnimating) {
      // Start position: exactly like PermanentRing (30px with 3px border)
      return {
        position: 'absolute' as const,
        left: '50px', // PermanentRing position
        top: '16px', // PermanentRing position
        width: '30px', // Exact PermanentRing size
        height: '30px',
        border: '3px solid white', // Exact PermanentRing border
        transform: 'translate(0, 0)',
        transition: 'none',
      };
    }
    
    // Center position: exactly like UnifiedRingLoader in center
    return {
      position: 'absolute' as const,
      left: '50vw', // Center position like UnifiedRingLoader
      top: '50vh', // Center position like UnifiedRingLoader
      width: '276px', // UnifiedRingLoader final size
      height: '276px',
      border: '30px solid rgba(255, 255, 255, 1)', // UnifiedRingLoader border
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