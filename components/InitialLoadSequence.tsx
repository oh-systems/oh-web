'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getInitialLoadImageUrl } from '../lib/models-config';

interface InitialLoadSequenceProps {
  className?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  startAnimation?: boolean;
  loop?: boolean;
  duration?: number;
  fps?: number;
  onSequenceComplete?: () => void;
  onLoadingProgress?: (progress: number) => void;
  priority?: boolean;
}

export default function InitialLoadSequence({
  className = '',
  width = 600,
  height = 600,
  autoPlay = true,
  startAnimation = false,
  duration = 5,
  fps = 60,
  onSequenceComplete,
  onLoadingProgress
}: InitialLoadSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const loadingFrames = useRef<Set<number>>(new Set());
  const lastRenderedFrame = useRef<number>(-1);

  // Generate array of image paths
  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= 300; i++) {
      paths.push(getInitialLoadImageUrl(i));
    }
    return paths;
  }, []);

  const totalFrames = imagePaths.length;

  const effectiveFPS = useMemo(() => {
    if (duration) {
      return totalFrames / duration;
    }
    return fps;
  }, [totalFrames, duration, fps]);

  // Preload frame
  const preloadFrame = useCallback((frameIndex: number) => {
    if (imageCache.current.has(frameIndex) || loadingFrames.current.has(frameIndex)) {
      return;
    }

    loadingFrames.current.add(frameIndex);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      imageCache.current.set(frameIndex, img);
      loadingFrames.current.delete(frameIndex);
      
      // Report loading progress
      if (onLoadingProgress) {
        const progress = imageCache.current.size / totalFrames;
        onLoadingProgress(progress);
      }
      
      if (imageCache.current.size >= Math.min(30, totalFrames)) {
        setIsReady(true);
        if (imageCache.current.size >= totalFrames) {
          setLoadingComplete(true);
        }
      }
    };
    
    img.onerror = () => {
      loadingFrames.current.delete(frameIndex);
    };
    
    img.src = imagePaths[frameIndex];
  }, [imagePaths, totalFrames]);

  // Preload all frames
  useEffect(() => {
    for (let i = 0; i < totalFrames; i++) {
      preloadFrame(i);
    }
  }, [totalFrames, preloadFrame]);

  // Render frame to canvas
  const renderFrame = useCallback((frameIndex: number) => {
    if (lastRenderedFrame.current === frameIndex) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true
    });
    if (!ctx) return;

    const img = imageCache.current.get(frameIndex);
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const scale = Math.min(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      lastRenderedFrame.current = frameIndex;
    }
  }, [width, height]);

  // Start animation when ready
  useEffect(() => {
    if (isReady && startAnimation && autoPlay && !isPlaying && loadingComplete) {
      setTimeout(() => {
        setIsPlaying(true);
      }, 100);
    }
  }, [isReady, startAnimation, autoPlay, isPlaying, loadingComplete]);

  // Animation loop
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const animate = useCallback(() => {
    if (!isPlaying) return;

    const now = performance.now();
    const deltaTime = now - lastUpdateTimeRef.current;
    const frameInterval = 1000 / effectiveFPS;

    if (deltaTime >= frameInterval) {
      setCurrentFrame((prevFrame) => {
        const nextFrame = prevFrame + 1;
        if (nextFrame >= totalFrames) {
          setIsPlaying(false);
          // Defer callback to avoid setState during render
          if (onSequenceComplete) {
            setTimeout(() => onSequenceComplete(), 0);
          }
          return prevFrame;
        }
        return nextFrame;
      });

      lastUpdateTimeRef.current = now - (deltaTime % frameInterval);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, effectiveFPS, totalFrames, onSequenceComplete]);

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

  // Render current frame
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      renderFrame(currentFrame);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentFrame, renderFrame]);

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
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'auto',
          willChange: 'contents',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }}
      />
      
      {/* Bottom gradient overlay */}
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
