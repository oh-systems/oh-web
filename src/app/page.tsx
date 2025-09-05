'use client';

import { useEffect } from "react";
import * as THREE from 'three';
// import { Model3D_Dev as Model3D, Model3D_Static, Navigation, HeroText } from "../../components"; // dev mode
import { Model3D, Model3D_Static, Navigation, HeroText } from "../../components"; // production mode

export default function Home() {
  useEffect(() => {
    const simulateLoading = async () => {
      const { appLoading } = await import('../lib/three/loadingManager');
      
      setTimeout(() => {
        const assets = [
          '/models/BLENDER OBJECT MID POLYS.glb',
          '/next.svg',
          '/vercel.svg',
          '/file.svg'
        ];

        assets.forEach((asset, index) => {
          setTimeout(() => {
            appLoading.ratio = (index + 1) / assets.length;
            appLoading.emit();
          }, (index + 1) * 400);
        });

        setTimeout(() => {
          setTimeout(() => {
            appLoading.complete();
          }, 2000);
        }, assets.length * 400 + 500);
        
      }, 3000);
    };

    simulateLoading();
  }, []);

  return (
    <div className="font-sans min-h-[300vh] h-auto relative overflow-x-hidden">
      <Navigation />

      <div className="min-h-screen relative">
        <HeroText scrollBehavior="fade" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full">
            <Model3D 
              modelPath="/models/INITIAL OBJECT MID POLYS.glb"
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-1 w-full h-full">
        <Model3D_Static 
          modelPath="/models/SPACE EMBOSSED.glb"
        />
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
