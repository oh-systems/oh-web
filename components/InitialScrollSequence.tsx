"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import gsap from "gsap";
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
  
  // GSAP-based animation state
  const currentTimeFrame = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const tickerCallbackRef = useRef<(() => void) | null>(null);

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
      return Math.max(0, Math.min(Math.floor(currentTimeFrame.current), totalFrames - 1));
    }
  }, [scrollProgress, totalFrames, isScrollDriven]);

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

  // GSAP ticker-based animation loop
  useEffect(() => {
    if (!isPlaying || isScrollDriven) {
      if (tickerCallbackRef.current) {
        gsap.ticker.remove(tickerCallbackRef.current);
        tickerCallbackRef.current = null;
      }
      return;
    }

    const frameIncrement = effectiveFPS / 60; // GSAP ticker runs at 60fps typically
    
    const tickerCallback = () => {
      currentTimeFrame.current += frameIncrement;
      
      if (currentTimeFrame.current >= totalFrames) {
        setIsPlaying(false);
        currentTimeFrame.current = totalFrames - 1;
      }
      
      // Force re-render to update currentFrame
      renderFrame(Math.floor(currentTimeFrame.current));
    };

    tickerCallbackRef.current = tickerCallback;
    gsap.ticker.add(tickerCallback);

    return () => {
      if (tickerCallbackRef.current) {
        gsap.ticker.remove(tickerCallbackRef.current);
        tickerCallbackRef.current = null;
      }
    };
  }, [isPlaying, effectiveFPS, totalFrames, isScrollDriven, renderFrame]);

  // Start/stop animation based on props
  useEffect(() => {
    if (autoPlay && startAnimation && !isScrollDriven) {
      currentTimeFrame.current = 0;
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [autoPlay, startAnimation, isScrollDriven]);

  // Render current frame - smooth rendering for both modes
  const isScrollDrivenRef = useRef(isScrollDriven);
  
  // Update ref when isScrollDriven changes
  useEffect(() => {
    isScrollDrivenRef.current = isScrollDriven;
  }, [isScrollDriven]);
  
  // Render current frame for scroll-driven mode
  useEffect(() => {
    if (!isScrollDriven) return;
    
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
  }, [currentFrame, renderFrame, isScrollDriven]);

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
