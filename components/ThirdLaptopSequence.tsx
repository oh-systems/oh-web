"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { getThirdLaptopImageUrl } from '../lib/models-config';

interface ThirdLaptopSequenceProps {
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

export default function ThirdLaptopSequence({
  className = "",
  width = 800,
  height = 600,
  autoPlay = true,
  startAnimation = false,
  scrollProgress,
  loop = true,
  duration = 26,
  fps = 30,
  onSequenceComplete,
  priority = false,
}: ThirdLaptopSequenceProps) {
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

  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= 1181; i++) {
      paths.push(getThirdLaptopImageUrl(i));
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

  const isScrollDriven = typeof scrollProgress === "number";

  // Calculate current frame
  const displayFrame = useMemo(() => {
    if (isScrollDriven) {
      const frame = Math.floor(scrollProgress! * (totalFrames - 1));
      return Math.max(0, Math.min(frame, totalFrames - 1));
    }
    return currentFrame;
  }, [isScrollDriven, scrollProgress, currentFrame, totalFrames]);

  // Preload frame with optimization
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
      preloadQueue.current.delete(frameIndex);
      
      if (imageCache.current.size >= Math.min(30, totalFrames)) {
        setIsReady(true);
        if (imageCache.current.size >= totalFrames * 0.5) {
          setLoadingComplete(true);
        }
      }
    };
    
    img.onerror = () => {
      loadingFrames.current.delete(frameIndex);
      preloadQueue.current.delete(frameIndex);
    };
    
    img.src = imagePaths[frameIndex];
  }, [imagePaths, totalFrames]);

  // Aggressive preloading strategy
  useEffect(() => {
    if (!isInView) return;

    const framesToPreload = 30;
    const preloadBatch: number[] = [];

    // Priority: current frame and immediate neighbors
    for (let i = -10; i <= 10; i++) {
      const frame = displayFrame + i;
      if (frame >= 0 && frame < totalFrames) {
        preloadBatch.push(frame);
      }
    }

    // Then preload further ahead
    for (let i = 11; i <= framesToPreload; i++) {
      const frame = displayFrame + i;
      if (frame >= 0 && frame < totalFrames) {
        preloadBatch.push(frame);
      }
    }

    const preloadInBatch = () => {
      preloadBatch.forEach(frame => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => preloadFrame(frame), { timeout: 100 });
        } else {
          setTimeout(() => preloadFrame(frame), 0);
        }
      });
    };

    preloadInBatch();
  }, [displayFrame, isInView, totalFrames, preloadFrame]);

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
      
      // Contain mode - fit within canvas
      const scale = Math.min(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      lastRenderedFrame.current = frameIndex;
    }
  }, [width, height]);

  // Render current frame with RAF and 30fps throttling
  const lastRenderTime = useRef<number>(0);
  useEffect(() => {
    const frame = requestAnimationFrame((currentTime) => {
      const deltaTime = currentTime - lastRenderTime.current;
      const frameInterval = 1000 / 30; // 30fps
      
      if (deltaTime >= frameInterval || lastRenderTime.current === 0) {
        renderFrame(displayFrame);
        lastRenderTime.current = currentTime;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [displayFrame, renderFrame]);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          for (let i = 0; i < Math.min(60, totalFrames); i++) {
            preloadFrame(i);
          }
        }
      },
      { threshold: 0.01, rootMargin: '200px' }
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
      className={`third-laptop-sequence ${className}`}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "100%",
        maxWidth: "100vw",
        maxHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
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
