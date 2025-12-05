'use client';

import React from 'react';

interface SectionIndicatorProps {
  currentSection: 'overview' | 'mission' | 'space' | 'information';
  onSectionClick?: (section: 'overview' | 'mission' | 'space' | 'information') => void;
  className?: string;
  style?: React.CSSProperties;
}

const SECTIONS = [
  { id: 'overview', label: 'OVERVIEW', description: 'First model' },
  { id: 'mission', label: 'MISSION', description: 'Cast shadow' },
  { id: 'space', label: 'SPACE', description: 'Laptop' },
  { id: 'information', label: 'INFORMATION', description: 'Footer' },
] as const;

export default function SectionIndicator({ 
  currentSection, 
  onSectionClick, 
  className = '', 
  style 
}: SectionIndicatorProps) {
  const handleSectionClick = (sectionId: 'overview' | 'mission' | 'space' | 'information') => {
    onSectionClick?.(sectionId);
  };

  return (
    <div 
      className={`section-indicator ${className}`}
      style={{
        position: 'fixed',
        right: '40px',
        top: '50vh', // Use viewport height for true center
        transform: 'translateY(-50%)',
        zIndex: 1000,
        pointerEvents: 'auto',
        ...style
      }}
    >
      <div className="flex items-start">
        {/* Labels column on the left */}
        <div className="flex flex-col justify-start">
          {SECTIONS.map((section, index) => {
            const isActive = currentSection === section.id;
            const isLast = index === SECTIONS.length - 1;
            
            return (
              <div key={`label-${section.id}`} className="flex items-start justify-end" style={{ height: isLast ? '8px' : '52px', paddingTop: '0px' }}>
                <span
                  className="transition-colors duration-200 select-none"
                  onClick={() => handleSectionClick(section.id as 'overview' | 'mission' | 'space' | 'information')}
                  style={{
                    fontFamily: 'Be Vietnam, Arial, sans-serif',
                    fontSize: '10px',
                    fontWeight: '400',
                    color: isActive ? 'white' : '#1E1E1E',
                    letterSpacing: '0.5px',
                    lineHeight: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    height: '8px', // Match circle height exactly
                  }}
                >
                  {section.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Circles and lines column on the right */}
        <div className="flex flex-col items-center ml-4">
          {SECTIONS.map((section, index) => {
            const isActive = currentSection === section.id;
            const isLast = index === SECTIONS.length - 1;
            
            return (
              <div key={`circle-${section.id}`} className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className="rounded-full border transition-colors duration-200"
                  onClick={() => handleSectionClick(section.id as 'overview' | 'mission' | 'space' | 'information')}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderColor: isActive ? 'white' : '#1E1E1E',
                    backgroundColor: isActive ? 'white' : 'transparent',
                    borderWidth: '1px',
                  }}
                />
                
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className="transition-colors duration-200"
                    style={{
                      width: '1px',
                      height: '44px',
                      backgroundColor: '#1E1E1E',
                      marginTop: '0px',
                      marginBottom: '0px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Custom font loading */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@100;200;300;400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}