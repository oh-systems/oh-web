'use client';

import { useState } from 'react';
import { UnifiedRingLoader, PermanentRing } from '../../components';

export default function AppContent({ children }: { children: React.ReactNode }) {
  const [loadingComplete, setLoadingComplete] = useState(false);
  
  return (
    <>
      {/* Loading phase: show UnifiedRingLoader until transition complete */}
      {!loadingComplete && (
        <UnifiedRingLoader onTransitionComplete={() => setLoadingComplete(true)} />
      )}
      
      {/* Permanent phase: show static PermanentRing after transition */}
      {loadingComplete && (
        <PermanentRing visible={true} />
      )}
      
      {/* Content fades in smoothly after loading */}
      <div style={{
        transition: 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: loadingComplete ? 1 : 0
      }}>
        {children}
      </div>
    </>
  );
}
