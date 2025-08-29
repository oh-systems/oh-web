'use client';

import { useState } from 'react';
import { UnifiedRingLoader, PermanentRing } from '../../components';

export default function AppContent({ children }: { children: React.ReactNode }) {
  const [contentVisible, setContentVisible] = useState(false);
  const [transitionComplete, setTransitionComplete] = useState(false);
  
  return (
    <>
      {/* Loading phase: show UnifiedRingLoader until transition complete */}
      {!transitionComplete && (
        <UnifiedRingLoader 
          onContentShow={() => setContentVisible(true)}
          onTransitionComplete={() => setTransitionComplete(true)} 
        />
      )}
      
      {/* Permanent phase: show static PermanentRing after transition */}
      {transitionComplete && (
        <PermanentRing visible={true} />
      )}
      
      {/* Content fades in when onContentShow is called */}
      <div style={{
        transition: 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: contentVisible ? 1 : 0
      }}>
        {children}
      </div>
    </>
  );
}
