'use client';

import { useEffect, useState } from 'react';

interface HeroTextProps {
  text?: string;
  className?: string;
  align?: 'left' | 'right' | 'center';
  size?: 'normal' | 'large';
  uppercase?: boolean;
  weight?: 'normal' | 'bold';
  scrollBehavior?: 'fade' | 'sticky' | 'delayed' | 'none';
}

export default function HeroText({ 
  text = "OH exists to redefine e-commerce by turning online shopping into immersive, spatial experiences. This is the foundation for a new kind of digital reality.",
  className = '',
  align = 'left',
  size = 'normal',
  uppercase = false,
  weight = 'bold',
  scrollBehavior = 'none'
}: HeroTextProps) {
  const [scrollY, setScrollY] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [transform, setTransform] = useState('');
  const [topPosition, setTopPosition] = useState<string>('');

  useEffect(() => {
    if (scrollBehavior === 'none') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      if (scrollBehavior === 'fade') {
        const fadeStart = 100;
        const fadeEnd = 300;
        
        if (currentScrollY <= fadeStart) {
          setOpacity(1);
        } else if (currentScrollY >= fadeEnd) {
          setOpacity(0);
        } else {
          const fadeProgress = (currentScrollY - fadeStart) / (fadeEnd - fadeStart);
          setOpacity(1 - fadeProgress);
        }
      } else if (scrollBehavior === 'sticky') {
        const moveStart = 200;
        const moveEnd = 500;
        const textBelowStart = moveEnd + 100;
        const textBelowEnd = textBelowStart + 200;
        const fadeStart = textBelowEnd + 200;
        const fadeEnd = fadeStart + 200;
        
        if (currentScrollY <= moveStart) {
          setTransform('');
          setTopPosition('');
          setOpacity(1);
        } else if (currentScrollY <= moveEnd) {
          const moveProgress = (currentScrollY - moveStart) / (moveEnd - moveStart);
          const top = 100 - (moveProgress * 50);
          setTopPosition(`${top}vh`);
          setTransform('translateY(-50%)');
          setOpacity(1);
        } else if (currentScrollY <= fadeStart) {
          setTopPosition('50vh');
          setTransform('translateY(-50%)');
          setOpacity(1);
        } else if (currentScrollY <= fadeEnd) {
          setTopPosition('50vh');
          setTransform('translateY(-50%)');
          const fadeProgress = (currentScrollY - fadeStart) / (fadeEnd - fadeStart);
          setOpacity(1 - fadeProgress);
        } else {
          setTopPosition('50vh');
          setTransform('translateY(-50%)');
          setOpacity(0);
        }
      } else if (scrollBehavior === 'delayed') {
        const appearStart = 500;
        const appearEnd = 700;
        const fadeStart = 1100;
        const fadeEnd = 1300;
        
        if (currentScrollY <= appearStart) {
          setOpacity(0);
        } else if (currentScrollY <= appearEnd) {
          const appearProgress = (currentScrollY - appearStart) / (appearEnd - appearStart);
          setOpacity(appearProgress);
        } else if (currentScrollY <= fadeStart) {
          setOpacity(1);
        } else if (currentScrollY <= fadeEnd) {
          const fadeProgress = (currentScrollY - fadeStart) / (fadeEnd - fadeStart);
          setOpacity(1 - fadeProgress);
        } else {
          setOpacity(0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollBehavior]);

  const baseClasses = align === 'left' 
    ? "absolute left-0 top-1/2 transform -translate-y-1/2 z-40 pl-16 w-1/2"
    : scrollBehavior === 'sticky' 
      ? "absolute z-40 w-1/2 max-w-4xl"
      : "absolute z-40 max-w-3xl";
    
  const textAlign = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  const fontSize = size === 'large' ? { fontSize: '96px' } : {};
  const textTransform = uppercase ? 'uppercase' : '';
  const fontWeight = weight === 'bold' ? 'font-bold' : 'font-normal';
  const lineHeight = size === 'large' ? 'leading-tight' : 'leading-relaxed';
  
  const dynamicStyle = {
    fontFamily: 'Helvetica, Arial, sans-serif',
    ...fontSize,
    opacity,
    transform: scrollBehavior === 'sticky' ? transform : undefined,
    top: scrollBehavior === 'sticky' ? topPosition : undefined,
    right: scrollBehavior === 'sticky' && topPosition ? '4rem' : undefined,
    position: (scrollBehavior === 'sticky' && topPosition ? 'fixed' : undefined) as 'fixed' | undefined,
    width: scrollBehavior === 'sticky' && size === 'large' ? '50vw' : undefined,
    transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
  };
  
  return (
    <div className={`${baseClasses} ${className}`}>
      <p 
        className={`text-white text-lg ${lineHeight} ${fontWeight} ${textAlign} ${textTransform} tracking-wide`}
        style={dynamicStyle}
      >
        {text}
      </p>
    </div>
  );
}
