'use client';

import React, { useRef, useMemo } from 'react';
import Image from 'next/image';

interface InitialScrollSequenceProps {
  className?: string;
  width?: number;
  height?: number;
  scrollProgress?: number; // 0 to 1 based on scroll position
  priority?: boolean;
}

export default function InitialScrollSequence({
  className = '',
  width = 600,
  height = 600,
  scrollProgress = 0,
  priority = false
}: InitialScrollSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate array of image paths for Initial Scroll
  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= 300; i++) {
      const frameNumber = i.toString().padStart(4, '0');
      paths.push(`/images/models/INITIAL%20SCROLL/INITIAL%20SCROLL${frameNumber}.avif`);
    }
    return paths;
  }, []);

  const totalFrames = imagePaths.length;

  // Calculate current frame based on scroll progress - linear, no easing for immediate response
  const currentFrame = Math.floor(scrollProgress * (totalFrames - 1));
  const clampedFrame = Math.max(0, Math.min(currentFrame, totalFrames - 1));

  // Always show the calculated frame
  const currentImagePath = imagePaths[clampedFrame];

  return (
    <div 
      ref={containerRef}
      className={`initial-scroll-sequence ${className}`}
      style={{ 
        width, 
        height,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {currentImagePath && (
        <Image
          src={currentImagePath}
          alt={`Initial scroll frame ${clampedFrame + 1}`}
          width={width}
          height={height}
          priority={priority}
          style={{
            objectFit: 'contain',
            width: '100%',
            height: '100%'
          }}
        />
      )}
      
      {/* Bottom gradient overlay - black to transparent covering 20% */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20%',
          background: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
    </div>
  );
}
