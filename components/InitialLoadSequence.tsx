'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { getInitialLoadImageUrl } from '../lib/models-config';

interface InitialLoadSequenceProps {
  className?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  startAnimation?: boolean; // New prop to control when animation starts
  loop?: boolean;
  duration?: number; // Duration in seconds instead of FPS
  fps?: number; // Keep FPS as fallback
  onSequenceComplete?: () => void;
  priority?: boolean;
}

export default function InitialLoadSequence({
  className = '',
  width = 600,
  height = 600,
  autoPlay = true,
  startAnimation = false,
  loop = false,
  duration = 5,
  fps = 60,
  onSequenceComplete,
  priority = false
}: InitialLoadSequenceProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [isInView, setIsInView] = useState(true); // Always load immediately for initial load screen
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate array of image paths
  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= 300; i++) {
      const frameNumber = i.toString().padStart(4, '0');
      paths.push(getInitialLoadImageUrl(`INITIAL${frameNumber}.avif`));
    }
    return paths;
  }, []);

  const totalFrames = imagePaths.length;

  // Calculate effective FPS based on duration
  const effectiveFPS = useMemo(() => {
    if (duration) {
      return totalFrames / duration;
    }
    return fps;
  }, [totalFrames, duration, fps]);

  // Native image preloading
  const [nativeImagesLoaded, setNativeImagesLoaded] = useState(false);
  const [nativeProgress, setNativeProgress] = useState(0);
  
  const updateProgress = useCallback((loadedCount: number) => {
    const progress = (loadedCount / totalFrames) * 100;
    setNativeProgress(progress);
    
    if (loadedCount === totalFrames) {
      setIsReady(true);
      setTimeout(() => {
        setNativeImagesLoaded(true);
        setLoadingComplete(true);
      }, 500);
    }
  }, [totalFrames]);
  
  useEffect(() => {
    // Always load immediately for initial loading screen
    const imageObjects: HTMLImageElement[] = [];
    let loadedCount = 0;
    
    imagePaths.forEach((path) => {
      const img = document.createElement('img') as HTMLImageElement;
      img.onload = () => {
        loadedCount++;
        updateProgress(loadedCount);
      };
      img.onerror = () => {
        loadedCount++;
        updateProgress(loadedCount);
      };
      img.src = path;
      imageObjects.push(img);
    });
    
    return () => {
      imageObjects.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [imagePaths, updateProgress]);
  
  const isLoading = !nativeImagesLoaded || !loadingComplete;

  // Start animation when all conditions are met
  useEffect(() => {
    if (isReady && startAnimation && autoPlay && !isPlaying && nativeImagesLoaded && loadingComplete) {
      setTimeout(() => {
        setIsPlaying(true);
      }, 100);
    }
  }, [isReady, startAnimation, autoPlay, isPlaying, nativeImagesLoaded, loadingComplete]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !isReady || !nativeImagesLoaded || !loadingComplete) {
      return;
    }

    let frameIndex = 0;
    const targetFrameTime = 1000 / effectiveFPS;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const expectedFrame = Math.floor(elapsed / targetFrameTime);
      
      if (expectedFrame > frameIndex && frameIndex < totalFrames - 1) {
        frameIndex = Math.min(expectedFrame, totalFrames - 1);
        setCurrentFrame(frameIndex);
      }
      
      if (frameIndex >= totalFrames - 1) {
        setIsPlaying(false);
        if (onSequenceComplete) {
          onSequenceComplete();
        }
        return;
      }
      
      if (isPlaying) {
        requestAnimationFrame(animate);
      }
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying, isReady, nativeImagesLoaded, loadingComplete, effectiveFPS, totalFrames, onSequenceComplete]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  if (isLoading) {
    // Just wait invisibly until ready
    return <div style={{ width, height, backgroundColor: 'transparent' }} />;
  }

  const currentImagePath = imagePaths[currentFrame];

  return (
    <div 
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{ 
        width, 
        height,
        willChange: 'contents',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        backgroundColor: 'transparent'
      }}
    >
      <Image
        src={currentImagePath}
        alt={`Frame ${currentFrame + 1}`}
        width={width}
        height={height}
        priority={currentFrame < 10}
        quality={100}
        unoptimized={true}
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'auto',
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          opacity: 1
        }}
      />
      
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
