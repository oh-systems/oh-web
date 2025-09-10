'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';

interface CastShadowsSequenceProps {
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

export default function CastShadowsSequence({
  className = '',
  height = 600,
  autoPlay = true,
  startAnimation = false,
  loop = true, // Default to true for auto-replay
  duration = 10,
  fps = 40,
  onSequenceComplete,
  priority = false
}: CastShadowsSequenceProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate array of image paths for CAST SHADOWS
  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= 300; i++) {
      const frameNumber = i.toString().padStart(4, '0');
      paths.push(`/images/models/SECOND CAST SHADOWS/CAST SHADOWS${frameNumber}.avif`);
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
  
  useEffect(() => {
    const imageObjects: HTMLImageElement[] = [];
    let loadedCount = 0;
    
    const updateProgress = () => {
      const progress = (loadedCount / totalFrames) * 100;
      setNativeProgress(progress);
      
      if (loadedCount === totalFrames) {
        setIsReady(true);
        setTimeout(() => {
          setNativeImagesLoaded(true);
          setLoadingComplete(true);
        }, 500);
      }
    };
    
    imagePaths.forEach((path) => {
      const img = document.createElement('img') as HTMLImageElement;
      img.onload = () => {
        loadedCount++;
        updateProgress();
      };
      img.onerror = () => {
        loadedCount++; // Count as loaded even if failed
        updateProgress();
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
  }, [imagePaths, totalFrames]);

  // Animation logic
  useEffect(() => {
    if (!isReady || !loadingComplete || !startAnimation) return;

    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [isReady, loadingComplete, startAnimation, autoPlay]);

  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const animate = useCallback(() => {
    if (!isPlaying) return;

    const now = performance.now();
    const deltaTime = now - lastUpdateTimeRef.current;
    const frameInterval = 1000 / effectiveFPS;

    if (deltaTime >= frameInterval) {
      setCurrentFrame(prevFrame => {
        const nextFrame = prevFrame + 1;
        if (nextFrame >= totalFrames) {
          if (loop) {
            return 0;
          } else {
            setIsPlaying(false);
            if (onSequenceComplete) {
              onSequenceComplete();
            }
            return prevFrame;
          }
        }
        return nextFrame;
      });
      
      lastUpdateTimeRef.current = now - (deltaTime % frameInterval);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, effectiveFPS, totalFrames, loop, onSequenceComplete]);

  useEffect(() => {
    if (isPlaying) {
      lastUpdateTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Restart function
  const restart = useCallback(() => {
    setCurrentFrame(0);
    setIsPlaying(true);
  }, []);

  // Play/pause toggle
  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const currentImageSrc = imagePaths[Math.min(currentFrame, totalFrames - 1)] || imagePaths[0];

  return (
    <div 
      ref={containerRef}
      className={`cast-shadows-sequence ${className}`}
      style={{ 
        width: '100%',
        height: height ? `${height}px` : 'auto',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Loading Progress Indicator */}
      {!loadingComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-white text-sm">
            Loading Cast Shadows... {Math.round(nativeProgress)}%
          </div>
        </div>
      )}

      {/* Main Image Display */}
      <div 
        className="relative w-full h-full"
        style={{ opacity: loadingComplete ? 1 : 0.3 }}
      >
        <Image
          src={currentImageSrc}
          alt={`Cast Shadows frame ${currentFrame + 1}`}
          fill
          sizes="100vw"
          className="object-cover"
          priority={priority}
          quality={85}
        />
      </div>
    </div>
  );
}
