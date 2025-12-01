"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import { getCastShadowsImageUrl } from "../lib/models-config";
import { useScrollSpeedLimiter, useAdaptiveQuality } from "../hooks";

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
      const frameNumber = i.toString().padStart(4, '0');
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

    imagePaths.forEach((path) => {
      const img = document.createElement("img") as HTMLImageElement;
      img.onload = () => {
        loadedCount++;
        updateProgress(loadedCount);
      };
      img.onerror = () => {
        loadedCount++; // Count as loaded even if failed
        updateProgress(loadedCount);
      };
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
      { threshold: 0.1, rootMargin: '100px' } // Start loading when component is near viewport
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation logic - use scroll progress if provided, otherwise use auto-play
  const isScrollDriven = typeof scrollProgress === "number";

  // Initialize scroll speed limiter for frame-based limiting - slower settings
  const frameSpeedLimiter = useScrollSpeedLimiter({
    maxVelocity: 300, // Much lower for slower, smoother animations
    smoothingFactor: 0.15, // More smoothing for slower progression
    enabled: isScrollDriven
  });

  // Adaptive quality management
  const adaptiveQuality = useAdaptiveQuality({
    velocityThresholds: { medium: 200, low: 400, critical: 600 },
    qualityLevels: { full: 1.0, medium: 0.85, low: 0.7, critical: 0.5 },
    enabled: isScrollDriven
  });

  // Track previous frame for skip detection
  const previousFrameRef = useRef<number>(0);

  // Calculate current frame based on mode
  const calculateCurrentFrame = () => {
    if (isScrollDriven) {
      // Apply frame-based speed limiting
      const { limitedFrame, velocity } = frameSpeedLimiter.processScrollProgress(
        scrollProgress!,
        totalFrames - 1
      );
      
      // Check if we should skip this frame for performance
      if (adaptiveQuality.shouldSkipFrame(limitedFrame, velocity)) {
        // Return previous frame to skip this update
        return previousFrameRef.current;
      }
      
      // Use linear progression with no easing effects
      const normalizedProgress = limitedFrame / (totalFrames - 1);
      
      // Direct linear mapping for consistent animation speed
      const easedProgress = normalizedProgress;
      
      const easedFrame = easedProgress * (totalFrames - 1);
      // Use floor instead of round for more predictable frame progression
      const frame = Math.floor(easedFrame);
      const finalFrame = Math.max(0, Math.min(frame, totalFrames - 1));
      
      // Update previous frame reference
      previousFrameRef.current = finalFrame;
      return finalFrame;
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

  // Preload next frame for smoother playback
  const nextFrame = Math.min(displayFrame + 1, totalFrames - 1);
  const nextImageSrc = imagePaths[nextFrame];

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
      {/* Main Image Display */}
      <div
        className="relative w-full h-full"
      >
        <Image
          key={currentImageSrc}
          src={currentImageSrc}
          alt={`Cast Shadows frame ${displayFrame + 1}`}
          width={width}
          height={height}
          priority={priority || displayFrame < 20}
          loading={priority || displayFrame < 20 ? 'eager' : 'lazy'}
          unoptimized
          quality={100}
          onError={() => {
            console.warn(
              `Failed to load Cast Shadows frame: ${currentImageSrc}`
            );
          }}
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
            imageRendering: "auto",
            backfaceVisibility: "hidden",
            transform: "translateZ(0)", // Hardware acceleration
          }}
        />

        {/* Preload next frame invisibly */}
        {nextImageSrc && nextImageSrc !== currentImageSrc && (
          <Image
            src={nextImageSrc}
            alt="preload"
            width={width}
            height={height}
            loading="lazy"
            unoptimized
            quality={100}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1,
            }}
          />
        )}
      </div>

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
