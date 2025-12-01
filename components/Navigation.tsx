'use client';

import React from 'react';

interface NavigationProps {
  className?: string;
  style?: React.CSSProperties;
  onNavClick?: (item: string) => void;
}

const NAV_ITEMS = ['About', 'Space', 'Contact'];

export default function Navigation({ className = '', style, onNavClick }: NavigationProps) {
  const handleClick = (item: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Direct click handler:', item);
    onNavClick?.(item.toLowerCase());
  };

  return (
    <div 
      className={`navigation-container fixed top-4 right-16 ${className}`}
      style={{
        ...style,
        pointerEvents: 'auto',
        zIndex: 999999999, // Extremely high to ensure it's above everything
        position: 'fixed',
      }}
    >
      <div className="flex space-x-32">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            onClick={(e) => handleClick(item, e)}
            onMouseDown={(e) => {
              console.log('Mouse down on:', item);
              e.preventDefault();
            }}
            className="text-white text-lg font-bold hover:opacity-70 transition-opacity duration-200 bg-transparent border-none cursor-pointer"
            style={{
              fontFamily: 'Helvetica, Arial, sans-serif',
              padding: '8px 16px',
              minHeight: '40px',
              minWidth: '80px',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 99999,
              backgroundColor: 'transparent',
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
