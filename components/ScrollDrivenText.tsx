'use client';

import { useEffect, useState } from 'react';

type TextAlign = 'left' | 'center' | 'right';

interface ScrollDrivenTextProps {
  heroLines: string[];
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
  textAlign?: TextAlign;
  scrollProgress: number; // 0 to 1, where 0 = no scroll, 1 = fully scrolled
  scrollThreshold?: number; // At what scroll progress (0-1) should the fade/move start
  animationDuration?: number; // How long the scroll range should be for complete animation
  stopAtMiddle?: boolean; // If true, text stops at middle of screen instead of moving to top
  lineHeightMultiplier?: number; // multiplier to compute CSS line-height and minHeight (e.g., 1.3)
}

export default function ScrollDrivenText({ 
  heroLines, 
  fontSize = 20, 
  className = "", 
  style = {}, 
  textAlign = 'left',
  scrollProgress = 0,
  scrollThreshold = 0.05, // Start animation when user starts scrolling
  animationDuration = 0.3, // Complete animation over 30% of scroll progress
  stopAtMiddle = false, // By default, move to top of screen
  lineHeightMultiplier = 0.5, // default matches previous hardcoded value
}: ScrollDrivenTextProps) {
  const [hasInitiallyAnimated, setHasInitiallyAnimated] = useState(false);

  useEffect(() => {
    // Initial slide-up animation on mount
    const timeout = setTimeout(() => setHasInitiallyAnimated(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  // Calculate scroll-driven animation progress
  const scrollAnimationProgress = Math.max(0, Math.min(1, 
    (scrollProgress - scrollThreshold) / animationDuration
  ));

  // When user is actively scrolling past threshold, disable extra margins so
  // minHeight / line-height control spacing during transforms. This prevents
  // margin from creating gaps while lines move.
  const effectiveMarginBottom = scrollProgress > scrollThreshold ? '0px' : '16px';

  // Calculate transform and opacity based on scroll progress
  const getLineTransform = (lineIndex: number) => {
    if (!hasInitiallyAnimated) {
      return 'translateY(30px)';
    }

    if (scrollProgress < scrollThreshold) {
      return 'translateY(0px)';
    }

    // Each line moves up with less aggressive stagger
    const staggerDelay = lineIndex * 0.05; // Reduce stagger for more uniform movement
    const adjustedProgress = Math.max(0, Math.min(1, 
      (scrollAnimationProgress - staggerDelay) / (1 - staggerDelay * heroLines.length * 0.1)
    ));
    
    // Adjust movement based on stopAtMiddle flag
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    let moveDistance;
    
    if (stopAtMiddle) {
      // Move up to 2/3 of screen height - from center (50%) to upper third (17% from top)
      // This requires moving up about 33% of viewport height
      moveDistance = adjustedProgress * (viewportHeight * 0.5); // Increased to 50% for more upward movement
    } else {
      // Move up to reach near top of screen (40% of viewport height)
      moveDistance = adjustedProgress * (viewportHeight * 0.4);
    }
    
    return `translateY(-${moveDistance}px)`;
  };

  const getLineOpacity = (lineIndex: number) => {
    if (!hasInitiallyAnimated) {
      return 0;
    }

    if (scrollProgress < scrollThreshold) {
      return 1;
    }

    // Smoother fade out - all lines fade together more uniformly
    const staggerDelay = lineIndex * 0.05; // Reduce stagger for more uniform fade
    const adjustedProgress = Math.max(0, Math.min(1, 
      (scrollAnimationProgress - staggerDelay) / (1 - staggerDelay * heroLines.length * 0.1)
    ));
    
    if (stopAtMiddle) {
      // For middle-stopping text, don't fade out - stay visible
      return 1;
    } else {
      // Smoother fade curve for text that goes to top
      return Math.max(0, 1 - adjustedProgress * adjustedProgress); // Quadratic fade for smoothness
    }
  };

  return (
    <div 
      className={`${className} z-40`}
      style={{
        fontFamily: "'Spartan', Helvetica, Arial, sans-serif",
        fontSize: `${fontSize}px`,
        color: 'white',
        fontWeight: 'bold',
        lineHeight: lineHeightMultiplier,
        textAlign,
        ...style,
      }}
    >
      <style>{`
        @keyframes initialSlideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      
      {heroLines.map((line: string, index: number) => (
        <div
          key={`${line}-${index}`}
          style={{
            overflow: 'visible', // Allow text to move outside bounds
            minHeight: `${fontSize * lineHeightMultiplier}px`,
            marginBottom: effectiveMarginBottom,
          }}
        >
          <p
            style={{
              margin: 0,
              padding: 0,
              lineHeight: lineHeightMultiplier,
              transform: hasInitiallyAnimated ? getLineTransform(index) : 'translateY(30px)',
              opacity: hasInitiallyAnimated ? getLineOpacity(index) : 0,
              transition: scrollProgress > scrollThreshold 
                ? 'transform 0.1s ease-out, opacity 0.2s ease-out' 
                : 'none',
              animation: hasInitiallyAnimated && scrollProgress < scrollThreshold
                ? `initialSlideUp 3.0s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.08}s both`
                : 'none',
            }}
          >
            {line}
          </p>
        </div>
      ))}
    </div>
  );
}