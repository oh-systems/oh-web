import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(Observer);

interface ScrollConfig {
  enabled: boolean;
  onProgressUpdate: (progress: number) => void;
  maxProgress?: number;
}

export function useGSAPScroll({
  enabled,
  onProgressUpdate,
  maxProgress = 1.0,
}: ScrollConfig) {
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const observerRef = useRef<any>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // Handle smooth progress updates with GSAP
  const updateProgress = useCallback(
    (delta: number) => {
      targetProgressRef.current = gsap.utils.clamp(
        0,
        maxProgress,
        targetProgressRef.current + delta
      );

      // Kill existing tween and create new one for smooth interpolation
      if (tweenRef.current) {
        tweenRef.current.kill();
      }

      tweenRef.current = gsap.to(progressRef, {
        current: targetProgressRef.current,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: () => {
          onProgressUpdate(progressRef.current);
        },
      });
    },
    [onProgressUpdate, maxProgress]
  );

  // Setup GSAP Observer for wheel/touch events
  useEffect(() => {
    if (!enabled) return;

    const observer = Observer.create({
      type: "wheel,touch",
      wheelSpeed: -1,
      onChangeY: (self) => {
        const delta = -self.deltaY * 0.0003; // Adjust sensitivity
        updateProgress(delta);
      },
      tolerance: 10,
      preventDefault: true,
    });

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.kill();
        observerRef.current = null;
      }
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    };
  }, [enabled, updateProgress]);

  const scrollTo = useCallback(
    (progress: number, duration = 1) => {
      targetProgressRef.current = gsap.utils.clamp(0, maxProgress, progress);

      if (tweenRef.current) {
        tweenRef.current.kill();
      }

      tweenRef.current = gsap.to(progressRef, {
        current: targetProgressRef.current,
        duration,
        ease: "power2.inOut",
        onUpdate: () => {
          onProgressUpdate(progressRef.current);
        },
      });
    },
    [onProgressUpdate, maxProgress]
  );

  return {
    currentProgress: progressRef.current,
    scrollTo,
    setProgress: (progress: number) => {
      progressRef.current = progress;
      targetProgressRef.current = progress;
      onProgressUpdate(progress);
    },
  };
}
