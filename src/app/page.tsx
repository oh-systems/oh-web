'use client';

import { useEffect } from "react";
import * as THREE from 'three';
import { ObjectPolysDev, SpaceEmbossedBackground, Navigation, HeroText, ArcwareGame, InitialLoadSequence } from "../../components";
import { useAppContext } from './AppContent';

export default function Home() {
  const { transitionComplete } = useAppContext();

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
    <div className="font-sans min-h-[400vh] h-auto relative overflow-x-hidden">
      <Navigation />

      <div className="min-h-screen relative">
        <HeroText scrollBehavior="fade" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            <InitialLoadSequence 
              width={1000}
              height={800}
              autoPlay={true}
              startAnimation={transitionComplete}
              duration={8}
              priority={true}
              className=""
              onSequenceComplete={() => {
                // Animation completed
              }}
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-1 w-full h-full">
        <SpaceEmbossedBackground 
          modelPath="/models/SPACE EMBOSSED.glb"
        />
      </div>

      {/* Interactive Game Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-8" 
           style={{ marginTop: '200vh' }}>
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
        text="THE FUTURE OF E-COMMERCE, TODAY."
        align="right"
        size="large"
        uppercase={true}
        scrollBehavior="sticky"
        className="bottom-20 right-16"
      />

      <HeroText 
        text="OH builds immersive environments for commerce and culture. We replace static websites with spatial systems powered by Unreal Engine, AI, and cloud infrastructure. Our work spans both digital and physical domains and is built to scale with the future of interaction."
        align="right"
        scrollBehavior="delayed"
        className="bottom-40 right-16"
      />
    </div>
  );
}
