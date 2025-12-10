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

  // Simple fade in effect
  useEffect(() => {
    const timer = setTimeout(() => setFadeProgress(1), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle loading complete
  useEffect(() => {
    if (isLoadingComplete) {
      const timer = setTimeout(() => {
        setIsComplete(true);
        if (onCenterCompleteRef.current) onCenterCompleteRef.current();
      }, 2000); // 2 second transition
      return () => clearTimeout(timer);
    }
  }, [isLoadingComplete]);

  // Handle move to corner
  useEffect(() => {
    if (moveToCorner && isComplete) {
      setTimeout(() => {
        if (onCornerCompleteRef.current) onCornerCompleteRef.current();
      }, 3000);
    }
  }, [moveToCorner, isComplete]);

  return (
    <div className={`unified-ring-container ${isComplete ? "completed" : ""}`}>
      {/* Ring with CSS animation for pulsing */}
      <div
        className={`unified-ring ${!isLoadingComplete ? 'pulsing' : 'settling'} ${moveToCorner && isComplete ? 'moving-corner' : ''}`}
        style={{
          opacity: fadeProgress,
        }}
      />
      
      {/* Loading text with percentage */}
      {!isLoadingComplete && (
        <div className="loading-text" style={{ opacity: fadeProgress }}>
          LOADING EXPERIENCE: {Math.round(loadingProgress * 100)}%
        </div>
      )}

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
        }

        .unified-ring-container.completed {
          background-color: transparent;
        }

        .unified-ring {
          position: absolute;
          left: 50vw;
          top: 50vh;
          width: 600px;
          height: 600px;
          border: 56px solid white;
          border-radius: 50%;
          background: transparent;
          transform: translate(-50%, -50%);
          transition: opacity 1s ease;
        }

        /* Mobile: Start with much smaller ring */
        @media (max-width: 768px) {
          .unified-ring {
            width: 200px;
            height: 200px;
            border: 20px solid white;
          }
        }

        /* Pulsing animation using CSS - much more performant */
        .unified-ring.pulsing {
          animation: pulse 3s ease-in-out infinite;
        }

        /* Settling animation when loading completes */
        .unified-ring.settling {
          animation: settle 2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          animation-fill-mode: forwards;
        }

        /* Moving to corner - starts from settled size and transitions over 3s */
        .unified-ring.moving-corner {
          animation: moveToCorner 3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        @keyframes pulse {
          0%, 100% {
            filter: blur(55px);
            transform: translate(-50%, -50%) scale(0.98);
          }
          50% {
            filter: blur(35px);
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes settle {
          from {
            width: 600px;
            height: 600px;
            border-width: 56px;
            filter: blur(45px);
          }
          to {
            width: 280px;
            height: 280px;
            border-width: 30px;
            filter: blur(0px);
          }
        }

        /* Mobile settle animation */
        @media (max-width: 768px) {
          @keyframes settle {
            from {
              width: 200px;
              height: 200px;
              border-width: 20px;
              filter: blur(35px);
            }
            to {
              width: 120px;
              height: 120px;
              border-width: 12px;
              filter: blur(0px);
            }
          }
        }

        @keyframes moveToCorner {
          from {
            width: 280px;
            height: 280px;
            border-width: 30px;
            left: 50vw;
            top: 50vh;
            transform: translate(-50%, -50%);
            filter: blur(0px);
          }
          to {
            width: 30px;
            height: 30px;
            border-width: 3px;
            left: 50px;
            top: 16px;
            transform: translate(0, 0);
            filter: blur(0px);
          }
        }

        /* Mobile move to corner animation */
        @media (max-width: 768px) {
          @keyframes moveToCorner {
            from {
              width: 120px;
              height: 120px;
              border-width: 12px;
              left: 50vw;
              top: 50vh;
              transform: translate(-50%, -50%);
              filter: blur(0px);
            }
            to {
              width: 24px;
              height: 24px;
              border-width: 2.5px;
              left: 20px;
              top: 16px;
              transform: translate(0, 0);
              filter: blur(0px);
            }
          }
        }

        .loading-text {
          position: absolute;
          left: 50vw;
          top: calc(50vh + 400px);
          transform: translateX(-50%);
          color: white;
          font-size: 18px;
          font-weight: 300;
          letter-spacing: 0.1em;
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* Mobile loading text positioning */
        @media (max-width: 768px) {
          .loading-text {
            top: calc(50vh + 150px);
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
