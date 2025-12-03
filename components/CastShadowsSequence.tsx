"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { getCastShadowsImageUrl } from "../lib/models-config";

interface CastShadowsSequenceProps {
  className?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  startAnimation?: boolean;
  scrollProgress?: number;
  loop?: boolean;
  duration?: number;
  fps?: number;
  onSequenceComplete?: () => void;
  priority?: boolean;
}

export default function CastShadowsSequence({
  className = "",
  width = 800,
  height = 600,
  autoPlay = true,
  startAnimation = false,
  scrollProgress,
  loop = true,
  duration = 40,
  fps = 30,
  onSequenceComplete,
  priority: _ = false,
}: CastShadowsSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const loadingFrames = useRef<Set<number>>(new Set());
  const lastRenderedFrame = useRef<number>(-1);

  const totalFrames = 1199;
  const maxCacheSize = 100;

  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= totalFrames; i++) {
      const frameNumber = i.toString().padStart(4, "0");
      paths.push(getCastShadowsImageUrl(`CAST SHADOWS${frameNumber}.avif`));
    }
    return paths;
  }, [totalFrames]);

  const effectiveFPS = useMemo(() => {
    if (duration) {
      return totalFrames / duration;
    }
    return fps;
  }, [totalFrames, duration, fps]);

  const isScrollDriven = typeof scrollProgress === "number";

  // Calculate current frame
  const displayFrame = useMemo(() => {
    if (isScrollDriven) {
      const frame = Math.floor(scrollProgress! * (totalFrames - 1));
      return Math.max(0, Math.min(frame, totalFrames - 1));
    }
    return currentFrame;
  }, [isScrollDriven, scrollProgress, currentFrame, totalFrames]);

  // Simple preload function
  const preloadFrame = useCallback((frameIndex: number) => {
    if (imageCache.current.has(frameIndex) || loadingFrames.current.has(frameIndex)) {
      return Promise.resolve();
    }

    loadingFrames.current.add(frameIndex);
    
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        imageCache.current.set(frameIndex, img);
        loadingFrames.current.delete(frameIndex);
        
        // Simple ready state
        if (imageCache.current.size >= 50) {
          setIsReady(true);
        }
        resolve();
      };
      
      img.onerror = () => {
        loadingFrames.current.delete(frameIndex);
        resolve();
      };
      
      img.src = imagePaths[frameIndex];
    });
  }, [imagePaths]);

  // Simple cache cleanup
  const cleanupCache = useCallback(() => {
    if (imageCache.current.size > maxCacheSize) {
      const framesToRemove = [];
      
      for (const [frameIndex] of imageCache.current) {
        const distance = Math.abs(frameIndex - displayFrame);
        if (distance > 50) {
          framesToRemove.push(frameIndex);
        }
      }
      
      // Remove half the distant frames
      const removeCount = Math.min(framesToRemove.length, 25);
      for (let i = 0; i < removeCount; i++) {
        imageCache.current.delete(framesToRemove[i]);
      }
    }
  }, [displayFrame, maxCacheSize]);

  // Simple preloading - just load frames around current position
  useEffect(() => {
    if (!isInView) return;

    // Load frames around current position
    const range = 25; // ±25 frames
    for (let i = -range; i <= range; i++) {
      const frame = displayFrame + i;
      if (frame >= 0 && frame < totalFrames) {
        preloadFrame(frame);
      }
    }

    // Simple cleanup every 20 frames
    if (displayFrame % 20 === 0) {
      cleanupCache();
    }
  }, [displayFrame, isInView, totalFrames, preloadFrame, cleanupCache]);

  // Simple render function
  const renderFrame = useCallback((frameIndex: number) => {
    if (lastRenderedFrame.current === frameIndex) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageCache.current.get(frameIndex);
    
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      lastRenderedFrame.current = frameIndex;
    }
  }, [width, height]);

  // Simple render effect
  useEffect(() => {
    renderFrame(displayFrame);
  }, [displayFrame, renderFrame]);

  // Simple intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          
          // Simple initial preload
          const preloadInitial = async () => {
            const promises = [];
            for (let i = 0; i < 100; i++) {
              promises.push(preloadFrame(i));
            }
            await Promise.all(promises);
            setIsReady(true);
          };
          
          preloadInitial();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [preloadFrame]);

  // Auto-play logic
  useEffect(() => {
    if (!isReady || !startAnimation || isScrollDriven) return;

    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [isReady, startAnimation, autoPlay, isScrollDriven]);

  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Simple animation logic
  const animate = useCallback(() => {
    if (!isPlaying) return;

    const now = performance.now();
    const deltaTime = now - lastUpdateTimeRef.current;
    const frameInterval = 1000 / effectiveFPS;

    if (deltaTime >= frameInterval) {
      setCurrentFrame((prevFrame) => {
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

  return (
    <div
      ref={containerRef}
      className={`cast-shadows-sequence ${className}`}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      {/* Canvas for optimized rendering */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Bottom gradient overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "20%",
          background:
            "linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </div>
  );
}
