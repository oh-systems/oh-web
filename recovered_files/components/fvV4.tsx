"use client";

import { useState, useLayoutEffect, useRef, useEffect, useMemo } from "react";
import {
  Navigation,
  SectionIndicator,
  ScrollDrivenText,
  InitialScrollSequence,
  InitialLoadSequence,
  CastShadowsSequence,
  ThirdLaptopSequence,
  CastShadowsText,
  CardDemo,
  SoundControls,
} from "../../components";
import { useAppContext } from "./AppContent";

export default function Home() {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [initialScrollProgress, setInitialScrollProgress] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [navigationFadeProgress, setNavigationFadeProgress] = useState(0);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [castSwapProgress, setCastSwapProgress] = useState(0);
  const [castAnimationProgress, setCastAnimationProgress] = useState(0);
  const [laptopSwapProgress, setLaptopSwapProgress] = useState(0);
  const [laptopAnimationProgress, setLaptopAnimationProgress] = useState(0);
  const [descriptiveTextOpacity, setDescriptiveTextOpacity] = useState(0);
  const [secondHeroOpacity, setSecondHeroOpacity] = useState(0);
  const [secondHeroMoveProgress, setSecondHeroMoveProgress] = useState(0);
  const [secondHeroFadeOut, setSecondHeroFadeOut] = useState(0);
  const [descriptiveTextFadeOut, setDescriptiveTextFadeOut] = useState(0);
  const [castTextProgress, setCastTextProgress] = useState(0);
  const [physicalIntegrationsOpacity, setPhysicalIntegrationsOpacity] =
    useState(0);
  const [firstHeroFadeOut, setFirstHeroFadeOut] = useState(0);
  const [viewportDimensions, setViewportDimensions] = useState({
    width: 1920,
    height: 1080,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isManualNavigationRef = useRef(false);
  const manualProgressRef = useRef<number | null>(null);
  const initialLoadCompleteRef = useRef(false);
  
  // Section tracking for indicator
  const getCurrentSection = (): 'overview' | 'mission' | 'space' => {
    if (animationProgress <= 0.286) return 'overview'; // Initial scroll sequence
    if (animationProgress <= 0.9) return 'mission'; // Cast Shadows sequence
    return 'space'; // Third laptop sequence
  };
  
  const currentSection = getCurrentSection();
  const {
    contentVisible,
    transitionComplete,
    setNavigationFadeProgress: setContextFadeProgress,
  } = useAppContext();

  // Handle navigation clicks
  const handleNavClick = (item: string) => {
    console.log("Navigation clicked:", item); // Debug log
    if (item === "about" || item === "contact") {
      setActiveCard(activeCard === item ? null : item); // Toggle card visibility
    } else if (item === "space") {
      setActiveCard(null); // Hide cards for Space
    }
  };

  // Handle section indicator clicks
  const handleSectionClick = (section: 'overview' | 'mission' | 'space') => {
    console.log('Section clicked:', section); // Debug log
    let targetProgress = 0;
    
    switch (section) {
      case 'overview':
        targetProgress = 0.1; // Go to beginning of overview
        break;
      case 'mission':
        targetProgress = 0.5; // Go to middle of cast shadows
        break;
      case 'space':
        targetProgress = 0.95; // Go to laptop sequence
        break;
    }
    
    console.log('Setting animation progress to:', targetProgress); // Debug log
    
    // Pause auto-play temporarily when manually navigating
    isManualNavigationRef.current = true;
    manualProgressRef.current = targetProgress;
    setAnimationProgress(targetProgress);
    
    // Resume auto-play after a longer delay to ensure navigation works
    setTimeout(() => {
      isManualNavigationRef.current = false;
      manualProgressRef.current = null;
      console.log('Resumed auto-play'); // Debug log
    }, 5000); // 5 second pause to allow user to see the section
  };

  // ==================== STAGE CONFIGURATION ====================
  // Stage 1: Navigation & Ring Fade Out
  const STAGE_1_CONFIG = useMemo(() => ({
    fadeStartProgress: 0.01, // Start fading at 1% of scroll progress (almost immediate)
    fadeDuration: 0.08, // Complete fade over 8% of scroll progress (1% to 9%) - very quick fade
    slideDistance: 20, // Pixels to slide upward during fade animation
  }), []);

  // Stage 2: Model Swap (Initial Scroll to Cast Shadows) - Sequential, no overlap
  const MODEL_SWAP_CONFIG = useMemo(() => ({
    swapStart: 0.286, // Start Cast Shadows after 20 seconds (20/70 = 0.286)
    swapEnd: 0.296, // Wider 1% transition window for smoother swap
    animationStart: 0.296, // Cast Shadows animation begins after transition
    animationEnd: 0.9, // Cast Shadows runs longer for slower sequence
  }), []);

  // Stage 3: Third Laptop Model Swap (Cast Shadows to Third Laptop)
  const LAPTOP_SWAP_CONFIG = useMemo(() => ({
    swapStart: 0.9, // Begin laptop transition later to accommodate longer Cast Shadows
    swapEnd: 0.92, // Slower crossfade transition
    animationStart: 0.92, // Laptop animation begins after crossfade
    animationEnd: 1.0, // Laptop runs for remaining scroll range
  }), []); // Text Sequence Configuration - Complete flow
  const TEXT_SEQUENCE = useMemo(() => ({
    // Phase 1: Both first and second hero texts visible from start
    firstHeroStart: 0.0, // First hero text visible from beginning
    firstHeroEnd: 0.25, // First hero text completes and fades
    secondHeroStart: 0.0, // Second hero text also visible from beginning
    secondHeroMoveStart: 0.25, // Both texts start moving up together
    secondHeroMidPosition: 0.3, // Second text reaches middle position

    // Phase 2: Descriptive text appears with second hero and moves in sync
    descriptiveStart: 0.0, // Start descriptive text with second hero text from beginning
    descriptiveEnd: 0.68, // Hero texts stay much longer in Cast Shadows animation
    secondHeroEnd: 0.68, // Second hero text stays much longer in Cast Shadows

    // Phase 3: Cast Shadows transition
    castShadowsStart: 0.55, // Cast Shadows model appears

    // Phase 4: Operating principles (all appear together)
    principlesStart: 0.68, // Start operating principles after hero texts fade
    principlesEnd: 0.74, // Operating principles show briefly before Physical Integrations

    // Phase 5: Physical Integrations
    physicalIntegrationsStart: 0.74, // Start Physical Integrations near end of Cast Shadows
    physicalIntegrationsEnd: 0.8, // Display until laptop appears

    // Phase 6: Laptop (no text)
    laptopStart: 0.98, // Laptop appears with no text
  }), []);
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

  // Update initialLoadComplete when content becomes visible and reset all progress
  useEffect(() => {
    if (contentVisible && !initialLoadComplete) {
      setInitialLoadComplete(true);
      initialLoadCompleteRef.current = true;
      
      // Reset all animation states to ensure we start from the very beginning
      setAnimationProgress(0);
      setInitialScrollProgress(0);
      setNavigationFadeProgress(0);
      setCastSwapProgress(0);
      setCastAnimationProgress(0);
      setLaptopSwapProgress(0);
      setLaptopAnimationProgress(0);
      setDescriptiveTextOpacity(0);
      setSecondHeroOpacity(0);
      setSecondHeroMoveProgress(0);
      setSecondHeroFadeOut(0);
      setDescriptiveTextFadeOut(0);
      setCastTextProgress(0);
      setPhysicalIntegrationsOpacity(0);
      setFirstHeroFadeOut(0);
    }
  }, [contentVisible, initialLoadComplete]);

  // Scroll-to-progress animation system with auto-play
  useLayoutEffect(() => {
    let scrollAccumulator = 0;
    let ticking = false;
    let autoPlayTime = 0; // Start immediately, no delay
    let lastAutoPlayTime = performance.now();
    let isAutoPlaying = true;
    let animationFrameId: number;
    let hasInitialized = false; // Track if we've started the animation

    const updateAnimationProgress = () => {
      // Wait until initial load is complete before allowing animation
      if (!initialLoadCompleteRef.current) return;

      // On first run after content becomes visible, ensure we're at 0
      if (!hasInitialized) {
        scrollAccumulator = 0;
        autoPlayTime = 0;
        lastAutoPlayTime = performance.now();
        hasInitialized = true;
      }

      const maxScrollRange = window.innerHeight * 3; // 3 viewport heights for full animation

      // Auto-play progression when not scrolling and not manually navigating
      if (isAutoPlaying && !isManualNavigationRef.current) {
        const now = performance.now();
        const deltaTime = (now - lastAutoPlayTime) / 1000; // Convert to seconds
        lastAutoPlayTime = now;

        // Auto-play speed with no initial delay
        autoPlayTime += deltaTime;

        const autoScrollProgress = (autoPlayTime / 100) * maxScrollRange; // 100 seconds total animation for slower, smoother transitions

        // Use auto-play progress if it's ahead of manual scroll
        if (autoScrollProgress > scrollAccumulator) {
          scrollAccumulator = Math.min(autoScrollProgress, maxScrollRange);
        }
      }

      // Check if we have a manual progress override
      if (manualProgressRef.current !== null) {
        console.log('Manual navigation active, setting progress to:', manualProgressRef.current);
        // Force the scroll accumulator to the manual progress
        scrollAccumulator = manualProgressRef.current * maxScrollRange;
        // Also sync autoPlayTime to match manual progress
        autoPlayTime = manualProgressRef.current * 100;
        lastAutoPlayTime = performance.now(); // Reset timing
      }

      const rawProgress = scrollAccumulator / maxScrollRange;
      
      if (manualProgressRef.current !== null) {
        console.log('Raw progress after manual override:', rawProgress);
      }

      // Set linear progress for initial scroll sequence (no easing for smooth constant speed)
      const initialScrollRawProgress = Math.min(
        rawProgress / MODEL_SWAP_CONFIG.swapStart,
        1
      );
      setInitialScrollProgress(initialScrollRawProgress);

      // Use linear progress for consistent animation speed
      const clampedProgress = Math.min(rawProgress, 1.0);

      setAnimationProgress(clampedProgress);

      // Calculate fade progress for navigation and ring (Stage 1)
      if (rawProgress >= STAGE_1_CONFIG.fadeStartProgress) {
        const fadeProgress = Math.min(
          (rawProgress - STAGE_1_CONFIG.fadeStartProgress) /
            STAGE_1_CONFIG.fadeDuration,
          1
        );

        setNavigationFadeProgress(fadeProgress);
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

        setCastSwapProgress(swapProgress);
      } else {
        // Reset swap progress when scrolling back
        setCastSwapProgress(0);
      }

      // Calculate Cast Shadows animation progress (for frame progression)
      let castAnimationProgress = 0;
      if (rawProgress >= MODEL_SWAP_CONFIG.animationStart) {
        // Cast Shadows is fully visible - calculate progress through its animation window
        const castStart = MODEL_SWAP_CONFIG.animationStart;
        const castEnd = MODEL_SWAP_CONFIG.animationEnd;
        const linearProgress = Math.min(
          (rawProgress - castStart) / (castEnd - castStart),
          1
        );

        // Clamp to prevent floating point precision issues
        castAnimationProgress = Math.max(0, Math.min(linearProgress, 0.999));
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

      // Calculate second hero text ("THE FUTURE OF...") visibility - visible from start, moves in sync
      if (
        rawProgress >= TEXT_SEQUENCE.secondHeroStart &&
        rawProgress <= TEXT_SEQUENCE.secondHeroEnd
      ) {
        const fadeInDuration = 0; // 2% for faster fade in to appear sooner
        const fadeOutStart = TEXT_SEQUENCE.secondHeroEnd - 0.08; // Start fade out 8% before end for complete fade

        if (rawProgress < TEXT_SEQUENCE.secondHeroStart + fadeInDuration) {
          // Fade in
          const fadeProgress =
            (rawProgress - TEXT_SEQUENCE.secondHeroStart) / fadeInDuration;
          setSecondHeroOpacity(fadeProgress);
          setSecondHeroFadeOut(0);
        } else if (rawProgress > fadeOutStart) {
          // Fade out - ensure complete fade by cast shadows start
          const fadeProgress = (rawProgress - fadeOutStart) / 0.08;
          setSecondHeroOpacity(Math.max(0, 1 - fadeProgress));
          setSecondHeroFadeOut(fadeProgress);
        } else {
          // Fully visible
          setSecondHeroOpacity(1);
          setSecondHeroFadeOut(0);
        }
      } else {
        setSecondHeroOpacity(0);
        setSecondHeroFadeOut(0);
      }

      // Calculate second hero text movement progress (for synchronized upward movement)
      if (
        rawProgress >= TEXT_SEQUENCE.secondHeroMoveStart &&
        rawProgress <= TEXT_SEQUENCE.secondHeroEnd
      ) {
        const moveProgress = Math.min(
          (rawProgress - TEXT_SEQUENCE.secondHeroMoveStart) /
            (TEXT_SEQUENCE.secondHeroMidPosition -
              TEXT_SEQUENCE.secondHeroMoveStart),
          1
        );
        setSecondHeroMoveProgress(moveProgress);
      } else {
        setSecondHeroMoveProgress(0);
      }

      // Calculate descriptive text visibility - appears when second text reaches middle, moves in sync
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
          setDescriptiveTextFadeOut(0);
        } else if (rawProgress > fadeOutStart) {
          // Fade out - ensure complete fade by cast shadows start
          const fadeProgress = (rawProgress - fadeOutStart) / 0.08;
          setDescriptiveTextOpacity(Math.max(0, 1 - fadeProgress));
          setDescriptiveTextFadeOut(fadeProgress);
        } else {
          // Fully visible
          setDescriptiveTextOpacity(1);
          setDescriptiveTextFadeOut(0);
        }
      } else {
        setDescriptiveTextOpacity(0);
        setDescriptiveTextFadeOut(0);
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

      // Calculate Physical Integrations text visibility
      if (
        rawProgress >= TEXT_SEQUENCE.physicalIntegrationsStart &&
        rawProgress <= TEXT_SEQUENCE.physicalIntegrationsEnd
      ) {
        const fadeInDuration = 0.02; // 2% for fade in
        const fadeOutStart = TEXT_SEQUENCE.physicalIntegrationsEnd - 0.05; // Start fade out 5% before end

        if (
          rawProgress <
          TEXT_SEQUENCE.physicalIntegrationsStart + fadeInDuration
        ) {
          // Fade in
          const fadeProgress =
            (rawProgress - TEXT_SEQUENCE.physicalIntegrationsStart) /
            fadeInDuration;
          setPhysicalIntegrationsOpacity(fadeProgress);
        } else if (rawProgress > fadeOutStart) {
          // Fade out
          const fadeProgress = (rawProgress - fadeOutStart) / 0.05;
          setPhysicalIntegrationsOpacity(Math.max(0, 1 - fadeProgress));
        } else {
          // Fully visible
          setPhysicalIntegrationsOpacity(1);
        }
      } else {
        setPhysicalIntegrationsOpacity(0);
      }

      // Calculate laptop swap progress (Stage 3: Cast Shadows -> Third Laptop)
      if (rawProgress >= LAPTOP_SWAP_CONFIG.swapStart) {
        const laptopProgress = Math.min(
          (rawProgress - LAPTOP_SWAP_CONFIG.swapStart) /
            (LAPTOP_SWAP_CONFIG.swapEnd - LAPTOP_SWAP_CONFIG.swapStart),
          1
        );

        setLaptopSwapProgress(laptopProgress);
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

        nextLaptopAnimationProgress = linearProgress;
      }
      setLaptopAnimationProgress(nextLaptopAnimationProgress);
    };

    const startAnimationLoop = () => {
      updateAnimationProgress();
      animationFrameId = requestAnimationFrame(startAnimationLoop);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!initialLoadCompleteRef.current) return;

      // Don't prevent default if clicking on navigation
      if ((e.target as Element)?.closest(".navigation-container")) {
        return;
      }

      e.preventDefault(); // Prevent page scroll

      // Manual scroll takes over from auto-play
      isAutoPlaying = false;

      // Allow forward and backward scrolling with higher sensitivity
      scrollAccumulator += e.deltaY * 1.5; // Increased sensitivity for better control
      scrollAccumulator = Math.max(
        0,
        Math.min(scrollAccumulator, window.innerHeight * 3)
      );

      // Reset auto-play timer to current position
      autoPlayTime = (scrollAccumulator / (window.innerHeight * 3)) * 70;

      if (!ticking) {
        requestAnimationFrame(() => {
          updateAnimationProgress();
          ticking = false;
        });
        ticking = true;
      }

      // Resume auto-play after 2 seconds of no scrolling
      setTimeout(() => {
        isAutoPlaying = true;
        lastAutoPlayTime = performance.now();
      }, 2000);
    };

    // Handle touch events for mobile/trackpad
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (!initialLoadCompleteRef.current) return;
      // Don't handle if touching navigation
      if ((e.target as Element)?.closest(".navigation-container")) {
        return;
      }
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!initialLoadCompleteRef.current) return;

      // Don't prevent default if touching navigation
      if ((e.target as Element)?.closest(".navigation-container")) {
        return;
      }

      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      // Manual touch takes over from auto-play
      isAutoPlaying = false;

      scrollAccumulator += deltaY * 3; // Higher sensitivity for touch
      scrollAccumulator = Math.max(
        0,
        Math.min(scrollAccumulator, window.innerHeight * 3)
      );

      touchStartY = touchY;

      // Reset auto-play timer to current position
      autoPlayTime = (scrollAccumulator / (window.innerHeight * 3)) * 100;
      if (!ticking) {
        requestAnimationFrame(() => {
          updateAnimationProgress();
          ticking = false;
        });
        ticking = true;
      }

      // Resume auto-play after 2 seconds of no interaction
      setTimeout(() => {
        isAutoPlaying = true;
        lastAutoPlayTime = performance.now();
      }, 2000);
    };

    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!initialLoadCompleteRef.current) return;

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
          scrollAccumulator = 0; // Jump to beginning
          autoPlayTime = 0; // Reset to start
          break;
        case "End":
          scrollAccumulator = window.innerHeight * 3; // Jump to end
          autoPlayTime = 70; // Full progression time
          break;
        default:
          return;
      }

      e.preventDefault();

      // Manual control takes over from auto-play
      isAutoPlaying = false;

      if (delta !== 0) {
        scrollAccumulator += delta;
        scrollAccumulator = Math.max(
          0,
          Math.min(scrollAccumulator, window.innerHeight * 3)
        );

        // Reset auto-play timer to current position
        autoPlayTime = (scrollAccumulator / (window.innerHeight * 3)) * 100;
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
        isAutoPlaying = true;
        lastAutoPlayTime = performance.now();
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
    STAGE_1_CONFIG,
    MODEL_SWAP_CONFIG,
    LAPTOP_SWAP_CONFIG,
    TEXT_SEQUENCE,
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
      <style jsx global>{`
        .navigation-container,
        .navigation-container * {
          font-family: "Helvetica", "Arial", sans-serif !important;
          font-weight: 400 !important;
          font-style: normal !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
      {/* Navigation rendered completely outside main container to avoid event conflicts */}
      <Navigation
        onNavClick={handleNavClick}
        style={{
          // opacity: 1 - navigationFadeProgress,
          // transform: `translate3d(0, ${navigationFadeProgress * -20}px, 0)`,
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 999999999,
          pointerEvents: "auto",
          // willChange: "transform, opacity", // Browser hint for hardware acceleration
          backfaceVisibility: "hidden", // Prevent flickering
          font: "helvetica",
        }}
      />
      
      {/* Section Indicator - only show after initial load */}
      {initialLoadComplete && (
        <SectionIndicator
          currentSection={currentSection}
          onSectionClick={handleSectionClick}
        />
      )}

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
                  display:
                    castSwapProgress > 0.5 || initialScrollProgress <= 0.01
                      ? "none"
                      : "block",
                  position: "absolute",
                  pointerEvents:
                    castSwapProgress > 0.5 || initialScrollProgress <= 0.01
                      ? "none"
                      : "auto",
                }}
              >
                <InitialScrollSequence
                  width={1000}
                  height={800}
                  scrollProgress={initialScrollProgress} // Use raw progress for immediate start
                  priority={true}
                />
              </div>

              {/* Cast Shadows sequence - no artificial fading, images handle their own transitions */}
              <div
                style={{
                  display:
                    castSwapProgress < 0.5 || laptopSwapProgress > 0.5
                      ? "none"
                      : "block",
                  position: "absolute",
                  inset: 0, // Full-screen positioning
                  width: "100vw",
                  height: "100vh",
                  pointerEvents:
                    castSwapProgress < 0.5 || laptopSwapProgress > 0.5
                      ? "none"
                      : "auto",
                }}
              >
                <CastShadowsSequence
                  scrollProgress={castAnimationProgress}
                  priority={castSwapProgress > 0.3}
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
                  duration={20} // Slower laptop animation - 20 seconds instead of 10
                  priority={laptopSwapProgress > 0.3}
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
                top: "100%", // Start below screen
                opacity: secondHeroOpacity,
                transform: `translateY(-50%) translateY(-${
                  secondHeroMoveProgress * 400 + secondHeroFadeOut * 300
                }px)`, // Move up in sync + significant upward movement during fade-out to reach top
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
                scrollProgress={0} // Disable internal scroll movement since we handle it manually
                scrollThreshold={1} // Set high threshold to prevent internal animation
                animationDuration={0.2}
                stopAtMiddle={false}
              />
            </div>

            {/* Descriptive Text - About Oh (right side, below second hero) */}
            <div
              className="absolute right-16 z-50"
              style={{
                top: "130%", // Position further down to prevent overlap with second hero text
                opacity: descriptiveTextOpacity,
                transform: `translateY(-50%) translateY(-${
                  secondHeroMoveProgress * 400 + descriptiveTextFadeOut * 300
                }px)`, // Move up more to maintain final relative position
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
                scrollProgress={0} // Disable internal scroll movement since we handle it manually
                scrollThreshold={1} // Set high threshold to prevent internal animation
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

            {/* Physical Integrations Text - appears after Cast Shadows principles */}
            <div
              className="absolute inset-0 z-50"
              style={{
                opacity: physicalIntegrationsOpacity,
                transition: "none",
                visibility:
                  physicalIntegrationsOpacity < 0.01 ? "hidden" : "visible",
                fontFamily: "'Spartan', Helvetica, Arial, sans-serif",
                fontSize: "24px",
                color: "white",
                lineHeight: 1.2,
                display: "flex",
                justifyContent: "space-between",
                padding: "20px 64px",
              }}
            >
              {/* Left side - Physical Integrations */}
              <div style={{ width: "45%", textAlign: "left" }}>
                <div style={{ fontWeight: "bold", marginBottom: "20px" }}>
                  PHYSICAL INTEGRATIONS
                </div>

                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  IMMERSIVE INSTALLATIONS
                </div>
                <div style={{ fontWeight: "normal", marginBottom: "20px" }}>
                  ON-SITE RETAIL AND CULTURAL ACTIVATIONS USING SPATIAL DESIGN,
                  PROJECTION, SOUND, AND INTERACTIVE SYSTEMS.
                </div>

                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  HYBRID ENVIRONMENTS
                </div>
                <div style={{ fontWeight: "normal", marginBottom: "20px" }}>
                  PHYSICALLY INTEGRATED SPACES WITH DIGITAL TWINS, LIVE MOTION
                  CAPTURE, AND AI BEHAVIOR SYNC.
                </div>

                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  TECHNICAL ART DIRECTION
                </div>
                <div style={{ fontWeight: "normal" }}>
                  END-TO-END DESIGN AND EXECUTION FOR EXHIBITIONS, PRODUCT
                  LAUNCHES, AND FUTURE-FORWARD RETAIL.
                </div>
              </div>

              {/* Right side - Digital Systems */}
              <div
                style={{
                  width: "60%",
                  textAlign: "right",
                  alignSelf: "flex-end",
                  marginTop: "80px",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "20px" }}>
                  DIGITAL SYSTEMS
                </div>

                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  SPATIAL COMMERCE SYSTEMS
                </div>
                <div style={{ fontWeight: "normal", marginBottom: "20px" }}>
                  FULLY INTERACTIVE ONLINE STORES IN UNREAL ENGINE. STREAMED
                  IN-BROWSER VIA LOW-LATENCY INFRASTRUCTURE.
                </div>

                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  AI-POWERED INTERACTIONS
                </div>
                <div style={{ fontWeight: "normal", marginBottom: "20px" }}>
                  VOICE AGENTS, NPCS, MEMORY LOGIC, AND INTELLIGENT GUIDANCE
                  SYSTEMS.
                </div>

                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  WEB INTEGRATION & DEPLOYMENT
                </div>
                <div style={{ fontWeight: "normal", marginBottom: "20px" }}>
                  CUSTOM THREE.JS FRONTENDS AND WEBGL PORTALS CONNECTED TO
                  CLOUD-HOSTED IMMERSIVE EXPERIENCES.
                </div>

                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  DIGITAL RETAIL ARCHITECTURE
                </div>
                <div style={{ fontWeight: "normal" }}>
                  PERSISTENT 3D ENVIRONMENTS DESIGNED FOR PRODUCT NAVIGATION,
                  BRAND ENGAGEMENT, AND LIVE INTERACTION.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card Demo Component - for visual display */}
        <CardDemo activeCard={activeCard} />
      </div>
      
      {/* Sound Controls - only show after initial load */}
      {initialLoadComplete && (
        <SoundControls />
      )}
    </>
  );
}
