import { useEffect, useRef, useState } from 'react';
import GlassSurface from './GlassSurface';
import './GlassCursor.css';

interface GlassCursorProps {
  scrollAnimationStarted?: boolean;
}

const GlassCursor = ({ scrollAnimationStarted = false }: GlassCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100 }); // Start off-screen
  const [realMousePosition, setRealMousePosition] = useState({ x: -100, y: -100 }); // Start off-screen
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [crystalOpacity, setCrystalOpacity] = useState(0);
  const mousePositionRef = useRef({ x: -100, y: -100 }); // Start off-screen
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Use exact clientX/clientY for pixel-perfect positioning
      const exactX = e.clientX;
      const exactY = e.clientY;
      
      mousePositionRef.current = { x: exactX, y: exactY };
      setRealMousePosition({ x: exactX, y: exactY }); // Update real position immediately with exact values
      if (!isVisible) setIsVisible(true);
      
      // Always do interactive detection (not just after scroll animation starts)
      // Use elementFromPoint to detect what's under the cursor (since cursor has pointer-events: none)
      const elementUnderCursor = document.elementFromPoint(exactX, exactY);
      if (elementUnderCursor) {
        const isInteractive = elementUnderCursor.closest(
          'a, button, [role="button"], input, textarea, select, [onclick], [tabindex], .section-indicator, .sound-container, .sound-toggle, svg, path, circle, rect'
        ) !== null;
        setIsHovering(isInteractive);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [scrollAnimationStarted, isVisible]);

  // Fade in crystal when scroll animation starts
  useEffect(() => {
    if (scrollAnimationStarted) {
      // Gradually fade in the crystal over 3 seconds with scale effect
      const fadeInDuration = 3000; // 3 seconds
      const startTime = performance.now();
      
      const fadeIn = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / fadeInDuration, 1);
        
        // Smooth ease-in-out
        const easedProgress = progress * progress * (3 - 2 * progress);
        setCrystalOpacity(easedProgress);
        
        if (progress < 1) {
          requestAnimationFrame(fadeIn);
        }
      };
      
      requestAnimationFrame(fadeIn);
    } else {
      setCrystalOpacity(0);
    }
  }, [scrollAnimationStarted]);

  // Separate effect for animation loop
  useEffect(() => {
    if (!scrollAnimationStarted) return; // Don't animate until scroll animation starts
    
    const animate = () => {
      setCursorPosition(prevPos => {
        const targetX = mousePositionRef.current.x;
        const targetY = mousePositionRef.current.y;
        
        // Smooth easing - lower values = more lag/trailing effect
        const easeAmount = 0.06;
        const newX = prevPos.x + (targetX - prevPos.x) * easeAmount;
        const newY = prevPos.y + (targetY - prevPos.y) * easeAmount;
        
        return { x: newX, y: newY };
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scrollAnimationStarted]);

  return (
    <>
      {/* Glass crystal with delayed/smooth movement - only after scroll starts */}
      {scrollAnimationStarted && (
        <div
          ref={cursorRef}
          className={`glass-cursor`}
          style={{
            left: cursorPosition.x,
            top: cursorPosition.y,
            opacity: crystalOpacity,
            transform: `translate(-50%, -50%) scale(${0.7 + crystalOpacity * 0.3})`,
            transition: 'none',
            pointerEvents: 'none',
            zIndex: 999999999,
          }}
        >
          <GlassSurface
            width={78}
            height={78}
            borderRadius={39}
            borderWidth={0}
            brightness={50}
            opacity={0.93}
            blur={15}
            displace={0.5}
            backgroundOpacity={0.08}
            saturation={1.3}
            distortionScale={-180}
            redOffset={0}
            greenOffset={8}
            blueOffset={16}
            className="glass-cursor__surface"
          >
            <div className="glass-cursor__content" />
          </GlassSurface>
        </div>
      )}
      
      {/* Small white circle indicator showing real cursor position - always visible */}
      <div
        style={{
          position: 'fixed',
          left: realMousePosition.x,
          top: realMousePosition.y,
          width: isHovering ? '12px' : '6px',
          height: isHovering ? '12px' : '6px',
          borderRadius: '50%',
          backgroundColor: 'white',
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.2s ease-out, height 0.2s ease-out',
          pointerEvents: 'none',
          zIndex: 999999999,
          opacity: 1,
        }}
      />
    </>
  );
};

export default GlassCursor;