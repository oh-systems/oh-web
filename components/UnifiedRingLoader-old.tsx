"use client";

import React, { useEffect, useState, useRef } from "react";

interface UnifiedRingLoaderProps {
  onContentShow?: () => void;
  onTransitionComplete?: () => void;
  onCenterComplete?: () => void;
  moveToCorner?: boolean;
  onCornerComplete?: () => void;
  loadingProgress?: number; // 0 to 1
  isLoadingComplete?: boolean;
}

export default function UnifiedRingLoader({
  onContentShow,
  onTransitionComplete,
  onCenterComplete,
  moveToCorner = false,
  onCornerComplete,
  loadingProgress = 0,
  isLoadingComplete = false,
}: UnifiedRingLoaderProps) {
  const [pulseProgress, setPulseProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [fadeProgress, setFadeProgress] = useState(0);
  const [finalTransitionProgress, setFinalTransitionProgress] = useState(0);

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

  // Pulsing animation while loading
  useEffect(() => {
    if (isLoadingComplete) return; // Stop pulsing when loading is complete

    let animationId: number;
    const startTime = performance.now();
    const pulseDuration = 3000; // 3 second pulse cycle (in and out)

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const cycleProgress = (elapsed % pulseDuration) / pulseDuration;

      // Create smooth back-and-forth motion using sine wave
      const pulseValue = Math.sin(cycleProgress * Math.PI * 2) * 0.5 + 0.5;
      setPulseProgress(pulseValue);

      // Fade in during first second
      const fadeValue = Math.min(elapsed / 1000, 1);
      setFadeProgress(fadeValue);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isLoadingComplete]);

  // Final transition animation when loading completes
  useEffect(() => {
    if (!isLoadingComplete) return;

    let animationId: number;
    const startTime = performance.now();
    const transitionDuration = 2000; // 2 seconds to settle into final position

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);

      // Ease out cubic for smooth settling
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setFinalTransitionProgress(easedProgress);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Animation complete - ring is now sharp and centered
        setIsComplete(true);
        if (onCenterCompleteRef.current) onCenterCompleteRef.current();
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isLoadingComplete]);

  useEffect(() => {
    if (moveToCorner && isComplete) {
      setTimeout(() => {
        if (onCornerCompleteRef.current) onCornerCompleteRef.current();
      }, 3000);
    }
  }, [moveToCorner, isComplete]);

  // Calculate ring properties based on current state
  const getRingProperties = () => {
    if (moveToCorner && isComplete) {
      // Moving to corner - final state
      return {
        size: 30,
        blur: 0,
        borderWidth: 3,
        opacity: 1,
        position: { left: "50px", top: "16px" },
        transform: "translate(0, 0)",
        transition: "all 3s cubic-bezier(0.4, 0.0, 0.2, 1)",
      };
    }

    if (isLoadingComplete) {
      // Loading complete - settle into final sharp state
      // Transition from 600px to 210px (final centered size)
      const size = 600 - finalTransitionProgress * 400; // 600px -> 210px
      const blur = 60 * (1 - finalTransitionProgress); // 60px -> 0px
      const borderWidth = 56 - finalTransitionProgress * 30; // 56px -> 20px

      return {
        size,
        blur,
        borderWidth,
        opacity: fadeProgress,
        position: { left: "50vw", top: "50vh" },
        transform: `translate(-50%, -50%)`,
        transition: "none",
      };
    }

    // Pulsing state while loading
    // Pulse between blurry (60px) and sharp (20px blur)
    const minBlur = 35;
    const maxBlur = 55;
    const blur = minBlur + (maxBlur - minBlur) * (1 - pulseProgress);

    // Very subtle size pulse (590px to 600px)
    const minSize = 590;
    const maxSize = 600;
    const size = minSize + (maxSize - minSize) * pulseProgress;

    return {
      size,
      blur,
      borderWidth: 56,
      opacity: fadeProgress * 0.9,
      position: { left: "50vw", top: "50vh" },
      transform: `translate(-50%, -50%)`,
      transition: "none",
    };
  };

  const ringProps = getRingProperties();

  // Calculate glow intensity based on state
  const gradientOpacity = isLoadingComplete
    ? (1 - finalTransitionProgress) * 0.8
    : (1 - pulseProgress * 0.3) * 0.8;

  return (
    <div className={`unified-ring-container ${isComplete ? "completed" : ""}`}>
      {/* Ring with pulsing animation */}
      <div
        className="unified-ring"
        style={{
          width: `${ringProps.size}px`,
          height: `${ringProps.size}px`,
          position: "absolute",
          left: ringProps.position.left,
          top: ringProps.position.top,
          transform: ringProps.transform,
          filter: ringProps.blur > 0 ? `blur(${ringProps.blur}px)` : "none",
          opacity: ringProps.opacity,
          border:
            moveToCorner && isComplete
              ? `${ringProps.borderWidth}px solid white`
              : `${ringProps.borderWidth}px solid rgba(255, 255, 255, 1)`,
          transition: ringProps.transition,
          boxShadow:
            finalTransitionProgress >= 0.95 || (moveToCorner && isComplete)
              ? "none"
              : `
              0 0 180px 60px rgba(255, 255, 255, ${gradientOpacity * 0.4}),
              0 0 360px 120px rgba(255, 255, 255, ${gradientOpacity * 0.2})
            `,
          willChange: isLoadingComplete ? 'auto' : 'transform, filter, opacity, width, height, border-width',
          backfaceVisibility: 'hidden' as const,
          perspective: 1000,
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
          transform: translateZ(0);
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
          transform-origin: center center;
          transform: translateZ(0);
        }
      `}</style>
    </div>
  );
}
