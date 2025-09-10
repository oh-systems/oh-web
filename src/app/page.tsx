'use client';

import { useEffect, useState, useLayoutEffect } from "react";
import { Navigation, HeroText, ArcwareGame, CastShadowsSequence, InitialScrollSequence } from "../../components";
import { useAppContext } from './AppContent';

export default function Home() {
  const { transitionComplete } = useAppContext();
  const [scrollProgress, setScrollProgress] = useState(0);

  // More reliable scroll detection using useLayoutEffect
  useLayoutEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollRange = 100; // Slower - 100px for all frames (was 20px)
      const progress = Math.min(scrollTop / scrollRange, 1);
      const adjustedProgress = scrollTop > 0 ? Math.max(progress, 0.05) : progress;

      setScrollProgress(adjustedProgress);
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Multiple event listeners for better compatibility
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    // Add wheel event as fallback
    let wheelScrollAccumulator = 0;
    const handleWheel = (e: WheelEvent) => {
      wheelScrollAccumulator += e.deltaY * 0.2; // Slower - reduced from 0.5 to 0.2
      wheelScrollAccumulator = Math.max(0, wheelScrollAccumulator); // Don't go negative

      const scrollRange = 100; // Match the scroll range
      const progress = Math.min(wheelScrollAccumulator / scrollRange, 1);
      const adjustedProgress = wheelScrollAccumulator > 0 ? Math.max(progress, 0.05) : progress;

      setScrollProgress(adjustedProgress);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });

    // Initial update
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    const simulateLoading = async () => {
      const { appLoading } = await import('../lib/three/loadingManager');

      setTimeout(() => {
        // Simulate loading the image sequence frames
        const totalFrames = 300;
        let loadedFrames = 0;

        const loadingInterval = setInterval(() => {
          loadedFrames += Math.random() * 8 + 2; // Simulate loading multiple frames at once

          if (loadedFrames >= totalFrames) {
            loadedFrames = totalFrames;
            clearInterval(loadingInterval);

            setTimeout(() => {
              appLoading.complete();
            }, 500);
          }

          appLoading.ratio = Math.min(loadedFrames / totalFrames, 1);
          appLoading.emit();
        }, 80);
      }, 500);
    };

    simulateLoading();
  }, []);

  return (
    <div className="font-sans min-h-[500vh] h-auto relative overflow-x-hidden">
      <Navigation />

      <div className="min-h-screen relative">
        <HeroText scrollBehavior="fade" />

        {/* Initial content - letters and scroll content that shows after loading */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            {/* Initial Scroll Sequence */}
            <div style={{
              opacity: 1,
              transition: 'opacity 800ms ease'
            }}>
              <InitialScrollSequence
                width={1000}
                height={800}
                scrollProgress={scrollProgress}
                priority={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Second Model Animation Section - Cast Shadows */}
      <div className="absolute inset-0 w-full h-full"
        style={{ marginTop: '110vh' }}>
        <div className="w-full h-full">
          <CastShadowsSequence
            height={800}
            autoPlay={true}
            startAnimation={transitionComplete}
            priority={false}
            className="w-full"
            onSequenceComplete={() => {
              // Cast Shadows animation completed
            }}
          />
        </div>

        {/* "THE FUTURE OF E-COMMERCE, TODAY." text overlaying Cast Shadows */}
                {/* "THE FUTURE OF E-COMMERCE, TODAY." text overlaying Cast Shadows */}
        <HeroText 
          text="THE FUTURE OF E-COMMERCE, TODAY."
          align="right"
          size="large"
          uppercase={true}
          scrollBehavior="none"
          className="absolute top-32 right-16 z-20"
        />
      </div>

      {/* Interactive Game Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-8"
        style={{ marginTop: '300vh' }}>
        <div className="w-full max-w-6xl">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <ArcwareGame
              style={{ height: '70vh', minHeight: '500px' }}
              className="w-full"
            />
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Interactive 3D experience • Cloud-rendered • No downloads required
          </p>
        </div>
      </div>

      <HeroText
        text="OH builds immersive environments for commerce and culture. We replace static websites with spatial systems powered by Unreal Engine, AI, and cloud infrastructure. Our work spans both digital and physical domains and is built to scale with the future of interaction."
        align="right"
        scrollBehavior="delayed"
        className="bottom-40 right-16"
      />
    </div>
  );
}
