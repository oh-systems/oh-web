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
  CastShadowsDetailsText,
  TransitionScreen,
  CardDemo,
  Footer,
  GlassCursor,
  LaptopText,
} from "../../components";
import { GlassSections } from "../../components/GlassSections";
import { useAppContext } from "./AppContent";
import { preloader, type PreloadProgress } from "../../lib/sequence-preloader";

// ==================== STAGE CONFIGURATION ====================
// Move config objects outside component to prevent recreation on every render
const STAGE_1_CONFIG = {
  fadeStartProgress: 0.001, // Start fading immediately (0.1% of scroll progress)
  fadeDuration: 0.02, // Complete fade over 2% of scroll progress - very quick fade
  slideDistance: 20, // Pixels to slide upward during fade animation
};

// Stage 2: Model Swap (Initial Scroll to Cast Shadows) - black buffer transition
const MODEL_SWAP_CONFIG = {
  swapStart: 0.167, // Start transition after initial scroll ends (20s/120s = 16.7%)
  swapEnd: 0.183, // Black buffer period (16.7% to 18.3%)
  animationStart: 0.2, // Cast Shadows animation begins after black buffer (24s)
  animationEnd: 0.533, // Cast Shadows ends at 53.3% (40s duration: 24s-64s)
};

// Stage 3: Third Laptop Model Swap (Cast Shadows to Third Laptop) - black buffer transition
const LAPTOP_SWAP_CONFIG = {
  swapStart: 0.533, // Begin transition when Cast Shadows ends
  swapEnd: 0.55, // Black buffer period (53.3% to 55%)
  animationStart: 0.567, // Laptop animation begins after black buffer (68s)
  animationEnd: 0.8, // Laptop animation completes at 80% (96s, giving 28s duration)
};

// Text Sequence Configuration - Complete flow
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
  principlesStart: 0.27, // Start operating principles right after second hero text fades completely
  principlesEnd: 0.4, // End later to last longer during Cast Shadows sequence

  // Phase 5: Laptop (no text)
  laptopStart: 0.92, // Laptop appears with no text
};
// =============================================================

export default function Home() {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [scrollContentReady, setScrollContentReady] = useState(false);
  const [allSequencesPreloaded, setAllSequencesPreloaded] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState({
    initialScroll: 0,
    castShadows: 0,
    thirdLaptop: 0,
    overall: 0,
  });
  const scrollAnimationStartedRef = useRef(false);

  // No cursor management needed - CSS always hides default cursor
  const [navigationFadeProgress, setNavigationFadeProgress] = useState(0);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [castSwapProgress, setCastSwapProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState<
    "overview" | "mission" | "space" | "information"
  >("overview");
  const [castAnimationProgress, setCastAnimationProgress] = useState(0);
  const [laptopSwapProgress, setLaptopSwapProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [laptopAnimationProgress, setLaptopAnimationProgress] = useState(0);
  const [rawProgress, setRawProgress] = useState(0);
  const [descriptiveTextOpacity, setDescriptiveTextOpacity] = useState(0);
  const [secondHeroOpacity, setSecondHeroOpacity] = useState(0);
  const [secondHeroPosition, setSecondHeroPosition] = useState(98); // Start at 98%
  const [descriptiveTextPosition, setDescriptiveTextPosition] = useState(98); // Start at same position
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
  const handleSectionClick = (
    section: "overview" | "mission" | "space" | "information"
  ) => {
    // Stop auto-play and directly control scroll position
    isAutoPlayingRef.current = false;

    // Set scroll accumulator based on section (0 to window.innerHeight * 4.5 to accommodate laptop animation)
    const maxScroll = window.innerHeight * 4.5;

    if (section === "overview") {
      scrollAccumulatorRef.current = maxScroll * 0.2; // 20% through (within 0-55% overview range)
      setCurrentSection("overview");
      setAnimationProgress(0.2);
    } else if (section === "mission") {
      scrollAccumulatorRef.current = maxScroll * 0.7; // 70% through (within 55-80% mission range)
      setCurrentSection("mission");
      setAnimationProgress(0.7);
    } else if (section === "space") {
      scrollAccumulatorRef.current = maxScroll * 0.85; // 85% through (within 80-95% space range)
      setCurrentSection("space");
      setAnimationProgress(0.85);
    } else if (section === "information") {
      scrollAccumulatorRef.current = maxScroll * 0.98; // 98% through (footer section)
      setCurrentSection("information");
      setAnimationProgress(0.98);
    }

    // Update auto-play time to current position
    autoPlayTimeRef.current = (scrollAccumulatorRef.current / maxScroll) * 80;

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
      autoPlayTimeRef.current =
        (scrollAccumulatorRef.current / maxScrollRange) * 100;
    }, 16); // Single frame delay (60fps) to avoid conflicts but maintain smoothness
  };

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

  // Start preloading all sequences immediately when component mounts
  useEffect(() => {
    const startPreloading = async () => {
      console.log(
        "🎬 Starting to preload all sequences during initial load..."
      );

      try {
        await preloader.preloadAllSequences((progress: PreloadProgress) => {
          setPreloadProgress(progress);
          console.log(
            `📊 Preload progress: ${(progress.overall * 100).toFixed(1)}%`
          );
        });

        console.log("✅ All sequences preloaded!");
        setAllSequencesPreloaded(true);
      } catch (error) {
        console.error("❌ Error preloading sequences:", error);
        // Still allow the app to continue even if preloading fails
        setAllSequencesPreloaded(true);
      }
    };

    startPreloading();
  }, []);

  // Update initialLoadComplete when content becomes visible AND all sequences are preloaded
  useEffect(() => {
    if (contentVisible && allSequencesPreloaded && !initialLoadComplete) {
      console.log("🎉 Initial load complete - all sequences ready!");
      setInitialLoadComplete(true);
    }
  }, [contentVisible, allSequencesPreloaded, initialLoadComplete]);

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
    if (
      autoPlayTimeRef.current === undefined ||
      autoPlayTimeRef.current === null
    ) {
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

      // Auto-play progression when not scrolling - continue through footer
      const currentProgress = scrollAccumulatorRef.current / maxScrollRange;
      if (isAutoPlayingRef.current && currentProgress < 1.0) {
        // Continue auto-play through footer
        const now = performance.now();
        const deltaTime = (now - lastAutoPlayTimeRef.current) / 1000; // Convert to seconds
        lastAutoPlayTimeRef.current = now;

        // Auto-play speed - smoothly progress from current position
        autoPlayTimeRef.current += deltaTime;

        // Start auto-scroll immediately when content is visible
        if (autoPlayTimeRef.current >= 0) {
          // Mark that scroll animation has actually started
          if (!scrollAnimationStartedRef.current) {
            scrollAnimationStartedRef.current = true;
            document.body.classList.add("scroll-started");
            document.documentElement.classList.add("scroll-started");

            // Remove forced cursor hiding
            const style = document.getElementById("cursor-hiding-rules");
            if (style) {
              style.remove();
            }
          }

          const autoScrollProgress =
            (autoPlayTimeRef.current / 100) * maxScrollRange; // 100 seconds total to include footer progression

          // Direct progression at normal speed to avoid catch-up behavior
          scrollAccumulatorRef.current = autoScrollProgress;
          // Allow progression to full maxScrollRange
          scrollAccumulatorRef.current = Math.min(
            scrollAccumulatorRef.current,
            maxScrollRange
          );

          // Keep target in sync during auto-play
          targetScrollRef.current = scrollAccumulatorRef.current;
        }
      } else if (currentProgress >= 1.0) {
        // Stop auto-play completely when reaching the end
        isAutoPlayingRef.current = false;
      }

      const rawProgress = scrollAccumulatorRef.current / maxScrollRange;
      setRawProgress(rawProgress);

      // Apply smooth easing for more natural animation feel
      const clampedProgress = Math.min(rawProgress, 1.5); // Allow progress up to 1.5 for laptop animation
      const easedProgress =
        clampedProgress * clampedProgress * (3 - 2 * clampedProgress); // smoothstep

      setAnimationProgress(easedProgress);

      // Update current section based on raw progress (always update for correct section indicator)
      if (rawProgress < 0.25) {
        setCurrentSection("overview"); // Initial scroll sequence
      } else if (rawProgress < 0.45) {
        setCurrentSection("mission"); // Cast shadows sequence
      } else if (rawProgress < 0.8) {
        setCurrentSection("space"); // Laptop sequence
      } else {
        setCurrentSection("information"); // Footer section
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

      // Calculate first hero text fade out progress - very fast
      if (
        rawProgress >= TEXT_SEQUENCE.firstHeroEnd - 0.015 &&
        rawProgress <= TEXT_SEQUENCE.firstHeroEnd + 0.015
      ) {
        const fadeProgress =
          (rawProgress - (TEXT_SEQUENCE.firstHeroEnd - 0.015)) / 0.03;
        // Apply smooth easing
        const smoothFade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
        setFirstHeroFadeOut(smoothFade);
      } else if (rawProgress > TEXT_SEQUENCE.firstHeroEnd + 0.015) {
        setFirstHeroFadeOut(1);
      } else {
        setFirstHeroFadeOut(0);
      }

      // Calculate second hero text - direct custom animation control
      const scrollStartThreshold = 0.08; // Later than first hero text (which starts at 0.02)
      const moveToMiddleEnd = 0.2; // Move to middle completes at 20% (slower movement - was 16%)
      const pauseAtMiddleEnd = 0.22; // Shorter pause
      const fadeCompleteEnd = 0.27; // Fade completes much sooner, before cast shadows
      const gapInVh = (180 / window.innerHeight) * 100; // Convert 180px to vh percentage

      if (rawProgress < scrollStartThreshold) {
        // Phase 0: Before scroll starts - stay at original position
        setSecondHeroPosition(98);
        setDescriptiveTextPosition(98 + gapInVh); // Responsive gap below second hero
        setSecondHeroOpacity(1);
        setDescriptiveTextOpacity(1);
      } else if (rawProgress <= moveToMiddleEnd) {
        // Phase 1: Moving to middle - interpolate position from 98% to 50%
        const moveProgress =
          (rawProgress - scrollStartThreshold) /
          (moveToMiddleEnd - scrollStartThreshold);
        const heroPos = 98 - moveProgress * 48; // 98% to 50%
        setSecondHeroPosition(heroPos);
        setDescriptiveTextPosition(heroPos + gapInVh); // Responsive gap below second hero
        setSecondHeroOpacity(1);
        setDescriptiveTextOpacity(1);
      } else if (rawProgress <= pauseAtMiddleEnd) {
        // Phase 2: Pause at middle - stay at 50%
        setSecondHeroPosition(50);
        setDescriptiveTextPosition(50 + gapInVh); // Responsive gap below middle position
        setSecondHeroOpacity(1);
        setDescriptiveTextOpacity(1);
      } else if (rawProgress <= fadeCompleteEnd) {
        // Phase 3: Continue moving up while fading - SAME timing as second hero
        const continueProgress =
          (rawProgress - pauseAtMiddleEnd) /
          (fadeCompleteEnd - pauseAtMiddleEnd);
        const heroPos = 50 - continueProgress * 30; // Move from 50% to 20%
        setSecondHeroPosition(heroPos);
        setDescriptiveTextPosition(heroPos + gapInVh); // Responsive gap below second hero
        const fadeProgress = continueProgress;
        const smoothFade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
        const opacity = Math.max(0, 1 - smoothFade);
        setSecondHeroOpacity(opacity);
        setDescriptiveTextOpacity(opacity); // EXACT same opacity timing as second hero
      } else {
        setSecondHeroPosition(20);
        setDescriptiveTextPosition(20 + gapInVh); // Responsive gap below final position
        setSecondHeroOpacity(0);
        setDescriptiveTextOpacity(0);
      }

      // Descriptive text opacity is now controlled by second hero text logic above
      // (removed old TEXT_SEQUENCE logic to prevent conflicts)

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
        currentProgress >= 0.25 && currentProgress < 0.45;
      const inLaptopRange = currentProgress >= 0.45 && currentProgress < 0.8;
      const inFooterRange = currentProgress >= 0.8;

      // Adaptive scroll sensitivity - increased for faster transitions
      let scrollMultiplier = 0.3; // Increased for faster scrolling between sections
      if (inCastShadowsRange) {
        scrollMultiplier = 0.08; // Increased from 0.02 for faster cast shadows
      } else if (inLaptopRange) {
        scrollMultiplier = 0.15; // Increased from 0.06 for faster laptop transitions
      } else if (inFooterRange) {
        scrollMultiplier = 0.4; // Fast scrolling in footer for quick transitions
      }

      const scrollDelta = Math.max(
        -3,
        Math.min(3, e.deltaY * scrollMultiplier)
      );

      // Direct update without extra interpolation - limit to 100% progress
      targetScrollRef.current = Math.max(
        0,
        Math.min(
          targetScrollRef.current + scrollDelta,
          window.innerHeight * 4.5 // Removed * 2.3 to prevent over-scrolling
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
        (scrollAccumulatorRef.current / (window.innerHeight * 4.5)) * 100;

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
      const inLaptopRange = currentProgress >= 0.45 && currentProgress < 0.8;
      const inFooterRange = currentProgress >= 0.8;

      let touchMultiplier = 0.25; // Increased base speed
      if (inLaptopRange) {
        touchMultiplier = 0.18; // Faster laptop touch scrolling
      } else if (inFooterRange) {
        touchMultiplier = 0.3; // Even faster footer touch scrolling
      }

      const limitedDelta = Math.max(-4, Math.min(4, deltaY * touchMultiplier));

      targetScrollRef.current = Math.max(
        0,
        Math.min(
          targetScrollRef.current + limitedDelta,
          window.innerHeight * 4.5
        )
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
          scrollAccumulatorRef.current = window.innerHeight * 4.5; // Jump to end (100%)
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
          Math.min(scrollAccumulatorRef.current, window.innerHeight * 4.5)
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
  }, [scrollContentReady]);

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

      {/* Laptop text overlay - at top level for maximum visibility */}
      <LaptopText progress={laptopAnimationProgress} />

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

        {/* Initial Load State - 3D INITIAL_LOAD model with loading indicator */}
        {!initialLoadComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            {/* Only show InitialLoadSequence after a brief delay to prevent flash */}
            <div
              style={{
                opacity: contentVisible ? 1 : 0,
                transition: "opacity 0.3s ease-in",
              }}
            >
              <InitialLoadSequence
                width={800}
                height={600}
                autoPlay={true}
                startAnimation={true}
                onSequenceComplete={() => {
                  // Note: we don't set initialLoadComplete here anymore
                  // It's set when both contentVisible AND allSequencesPreloaded are true
                }}
                onLoadingProgress={() => {
                  // This tracks InitialLoadSequence progress (optional, not used for gating)
                }}
                priority={true}
              />
            </div>
          </div>
        )}

        {/* Scroll-driven Animation Content - only visible after initial load + all sequences preloaded */}
        {scrollContentReady && allSequencesPreloaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center">
              {/* Initial Scroll sequence - no artificial fading, images handle their own transitions */}
              <div
                style={{
                  display:
                    rawProgress < MODEL_SWAP_CONFIG.swapStart
                      ? "block"
                      : "none", // Show only during initial scroll period
                  position: "absolute",
                  pointerEvents:
                    rawProgress < MODEL_SWAP_CONFIG.swapStart ? "auto" : "none",
                }}
              >
                <InitialScrollSequence
                  width={1000}
                  height={800}
                  scrollProgress={Math.min(
                    rawProgress / MODEL_SWAP_CONFIG.swapStart,
                    1
                  )} // Map 0-25% raw progress to 0-100% sequence
                  priority={true}
                />
              </div>

              {/* Black buffer overlay between Initial Scroll and Cast Shadows */}
              <div
                style={{
                  display:
                    rawProgress >= MODEL_SWAP_CONFIG.swapStart &&
                    rawProgress <= MODEL_SWAP_CONFIG.swapEnd
                      ? "block"
                      : "none",
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
                  display:
                    rawProgress >= LAPTOP_SWAP_CONFIG.swapStart &&
                    rawProgress <= LAPTOP_SWAP_CONFIG.swapEnd
                      ? "block"
                      : "none",
                  position: "absolute",
                  inset: 0,
                  width: "100vw",
                  height: "100vh",
                  backgroundColor: "black",
                  zIndex: 100,
                }}
              />

              {/* TransitionScreen - shows before laptop */}
              {rawProgress >= LAPTOP_SWAP_CONFIG.swapEnd &&
                rawProgress < LAPTOP_SWAP_CONFIG.animationStart && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 150,
                      backgroundColor: "transparent",
                      pointerEvents: "none",
                    }}
                  >
                    <TransitionScreen
                      progress={
                        (rawProgress - LAPTOP_SWAP_CONFIG.swapEnd) /
                        (LAPTOP_SWAP_CONFIG.animationStart -
                          LAPTOP_SWAP_CONFIG.swapEnd)
                      }
                      laptopProgress={laptopAnimationProgress}
                    />
                  </div>
                )}

              {/* Third Laptop sequence with TransitionScreen as background layer */}
              <div
                style={{
                  display:
                    rawProgress < LAPTOP_SWAP_CONFIG.animationStart
                      ? "none"
                      : "flex",
                  position: "absolute",
                  inset: 0,
                  width: "100vw",
                  height: "100vh",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 150,
                }}
              >
                {/* TransitionScreen as background - inside laptop container */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    backgroundColor: "transparent",
                    pointerEvents: "none",
                  }}
                >
                  <TransitionScreen
                    progress={
                      (rawProgress - LAPTOP_SWAP_CONFIG.swapEnd) /
                      (LAPTOP_SWAP_CONFIG.animationStart -
                        LAPTOP_SWAP_CONFIG.swapEnd)
                    }
                    laptopProgress={laptopAnimationProgress}
                  />
                </div>

                {/* Laptop images on top */}
                <div style={{ position: "relative", zIndex: 10 }}>
                  <ThirdLaptopSequence
                    width={viewportDimensions.width}
                    height={viewportDimensions.height}
                    scrollProgress={laptopAnimationProgress}
                    priority={laptopSwapProgress > 0.1}
                  />
                </div>
              </div>
            </div>

            {/* First Hero Text - starting in middle of screen */}
            <div
              className="absolute left-0 pl-16 z-[150]"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
              }}
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
                      scrollThreshold={0.02}
                      animationDuration={0.15}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Second Hero Text - "THE FUTURE OF E-COMMERCE, TODAY" (right side) */}
            <div
              className="absolute right-16 z-[150]"
              style={{
                top: `${secondHeroPosition}%`, // Direct position control
                opacity: secondHeroOpacity,
                transform: "translateY(-50%)", // Center vertically
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
                scrollProgress={0} // Don't let ScrollDrivenText handle scroll movement
                scrollThreshold={999} // Never trigger scroll movement
                animationDuration={0.15}
                stopAtMiddle={false}
              />
            </div>

            {/* Descriptive Text - About Oh (right side, below second hero) */}
            <div
              className="absolute right-16 z-[150]"
              style={{
                top: `${descriptiveTextPosition}%`, // Follow second hero text position
                opacity: descriptiveTextOpacity, // Same opacity as second hero
                transform: "translateY(-50%)", // Center vertically
                transition: "none", // No CSS transitions for smooth scrubbing
                visibility:
                  descriptiveTextOpacity < 0.01 ? "hidden" : "visible",
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
                scrollProgress={0} // Don't let ScrollDrivenText handle scroll movement
                scrollThreshold={999} // Never trigger scroll movement - same as second hero
                animationDuration={0.15} // Same letter animation timing as second hero
                stopAtMiddle={false}
              />
            </div>

            {/* Cast Shadows Operating Principles Text Sequence */}
            <div className="absolute inset-0 z-[110] pointer-events-none">
              <CastShadowsText
                scrollProgress={castTextProgress}
                fadeOutProgress={0} // No longer needed since we handle fade separately
              />
            </div>

            {/* Cast Shadows Details Text Sequence */}
            <div className="absolute inset-0 z-[110] pointer-events-none">
              <CastShadowsDetailsText scrollProgress={castAnimationProgress} />
            </div>

            {/* No third hero text - laptop appears without text */}
          </div>
        )}

        {/* Card Demo Component - for visual display */}
        <CardDemo activeCard={activeCard} />

        {/* Footer - appears when in information section */}
        {currentSection === "information" && (
          <Footer
            scrollProgress={(rawProgress - 0.8) / 0.2}
            onRingCenterComplete={() => {
              // Lock scroll once ring reaches center
              if (containerRef.current) {
                containerRef.current.style.overflow = "hidden";
                containerRef.current.style.touchAction = "none";
                // Prevent further scroll accumulation
                const maxScrollRange = window.innerHeight * 4.5;
                scrollAccumulatorRef.current = maxScrollRange * 1.0;
              }
            }}
          />
        )}
      </div>

      {/* Glass Sections for About and Contact - rendered outside main container like Navigation */}
      <GlassSections
        showAbout={showAbout}
        showContact={showContact}
        onAboutClose={() => setShowAbout(false)}
        onContactClose={() => setShowContact(false)}
      />
    </>
  );
}
