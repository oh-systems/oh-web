"use client";

import { useState, createContext, useContext } from "react";
import {
  UnifiedRingLoader,
  PermanentRing,
  InitialLoadSequence,
  GlassCursor,
} from "../../components";

// Create context to share loading sequence state and navigation fade
const AppContext = createContext({
  contentVisible: false,
  transitionComplete: false,
  showInitialLoad: false,
  ringInCenter: false,
  ringMovedToCorner: false,
  navigationFadeProgress: 0,
  permanentRingVisible: true,
  loadingProgress: 0,
  isLoadingComplete: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setNavigationFadeProgress: (progress: number) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPermanentRingVisible: (visible: boolean) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLoadingProgress: (progress: number) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setIsLoadingComplete: (complete: boolean) => {},
});

export const useAppContext = () => useContext(AppContext);

export default function AppContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contentVisible, setContentVisible] = useState(false);
  const [transitionComplete, setTransitionComplete] = useState(false);
  const [showInitialLoad, setShowInitialLoad] = useState(false);
  const [ringInCenter, setRingInCenter] = useState(false);
  const [ringMovedToCorner, setRingMovedToCorner] = useState(false);
  const [navigationFadeProgress, setNavigationFadeProgress] = useState(0);
  const [permanentRingVisible, setPermanentRingVisible] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  const handleRingCenterComplete = () => {
    // Ring has completed morphing in center (loading is done), now show initial load
    setRingInCenter(true);
    setShowInitialLoad(true);
  };

  const handleInitialLoadComplete = () => {
    // Initial load sequence finished, move ring to corner
    setShowInitialLoad(false);
    setRingMovedToCorner(true);
  };

  const handleRingMovedToCorner = () => {
    // Ring is now in corner as permanent ring
    setTransitionComplete(true);
    // Wait a bit longer for the seamless transition, then fade in text
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      setContentVisible(true);
    }, 500); // Reduced delay since transition is now smoother
  };

  return (
    <AppContext.Provider
      value={{
        contentVisible,
        transitionComplete,
        showInitialLoad,
        ringInCenter,
        ringMovedToCorner,
        navigationFadeProgress,
        permanentRingVisible,
        loadingProgress,
        isLoadingComplete,
        setNavigationFadeProgress,
        setPermanentRingVisible,
        setLoadingProgress,
        setIsLoadingComplete,
      }}>
      {/* White cursor ball - always visible from the start */}
      <GlassCursor />
      
      {/* Loading phase: show UnifiedRingLoader until moved to corner - only on first visit */}
      {!transitionComplete && (
        <UnifiedRingLoader
          onCenterComplete={handleRingCenterComplete}
          moveToCorner={ringMovedToCorner}
          onCornerComplete={handleRingMovedToCorner}
          loadingProgress={loadingProgress}
          isLoadingComplete={isLoadingComplete}
        />
      )}

      {/* Initial Load Sequence: shows when ring is in center - only on first visit */}
      {showInitialLoad && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 500,
          }}
        >
          <InitialLoadSequence
            width={typeof window !== 'undefined' && window.innerWidth <= 768 ? 400 : 800}
            height={typeof window !== 'undefined' && window.innerWidth <= 768 ? 400 : 800}
            autoPlay={true}
            startAnimation={true}
            duration={6} // Longer transition for better pacing
            loop={false}
            priority={true}
            onSequenceComplete={handleInitialLoadComplete}
          />
        </div>
      )}

      {/* Permanent phase: show static PermanentRing after transition */}
      {transitionComplete && <PermanentRing visible={permanentRingVisible} />}

      {/* Content is immediately visible - no global slide animation */}
      <div
        style={{
          transform: "translateY(0)",
          opacity: 1,
        }}
      >
        {children}
      </div>
    </AppContext.Provider>
  );
}
