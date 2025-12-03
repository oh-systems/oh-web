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
  priority = false,
}: CastShadowsSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const preloadQueue = useRef<Set<number>>(new Set());
  const loadingFrames = useRef<Set<number>>(new Set());
  const lastRenderedFrame = useRef<number>(-1);

  const totalFrames = 1199;

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

  // Preload frame with optimization - returns promise for batching
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
        preloadQueue.current.delete(frameIndex);
        
        // Update ready state
        if (imageCache.current.size >= Math.min(50, totalFrames)) {
          setIsReady(true);
          if (imageCache.current.size >= totalFrames * 0.3) {
            setLoadingComplete(true);
          }
        }
        resolve();
      };
      
      img.onerror = () => {
        loadingFrames.current.delete(frameIndex);
        preloadQueue.current.delete(frameIndex);
        resolve();
      };
      
      img.src = imagePaths[frameIndex];
    });
  }, [imagePaths, totalFrames]);

  // Aggressive preloading strategy - increased buffer and continuous background loading
  useEffect(() => {
    if (!isInView) return;

    const framesToPreload = 80; // Double the preload buffer
    const preloadBatch: number[] = [];

    // Priority: current frame and immediate neighbors (higher priority range)
    for (let i = -20; i <= 20; i++) {
      const frame = displayFrame + i;
      if (frame >= 0 && frame < totalFrames) {
        preloadBatch.push(frame);
      }
    }

    // Then preload further ahead
    for (let i = 21; i <= framesToPreload; i++) {
      const frame = displayFrame + i;
      if (frame >= 0 && frame < totalFrames) {
        preloadBatch.push(frame);
      }
    }

    // Also preload behind for smooth reverse scrolling
    for (let i = -21; i >= -40; i--) {
      const frame = displayFrame + i;
      if (frame >= 0 && frame < totalFrames) {
        preloadBatch.push(frame);
      }
    }

    // Immediate preload for nearby frames, deferred for distant ones
    preloadBatch.forEach((frame, index) => {
      const isNearby = Math.abs(frame - displayFrame) <= 20;
      if (isNearby) {
        // Immediate preload for nearby frames
        preloadFrame(frame);
      } else {
        // Deferred preload for distant frames
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => preloadFrame(frame), { timeout: 50 });
        } else {
          setTimeout(() => preloadFrame(frame), index);
        }
      }
    });
  }, [displayFrame, isInView, totalFrames, preloadFrame]);

  // Render frame to canvas - with fallback for missing frames
  const renderFrame = useCallback((frameIndex: number) => {
    if (lastRenderedFrame.current === frameIndex) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true
    });
    if (!ctx) return;

    let img = imageCache.current.get(frameIndex);
    
    // Fallback: if current frame not loaded, try previous frames
    if (!img || !img.complete) {
      for (let i = 1; i <= 5; i++) {
        const fallbackFrame = frameIndex - i;
        if (fallbackFrame >= 0) {
          const fallbackImg = imageCache.current.get(fallbackFrame);
          if (fallbackImg && fallbackImg.complete) {
            img = fallbackImg;
            break;
          }
        }
      }
    }
    
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Cover mode - fill entire canvas
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      lastRenderedFrame.current = frameIndex;
    }
  }, [width, height]);

  // Render current frame with RAF
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      renderFrame(displayFrame);
    });
    return () => cancelAnimationFrame(frame);
  }, [displayFrame, renderFrame]);

  // Intersection observer - start aggressive background preloading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          
          // Immediate preload of first 200 frames for smooth start
          const immediatePreload = async () => {
            const promises = [];
            for (let i = 0; i < Math.min(200, totalFrames); i++) {
              promises.push(preloadFrame(i));
              // Batch in groups of 10 to avoid overwhelming the browser
              if (promises.length >= 10) {
                await Promise.all(promises);
                promises.length = 0;
              }
            }
            if (promises.length > 0) {
              await Promise.all(promises);
            }
            
            // Then continue loading rest in background
            for (let i = 200; i < totalFrames; i++) {
              if (window.requestIdleCallback) {
                window.requestIdleCallback(() => preloadFrame(i), { timeout: 1000 });
              } else {
                setTimeout(() => preloadFrame(i), i - 200);
              }
            }
          };
          
          immediatePreload();
        }
      },
      { threshold: 0.01, rootMargin: "300px" } // Increased margin for earlier loading
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [totalFrames, preloadFrame]);

  // Auto-play logic
  useEffect(() => {
    if (!isReady || !loadingComplete || !startAnimation || isScrollDriven)
      return;

    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [isReady, loadingComplete, startAnimation, autoPlay, isScrollDriven]);

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
          if (loop) {
            return 0;
          } else {
            setIsPlaying(false);
            if (onSequenceComplete) {
              setTimeout(() => onSequenceComplete(), 0);
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
          imageRendering: 'auto',
          willChange: 'contents',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
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
