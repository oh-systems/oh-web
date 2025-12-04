"use client";

import { useState, useLayoutEffect, useRef, useEffect } from "react";
import {
  Navigation,
  SectionIndicator,
  Sound,
  ScrollDrivenText,
  InitialScrollSequence,
  InitialLoadSequence,
  CastShadowsSequence,
  ThirdLaptopSequence,
  CastShadowsText,
  CardDemo,
} from "../../components";
import { GlassSections } from "../../components/GlassSections";
import { useAppContext } from "./AppContent";

export default function Home() {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [scrollContentReady, setScrollContentReady] = useState(false);
  const [navigationFadeProgress, setNavigationFadeProgress] = useState(0);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [castSwapProgress, setCastSwapProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState<
    "overview" | "mission" | "space"
  >("overview");
  const [castAnimationProgress, setCastAnimationProgress] = useState(0);
  const [laptopSwapProgress, setLaptopSwapProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [laptopAnimationProgress, setLaptopAnimationProgress] = useState(0);
  const [rawProgress, setRawProgress] = useState(0);
  const [descriptiveTextOpacity, setDescriptiveTextOpacity] = useState(0);
  const [secondHeroOpacity, setSecondHeroOpacity] = useState(0);
  const [castTextProgress, setCastTextProgress] = useState(0);
  const [firstHeroFadeOut, setFirstHeroFadeOut] = useState(0);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [viewportDimensions, setViewportDimensions] = useState({
    width: 1920,
    height: 1080,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    contentVisible,
    transitionComplete,
    setNavigationFadeProgress: setContextFadeProgress,
  } = useAppContext();

  // Refs to access scroll variables from handleSectionClick
  const scrollAccumulatorRef = useRef(0);
  const isAutoPlayingRef = useRef(true);
  const autoPlayTimeRef = useRef(-10);
  const lastAutoPlayTimeRef = useRef(0);
  const laptopAnimationProgressRef = useRef(0);
  const castAnimationProgressRef = useRef(0);
  const updateAnimationProgressRef = useRef<(() => void) | null>(null);
  const autoPlayResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetScrollRef = useRef(0);

  // Handle sound toggle
  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Handle navigation clicks
  const handleNavClick = (item: string) => {
    if (item === "about") {
      setShowAbout(!showAbout);
      setActiveCard(null);
    } else if (item === "contact") {
      setShowContact(!showContact);
      setActiveCard(null);
    } else if (item === "space") {
      setActiveCard(null); // Hide cards for Space
      setShowAbout(false);
      setShowContact(false);
    }
  };

  // Handle section navigation clicks
  const handleSectionClick = (section: "overview" | "mission" | "space") => {
    // Stop auto-play and directly control scroll position
    isAutoPlayingRef.current = false;

    // Set scroll accumulator based on section (0 to window.innerHeight * 4.5 to accommodate laptop animation)
    const maxScroll = window.innerHeight * 4.5;

    if (section === "overview") {
      scrollAccumulatorRef.current = maxScroll * 0.2; // 20% through (within 0-55% overview range)
      setCurrentSection("overview");
      setAnimationProgress(0.2);
    } else if (section === "mission") {
      scrollAccumulatorRef.current = maxScroll * 0.7; // 70% through (within 55-90% mission range)
      setCurrentSection("mission");
      setAnimationProgress(0.7);
    } else if (section === "space") {
      scrollAccumulatorRef.current = maxScroll * 0.95; // 95% through (within 90-100% space range)
      setCurrentSection("space");
      setAnimationProgress(0.95);
    }

    // Update auto-play time to current position
    autoPlayTimeRef.current =
      (scrollAccumulatorRef.current / maxScroll) * 80;

    // Force animation update (this will recalculate section but should match what we just set)
    if (updateAnimationProgressRef.current) {
      updateAnimationProgressRef.current();
    }

    // Resume auto-play after 2 seconds
    scheduleAutoPlayResume();
  };

  // Helper function to schedule auto-play resumption
  const scheduleAutoPlayResume = () => {
    // Clear any existing timeout
    if (autoPlayResumeTimeoutRef.current) {
      clearTimeout(autoPlayResumeTimeoutRef.current);
    }

    // Resume immediately without delay for smoother experience
    autoPlayResumeTimeoutRef.current = setTimeout(() => {
      isAutoPlayingRef.current = true;
      lastAutoPlayTimeRef.current = performance.now();
      // Sync auto-play time to current scroll position to prevent catch-up
      const maxScrollRange = window.innerHeight * 4.5;
      autoPlayTimeRef.current = (scrollAccumulatorRef.current / maxScrollRange) * 80;
    }, 16); // Single frame delay (60fps) to avoid conflicts but maintain smoothness
  };

  // ==================== STAGE CONFIGURATION ====================
  // Stage 1: Navigation & Ring Fade Out
  const STAGE_1_CONFIG = {
    fadeStartProgress: 0.001, // Start fading immediately (0.1% of scroll progress)
    fadeDuration: 0.02, // Complete fade over 2% of scroll progress - very quick fade
    slideDistance: 20, // Pixels to slide upward during fade animation
  };

  // Stage 2: Model Swap (Initial Scroll to Cast Shadows) - black buffer transition
  const MODEL_SWAP_CONFIG = {
    swapStart: 0.25, // Start transition after initial scroll ends (20s/80s = 25%)
    swapEnd: 0.275, // Black buffer period (25% to 27.5%)
    animationStart: 0.28, // Cast Shadows animation begins after black buffer
    animationEnd: 0.78, // Cast Shadows ends at 78% (40s duration: 22.4s-62.4s)
  };

  // Stage 3: Third Laptop Model Swap (Cast Shadows to Third Laptop) - black buffer transition
  const LAPTOP_SWAP_CONFIG = {
    swapStart: 0.78, // Begin transition when Cast Shadows ends
    swapEnd: 0.8, // Black buffer period (78% to 80%)
    animationStart: 0.81, // Laptop animation begins after black buffer  
    animationEnd: 1.0, // Laptop animation completes at 100%
  }; // Text Sequence Configuration - Complete flow
  const TEXT_SEQUENCE = {
    // Phase 1: Original first hero text "OH exists to redefine..."
    firstHeroEnd: 0.15, // First hero text completes and fades

    // Phase 2: "THE FUTURE OF..." + descriptive text (both on right side)
    secondHeroStart: 0.17, // Start "THE FUTURE OF..." on right
    secondHeroEnd: 0.3, // Stay until Cast Shadows text appears
    descriptiveStart: 0.17, // Start descriptive text at same time
    descriptiveEnd: 0.3, // Stay until Cast Shadows text appears

    // Phase 3: Cast Shadows transition
    castShadowsStart: 0.25, // Cast Shadows model appears

    // Phase 4: Operating principles (all appear together)
    principlesStart: 0.32, // Start operating principles after Cast Shadows transition
    principlesEnd: 0.89, // End as Cast Shadows fades

    // Phase 5: Laptop (no text)
    laptopStart: 0.92, // Laptop appears with no text
  };
  // =============================================================

  // Track viewport dimensions for full-screen CastShadowsSequence
  useLayoutEffect(() => {
    const updateDimensions = () => {
      setViewportDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    updateDimensions();

    // Listen for resize
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Sync navigationFadeProgress to context for PermanentRing
  useEffect(() => {
    setContextFadeProgress(navigationFadeProgress);
  }, [navigationFadeProgress, setContextFadeProgress]);

  // Update initialLoadComplete when content becomes visible
  useEffect(() => {
    if (contentVisible && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [contentVisible, initialLoadComplete]);

  // Handle 2-second delay before showing scroll content
  useEffect(() => {
    if (initialLoadComplete && !scrollContentReady) {
      const timer = setTimeout(() => {
        setScrollContentReady(true);
        // Reset auto-play timeline so Initial Scroll starts from frame 0
        autoPlayTimeRef.current = 0;
        scrollAccumulatorRef.current = 0;
        targetScrollRef.current = 0;
        lastAutoPlayTimeRef.current = performance.now();
        isAutoPlayingRef.current = true; // Ensure auto-play is enabled
        setScrollContentReady(true);
        // Reset auto-play timeline so Initial Scroll starts from frame 0
        autoPlayTimeRef.current = 0;
        scrollAccumulatorRef.current = 0;
        targetScrollRef.current = 0;
        lastAutoPlayTimeRef.current = performance.now();
        isAutoPlayingRef.current = true; // Ensure auto-play is enabled
      }, 2000); // 2-second delay

      return () => clearTimeout(timer);
    }
  }, [initialLoadComplete, scrollContentReady]);

  // Scroll-to-progress animation system with auto-play
  useLayoutEffect(() => {
    if (!scrollContentReady) return; // Only start animation when content is ready
    
    let animationFrameId: number;

    // Initialize refs only when starting
    if (autoPlayTimeRef.current === undefined || autoPlayTimeRef.current === null) {
      scrollAccumulatorRef.current = 0;
      targetScrollRef.current = 0;
      autoPlayTimeRef.current = 0;
      lastAutoPlayTimeRef.current = performance.now();
      isAutoPlayingRef.current = true;
    }

    const updateAnimationProgress = () => {
      // Wait until scroll content is ready before allowing animation
      if (!scrollContentReady) return;

      const maxScrollRange = window.innerHeight * 4.5; // 4.5 viewport heights to accommodate extended Cast Shadows (162.2%) and laptop animations

      // Auto-play progression when not scrolling
      if (isAutoPlayingRef.current) {
        const now = performance.now();
        const deltaTime = (now - lastAutoPlayTimeRef.current) / 1000; // Convert to seconds
        lastAutoPlayTimeRef.current = now;

        // Auto-play speed - smoothly progress from current position
        autoPlayTimeRef.current += deltaTime;

        // Start auto-scroll immediately when content is visible
        if (autoPlayTimeRef.current >= 0) {
          const autoScrollProgress =
            (autoPlayTimeRef.current / 80) * maxScrollRange; // 80 seconds total to reach 220% (laptop animation completion)

          // Direct progression at normal speed to avoid catch-up behavior
          scrollAccumulatorRef.current = autoScrollProgress;
          scrollAccumulatorRef.current = Math.min(
            scrollAccumulatorRef.current,
            maxScrollRange * 2.3
          );

          // Keep target in sync during auto-play
          targetScrollRef.current = scrollAccumulatorRef.current;
        }
      }

      const rawProgress = scrollAccumulatorRef.current / maxScrollRange;
      setRawProgress(rawProgress);

      // Apply smooth easing for more natural animation feel
      const clampedProgress = Math.min(rawProgress, 1.5); // Allow progress up to 1.5 for laptop animation
      const easedProgress =
        clampedProgress * clampedProgress * (3 - 2 * clampedProgress); // smoothstep

      setAnimationProgress(easedProgress);

      // Update current section based on raw progress (always update for correct section indicator)
      if (rawProgress < 0.55) {
        setCurrentSection("overview"); // Initial scroll sequence
      } else if (rawProgress < 0.9) {
        // Updated to match new Cast Shadows range
        setCurrentSection("mission"); // Cast shadows sequence
      } else {
        setCurrentSection("space"); // Laptop sequence
      }

      // Calculate fade progress for navigation and ring (Stage 1)
      if (rawProgress >= STAGE_1_CONFIG.fadeStartProgress) {
        const fadeProgress = Math.min(
          (rawProgress - STAGE_1_CONFIG.fadeStartProgress) /
            STAGE_1_CONFIG.fadeDuration,
          1
        );

        // Apply easing to fade for smooth transition
        const easedFadeProgress =
          fadeProgress * fadeProgress * (3 - 2 * fadeProgress);

        setNavigationFadeProgress(easedFadeProgress);
      } else {
        // Reset fade progress when scrolling back
        setNavigationFadeProgress(0);
      }

      // Calculate model swap progress (Stage 2: Initial Scroll -> Cast Shadows)
      if (rawProgress >= MODEL_SWAP_CONFIG.swapStart) {
        const swapProgress = Math.min(
          (rawProgress - MODEL_SWAP_CONFIG.swapStart) /
            (MODEL_SWAP_CONFIG.swapEnd - MODEL_SWAP_CONFIG.swapStart),
          1
        );

        // Apply smoothstep easing for natural crossfade
        const easedSwapProgress =
          swapProgress * swapProgress * (3 - 2 * swapProgress);

        setCastSwapProgress(easedSwapProgress);
      } else {
        // Reset swap progress when scrolling back
        setCastSwapProgress(0);
      }

      // Calculate Cast Shadows animation progress - match laptop approach exactly
      let nextCastAnimationProgress = 0;
      if (rawProgress >= MODEL_SWAP_CONFIG.animationStart) {
        const castStart = MODEL_SWAP_CONFIG.animationStart; // 55.1%
        const castEnd = MODEL_SWAP_CONFIG.animationEnd; // 90%
        const linearProgress =
          (rawProgress - castStart) / (castEnd - castStart);

        // Use linear progress for consistent, smooth animation speed - no clamping to allow full range
        nextCastAnimationProgress = Math.max(0, linearProgress);
      }

      // Only update state if the value actually changed to prevent render loops
      if (
        Math.abs(nextCastAnimationProgress - castAnimationProgressRef.current) >
        0.001
      ) {
        castAnimationProgressRef.current = nextCastAnimationProgress;
        setCastAnimationProgress(nextCastAnimationProgress);
      }

      // Calculate first hero text fade out progress - slow and smooth
      if (
        rawProgress >= TEXT_SEQUENCE.firstHeroEnd - 0.05 &&
        rawProgress <= TEXT_SEQUENCE.firstHeroEnd + 0.05
      ) {
        const fadeProgress =
          (rawProgress - (TEXT_SEQUENCE.firstHeroEnd - 0.05)) / 0.1;
        // Apply smooth easing
        const smoothFade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
        setFirstHeroFadeOut(smoothFade);
      } else if (rawProgress > TEXT_SEQUENCE.firstHeroEnd + 0.05) {
        setFirstHeroFadeOut(1);
      } else {
        setFirstHeroFadeOut(0);
      }

      // Calculate second hero text ("THE FUTURE OF...") visibility - ensure complete fade before cast shadows
      if (
        rawProgress >= TEXT_SEQUENCE.secondHeroStart &&
        rawProgress <= TEXT_SEQUENCE.secondHeroEnd
      ) {
        const fadeInDuration = 0.08; // 8% for slower fade in
        const fadeOutStart = TEXT_SEQUENCE.secondHeroEnd - 0.12; // Start fade out 12% before end for slower fade

        if (rawProgress < TEXT_SEQUENCE.secondHeroStart + fadeInDuration) {
          // Fade in with smooth easing
          const fadeProgress =
            (rawProgress - TEXT_SEQUENCE.secondHeroStart) / fadeInDuration;
          const smoothFade =
            fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
          setSecondHeroOpacity(smoothFade);
        } else if (rawProgress > fadeOutStart) {
          // Fade out with smooth easing - ensure complete fade by cast shadows start
          const fadeProgress = (rawProgress - fadeOutStart) / 0.12;
          const smoothFade =
            fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
          setSecondHeroOpacity(Math.max(0, 1 - smoothFade));
        } else {
          // Fully visible
          setSecondHeroOpacity(1);
        }
      } else {
        setSecondHeroOpacity(0);
      }

      // Calculate descriptive text visibility - ensure complete fade before cast shadows
      if (
        rawProgress >= TEXT_SEQUENCE.descriptiveStart &&
        rawProgress <= TEXT_SEQUENCE.descriptiveEnd
      ) {
        const fadeInDuration = 0.08; // 8% for slower fade in
        const fadeOutStart = TEXT_SEQUENCE.descriptiveEnd - 0.12; // Start fade out 12% before end for slower fade

        if (rawProgress < TEXT_SEQUENCE.descriptiveStart + fadeInDuration) {
          // Fade in with smooth easing
          const fadeProgress =
            (rawProgress - TEXT_SEQUENCE.descriptiveStart) / fadeInDuration;
          const smoothFade =
            fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
          setDescriptiveTextOpacity(smoothFade);
        } else if (rawProgress > fadeOutStart) {
          // Fade out with smooth easing - ensure complete fade by cast shadows start
          const fadeProgress = (rawProgress - fadeOutStart) / 0.12;
          const smoothFade =
            fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
          setDescriptiveTextOpacity(Math.max(0, 1 - smoothFade));
        } else {
          // Fully visible
          setDescriptiveTextOpacity(1);
        }
      } else {
        setDescriptiveTextOpacity(0);
      }

      // Calculate Cast Shadows operating principles progress
      if (
        rawProgress >= TEXT_SEQUENCE.principlesStart &&
        rawProgress <= TEXT_SEQUENCE.principlesEnd
      ) {
        const textProgress =
          (rawProgress - TEXT_SEQUENCE.principlesStart) /
          (TEXT_SEQUENCE.principlesEnd - TEXT_SEQUENCE.principlesStart);
        setCastTextProgress(textProgress);
      } else {
        setCastTextProgress(0);
      }

      // Calculate laptop swap progress (Stage 3: Cast Shadows -> Third Laptop)
      if (rawProgress >= LAPTOP_SWAP_CONFIG.swapStart) {
        const laptopProgress = Math.min(
          (rawProgress - LAPTOP_SWAP_CONFIG.swapStart) /
            (LAPTOP_SWAP_CONFIG.swapEnd - LAPTOP_SWAP_CONFIG.swapStart),
          1
        );

        // Apply smoothstep easing for natural crossfade
        const easedLaptopProgress =
          laptopProgress * laptopProgress * (3 - 2 * laptopProgress);

        setLaptopSwapProgress(easedLaptopProgress);
      } else {
        // Reset laptop swap progress when scrolling back
        setLaptopSwapProgress(0);
      }

      // Calculate laptop animation progress across its full window
      let nextLaptopAnimationProgress = 0;
      if (rawProgress >= LAPTOP_SWAP_CONFIG.animationStart) {
        const laptopStart = LAPTOP_SWAP_CONFIG.animationStart; // 90.1%
        const laptopEnd = LAPTOP_SWAP_CONFIG.animationEnd; // 150%
        const linearProgress =
          (rawProgress - laptopStart) / (laptopEnd - laptopStart);

        // Use linear progress for consistent, smooth animation speed - no clamping to allow full range
        nextLaptopAnimationProgress = Math.max(0, linearProgress);
      }

      // Only update state if the value actually changed to prevent render loops
      if (
        Math.abs(
          nextLaptopAnimationProgress - laptopAnimationProgressRef.current
        ) > 0.001
      ) {
        laptopAnimationProgressRef.current = nextLaptopAnimationProgress;
        setLaptopAnimationProgress(nextLaptopAnimationProgress);
      }
    };

    // Make updateAnimationProgress accessible via ref
    updateAnimationProgressRef.current = updateAnimationProgress;

    let lastFrameTime = 0;
    const startAnimationLoop = (currentTime: number = 0) => {
      // Throttle to 60fps to prevent excessive updates
      if (currentTime - lastFrameTime >= 16.67) {
        // ~60fps
        updateAnimationProgress();
        lastFrameTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(startAnimationLoop);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!initialLoadComplete) return;

      // Don't prevent default if clicking on navigation
      if ((e.target as Element)?.closest(".navigation-container")) {
        return;
      }

      e.preventDefault(); // Prevent page scroll

      // Manual scroll takes over from auto-play
      isAutoPlayingRef.current = false;

      // Optimized scroll speed limiting with adaptive sensitivity
      const currentProgress =
        scrollAccumulatorRef.current / (window.innerHeight * 4.5);
      const inCastShadowsRange =
        currentProgress >= 0.55 && currentProgress < 0.9;
      const inLaptopRange = currentProgress >= 0.9;

      // Adaptive scroll sensitivity based on current section
      let scrollMultiplier = 0.6; // Default for initial sections
      if (inCastShadowsRange) {
        scrollMultiplier = 0.08; // Much slower in cast shadows - 1200 frames need very fine control
      } else if (inLaptopRange) {
        scrollMultiplier = 0.25; // Increased from 0.15 for smoother laptop movement
      }

      const scrollDelta = Math.max(
        -12,
        Math.min(12, e.deltaY * scrollMultiplier)
      );

      // Direct update without extra interpolation for better performance - allow scrolling beyond base range for extended Cast Shadows animation
      targetScrollRef.current = Math.max(
        0,
        Math.min(
          targetScrollRef.current + scrollDelta,
          window.innerHeight * 4.5 * 2.3
        )
      );

      // Adaptive lerp for smoother feedback based on scroll speed and section
      const scrollSpeed = Math.abs(
        targetScrollRef.current - scrollAccumulatorRef.current
      );
      let lerpFactor = 0.2; // Base lerp factor

      if (inCastShadowsRange) {
        // Cast Shadows needs smooth movement without lag-induced oscillation
        if (scrollSpeed < 3) {
          lerpFactor = 0.7; // Very responsive for tiny movements
        } else if (scrollSpeed < 10) {
          lerpFactor = 0.5; // Good response for small movements
        } else if (scrollSpeed < 30) {
          lerpFactor = 0.25; // Balanced for medium movements
        } else {
          lerpFactor = 0.18; // Still responsive enough to prevent oscillation
        }
      } else if (inLaptopRange && scrollSpeed < 20) {
        lerpFactor = 0.35; // More responsive in laptop section for small movements
      } else if (scrollSpeed > 100) {
        lerpFactor = 0.12; // Slower for big jumps to prevent jarring
      } else if (scrollSpeed < 10) {
        lerpFactor = 0.4; // Very responsive for fine movements
      }

      // Apply deadzone to prevent oscillation in Cast Shadows
      const scrollDiff = targetScrollRef.current - scrollAccumulatorRef.current;
      const deadzone = inCastShadowsRange ? 0.5 : 0.1; // Larger deadzone for Cast Shadows

      if (Math.abs(scrollDiff) > deadzone) {
        scrollAccumulatorRef.current += scrollDiff * lerpFactor;
      } else {
        // Snap to target when very close to prevent micro-oscillations
        scrollAccumulatorRef.current = targetScrollRef.current;
      }

      // Update auto-play timer to current position for smooth continuation
      autoPlayTimeRef.current =
        (scrollAccumulatorRef.current / (window.innerHeight * 4.5)) * 45;

      // Always update animation progress for smooth scrolling
      updateAnimationProgress();

      // Resume auto-play after 3 seconds of no scrolling (longer for smoother UX)
      scheduleAutoPlayResume();
    };

    // Handle touch events for mobile/trackpad
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (!initialLoadComplete) return;
      // Don't handle if touching navigation
      if ((e.target as Element)?.closest(".navigation-container")) {
        return;
      }
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!initialLoadComplete) return;

      // Don't prevent default if touching navigation
      if ((e.target as Element)?.closest(".navigation-container")) {
        return;
      }

      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      // Manual touch takes over from auto-play
      isAutoPlayingRef.current = false;

      // Optimized touch handling
      const currentProgress =
        scrollAccumulatorRef.current / (window.innerHeight * 4.5);
      const inLaptopRange = currentProgress >= 0.9;

      const limitedDelta = Math.max(
        -15,
        Math.min(15, deltaY * (inLaptopRange ? 0.45 : 0.6))
      );

      targetScrollRef.current = Math.max(
        0,
        Math.min(targetScrollRef.current + limitedDelta, window.innerHeight * 4.5 * 2.3)
      );

      scrollAccumulatorRef.current +=
        (targetScrollRef.current - scrollAccumulatorRef.current) * 0.3;

      touchStartY = touchY;

      // Update auto-play timer to current position for smooth continuation
      autoPlayTimeRef.current =
        (scrollAccumulatorRef.current / (window.innerHeight * 4.5)) * 80;

      // Always update animation progress for smooth scrolling
      updateAnimationProgress();

      // Resume auto-play after 2 seconds of no scrolling
      scheduleAutoPlayResume();
    };

    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!initialLoadComplete) return;

      let delta = 0;
      switch (e.key) {
        case "ArrowUp":
        case "ArrowLeft":
          delta = -50; // Move backward
          break;
        case "ArrowDown":
        case "ArrowRight":
          delta = 50; // Move forward
          break;
        case "Home":
          scrollAccumulatorRef.current = 0; // Jump to beginning
          autoPlayTimeRef.current = -10; // Reset to start of delay period
          break;
        case "End":
          scrollAccumulatorRef.current = window.innerHeight * 4.5 * 2.3; // Jump to end
          autoPlayTimeRef.current = 45; // Full progression time
          break;
        default:
          return;
      }

      e.preventDefault();

      // Manual control takes over from auto-play
      isAutoPlayingRef.current = false;

      if (delta !== 0) {
        scrollAccumulatorRef.current += delta;
        scrollAccumulatorRef.current = Math.max(
          0,
          Math.min(scrollAccumulatorRef.current, window.innerHeight * 4.5 * 2.3)
        );

        // Reset auto-play timer to current position
        autoPlayTimeRef.current =
          (scrollAccumulatorRef.current / (window.innerHeight * 4.5)) * 80;
      }

      // Always update for smooth scrolling
      updateAnimationProgress();

      // Resume auto-play after 2 seconds of no interaction
      scheduleAutoPlayResume();
    };

    // Start the animation loop
    startAnimationLoop();

    // Add event listeners
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    scrollContentReady,
    initialLoadComplete,
    STAGE_1_CONFIG.fadeStartProgress,
    STAGE_1_CONFIG.fadeDuration,
    MODEL_SWAP_CONFIG.swapStart,
    MODEL_SWAP_CONFIG.swapEnd,
    MODEL_SWAP_CONFIG.animationStart,
    MODEL_SWAP_CONFIG.animationEnd,
    LAPTOP_SWAP_CONFIG.swapStart,
    LAPTOP_SWAP_CONFIG.swapEnd,
    LAPTOP_SWAP_CONFIG.animationStart,
    LAPTOP_SWAP_CONFIG.animationEnd,
    TEXT_SEQUENCE.firstHeroEnd,
    TEXT_SEQUENCE.secondHeroStart,
    TEXT_SEQUENCE.secondHeroEnd,
    TEXT_SEQUENCE.descriptiveStart,
    TEXT_SEQUENCE.descriptiveEnd,
    TEXT_SEQUENCE.principlesStart,
    TEXT_SEQUENCE.principlesEnd,
  ]);

  // Don't render main content until transition is complete
  if (!transitionComplete) {
    return null;
  }

  return (
    <>
      {/* Global styles to prevent scrolling */}
      <style jsx global>{`
        html,
        body {
          overflow: hidden;
          height: 100vh;
          margin: 0;
          padding: 0;
        }
      `}</style>

      {/* Navigation rendered completely outside main container to avoid event conflicts */}
      <Navigation
        onNavClick={handleNavClick}
        style={{
          opacity: 1, // Always visible once transition completes
          transform: `translateY(0px)`,
          transition: "opacity 0.3s ease-in-out",
          position: "fixed",
          top: 0,
          right: "40px",
          zIndex: 999999999, // Extremely high to ensure it's above permanent ring
          pointerEvents: "auto",
        }}
      />

      {/* Section Indicator - vertical navigation on left side */}
      <SectionIndicator
        currentSection={currentSection}
        onSectionClick={handleSectionClick}
        style={{
          opacity: 1, // Always visible once transition completes
          transition: "opacity 0.3s ease-in-out",
        }}
      />

      {/* Sound Control - bottom left corner */}
      <Sound
        isEnabled={soundEnabled}
        onToggle={handleSoundToggle}
        style={{
          opacity: 1, // Always visible once transition completes
          transition: "opacity 0.3s ease-in-out",
          zIndex: 999999998, // High z-index to ensure visibility
        }}
      />

      <div
        ref={containerRef}
        className="font-sans min-h-screen h-screen relative overflow-hidden bg-black"
        style={{
          height: "100vh",
          position: "fixed",
          width: "100%",
          top: 0,
          left: 0,
        }}
      >
        {/* Permanent Ring fade is now handled in AppContent.tsx - we apply fade to that ring */}

        {/* Initial Load State - 3D INITIAL_LOAD model */}
        {!initialLoadComplete && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <InitialLoadSequence
              width={800}
              height={600}
              autoPlay={true}
              startAnimation={true}
              onSequenceComplete={() => {
                setInitialLoadComplete(true);
              }}
              priority={true}
            />

            {/* Loading text */}
            <div className="absolute bottom-32 text-white text-center">
              <div className="text-lg mb-2">Loading Experience</div>
              <div className="text-sm opacity-70">Please wait...</div>
            </div>
          </div>
        )}

        {/* Scroll-driven Animation Content - only visible after initial load + 2s delay */}
        {scrollContentReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center">
              {/* Initial Scroll sequence - no artificial fading, images handle their own transitions */}
              <div
                style={{
                  display: rawProgress < MODEL_SWAP_CONFIG.swapStart ? "block" : "none", // Show only during initial scroll period
                  position: "absolute",
                  pointerEvents: rawProgress < MODEL_SWAP_CONFIG.swapStart ? "auto" : "none",
                }}
              >
                <InitialScrollSequence
                  width={1000}
                  height={800}
                  scrollProgress={Math.min(rawProgress / MODEL_SWAP_CONFIG.swapStart, 1)} // Map 0-25% raw progress to 0-100% sequence
                  priority={true}
                />
              </div>

              {/* Black buffer overlay between Initial Scroll and Cast Shadows */}
              <div
                style={{
                  display: (rawProgress >= MODEL_SWAP_CONFIG.swapStart && rawProgress <= MODEL_SWAP_CONFIG.swapEnd) ? "block" : "none",
                  position: "absolute",
                  inset: 0,
                  width: "100vw",
                  height: "100vh",
                  backgroundColor: "black",
                  zIndex: 100,
                }}
              />

              {/* Cast Shadows sequence - no artificial fading, images handle their own transitions */}
              <div
                style={{
                  display:
                    castSwapProgress < 0.5 || laptopSwapProgress > 0.5
                      ? "none"
                      : "flex",
                  position: "absolute",
                  inset: 0, // Full-screen positioning
                  width: "100vw",
                  height: "100vh",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents:
                    castSwapProgress < 0.5 || laptopSwapProgress > 0.5
                      ? "none"
                      : "auto",
                }}
              >
                <CastShadowsSequence
                  width={viewportDimensions.width}
                  height={viewportDimensions.height}
                  scrollProgress={castAnimationProgress}
                  priority={castSwapProgress > 0.1}
                  fps={30}
                />
              </div>

              {/* Black buffer overlay between Cast Shadows and Third Laptop */}
              <div
                style={{
                  display: (rawProgress >= LAPTOP_SWAP_CONFIG.swapStart && rawProgress <= LAPTOP_SWAP_CONFIG.swapEnd) ? "block" : "none",
                  position: "absolute",
                  inset: 0,
                  width: "100vw",
                  height: "100vh",
                  backgroundColor: "black",
                  zIndex: 100,
                }}
              />

              {/* Third Laptop sequence - no artificial fading, images handle their own transitions */}
              <div
                style={{
                  display: laptopSwapProgress < 0.5 ? "none" : "flex",
                  position: "absolute",
                  inset: 0, // Full-screen positioning
                  width: "100vw",
                  height: "100vh",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: laptopSwapProgress < 0.5 ? "none" : "auto",
                }}
              >
                <ThirdLaptopSequence
                  width={viewportDimensions.width}
                  height={viewportDimensions.height}
                  scrollProgress={laptopAnimationProgress}
                  priority={laptopSwapProgress > 0.1} // Only prioritize when starting to show
                />
              </div>
            </div>

            {/* First Hero Text - with extra space for upward movement */}
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 pl-16"
              style={{ paddingTop: "100px" }}
            >
              {(() => {
                const opacity = Math.max(0, 1 - firstHeroFadeOut);
                const shouldHide = firstHeroFadeOut >= 1;

                return (
                  <div
                    style={{
                      opacity,
                      transform: `translateY(${firstHeroFadeOut * 20}px)`,
                      pointerEvents: opacity < 0.05 ? "none" : "auto",
                      visibility: shouldHide ? "hidden" : "visible",
                      transition:
                        "opacity 0.5s ease-out, transform 0.5s ease-out",
                    }}
                  >
                    <ScrollDrivenText
                      heroLines={[
                        "OH exists to redefine e-commerce by turning online shopping into immersive,",
                        "spatial experiences. This is the foundation for a new kind of digital reality.",
                      ]}
                      fontSize={20}
                      lineHeightMultiplier={1.3}
                      scrollProgress={animationProgress}
                      scrollThreshold={0.05}
                      animationDuration={0.15}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Second Hero Text - "THE FUTURE OF E-COMMERCE, TODAY" (right side) */}
            <div
              className="absolute right-16 z-50"
              style={{
                top: "55%",
                opacity: secondHeroOpacity,
                transform: `translateY(-50%) translateY(${
                  secondHeroOpacity > 0.05 ? 300 * (1 - secondHeroOpacity) : 0
                }px)`, // Center vertically + fade in from below, but stop transform when nearly invisible
                transition: "none", // No CSS transitions for smooth scrubbing
                visibility: secondHeroOpacity < 0.01 ? "hidden" : "visible", // Hide completely when fully faded
              }}
            >
              <ScrollDrivenText
                heroLines={["THE FUTURE OF", "E-COMMERCE,", "TODAY."]}
                fontSize={96}
                className=""
                textAlign="right"
                style={{ lineHeight: 0.75 }}
                lineHeightMultiplier={1.0}
                scrollProgress={animationProgress}
                scrollThreshold={TEXT_SEQUENCE.secondHeroStart}
                animationDuration={0.2}
                stopAtMiddle={false}
              />
            </div>

            {/* Descriptive Text - About Oh (right side, below second hero) */}
            <div
              className="absolute right-16 z-50"
              style={{
                top: "85%",
                opacity: descriptiveTextOpacity,
                transform: `translateY(-50%) translateY(${
                  300 * (1 - descriptiveTextOpacity)
                }px)`, // Center vertically + fade in from below
                transition: "none", // No CSS transitions for smooth scrubbing
              }}
            >
              <ScrollDrivenText
                heroLines={[
                  "Oh builds immersive environments for commerce and culture. We replace static",
                  "websites with spatial systems powered by Unreal Engine, AI, and cloud",
                  "infrastructure. Our work spans both digital and physical domains and is built to",
                  "scale with the future of interaction.",
                ]}
                fontSize={20}
                className=""
                textAlign="right"
                style={{}}
                lineHeightMultiplier={1.0}
                scrollProgress={animationProgress}
                scrollThreshold={TEXT_SEQUENCE.descriptiveStart}
                animationDuration={0.2}
                stopAtMiddle={false}
              />
            </div>

            {/* Cast Shadows Operating Principles Text Sequence */}
            <div className="absolute inset-0 z-40 pointer-events-none">
              <CastShadowsText
                scrollProgress={castTextProgress}
                fadeOutProgress={0} // No longer needed since we handle fade separately
              />
            </div>

            {/* No third hero text - laptop appears without text */}
          </div>
        )}

        {/* Card Demo Component - for visual display */}
        <CardDemo activeCard={activeCard} />

        {/* Glass Sections for About and Contact */}
        <GlassSections
          showAbout={showAbout}
          showContact={showContact}
          onAboutClose={() => setShowAbout(false)}
          onContactClose={() => setShowContact(false)}
        />
      </div>
    </>
  );
}
