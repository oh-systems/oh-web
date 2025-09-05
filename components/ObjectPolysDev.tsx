'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Types and Interfaces
interface ObjectPolysDevProps {
  modelPath?: string;
  className?: string;
}

// Configuration Constants (optimized for development)
const DEV_CAMERA_CONFIG = {
  fov: 5,
  near: 0.1,
  far: 2000,
  position: { x: 0, y: 0, z: 10 }
};

const DEV_LIGHT_CONFIG = {
  color: 0xffffff,
  intensity: 200,
  width: 2,
  height: 1,
  position: { x: 0.5, y: 2.4, z: -2.2 }
};

const DEV_INITIAL_TRANSFORM = {
  position: { x: 0.15, y: 0.1, z: 0 },
  rotation: { x: 4, y: 48, z: 84 }, // degrees
  scale: { x: 1, y: 1, z: 1 }
};

const DEV_MATERIAL_CONFIG = {
  color: 0xffffff,
  metalness: 0.0,
  roughness: 0.3,
  reflectivity: 0.84,
  clearcoat: 0.0,
  clearcoatRoughness: 0.1,
  ior: 1.24,
  transmission: 0.0,
  thickness: 1.68,
  displacementScale: 1.0
};

// Performance optimized version for development
export default function ObjectPolysDev({ 
  modelPath = '/models/INITIAL OBJECT MID POLYS.glb',
  className = ''
}: ObjectPolysDevProps) {
  const [mounted, setMounted] = useState(false);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const objectModelRef = useRef<THREE.Group | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  const shadowLightPosition = useRef({ x: 5, y: 10, z: 5 });

  useEffect(() => {
    if (!mounted || !mountRef.current) return;
    
    const container = mountRef.current;
    const containerRect = container.getBoundingClientRect();

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      DEV_CAMERA_CONFIG.fov,
      containerRect.width / containerRect.height,
      DEV_CAMERA_CONFIG.near,
      DEV_CAMERA_CONFIG.far
    );
    camera.position.set(DEV_CAMERA_CONFIG.position.x, DEV_CAMERA_CONFIG.position.y, DEV_CAMERA_CONFIG.position.z);
    camera.lookAt(0, 0, 0);

    // Optimized renderer for development
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disabled for performance
      alpha: true,
      powerPreference: "low-power"
    });
    renderer.setSize(containerRect.width, containerRect.height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // Basic shadows for performance
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio
    container.appendChild(renderer.domElement);

    // Simplified lighting setup for development
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    // Smaller shadow maps for performance
    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 25;
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    directionalLight.shadow.bias = -0.001;
    directionalLightRef.current = directionalLight;
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const objectModel = gltf.scene;
        
        const boundingBox = new THREE.Box3().setFromObject(objectModel);
        const center = boundingBox.getCenter(new THREE.Vector3());
        objectModel.position.sub(center);
        
        objectModel.position.set(DEV_INITIAL_TRANSFORM.position.x, DEV_INITIAL_TRANSFORM.position.y, DEV_INITIAL_TRANSFORM.position.z);
        objectModel.rotation.set(
          DEV_INITIAL_TRANSFORM.rotation.x * Math.PI/180,
          DEV_INITIAL_TRANSFORM.rotation.y * Math.PI/180,
          DEV_INITIAL_TRANSFORM.rotation.z * Math.PI/180
        );
        objectModel.scale.set(DEV_INITIAL_TRANSFORM.scale.x, DEV_INITIAL_TRANSFORM.scale.y, DEV_INITIAL_TRANSFORM.scale.z);
        
        // Simplified material setup for performance
        objectModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Use standard material instead of physical for better performance
            const material = new THREE.MeshStandardMaterial({
              color: DEV_MATERIAL_CONFIG.color,
              metalness: DEV_MATERIAL_CONFIG.metalness,
              roughness: DEV_MATERIAL_CONFIG.roughness,
              side: THREE.DoubleSide
            });
            
            if (child.material) {
              (child.material as THREE.Material).dispose();
            }
            child.material = material;
            
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(objectModel);
        objectModelRef.current = objectModel;
        
        console.log('Object Polys development model loaded');
      },
      undefined,
      (error) => console.error('Error loading Object Polys dev model:', error)
    );

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mousePosition.current = { x, y };
      targetRotation.current = { x: y * 0.08, y: x * 0.08 };
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Performance limited animation loop (45 FPS max)
    let lastTime = 0;
    const targetFPS = 45;
    const targetFrameTime = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (currentTime - lastTime < targetFrameTime) {
        return;
      }
      lastTime = currentTime;
      
      if (objectModelRef.current) {
        const targetVelocityX = (targetRotation.current.x - currentRotation.current.x) * 0.018;
        const targetVelocityY = (targetRotation.current.y - currentRotation.current.y) * 0.018;
        const maxVelocity = 0.0012;
        const velocitySmoothing = 0.08;

        rotationVelocity.current.x += (targetVelocityX - rotationVelocity.current.x) * velocitySmoothing;
        rotationVelocity.current.y += (targetVelocityY - rotationVelocity.current.y) * velocitySmoothing;

        rotationVelocity.current.x = Math.max(Math.min(rotationVelocity.current.x, maxVelocity), -maxVelocity);
        rotationVelocity.current.y = Math.max(Math.min(rotationVelocity.current.y, maxVelocity), -maxVelocity);

        currentRotation.current.x += rotationVelocity.current.x;
        currentRotation.current.y += rotationVelocity.current.y;
        
        objectModelRef.current.rotation.x = (DEV_INITIAL_TRANSFORM.rotation.x * Math.PI/180) + currentRotation.current.x;
        objectModelRef.current.rotation.y = (DEV_INITIAL_TRANSFORM.rotation.y * Math.PI/180) + currentRotation.current.y;

        // Simplified shadow light following for performance
        if (directionalLightRef.current) {
          const baseOffset = { x: 5, y: 10, z: 5 };
          const rotationInfluence = 0.2; // Reduced influence for smoother performance
          
          const targetX = baseOffset.x + Math.sin(currentRotation.current.y) * rotationInfluence * 2;
          const targetY = baseOffset.y + Math.sin(currentRotation.current.x) * rotationInfluence * 1;
          const targetZ = baseOffset.z + Math.cos(currentRotation.current.y) * rotationInfluence * 2;

          const shadowSmoothing = 0.03; // Slightly faster smoothing
          
          shadowLightPosition.current.x += (targetX - shadowLightPosition.current.x) * shadowSmoothing;
          shadowLightPosition.current.y += (targetY - shadowLightPosition.current.y) * shadowSmoothing;
          shadowLightPosition.current.z += (targetZ - shadowLightPosition.current.z) * shadowSmoothing;

          directionalLightRef.current.position.set(
            shadowLightPosition.current.x,
            shadowLightPosition.current.y,
            shadowLightPosition.current.z
          );
        }
      }
      
      renderer.render(scene, camera);
    };
    animate(0);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      renderer.dispose();
      
      if (objectModelRef.current) {
        objectModelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
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
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 80%, rgba(0,0,0,0) 95%, transparent 100%)'
        }}
      />
    </div>
  );
}
