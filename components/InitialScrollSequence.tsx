"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getInitialScrollImageUrl } from "../lib/models-config";
import { SequencePreloader } from "../lib/sequence-preloader";

interface InitialScrollSequenceProps {
  className?: string;
  width?: number;
  height?: number;
  scrollProgress?: number; // 0 to 1 based on scroll position
  priority?: boolean;
  autoPlay?: boolean;
  startAnimation?: boolean;
  duration?: number; // Duration in seconds (default: 20)
  fps?: number; // Target FPS (default: 30)
}

export default function InitialScrollSequence({
  className = "",
  width = 600,
  height = 600,
  scrollProgress = 0,
  autoPlay = false,
  startAnimation = false,
  duration = 20,
  fps = 30,
}: InitialScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInView, setIsInView] = useState(false);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const preloadQueue = useRef<Set<number>>(new Set());
  const loadingFrames = useRef<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRenderedFrame = useRef<number>(-1);
  
  // Time-based animation state
  const [currentTimeFrame, setCurrentTimeFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Generate array of image paths for Initial Scroll (1-indexed, 600 frames total)
  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= 600; i++) {
      paths.push(getInitialScrollImageUrl(i));
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

  const isScrollDriven = typeof scrollProgress === "number" && !autoPlay;

  // Calculate current frame based on scroll progress or time
  const currentFrame = useMemo(() => {
    if (isScrollDriven) {
      const frame = Math.floor(scrollProgress * (totalFrames - 1));
      return Math.max(0, Math.min(frame, totalFrames - 1));
    } else {
      return Math.max(0, Math.min(currentTimeFrame, totalFrames - 1));
    }
  }, [scrollProgress, totalFrames, isScrollDriven, currentTimeFrame]);

  // Preload frame - use globally preloaded images when available
  const preloadFrame = useCallback(
    (frameIndex: number) => {
      // First check if already in global cache
      const cachedImg = SequencePreloader.getCachedImage('initialScroll', frameIndex);
      if (cachedImg) {
        imageCache.current.set(frameIndex, cachedImg);
        return;
      }

      if (
        imageCache.current.has(frameIndex) ||
        loadingFrames.current.has(frameIndex)
      ) {
        return;
      }

      loadingFrames.current.add(frameIndex);
      const img = new Image();
      img.crossOrigin = "anonymous";

      // Production optimizations for faster loading
      img.loading = "eager"; // Load immediately
      img.decoding = "async"; // Decode off main thread

      img.onload = async () => {
        // Decode the image off the main thread for smoother performance
        try {
          await img.decode();
        } catch {
          // Fallback if decode fails
        }
        imageCache.current.set(frameIndex, img);
        loadingFrames.current.delete(frameIndex);
        preloadQueue.current.delete(frameIndex);
      };

      img.onerror = () => {
        loadingFrames.current.delete(frameIndex);
        preloadQueue.current.delete(frameIndex);
      };

      img.src = imagePaths[frameIndex];
    },
    [imagePaths]
  );

  // Removed individual frame preloading - now handled by batch preload above

  // Render frame to canvas
  const renderFrame = useCallback(
    (frameIndex: number) => {
      if (lastRenderedFrame.current === frameIndex) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", {
        alpha: false,
        desynchronized: true, // Better performance for animations
        willReadFrequently: false, // Optimize for write-heavy operations
        powerPreference: "high-performance", // Use dedicated GPU if available
      }) as CanvasRenderingContext2D | null;
      if (!ctx) return;

      const img = imageCache.current.get(frameIndex);
      if (img && img.complete) {
        // Clear canvas and draw new frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate aspect-fit dimensions
        const scale = Math.min(width / img.width, height / img.height);
        const x = (width - img.width * scale) / 2;
        const y = (height - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        lastRenderedFrame.current = frameIndex;
      }
    },
    [width, height]
  );

  // Time-based animation loop
  const animate = useCallback(() => {
    if (!isPlaying) return;

    const now = performance.now();
    const deltaTime = now - lastUpdateTimeRef.current;
    const frameInterval = 1000 / effectiveFPS;

    if (deltaTime >= frameInterval) {
      setCurrentTimeFrame((prevFrame) => {
        const nextFrame = prevFrame + 1;
        if (nextFrame >= totalFrames) {
          setIsPlaying(false);
          return totalFrames - 1;
        }
        return nextFrame;
      });

      lastUpdateTimeRef.current = now - (deltaTime % frameInterval);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, effectiveFPS, totalFrames]);

  // Start/stop animation based on props
  useEffect(() => {
    if (autoPlay && startAnimation && !isScrollDriven) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [autoPlay, startAnimation, isScrollDriven]);

  // Animation loop management
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

  // Render current frame with RAF and 30fps throttling - match other sequences
  const lastRenderTime = useRef<number>(0);
  useEffect(() => {
    const frame = requestAnimationFrame((currentTime) => {
      const deltaTime = currentTime - lastRenderTime.current;
      const frameInterval = 1000 / 30; // 30fps throttle

      if (deltaTime >= frameInterval || lastRenderTime.current === 0) {
        // Priority rendering: if current frame is not loaded, try to render any nearby loaded frame
        const img = imageCache.current.get(currentFrame);
        if (img && img.complete) {
          renderFrame(currentFrame);
        } else {
          // Fallback: try rendering a nearby loaded frame to prevent blank canvas
          for (let i = 1; i <= 3; i++) {
            const fallbackFrame = currentFrame - i;
            if (fallbackFrame >= 0 && imageCache.current.has(fallbackFrame)) {
              renderFrame(fallbackFrame);
              break;
            }
          }
        }
        lastRenderTime.current = currentTime;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [currentFrame, renderFrame]);

  // Populate local cache from global preloader cache on mount
  useEffect(() => {
    for (let i = 0; i < totalFrames; i++) {
      const cachedImg = SequencePreloader.getCachedImage('initialScroll', i);
      if (cachedImg) {
        imageCache.current.set(i, cachedImg);
      }
    }
  }, [totalFrames]);

  // Early preloading for production performance
  useEffect(() => {
    // Start preloading the first few critical frames immediately (before intersection)
    // This helps with production lag by starting network requests early
    const preloadCriticalFrames = () => {
      for (let i = 0; i < 3; i++) {
        if (i < totalFrames) {
          preloadFrame(i);
        }
      }
    };

    // Use a small delay to not block initial render
    setTimeout(preloadCriticalFrames, 100);
  }, [totalFrames, preloadFrame]);

  // Simple intersection observer to mark component as in view (preloading handled globally)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.01, rootMargin: "200px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [totalFrames, preloadFrame]);

  return (
    <div
      ref={containerRef}
      className={`initial-scroll-sequence ${className}`}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
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
          objectFit: "contain",
          imageRendering: "auto",
          willChange: "contents",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)", // Hardware acceleration
        }}
      />

      {/* Bottom gradient overlay - black to transparent covering 20% */}
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
