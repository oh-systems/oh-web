'use client';

import React, { useEffect, useRef } from 'react';

interface NavigationProps {
  className?: string;
  style?: React.CSSProperties;
  onNavClick?: (item: string) => void;
}

const NAV_ITEMS = ['ABOUT', 'SPACE', 'CONTACT'];

export default function Navigation({ className = '', style, onNavClick }: NavigationProps) {
  const navRef = useRef<HTMLDivElement>(null);

  const handleClick = (item: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Direct click handler:', item);
    onNavClick?.(item.toLowerCase());
  };

  // Split text into individual letters and animate them with slide-up effect
  useEffect(() => {
    if (navRef.current) {
      const buttons = navRef.current.querySelectorAll('button');
      
      buttons.forEach((button, buttonIndex) => {
        const text = button.textContent || '';
        
        // Button is already hidden with visibility in CSS
        
        button.innerHTML = '';
        
        // All buttons animate simultaneously - no delays between buttons
        const baseDelay = 0; // Remove button delay so all animate together
        
        // Create spans for each letter
        text.split('').forEach((char, charIndex) => {
          // Create container for each letter with overflow hidden
          const letterContainer = document.createElement('div');
          letterContainer.style.cssText = `
            display: inline-block;
            overflow: hidden;
            height: 1.2em;
            vertical-align: top;
            position: relative;
          `;
          
          // Create the actual letter span that will animate
          const letterSpan = document.createElement('span');
          letterSpan.textContent = char === ' ' ? '\u00A0' : char;
          letterSpan.style.cssText = `
            display: block;
            transform: translateY(100%);
            opacity: 0;
            animation: letterSlideUp 1.2s ease-out forwards;
            animation-delay: ${baseDelay}ms;
          `;
          
          letterContainer.appendChild(letterSpan);
          button.appendChild(letterContainer);
        });
        
        // Show the button now that letters are ready
        (button as HTMLElement).style.visibility = 'visible';
      });
    }
  }, []);

  return (
    <div 
      ref={navRef}
      className={`navigation-container fixed top-4 ${className}`}
      style={{
        right: '40px',
        ...style,
      }}
    >
      <div className="flex space-x-32">
        {NAV_ITEMS.map((item, index) => (
          <button
            key={item}
            onClick={(e) => handleClick(item, e)}
            onMouseDown={(e) => {
              console.log('Mouse down on:', item);
              e.preventDefault();
            }}
            className="text-white hover:opacity-70 transition-opacity duration-200 bg-transparent border-none cursor-pointer nav-button"
            style={{
              ...{
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '20px',
                fontWeight: '400',
                padding: '8px 16px',
                minHeight: '40px',
                minWidth: '80px',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 99999,
                backgroundColor: 'transparent',
                visibility: 'hidden', // Hide initially to prevent flash
              },
            }}

          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
