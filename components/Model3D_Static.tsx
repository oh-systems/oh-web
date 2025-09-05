'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Types and Interfaces
interface Model3DStaticProps {
  modelPath: string;
  className?: string;
}

export default function Model3D_Static({ 
  modelPath,
  className = ''
}: Model3DStaticProps) {
  const [mounted, setMounted] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mountRef.current) return;
    
    const container = mountRef.current;
    const containerRect = container.getBoundingClientRect();

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRect.width / containerRect.height,
      0.1,
      2000
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      alpha: true,
      powerPreference: "low-power"
    });
    renderer.setSize(containerRect.width, containerRect.height);
    renderer.setPixelRatio(1);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 2.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
    directionalLight.position.set(2, 5, 2);
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        
        const boundingBox = new THREE.Box3().setFromObject(model);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        
        model.position.sub(center);
        model.rotation.x = Math.PI / 2;
        
        const maxDimension = Math.max(size.x, size.y, size.z);
        let scaleFactor = 1;
        
        if (maxDimension < 2) {
          scaleFactor = 2 / maxDimension;
        }
        
        scaleFactor *= 0.5;
        model.scale.setScalar(scaleFactor);
        
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = new THREE.MeshLambertMaterial({
              color: 0xcccccc,
              side: THREE.FrontSide,
              transparent: true,
              opacity: 0.8
            });
            
            if (child.material) {
              (child.material as THREE.Material).dispose();
            }
            child.material = material;
          }
        });
        
        scene.add(model);
        render();
      },
      undefined,
      (error) => console.error('Error loading static model:', error)
    );

    const render = () => {
      renderer.render(scene, camera);
    };
    
    render();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      renderer.dispose();
    };
  }, [modelPath, mounted]);

  if (!mounted) {
    return (
      <div 
        className={`w-full h-full ${className}`}
        style={{ background: 'transparent' }}
      />
    );
  }

  return (
    <div 
      className={`w-full h-full relative ${className}`}
      style={{ background: 'transparent' }}
    >
      <div 
        ref={mountRef}
        className="w-full h-full"
      />
    </div>
  );
}
