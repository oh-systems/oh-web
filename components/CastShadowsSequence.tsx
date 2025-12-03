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
  const maxCacheSize = 150; // Larger cache for production stability

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

  // Production-ready preload function with better error handling
  const preloadFrame = useCallback((frameIndex: number) => {
    if (imageCache.current.has(frameIndex) || loadingFrames.current.has(frameIndex)) {
      return Promise.resolve();
    }

    loadingFrames.current.add(frameIndex);
    
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const startTime = performance.now();
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        imageCache.current.set(frameIndex, img);
        loadingFrames.current.delete(frameIndex);
        
        // Log slow loads in production for debugging
        if (loadTime > 2000 && process.env.NODE_ENV === 'production') {
          console.warn(`Slow frame load in production: Frame ${frameIndex} took ${loadTime.toFixed(0)}ms`);
        }
        
        // Lower threshold for production readiness
        if (imageCache.current.size >= 30) {
          setIsReady(true);
        }
        resolve();
      };
      
      img.onerror = () => {
        console.error(`Failed to load frame ${frameIndex} in production`);
        loadingFrames.current.delete(frameIndex);
        resolve();
      };
      
      img.src = imagePaths[frameIndex];
    });
  }, [imagePaths]);

  // Production-optimized cache cleanup
  const cleanupCache = useCallback(() => {
    // Only cleanup if significantly over limit
    if (imageCache.current.size > maxCacheSize + 20) {
      const framesToRemove = [];
      
      for (const [frameIndex] of imageCache.current) {
        const distance = Math.abs(frameIndex - displayFrame);
        if (distance > 75) { // Keep more frames in production
          framesToRemove.push({ frame: frameIndex, distance });
        }
      }
      
      // Sort by distance and remove furthest first
      framesToRemove.sort((a, b) => b.distance - a.distance);
      
      // Remove fewer frames at once to maintain buffer
      const removeCount = Math.min(framesToRemove.length, 15);
      for (let i = 0; i < removeCount; i++) {
        imageCache.current.delete(framesToRemove[i].frame);
      }
    }
  }, [displayFrame, maxCacheSize]);

  // Production-optimized preloading with larger buffer
  useEffect(() => {
    if (!isInView) return;

    // Larger range for production stability
    const range = 40; // ±40 frames for smoother production experience
    
    // Load critical frames immediately (closer to current frame)
    const criticalRange = 15;
    for (let i = -criticalRange; i <= criticalRange; i++) {
      const frame = displayFrame + i;
      if (frame >= 0 && frame < totalFrames && !imageCache.current.has(frame)) {
        preloadFrame(frame);
      }
    }
    
    // Load extended range with slight delay for non-blocking
    setTimeout(() => {
      for (let i = -range; i <= range; i++) {
        const frame = displayFrame + i;
        if (frame >= 0 && frame < totalFrames && !imageCache.current.has(frame) && Math.abs(i) > criticalRange) {
          preloadFrame(frame);
        }
      }
    }, 10);

    // Less frequent cleanup to maintain larger buffer
    if (displayFrame % 30 === 0) {
      cleanupCache();
    }
  }, [displayFrame, isInView, totalFrames, preloadFrame, cleanupCache]);

  // Production-ready render function with fallbacks
  const renderFrame = useCallback((frameIndex: number) => {
    if (lastRenderedFrame.current === frameIndex) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let img = imageCache.current.get(frameIndex);
    
    // Fallback system for production - prevents getting stuck
    if (!img || !img.complete) {
      // Try nearby frames first (±3 frames)
      for (const offset of [1, -1, 2, -2, 3, -3]) {
        const fallbackIndex = frameIndex + offset;
        if (fallbackIndex >= 0 && fallbackIndex < totalFrames) {
          const fallbackImg = imageCache.current.get(fallbackIndex);
          if (fallbackImg && fallbackImg.complete) {
            img = fallbackImg;
            break;
          }
        }
      }
      
      // If still no frame, use any available frame to keep animation moving
      if (!img || !img.complete) {
        for (const [_, cachedImg] of imageCache.current) {
          if (cachedImg && cachedImg.complete) {
            img = cachedImg;
            break;
          }
        }
      }
    }
    
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      lastRenderedFrame.current = frameIndex;
    }
  }, [width, height, totalFrames]);

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
          
          // Production-optimized initial preload
          const preloadInitial = async () => {
            // Load first 150 frames for better production experience
            const initialBatch = Math.min(150, totalFrames);
            const promises = [];
            
            // Load in batches to prevent overwhelming network
            for (let i = 0; i < initialBatch; i++) {
              promises.push(preloadFrame(i));
              
              // Process in batches of 20
              if (promises.length >= 20) {
                await Promise.all(promises);
                promises.length = 0;
                // Small delay between batches for production stability
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
            
            if (promises.length > 0) {
              await Promise.all(promises);
            }
            
            setIsReady(true);
            
            // Continue loading remaining frames in background
            for (let i = initialBatch; i < totalFrames; i++) {
              setTimeout(() => preloadFrame(i), (i - initialBatch) * 25);
            }
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
