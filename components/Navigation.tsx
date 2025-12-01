'use client';

import React from 'react';

interface NavigationProps {
  className?: string;
  style?: React.CSSProperties;
  onNavClick?: (item: string) => void;
}

const NAV_ITEMS = ['ABOUT', 'SPACE', 'CONTACT'];

export default function Navigation({ className = '', style, onNavClick }: NavigationProps) {
  const handleClick = (item: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Direct click handler:', item);
    onNavClick?.(item.toLowerCase());
  };

  return (
    <div 
      className={`navigation-container fixed top-4 ${className}`}
      style={{
        right: '40px',
        ...style,
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
            className="text-white hover:opacity-70 transition-opacity duration-200 bg-transparent border-none cursor-pointer"
            style={{
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
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
