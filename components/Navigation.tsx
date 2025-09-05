'use client';

import { useEffect, useState } from 'react';

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className = '' }: NavigationProps) {
  const [scrollY, setScrollY] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Fade out as menu approaches top of screen
      const fadeStart = 50;   // Start fading after 50px scroll
      const fadeEnd = 200;    // Fully transparent at 200px
      
      if (currentScrollY <= fadeStart) {
        setOpacity(1);
      } else if (currentScrollY >= fadeEnd) {
        setOpacity(0);
      } else {
        const fadeProgress = (currentScrollY - fadeStart) / (fadeEnd - fadeStart);
        setOpacity(1 - fadeProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 right-0 z-50 py-4 pl-8 pr-16 transition-opacity duration-300 ease-out ${className}`}
      style={{ opacity }}
    >
      <ul className="flex space-x-32 text-white">
        <li>
          <a 
            href="/about" 
            className="text-white text-lg font-bold hover:opacity-70 transition-opacity duration-200"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            About
          </a>
        </li>
        <li>
          <a 
            href="/game" 
            className="text-white text-lg font-bold hover:opacity-70 transition-opacity duration-200"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            Space
          </a>
        </li>
        <li>
          <a 
            href="/contact" 
            className="text-white text-lg font-bold hover:opacity-70 transition-opacity duration-200"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            Contact
          </a>
        </li>
      </ul>
    </nav>
  );
}
