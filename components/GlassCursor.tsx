import { useEffect, useRef, useState } from 'react';
import GlassSurface from './GlassSurface';
import './GlassCursor.css';

interface GlassCursorProps {
  scrollAnimationStarted?: boolean;
}

const GlassCursor = ({ scrollAnimationStarted = false }: GlassCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [realMousePosition, setRealMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    // Initialize cursor position on client mount
    if (typeof window !== 'undefined') {
      const initialX = window.innerWidth / 2;
      const initialY = window.innerHeight / 2;
      setCursorPosition({ x: initialX, y: initialY });
      setRealMousePosition({ x: initialX, y: initialY });
      mousePositionRef.current = { x: initialX, y: initialY };
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      setRealMousePosition({ x: e.clientX, y: e.clientY }); // Update real position immediately
      if (!isVisible) setIsVisible(true);
      
      // Only do interactive detection after scroll animation starts
      if (scrollAnimationStarted) {
        // Use elementFromPoint to detect what's under the cursor (since cursor has pointer-events: none)
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        if (elementUnderCursor) {
          const isInteractive = elementUnderCursor.closest('a, button, [role="button"], input, textarea, select, [onclick], [tabindex]') !== null;
          setIsHovering(isInteractive);
        }
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
  }, [scrollAnimationStarted]);

  // Show cursor immediately on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

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
          className={`glass-cursor ${isVisible ? 'glass-cursor--visible' : ''}`}
          style={{
            left: cursorPosition.x,
            top: cursorPosition.y,
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