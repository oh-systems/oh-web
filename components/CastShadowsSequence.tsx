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

  const totalFrames = 1200;

  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= totalFrames; i++) {
      paths.push(getCastShadowsImageUrl(i));
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

  // Calculate current frame - match laptop sequence approach exactly
  const displayFrame = useMemo(() => {
    if (isScrollDriven) {
      const frame = Math.floor(scrollProgress! * (totalFrames - 1));
      return Math.max(0, Math.min(frame, totalFrames - 1));
    }
    return currentFrame;
  }, [isScrollDriven, scrollProgress, currentFrame, totalFrames]);

  // Production-ready preload function with better error handling
  const preloadFrame = useCallback(
    (frameIndex: number) => {
      if (
        imageCache.current.has(frameIndex) ||
        loadingFrames.current.has(frameIndex)
      ) {
        return Promise.resolve();
      }

      loadingFrames.current.add(frameIndex);

      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        const startTime = performance.now();

        img.onload = () => {
          const loadTime = performance.now() - startTime;
          imageCache.current.set(frameIndex, img);
          loadingFrames.current.delete(frameIndex);

          // Debug logging for production
          if (process.env.NODE_ENV === "production" && frameIndex <= 5) {
            console.log(`✅ Frame ${frameIndex} loaded successfully in ${loadTime.toFixed(0)}ms from ${imagePaths[frameIndex]}`);
          }

          // Lower threshold for production readiness
          if (imageCache.current.size >= 10) { // Reduced for faster startup
            setIsReady(true);
          }
          resolve();
        };

      img.onerror = (error) => {
        console.error(`Failed to load frame ${frameIndex}:`, {
          url: imagePaths[frameIndex],
          error: error,
          isProduction: process.env.NODE_ENV === 'production'
        });
        loadingFrames.current.delete(frameIndex);
        resolve();
      };        img.src = imagePaths[frameIndex];
      });
    },
    [imagePaths]
  );

  // Removed individual frame preloading - now handled by batch preload above

  // Render frame to canvas - match laptop approach exactly
  const renderFrame = useCallback(
    (frameIndex: number) => {
      if (lastRenderedFrame.current === frameIndex) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });
      if (!ctx) return;

      const img = imageCache.current.get(frameIndex);
      if (img && img.complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fill entire canvas - stretch to full width and height
        ctx.drawImage(img, 0, 0, width, height);
        lastRenderedFrame.current = frameIndex;
      }
    },
    [width, height]
  );

  // Render current frame with RAF and 30fps throttling - match laptop approach
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

  // Intersection observer with aggressive preloading (similar to InitialLoadSequence)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);

          // Preload all frames immediately for smooth experience (like InitialLoadSequence)
          const preloadAllFrames = async () => {
            console.log(`🚀 Starting preload of all ${totalFrames} Cast Shadows frames...`);
            const batchSize = 50; // Larger batches for efficiency
            
            for (let batchStart = 0; batchStart < totalFrames; batchStart += batchSize) {
              const batchEnd = Math.min(batchStart + batchSize, totalFrames);
              const promises = [];
              
              // Load batch
              for (let i = batchStart; i < batchEnd; i++) {
                promises.push(preloadFrame(i));
              }
              
              await Promise.all(promises);
              
              // Set ready after first batch for immediate playback
              if (batchStart === 0) {
                setIsReady(true);
                console.log(`✅ Cast Shadows first batch loaded, ready to play`);
              }
              
              // Very small delay between batches to prevent overwhelming
              if (batchEnd < totalFrames) {
                await new Promise(resolve => setTimeout(resolve, 5));
              }
            }
            
            console.log(`🎯 All ${totalFrames} Cast Shadows frames preloaded`);
          };

          preloadAllFrames();
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
          width: "100%",
          height: "100%",
          objectFit: "fill",
          imageRendering: "auto",
          willChange: "contents",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
      />

      {/* Bottom gradient overlay */}
      {/* <div
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
      /> */}
    </div>
  );
}
