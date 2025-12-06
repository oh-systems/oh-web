"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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

  // Render current frame with RAF - responsive for scroll, throttled for auto-play
  const lastRenderTime = useRef<number>(0);
  useEffect(() => {
    const frame = requestAnimationFrame((currentTime) => {
      if (isScrollDriven) {
        // Immediate rendering for scroll-driven mode
        renderFrame(displayFrame);
      } else {
        // 30fps throttling only for auto-play mode
        const deltaTime = currentTime - lastRenderTime.current;
        const frameInterval = 1000 / 30;

        if (deltaTime >= frameInterval || lastRenderTime.current === 0) {
          renderFrame(displayFrame);
          lastRenderTime.current = currentTime;
        }
      }
    });
    return () => cancelAnimationFrame(frame);
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
