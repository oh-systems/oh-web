import { useEffect, useRef, useState } from 'react';
import GlassSurface from './GlassSurface';
import './GlassCursor.css';

const GlassCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
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
  }, [isVisible]);

  return (
    <div
      ref={cursorRef}
      className={`glass-cursor ${isVisible ? 'glass-cursor--visible' : ''}`}
      style={{
        left: mousePosition.x,
        top: mousePosition.y,
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