"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import gsap from "gsap";
import { getThirdLaptopImageUrl } from "../lib/models-config";
import { SequencePreloader } from "../lib/sequence-preloader";

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
  duration = 40,
  fps = 30,
  onSequenceComplete,
}: ThirdLaptopSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrame = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const preloadQueue = useRef<Set<number>>(new Set());
  const loadingFrames = useRef<Set<number>>(new Set());
  const lastRenderedFrame = useRef<number>(-1);
  const tickerCallbackRef = useRef<(() => void) | null>(null);

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
    return Math.floor(currentFrame.current);
  }, [isScrollDriven, scrollProgress, totalFrames]);

  // Preload frame - use globally preloaded images when available
  const preloadFrame = useCallback(
    (frameIndex: number) => {
      // First check if already in global cache
      const cachedImg = SequencePreloader.getCachedImage('thirdLaptop', frameIndex);
      if (cachedImg) {
        imageCache.current.set(frameIndex, cachedImg);
        if (imageCache.current.size >= Math.min(30, totalFrames)) {
          setIsReady(true);
          if (imageCache.current.size >= totalFrames * 0.5) {
            setLoadingComplete(true);
          }
        }
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
    },
    [imagePaths, totalFrames]
  );

  // Removed individual frame preloading - now handled by batch preload above

  // Render frame to canvas
  const renderFrame = useCallback(
    (frameIndex: number) => {
      if (lastRenderedFrame.current === frameIndex) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", {
        alpha: true,
        desynchronized: true,
      });
      if (!ctx) return;

      const img = imageCache.current.get(frameIndex);
      if (img && img.complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Make laptop smaller (70% of original size)
        const baseScale = Math.min(width / img.width, height / img.height);
        const scale = baseScale * 0.7;
        
        // Calculate scaled dimensions
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Horizontal centering
        const x = (width - scaledWidth) / 2;
        
        // Vertical positioning based on animation progress
        const progress = isScrollDriven && typeof scrollProgress === 'number' ? scrollProgress : frameIndex / (totalFrames - 1);
        
        // Position: bottom -> center -> top with smooth easing
        const bottomY = height * 0.3; // Start laptop at 30% down the screen
        const centerY = (height - scaledHeight) / 2 - 50; // Center position
        const topY = height * 0.005; // End position
        
        let y;
        if (progress <= 0.4) {
          // Move from bottom to center (first 40% of animation) with ease-out
          const localProgress = progress / 0.4; // 0 to 1
          // Cubic ease-out: starts fast, slows down as it approaches center
          const easedProgress = 1 - Math.pow(1 - localProgress, 3);
          y = bottomY + (centerY - bottomY) * easedProgress;
        } else if (progress <= 0.6) {
          // Stay perfectly still in center (40% to 60% of animation)
          y = centerY;
        } else {
          // Move from center to top (last 40% of animation) with ease-in
          const localProgress = (progress - 0.6) / 0.4; // 0 to 1
          // Cubic ease-in: starts slow, accelerates as it leaves center
          const easedProgress = localProgress * localProgress * localProgress;
          y = centerY + (topY - centerY) * easedProgress;
        }

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        lastRenderedFrame.current = frameIndex;
      }
    },
    [width, height, scrollProgress, isScrollDriven, totalFrames]
  );

  // Render current frame for scroll-driven mode
  useEffect(() => {
    if (!isScrollDriven) return;
    renderFrame(displayFrame);
  }, [displayFrame, renderFrame, isScrollDriven]);

  // Populate local cache from global preloader cache on mount
  useEffect(() => {
    for (let i = 0; i < totalFrames; i++) {
      const cachedImg = SequencePreloader.getCachedImage('thirdLaptop', i);
      if (cachedImg) {
        imageCache.current.set(i, cachedImg);
      }
    }
    // If we have frames cached, mark as ready
    if (imageCache.current.size >= Math.min(30, totalFrames)) {
      setIsReady(true);
      if (imageCache.current.size >= totalFrames * 0.5) {
        setLoadingComplete(true);
      }
    }
  }, [totalFrames]);

  // Simple intersection observer to mark component as in view (preloading handled globally)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setIsReady(true); // Mark as ready immediately since preloading is done globally
          setLoadingComplete(true);
        }
      },
      { threshold: 0.01, rootMargin: "200px" }
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
            setTimeout(() => onSequenceComplete(), 0);
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
        backgroundColor: "transparent", // Ensure transparent background
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
          transform: "translateZ(0)",
          backgroundColor: "transparent", // Explicitly transparent
        }}
      />
    </div>
  );
}
