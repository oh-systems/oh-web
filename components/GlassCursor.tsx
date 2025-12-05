import { useEffect, useRef, useState } from 'react';
import GlassSurface from './GlassSurface';
import './GlassCursor.css';

interface GlassCursorProps {
  scrollAnimationStarted?: boolean;
}

const GlassCursor = ({ scrollAnimationStarted = false }: GlassCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    // Initialize cursor position on client mount
    if (typeof window !== 'undefined') {
      const initialX = window.innerWidth / 2;
      const initialY = window.innerHeight / 2;
      setCursorPosition({ x: initialX, y: initialY });
      mousePositionRef.current = { x: initialX, y: initialY };
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollAnimationStarted) return; // Don't track mouse until scroll animation starts
      
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      if (!scrollAnimationStarted) return;
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      if (!scrollAnimationStarted) return;
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

  // Show cursor when scroll animation starts
  useEffect(() => {
    if (scrollAnimationStarted) {
      setIsVisible(true);
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

  // Don't render anything at all until scroll animation actually starts
  if (!scrollAnimationStarted) {
    return null;
  }

  return (
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
  );
};

export default GlassCursor;