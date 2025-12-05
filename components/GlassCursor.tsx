import { useEffect, useRef, useState } from 'react';
import GlassSurface from './GlassSurface';
import './GlassCursor.css';

const GlassCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
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

    // Hide default cursor globally
    document.body.style.cursor = 'none';
    
    // Hide cursor on all interactive elements
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      
      // Restore default cursor
      document.body.style.cursor = 'auto';
      
      // Remove global cursor hiding
      const styles = document.head.querySelectorAll('style');
      styles.forEach(style => {
        if (style.textContent?.includes('cursor: none !important')) {
          style.remove();
        }
      });
    };
  }, []);

  // Separate effect for animation loop
  useEffect(() => {
    const animate = () => {
      setCursorPosition(prevPos => {
        const targetX = mousePositionRef.current.x;
        const targetY = mousePositionRef.current.y;
        
        // Smooth easing - lower values = more lag/trailing effect
        const easeAmount = 0.05;
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
  }, []);

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