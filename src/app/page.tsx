'use client';

import { useEffect } from "react";
import * as THREE from 'three';
import { Model3D, Navigation, HeroText } from "../../components";

export default function Home() {
  useEffect(() => {
    // Simulate loading some assets to test the ring loader
    const simulateLoading = async () => {
      // Import the loading manager
      const { appLoading } = await import('../lib/three/loadingManager');
      
      console.log('Starting initial pulse phase...');
      
      // Wait 3 seconds for initial pulse phase
      setTimeout(() => {
        console.log('Initial pulse complete - starting loading progression...');
        
        // Simulate loading multiple assets including our 3D model
        const assets = [
          '/models/INITIAL OBJECT MID POLYS.glb',
          '/next.svg',
          '/vercel.svg',
          '/file.svg'
        ];

        // Create fake loaders to simulate progress
        assets.forEach((asset, index) => {
          setTimeout(() => {
            // Simulate progress updates
            appLoading.ratio = (index + 1) / assets.length;
            appLoading.emit();
          }, (index + 1) * 400); // 400ms intervals
        });

        // After all assets are loaded, wait a bit then trigger completion
        setTimeout(() => {
          console.log('All assets loaded, ring should be in final clear state');
          // Ring will stay in clear state until you call appLoading.complete()
          
          // Simulate next step - wait 2 seconds then complete the loader
          setTimeout(() => {
            console.log('Triggering loader completion...');
            appLoading.complete();
          }, 2000);
        }, assets.length * 400 + 500);
        
      }, 3000); // 3 second initial pulse phase
    };

    simulateLoading();
  }, []);

  return (
    <div className="font-sans min-h-screen relative overflow-hidden">
      {/* Top Right Navigation Menu */}
      <Navigation />

      {/* Hero Text - Left Side, Vertically Centered */}
      <HeroText />

      {/* Main 3D Model Display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full">
          <Model3D 
            modelPath="/models/INITIAL OBJECT MID POLYS.glb"
            className=""
          />
        </div>
      </div>
    </div>
  );
}
