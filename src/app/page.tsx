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
import { useAppContext } from "./AppContent";

export default function Home() {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [navigationFadeProgress, setNavigationFadeProgress] = useState(0);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [castSwapProgress, setCastSwapProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState<'overview' | 'mission' | 'space'>('overview');
  const [castAnimationProgress, setCastAnimationProgress] = useState(0);
  const [laptopSwapProgress, setLaptopSwapProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [laptopAnimationProgress, setLaptopAnimationProgress] = useState(0);
  const [descriptiveTextOpacity, setDescriptiveTextOpacity] = useState(0);
  const [secondHeroOpacity, setSecondHeroOpacity] = useState(0);
  const [castTextProgress, setCastTextProgress] = useState(0);
  const [firstHeroFadeOut, setFirstHeroFadeOut] = useState(0);
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
  const updateAnimationProgressRef = useRef<(() => void) | null>(null);

  // Handle sound toggle
  const handleSoundToggle = () => {
    console.log("Sound toggle called - before:", soundEnabled);
    setSoundEnabled(!soundEnabled);
    console.log("Sound toggled - after:", !soundEnabled);
  };

  // Handle navigation clicks
  const handleNavClick = (item: string) => {
    console.log("Navigation clicked:", item); // Debug log
    if (item === "about" || item === "contact") {
      setActiveCard(activeCard === item ? null : item); // Toggle card visibility
    } else if (item === "space") {
      setActiveCard(null); // Hide cards for Space
    }
  };

  // Handle section navigation clicks
  const handleSectionClick = (section: 'overview' | 'mission' | 'space') => {
    console.log("Section clicked:", section);
    
    // Stop auto-play and directly control scroll position
    isAutoPlayingRef.current = false;
    
    // Set scroll accumulator based on section (0 to window.innerHeight * 3)
    const maxScroll = window.innerHeight * 3;
    
    if (section === 'overview') {
      scrollAccumulatorRef.current = maxScroll * 0.2; // 20% through
      setCurrentSection('overview');
      setAnimationProgress(0.2);
    } else if (section === 'mission') {
      scrollAccumulatorRef.current = maxScroll * 0.7; // 70% through  
      setCurrentSection('mission');
      setAnimationProgress(0.7);
    } else if (section === 'space') {
      scrollAccumulatorRef.current = maxScroll * 0.95; // 95% through
      setCurrentSection('space');
      setAnimationProgress(0.95);
    }
    
    // Update auto-play time to current position
    autoPlayTimeRef.current = (scrollAccumulatorRef.current / maxScroll) * 45;
    
    // Force animation update
    if (updateAnimationProgressRef.current) {
      updateAnimationProgressRef.current();
    }
    
    // Resume auto-play after 2 seconds
    setTimeout(() => {
      isAutoPlayingRef.current = true;
      lastAutoPlayTimeRef.current = performance.now();
    }, 2000);
  };

  // ==================== STAGE CONFIGURATION ====================
  // Stage 1: Navigation & Ring Fade Out
  const STAGE_1_CONFIG = {
    fadeStartProgress: 0.001, // Start fading immediately (0.1% of scroll progress)
    fadeDuration: 0.02, // Complete fade over 2% of scroll progress - very quick fade
    slideDistance: 20, // Pixels to slide upward during fade animation
  };

  // Stage 2: Model Swap (Initial Scroll to Cast Shadows) - Sequential, no overlap
  const MODEL_SWAP_CONFIG = {
    swapStart: 0.55, // Start Cast Shadows after descriptive text completes
    swapEnd: 0.551, // Instant transition - 0.1% crossfade into Cast Shadows
    animationStart: 0.551, // Cast Shadows animation begins immediately
    animationEnd: 0.85, // Extended range for slower Cast Shadows animation
  };

  // Stage 3: Third Laptop Model Swap (Cast Shadows to Third Laptop)
  const LAPTOP_SWAP_CONFIG = {
    swapStart: 0.85, // Begin laptop after slower Cast Shadows range
    swapEnd: 0.851, // Instant transition - 0.1% crossfade into laptop
    animationStart: 0.851, // Laptop animation begins immediately
    animationEnd: 1.0, // Laptop runs for remaining scroll range
  }; // Text Sequence Configuration - Complete flow
  const TEXT_SEQUENCE = {
    // Phase 1: Original first hero text "OH exists to redefine..."
    firstHeroEnd: 0.25, // First hero text completes and fades

    // Phase 2: "THE FUTURE OF..." + descriptive text (both on right side)
    secondHeroStart: 0.27, // Start "THE FUTURE OF..." on right
    secondHeroEnd: 0.60, // Stay until Cast Shadows text appears
    descriptiveStart: 0.27, // Start descriptive text at same time
    descriptiveEnd: 0.60, // Stay until Cast Shadows text appears

    // Phase 3: Cast Shadows transition
    castShadowsStart: 0.55, // Cast Shadows model appears

    // Phase 4: Operating principles (all appear together)
    principlesStart: 0.60, // Start operating principles well after Cast Shadows transition starts
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

  // Scroll-to-progress animation system with auto-play
  useLayoutEffect(() => {
    let ticking = false;
    let animationFrameId: number;
    
    // Initialize refs
    scrollAccumulatorRef.current = 0;
    autoPlayTimeRef.current = 0; // Start immediately when content is visible
    lastAutoPlayTimeRef.current = performance.now();
    isAutoPlayingRef.current = true;

    const updateAnimationProgress = () => {
      // Wait until initial load is complete before allowing animation
      if (!initialLoadComplete) return;

      const maxScrollRange = window.innerHeight * 3; // 3 viewport heights for full animation

      // Auto-play progression when not scrolling
      if (isAutoPlayingRef.current) {
        const now = performance.now();
        const deltaTime = (now - lastAutoPlayTimeRef.current) / 1000; // Convert to seconds
        lastAutoPlayTimeRef.current = now;

        // Auto-play speed with 10-second initial delay
        autoPlayTimeRef.current += deltaTime;

        // Start auto-scroll immediately when content is visible
        if (autoPlayTimeRef.current >= 0) {
          const autoScrollProgress = (autoPlayTimeRef.current / 35) * maxScrollRange; // 35 seconds total animation (12s + 10s + 15s sequences)

          // Use auto-play progress if it's ahead of manual scroll
          if (autoScrollProgress > scrollAccumulatorRef.current) {
            scrollAccumulatorRef.current = Math.min(autoScrollProgress, maxScrollRange);
          }
        }
      }

      const rawProgress = scrollAccumulatorRef.current / maxScrollRange;

      // Apply smooth easing for more natural animation feel
      const clampedProgress = Math.min(rawProgress, 1.0);
      const easedProgress =
        clampedProgress * clampedProgress * (3 - 2 * clampedProgress); // smoothstep

      setAnimationProgress(easedProgress);

      // Update current section based on animation progress
      if (easedProgress < 0.55) {
        setCurrentSection('overview'); // Initial scroll sequence
      } else if (easedProgress < 0.92) {
        setCurrentSection('mission'); // Cast shadows sequence
      } else {
        setCurrentSection('space'); // Laptop sequence
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

      // Calculate Cast Shadows animation progress (for frame progression)
      let castAnimationProgress = 0;
      if (rawProgress >= MODEL_SWAP_CONFIG.animationStart) {
        // Cast Shadows is fully visible - calculate progress through its animation window
        const castStart = MODEL_SWAP_CONFIG.animationStart; // 40.1%
        const castEnd = MODEL_SWAP_CONFIG.animationEnd; // 65%
        const linearProgress = Math.min(
          (rawProgress - castStart) / (castEnd - castStart),
          1
        );

        // Use linear progression with no easing effects
        castAnimationProgress = linearProgress;
      }
      setCastAnimationProgress(castAnimationProgress);

      // Calculate first hero text fade out progress
      if (
        rawProgress >= TEXT_SEQUENCE.firstHeroEnd - 0.02 &&
        rawProgress <= TEXT_SEQUENCE.firstHeroEnd + 0.02
      ) {
        const fadeProgress =
          (rawProgress - (TEXT_SEQUENCE.firstHeroEnd - 0.02)) / 0.04;
        setFirstHeroFadeOut(fadeProgress);
      } else if (rawProgress > TEXT_SEQUENCE.firstHeroEnd + 0.02) {
        setFirstHeroFadeOut(1);
      } else {
        setFirstHeroFadeOut(0);
      }

      // Calculate second hero text ("THE FUTURE OF...") visibility - ensure complete fade before cast shadows
      if (
        rawProgress >= TEXT_SEQUENCE.secondHeroStart &&
        rawProgress <= TEXT_SEQUENCE.secondHeroEnd
      ) {
        const fadeInDuration = 0.05; // 5% for fade in
        const fadeOutStart = TEXT_SEQUENCE.secondHeroEnd - 0.08; // Start fade out 8% before end for complete fade

        if (rawProgress < TEXT_SEQUENCE.secondHeroStart + fadeInDuration) {
          // Fade in
          const fadeProgress =
            (rawProgress - TEXT_SEQUENCE.secondHeroStart) / fadeInDuration;
          setSecondHeroOpacity(fadeProgress);
        } else if (rawProgress > fadeOutStart) {
          // Fade out - ensure complete fade by cast shadows start
          const fadeProgress = (rawProgress - fadeOutStart) / 0.08;
          setSecondHeroOpacity(Math.max(0, 1 - fadeProgress));
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
        const fadeInDuration = 0.05; // 5% for fade in
        const fadeOutStart = TEXT_SEQUENCE.descriptiveEnd - 0.08; // Start fade out 8% before end for complete fade

        if (rawProgress < TEXT_SEQUENCE.descriptiveStart + fadeInDuration) {
          // Fade in
          const fadeProgress =
            (rawProgress - TEXT_SEQUENCE.descriptiveStart) / fadeInDuration;
          setDescriptiveTextOpacity(fadeProgress);
        } else if (rawProgress > fadeOutStart) {
          // Fade out - ensure complete fade by cast shadows start
          const fadeProgress = (rawProgress - fadeOutStart) / 0.08;
          setDescriptiveTextOpacity(Math.max(0, 1 - fadeProgress));
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
        const laptopStart = LAPTOP_SWAP_CONFIG.animationStart; // 57.1%
        const laptopEnd = LAPTOP_SWAP_CONFIG.animationEnd; // 100%
        const linearProgress = Math.min(
          (rawProgress - laptopStart) / (laptopEnd - laptopStart),
          1
        );

        // Apply smoothstep easing for smoother animation progression
        nextLaptopAnimationProgress =
          linearProgress * linearProgress * (3 - 2 * linearProgress);
      }
      setLaptopAnimationProgress(nextLaptopAnimationProgress);
    };
    
    // Make updateAnimationProgress accessible via ref
    updateAnimationProgressRef.current = updateAnimationProgress;

    const startAnimationLoop = () => {
      updateAnimationProgress();
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

      // Allow forward and backward scrolling with higher sensitivity
      scrollAccumulatorRef.current += e.deltaY * 1.5; // Increased sensitivity for better control
      scrollAccumulatorRef.current = Math.max(
        0,
        Math.min(scrollAccumulatorRef.current, window.innerHeight * 3)
      );

      // Reset auto-play timer to current position (accounting for 10s delay)
      autoPlayTimeRef.current = (scrollAccumulatorRef.current / (window.innerHeight * 3)) * 45;

      if (!ticking) {
        requestAnimationFrame(() => {
          updateAnimationProgress();
          ticking = false;
        });
        ticking = true;
      }

      // Resume auto-play after 2 seconds of no scrolling
      setTimeout(() => {
        isAutoPlayingRef.current = true;
        lastAutoPlayTimeRef.current = performance.now();
      }, 2000);
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

      scrollAccumulatorRef.current += deltaY * 3; // Higher sensitivity for touch
      scrollAccumulatorRef.current = Math.max(
        0,
        Math.min(scrollAccumulatorRef.current, window.innerHeight * 3)
      );

      touchStartY = touchY;

      // Reset auto-play timer to current position
      autoPlayTimeRef.current = (scrollAccumulatorRef.current / (window.innerHeight * 3)) * 45;
      if (!ticking) {
        requestAnimationFrame(() => {
          updateAnimationProgress();
          ticking = false;
        });
        ticking = true;
      }

      // Resume auto-play after 2 seconds of no interaction
      setTimeout(() => {
        isAutoPlayingRef.current = true;
        lastAutoPlayTimeRef.current = performance.now();
      }, 2000);
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
          scrollAccumulatorRef.current = window.innerHeight * 3; // Jump to end
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
          Math.min(scrollAccumulatorRef.current, window.innerHeight * 3)
        );

        // Reset auto-play timer to current position
        autoPlayTimeRef.current = (scrollAccumulatorRef.current / (window.innerHeight * 3)) * 45;
      }

      if (!ticking) {
        requestAnimationFrame(() => {
          updateAnimationProgress();
          ticking = false;
        });
        ticking = true;
      }

      // Resume auto-play after 2 seconds of no interaction
      setTimeout(() => {
        isAutoPlayingRef.current = true;
        lastAutoPlayTimeRef.current = performance.now();
      }, 2000);
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
      {console.log('Rendering Sound component, soundEnabled:', soundEnabled, 'transitionComplete:', transitionComplete)}
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

        {/* Scroll-driven Animation Content - only visible after initial load */}
        {initialLoadComplete && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center">
              {/* Initial Scroll sequence - no artificial fading, images handle their own transitions */}
              <div
                style={{
                  display: castSwapProgress > 0.5 ? "none" : "block", // Simply show/hide instead of fading
                  position: "absolute",
                  pointerEvents: castSwapProgress > 0.5 ? "none" : "auto",
                }}
              >
                <InitialScrollSequence
                  width={1000}
                  height={800}
                  scrollProgress={Math.min(
                    animationProgress / MODEL_SWAP_CONFIG.swapStart,
                    1
                  )} // Map 0-40% scroll to 0-100% sequence
                  priority={true}
                />
              </div>

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
                  scrollProgress={castAnimationProgress} // Use the new progress that maps 55-95% range to 0-100% frames
                  priority={castSwapProgress > 0.1} // Only prioritize when starting to show
                />
              </div>

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
                  width={Math.round(viewportDimensions.width * 0.8)}
                  height={Math.round(viewportDimensions.height * 0.8)}
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
      </div>
    </>
  );
}
