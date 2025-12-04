"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { getThirdLaptopImageUrl } from "../lib/models-config";

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
      preloadBatch.forEach((frame) => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => preloadFrame(frame), {
            timeout: 100,
          });
        } else {
          setTimeout(() => preloadFrame(frame), 0);
        }
      });
    };

    preloadInBatch();
  }, [displayFrame, isInView, totalFrames, preloadFrame]);

  // Render frame to canvas
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
        
        // Smooth easing for vertical movement (ease-in-out)
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Position: bottom -> center -> top
        // At progress 0: start much higher up from bottom of screen
        // At progress 0.5: center aligned (y = (canvas.height - scaledHeight) / 2)  
        // At progress 1: top aligned (y = 0)
        const bottomY = height * 0.3; // Start laptop at 30% down the screen (much higher initial position)
        const centerY = (height - scaledHeight) / 2 - 50; // Move center position up by 50px
        const topY = height * 0.005; 
        
        let y;
        if (easeProgress <= 0.3) {
          // Move from bottom to center (first 30% of animation)
          const localProgress = easeProgress / 0.3; // 0 to 1
          y = bottomY + (centerY - bottomY) * localProgress;
        } else if (easeProgress <= 0.9) {
          // Stay in center (30% to 90% of animation - stays in middle much longer)
          y = centerY;
        } else {
          // Move from center to top (last 10% of animation)
          const localProgress = (easeProgress - 0.9) / 0.1; // 0 to 1
          y = centerY + (topY - centerY) * localProgress;
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
        }}
      />
    </div>
  );
}
