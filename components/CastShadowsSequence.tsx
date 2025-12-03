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
  startAnimation?: boolean; // New prop to control when animation starts
  scrollProgress?: number; // 0 to 1 based on scroll position - when provided, overrides autoPlay
  loop?: boolean;
  duration?: number; // Duration in seconds instead of FPS
  fps?: number; // Keep FPS as fallback
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
  loop = true, // Default to true for auto-replay
  duration = 40,
  fps = 30,
  onSequenceComplete,
  priority = false,
}: CastShadowsSequenceProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate array of image paths for CAST SHADOWS using configuration
  const totalFrames = 1199;

  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 1; i <= totalFrames; i++) {
      const frameNumber = i.toString().padStart(4, "0");
      paths.push(getCastShadowsImageUrl(`CAST SHADOWS${frameNumber}.avif`));
    }
    return paths;
  }, [totalFrames]);

  // Calculate effective FPS based on duration
  const effectiveFPS = useMemo(() => {
    if (duration) {
      return totalFrames / duration;
    }
    return fps;
  }, [totalFrames, duration, fps]);

  const updateProgress = useCallback(
    (loadedCount: number) => {
      if (loadedCount === totalFrames) {
        setIsReady(true);
        setTimeout(() => {
          setLoadingComplete(true);
        }, 500);
      }
    },
    [totalFrames]
  );

  useEffect(() => {
    // Only start loading images when component is in view
    if (!isInView) return;

    const imageObjects: HTMLImageElement[] = [];
    let loadedCount = 0;

    imagePaths.forEach((path, index) => {
      const img = document.createElement("img") as HTMLImageElement;
      img.onload = () => {
        loadedCount++;
        updateProgress(loadedCount);
      };
      img.onerror = () => {
        console.error(`Failed to load frame ${index}: ${path}`);
        loadedCount++;
        updateProgress(loadedCount);
      };
      // Force browser to cache the image
      img.crossOrigin = "anonymous";
      img.src = path;
      imageObjects.push(img);
    });

    return () => {
      imageObjects.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [imagePaths, updateProgress, isInView]);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "100px" } // Start loading when component is near viewport
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation logic - use scroll progress if provided, otherwise use auto-play
  const isScrollDriven = typeof scrollProgress === "number";

  // Calculate current frame based on mode - simplified for performance
  const calculateCurrentFrame = () => {
    if (isScrollDriven) {
      // Direct linear mapping for smooth, consistent animation
      const frame = Math.floor(scrollProgress! * (totalFrames - 1));
      return Math.max(0, Math.min(frame, totalFrames - 1));
    }
    return currentFrame; // Auto-play mode
  };

  const displayFrame = calculateCurrentFrame();

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

  const currentImageSrc =
    imagePaths[Math.min(displayFrame, totalFrames - 1)] || imagePaths[0];

  return (
    <div
      ref={containerRef}
      className={`cast-shadows-sequence ${className}`}
      style={{
        width: "100%",
        height: "100%", // Always use 100% to fill parent container
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Main Image Display - Single image with stable key for smooth rendering */}
      <div
        className="relative w-full h-full"
        style={{ backgroundColor: "#000" }} // Black background to prevent white flashes
      >
        <img
          src={currentImageSrc}
          alt={`Cast Shadows frame ${displayFrame + 1}`}
          width={width}
          height={height}
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
            imageRendering: "auto",
            backfaceVisibility: "hidden",
            transform: "translateZ(0)",
            display: "block",
            willChange: "auto",
          }}
        />
      </div>

      {/* Preload next 2-5 frames invisibly for buffer */}
      {[1, 2, 3, 4, 5].map((offset) => {
        const preloadFrame = Math.min(displayFrame + offset, totalFrames - 1);
        const preloadSrc = imagePaths[preloadFrame];
        if (preloadSrc) {
          return (
            <link
              key={`preload-offset-${offset}-frame-${preloadFrame}`}
              rel="preload"
              as="image"
              href={preloadSrc}
            />
          );
        }
        return null;
      })}

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
