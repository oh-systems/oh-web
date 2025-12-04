"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getInitialScrollImageUrl } from "../lib/models-config";

interface InitialScrollSequenceProps {
  className?: string;
  width?: number;
  height?: number;
  scrollProgress?: number; // 0 to 1 based on scroll position
  priority?: boolean;
}

export default function InitialScrollSequence({
  className = "",
  width = 600,
  height = 600,
  scrollProgress = 0,
  priority = false,
}: InitialScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInView, setIsInView] = useState(false);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const preloadQueue = useRef<Set<number>>(new Set());
  const loadingFrames = useRef<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRenderedFrame = useRef<number>(-1);

  // Generate array of image paths for Initial Scroll (1-indexed, 600 frames total)
  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= 600; i++) {
      paths.push(getInitialScrollImageUrl(i));
    }
    return paths;
  }, []);

  const totalFrames = imagePaths.length;

  // Calculate current frame based on scroll progress
  const currentFrame = useMemo(() => {
    const frame = Math.floor(scrollProgress * (totalFrames - 1));
    return Math.max(0, Math.min(frame, totalFrames - 1));
  }, [scrollProgress, totalFrames]);

  // Preload frame with production optimizations
  const preloadFrame = useCallback(
    (frameIndex: number) => {
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
        } catch (e) {
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

  // Optimized preloading strategy - prioritize immediate frames
  useEffect(() => {
    if (!isInView) return;

    const framesToPreload = 15; // Reduced preload window for better performance
    const preloadBatch: number[] = [];

    // Priority: current frame and immediate neighbors (critical for smooth scrolling)
    for (let i = -2; i <= 8; i++) {
      // Focus more on frames ahead
      const frame = currentFrame + i;
      if (frame >= 0 && frame < totalFrames) {
        preloadBatch.push(frame);
      }
    }

    // Then preload further ahead with lower priority
    for (let i = 9; i <= framesToPreload; i++) {
      const frame = currentFrame + i;
      if (frame >= 0 && frame < totalFrames) {
        preloadBatch.push(frame);
      }
    }

    // Preload using requestIdleCallback with shorter timeout for better responsiveness
    const preloadInBatch = () => {
      preloadBatch.forEach((frame, index) => {
        if (window.requestIdleCallback) {
          // Prioritize immediate frames with shorter timeout
          const timeout = index < 5 ? 16 : 50; // 16ms for critical frames, 50ms for others
          window.requestIdleCallback(() => preloadFrame(frame), { timeout });
        } else {
          // Use different delays for priority
          const delay = index < 5 ? 0 : 16;
          setTimeout(() => preloadFrame(frame), delay);
        }
      });
    };

    preloadInBatch();
  }, [currentFrame, isInView, totalFrames, preloadFrame]);

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

  // Render current frame with RAF for smooth updates - optimized for production
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
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
    });
    return () => cancelAnimationFrame(frame);
  }, [currentFrame, renderFrame]);

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

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Start preloading with just the first few frames for immediate responsiveness
          for (let i = 0; i < Math.min(10, totalFrames); i++) {
            preloadFrame(i);
          }
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
