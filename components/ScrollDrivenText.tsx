'use client';

import { useEffect, useState, useRef } from 'react';

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
  lineHeightMultiplier = 0.85, // slightly looser line spacing
}: ScrollDrivenTextProps) {
  const [hasInitiallyAnimated, setHasInitiallyAnimated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial slide-up animation on mount
    const timeout = setTimeout(() => setHasInitiallyAnimated(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  // Split text into letters and animate them
  useEffect(() => {
    if (textRef.current && hasInitiallyAnimated) {
      const paragraphs = textRef.current.querySelectorAll('p');
      
      paragraphs.forEach((paragraph, paragraphIndex) => {
        const text = paragraph.textContent || '';
        
        // Hide the paragraph initially to prevent flash
        (paragraph as HTMLElement).style.visibility = 'hidden';
        
        paragraph.innerHTML = '';
        
        // All lines animate simultaneously - no delays between lines
        const baseDelay = 0; // Remove line delay so all animate together
        
        // Split into letters and create animated spans
        text.split('').forEach((char, charIndex) => {
          // Create container for each letter with overflow hidden
          const letterContainer = document.createElement('span');
          letterContainer.style.cssText = `
            display: inline-block;
            overflow: hidden;
            vertical-align: top;
            height: ${lineHeightMultiplier}em;
          `;
          
          // Create the actual letter span that will animate
          const letterSpan = document.createElement('span');
          letterSpan.textContent = char === ' ' ? '\u00A0' : char;
          letterSpan.style.cssText = `
            display: block;
            transform: translateY(100%);
            opacity: 0;
            animation: letterSlideUp 2.4s ease-out forwards;
            animation-delay: ${baseDelay}ms;
          `;
          
          letterContainer.appendChild(letterSpan);
          paragraph.appendChild(letterContainer);
        });
        
        // Show the paragraph now that letters are ready
        (paragraph as HTMLElement).style.visibility = 'visible';
      });
    }
  }, [hasInitiallyAnimated]);

  // Calculate scroll-driven animation progress
  const scrollAnimationProgress = Math.max(0, Math.min(1, 
    (scrollProgress - scrollThreshold) / animationDuration
  ));

  // When user is actively scrolling past threshold, disable extra margins so
  // minHeight / line-height control spacing during transforms. This prevents
  // margin from creating gaps while lines move.
  const effectiveMarginBottom = scrollProgress > scrollThreshold ? '0px' : '16px';

  // Calculate transform and opacity based on scroll progress
  const getLineTransform = () => {
    if (!hasInitiallyAnimated) {
      return 'translateY(30px)';
    }

    if (scrollProgress < scrollThreshold) {
      return 'translateY(0px)';
    }

    // All lines move together as one unit - no stagger
    const adjustedProgress = scrollAnimationProgress;
    
    // Adjust movement based on stopAtMiddle flag and two-phase movement
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    let moveDistance;
    
    // Two-phase movement for second hero text (when animationDuration is 0.10)
    if (animationDuration === 0.10) {
      const quickPhaseEnd = 1.0; // End of quick movement phase (reaches middle at 10% rawProgress)
      const pausePhaseEnd = 6.0; // MUCH longer pause until 60% rawProgress (6.0 * 0.10 = 0.60)
      
      if (adjustedProgress <= quickPhaseEnd) {
        // Phase 1: Quick movement to middle (from 98% to ~50%)
        moveDistance = adjustedProgress * (viewportHeight * 0.48); // Move up 48% of screen height
      } else if (adjustedProgress <= pausePhaseEnd) {
        // Phase 2: Extended pause at middle position - no movement
        moveDistance = viewportHeight * 0.48; // Stay at middle longer
      } else {
        // Phase 3: Continue moving up (fade starts here too)
        const continueProgress = (adjustedProgress - pausePhaseEnd) / 2; // Slower continued movement
        moveDistance = (viewportHeight * 0.48) + (continueProgress * viewportHeight * 0.4);
      }
    } else if (stopAtMiddle) {
      // Original stopAtMiddle behavior for other texts
      const clampedProgress = Math.min(adjustedProgress, 1);
      moveDistance = clampedProgress * (viewportHeight * 0.15);
    } else {
      // Normal movement to top
      moveDistance = adjustedProgress * (viewportHeight * 0.4);
    }
    
    return `translateY(-${moveDistance}px)`;
  };

  const getLineOpacity = () => {
    if (!hasInitiallyAnimated) {
      return 0;
    }

    if (scrollProgress < scrollThreshold) {
      return 1;
    }

    // All lines fade together as one unit - no stagger
    const adjustedProgress = scrollAnimationProgress;
    
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
      ref={textRef}
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
            marginBottom: '-0.1em', // Slight pull for tighter spacing
            paddingBottom: 0,
          }}
        >
          <p
            className="hero-text-paragraph"
            style={{
              margin: 0,
              padding: 0,
              lineHeight: lineHeightMultiplier,
              transform: scrollProgress > scrollThreshold ? getLineTransform() : 'translateY(0px)',
              opacity: scrollProgress > scrollThreshold ? getLineOpacity() : 1,
              transition: scrollProgress > scrollThreshold 
                ? 'transform 0.1s ease-out, opacity 0.2s ease-out' 
                : 'none',
              visibility: 'hidden', // Hide by default until letters are ready
            }}
          >
            {line}
          </p>
        </div>
      ))}
    </div>
  );
}