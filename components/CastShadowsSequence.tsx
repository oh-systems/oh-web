"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import gsap from "gsap";
import { getCastShadowsImageUrl } from "../lib/models-config";
import { SequencePreloader } from "../lib/sequence-preloader";

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
  const currentFrame = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const loadingFrames = useRef<Set<number>>(new Set());
  const lastRenderedFrame = useRef<number>(-1);
  const tickerCallbackRef = useRef<(() => void) | null>(null);

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
    return Math.floor(currentFrame.current);
  }, [isScrollDriven, scrollProgress, totalFrames]);

  // Production-ready preload function - use globally preloaded images when available
  const preloadFrame = useCallback(
    (frameIndex: number) => {
      // First check if already in global cache
      const cachedImg = SequencePreloader.getCachedImage(
        "castShadows",
        frameIndex
      );
      if (cachedImg) {
        imageCache.current.set(frameIndex, cachedImg);
        if (imageCache.current.size >= 10) {
          setIsReady(true);
        }
        return Promise.resolve();
      }

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
            console.log(
              `✅ Frame ${frameIndex} loaded successfully in ${loadTime.toFixed(
                0
              )}ms from ${imagePaths[frameIndex]}`
            );
          }

          // Lower threshold for production readiness
          if (imageCache.current.size >= 10) {
            // Reduced for faster startup
            setIsReady(true);
          }
          resolve();
        };

        img.onerror = (error) => {
          console.error(`Failed to load frame ${frameIndex}:`, {
            url: imagePaths[frameIndex],
            error: error,
            isProduction: process.env.NODE_ENV === "production",
          });
          loadingFrames.current.delete(frameIndex);
          resolve();
        };
        img.src = imagePaths[frameIndex];
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

  // Populate local cache from global preloader cache on mount
  useEffect(() => {
    for (let i = 0; i < totalFrames; i++) {
      const cachedImg = SequencePreloader.getCachedImage("castShadows", i);
      if (cachedImg) {
        imageCache.current.set(i, cachedImg);
      }
    }
    // If we have frames cached, mark as ready
    if (imageCache.current.size >= 10) {
      setIsReady(true);
    }
  }, [totalFrames]);

  // Render current frame for scroll-driven mode
  useEffect(() => {
    if (!isScrollDriven) return;
    renderFrame(displayFrame);
  }, [displayFrame, renderFrame, isScrollDriven]);

  // Simple intersection observer to mark component as in view (preloading handled globally)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setIsReady(true); // Mark as ready immediately since preloading is done globally
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

  // GSAP ticker-based animation loop
  useEffect(() => {
    if (!isPlaying || isScrollDriven) {
      if (tickerCallbackRef.current) {
        gsap.ticker.remove(tickerCallbackRef.current);
        tickerCallbackRef.current = null;
      }
      return;
    }

    const frameIncrement = effectiveFPS / 60; // GSAP ticker runs at ~60fps
    
    const tickerCallback = () => {
      currentFrame.current += frameIncrement;
      
      if (currentFrame.current >= totalFrames) {
        if (loop) {
          currentFrame.current = 0;
        } else {
          setIsPlaying(false);
          currentFrame.current = totalFrames - 1;
          if (onSequenceComplete) {
            onSequenceComplete();
          }
        }
      }
      
      renderFrame(Math.floor(currentFrame.current));
    };

    tickerCallbackRef.current = tickerCallback;
    gsap.ticker.add(tickerCallback);

    return () => {
      if (tickerCallbackRef.current) {
        gsap.ticker.remove(tickerCallbackRef.current);
        tickerCallbackRef.current = null;
      }
    };
  }, [isPlaying, effectiveFPS, totalFrames, loop, onSequenceComplete, isScrollDriven, renderFrame]);

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
