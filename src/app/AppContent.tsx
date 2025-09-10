'use client';

import { useState, createContext, useContext } from 'react';
import { UnifiedRingLoader, PermanentRing, InitialLoadSequence } from '../../components';

// Create context to share loading sequence state
const AppContext = createContext({
  contentVisible: false,
  transitionComplete: false,
  showInitialLoad: false,
  ringInCenter: false,
  ringMovedToCorner: false
});

export const useAppContext = () => useContext(AppContext);

export default function AppContent({ children }: { children: React.ReactNode }) {
  const [contentVisible, setContentVisible] = useState(false);
  const [transitionComplete, setTransitionComplete] = useState(false);
  const [showInitialLoad, setShowInitialLoad] = useState(false);
  const [ringInCenter, setRingInCenter] = useState(false);
  const [ringMovedToCorner, setRingMovedToCorner] = useState(false);
  
  const handleRingCenterComplete = () => {
    // Ring has completed morphing in center, now show initial load
    setRingInCenter(true);
    setShowInitialLoad(true);
  };

  const handleInitialLoadComplete = () => {
    // Initial load sequence finished, move ring to corner
    setShowInitialLoad(false);
    setRingMovedToCorner(true);
    setContentVisible(true); // Show letters and menu
  };

  const handleRingMovedToCorner = () => {
    // Ring is now in corner as permanent ring
    setTransitionComplete(true);
  };
  
  return (
    <AppContext.Provider value={{ 
      contentVisible, 
      transitionComplete, 
      showInitialLoad,
      ringInCenter,
      ringMovedToCorner
    }}>
      {/* Loading phase: show UnifiedRingLoader until moved to corner */}
      {!transitionComplete && (
        <UnifiedRingLoader 
          onCenterComplete={handleRingCenterComplete}
          moveToCorner={ringMovedToCorner}
          onCornerComplete={handleRingMovedToCorner}
        />
      )}
      
      {/* Initial Load Sequence: shows when ring is in center */}
      {showInitialLoad && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 500
        }}>
          <InitialLoadSequence
            width={800}
            height={800}
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
      {transitionComplete && (
        <PermanentRing visible={true} />
      )}
      
      {/* Content fades in when ring moves to corner */}
      <div style={{
        transition: 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: contentVisible ? 1 : 0
      }}>
        {children}
      </div>
    </AppContext.Provider>
  );
}
