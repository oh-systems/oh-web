"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import Image from "next/image";
import { getInitialScrollImageUrl } from '../lib/models-config';

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
  const [loadingComplete, setLoadingComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate array of image paths for Initial Scroll (0-indexed, 601 frames total)
  const imagePaths = useMemo(() => {
    const paths: string[] = [];
    for (let i = 0; i <= 600; i++) {
      const frameNumber = i.toString().padStart(4, "0");
      paths.push(
        getInitialScrollImageUrl(`INITIAL SCROLL${frameNumber}.avif`)
      );
    }
    return paths;
  }, []);

  const totalFrames = imagePaths.length;

  const updateProgress = useCallback(
    (loadedCount: number) => {
      if (loadedCount === totalFrames) {
        setTimeout(() => {
          setLoadingComplete(true);
        }, 25); // Ultra-fast loading for immediate responsiveness
      }
    },
    [totalFrames]
  );

  useEffect(() => {
    let isMounted = true;
    const imageObjects: HTMLImageElement[] = [];
    let loadedCount = 0;

    imagePaths.forEach((path) => {
      const img = new window.Image();
      img.onload = () => {
        if (!isMounted) return;
        loadedCount += 1;
        updateProgress(loadedCount);
      };
      img.onerror = () => {
        if (!isMounted) return;
        loadedCount += 1;
        updateProgress(loadedCount);
      };
      img.src = path;
      imageObjects.push(img);
    });

    return () => {
      isMounted = false;
      imageObjects.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [imagePaths, updateProgress]);

  // Animation logic - use scroll progress (always scroll-driven for this component)
  const isScrollDriven = typeof scrollProgress === "number";

  // Calculate current frame based on scroll progress with better smoothing
  const calculateCurrentFrame = () => {
    if (isScrollDriven) {
      // Apply smoothstep easing to the scroll progress for more natural transitions
      const easedScrollProgress = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);
      const easedFrame = easedScrollProgress * (totalFrames - 1);
      
      // Use the eased frame calculation with Math.round for smoother transitions
      const frame = Math.round(easedFrame);
      return Math.max(0, Math.min(frame, totalFrames - 1));
    }
    return 0; // Fallback to first frame
  };

  const displayFrame = calculateCurrentFrame();

  const [failedFrames, setFailedFrames] = useState<Set<number>>(new Set());

  const getCurrentImageSrc = () => {
    let frame = Math.min(displayFrame, totalFrames - 1);
    
    // If the current frame failed to load, try the previous frame
    while (frame > 0 && failedFrames.has(frame)) {
      frame--;
    }
    
    return imagePaths[frame] || imagePaths[0];
  };

  const currentImageSrc = getCurrentImageSrc();
  
  // Preload next frame for smoother playback
  const nextFrame = Math.min(displayFrame + 1, totalFrames - 1);
  const nextImageSrc = imagePaths[nextFrame];

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
      {/* Main Image Display */}
      <div
        className="relative w-full h-full"
        style={{ opacity: loadingComplete ? 1 : 0.7 }}
      >
        <Image
          key={currentImageSrc}
          src={currentImageSrc}
          alt={`Initial scroll frame ${displayFrame}`}
          width={width}
          height={height}
          priority={priority || displayFrame < 20}
          unoptimized
          quality={100}
          onError={() => {
            console.warn(`Failed to load Initial Scroll frame: ${currentImageSrc}`);
            setFailedFrames(prev => new Set(prev).add(displayFrame));
          }}
          style={{
            objectFit: "contain",
            width: "100%",
            height: "100%",
            imageRendering: "auto",
            backfaceVisibility: "hidden",
            transform: "translateZ(0)" // Hardware acceleration
          }}
        />
        
        {/* Preload next frame invisibly */}
        {nextImageSrc && nextImageSrc !== currentImageSrc && (
          <Image
            src={nextImageSrc}
            alt="preload"
            width={width}
            height={height}
            unoptimized
            quality={100}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1
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
