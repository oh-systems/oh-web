'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Types and Interfaces
interface Model3DProps {
  modelPath?: string;
  className?: string;
}

// Configuration Constants (same as original but optimized)
const CAMERA_CONFIG = {
  fov: 5,
  near: 0.1,
  far: 2000,
  position: { x: 0, y: 0, z: 10 }
};

// Simplified lighting config for development
const DEV_LIGHT_CONFIG = {
  ambient: { color: 0x404040, intensity: 1.5 },
  directional: { color: 0xffffff, intensity: 2.0 },
  fill: { color: 0xffffff, intensity: 1.0 }
};

const INITIAL_TRANSFORM = {
  position: { x: 0.15, y: 0.1, z: 0 },
  rotation: { x: 4, y: 48, z: 84 }, // degrees
  scale: { x: 1, y: 1, z: 1 }
};

// Simplified material config for development
const DEV_MATERIAL_CONFIG = {
  color: 0xffffff,
  metalness: 0.0,
  roughness: 0.4,
  reflectivity: 0.5
};

export default function Model3D_Dev({ 
  modelPath = '/models/INITIAL OBJECT MID POLYS.glb',
  className = ''
}: Model3DProps) {
  // State for client-side rendering
  const [mounted, setMounted] = useState(false);
  
  // Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  
  // Ensure client-side only
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Mouse interaction state
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  // Shadow light position tracking  
  const shadowLightPosition = useRef({ x: 5, y: 10, z: 5 });

  useEffect(() => {
    if (!mounted || !mountRef.current) return;
    
    const container = mountRef.current;
    const containerRect = container.getBoundingClientRect();

    // Scene Setup
    const scene = new THREE.Scene();

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      containerRect.width / containerRect.height,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );
    camera.position.set(CAMERA_CONFIG.position.x, CAMERA_CONFIG.position.y, CAMERA_CONFIG.position.z);
    camera.lookAt(0, 0, 0);

    // Optimized Renderer Setup for Development
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disabled for performance
      alpha: true,
      powerPreference: "low-power"
    });
    renderer.setSize(containerRect.width, containerRect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio for performance
    
    // Simplified shadow mapping for development
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // Faster than PCFSoftShadowMap
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Simplified Lighting Setup (no RectAreaLight for performance)
    const ambientLight = new THREE.AmbientLight(
      DEV_LIGHT_CONFIG.ambient.color, 
      DEV_LIGHT_CONFIG.ambient.intensity
    );
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      DEV_LIGHT_CONFIG.directional.color, 
      DEV_LIGHT_CONFIG.directional.intensity
    );
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    
    // Reduced shadow map size for performance
    directionalLight.shadow.mapSize.width = 512;  // Reduced from 1024
    directionalLight.shadow.mapSize.height = 512; // Reduced from 1024
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 25;
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    directionalLight.shadow.bias = -0.001;
    directionalLight.shadow.normalBias = 0.02;
    directionalLightRef.current = directionalLight;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(
      DEV_LIGHT_CONFIG.fill.color, 
      DEV_LIGHT_CONFIG.fill.intensity
    );
    fillLight.position.set(-3, 5, -3);
    scene.add(fillLight);

    // Model Loading
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        
        // Center the model
        const boundingBox = new THREE.Box3().setFromObject(model);
        const center = boundingBox.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Apply initial transform
        model.position.set(INITIAL_TRANSFORM.position.x, INITIAL_TRANSFORM.position.y, INITIAL_TRANSFORM.position.z);
        model.rotation.set(
          INITIAL_TRANSFORM.rotation.x * Math.PI/180,
          INITIAL_TRANSFORM.rotation.y * Math.PI/180,
          INITIAL_TRANSFORM.rotation.z * Math.PI/180
        );
        model.scale.set(INITIAL_TRANSFORM.scale.x, INITIAL_TRANSFORM.scale.y, INITIAL_TRANSFORM.scale.z);
        
        // Configure materials (simplified for development)
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Ensure smooth normals
            child.geometry.computeVertexNormals();
            
            // Use MeshStandardMaterial instead of MeshPhysicalMaterial for performance
            const material = new THREE.MeshStandardMaterial({
              color: DEV_MATERIAL_CONFIG.color,
              metalness: DEV_MATERIAL_CONFIG.metalness,
              roughness: DEV_MATERIAL_CONFIG.roughness,
              side: THREE.DoubleSide,
              envMapIntensity: 0 // No environment mapping for performance
            });
            
            if (child.material) {
              (child.material as THREE.Material).dispose();
            }
            child.material = material;
            
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        modelRef.current = model;
      },
      undefined,
      (error) => console.error('Error loading model:', error)
    );

    // Mouse Movement Handler
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mousePosition.current = { x, y };
      targetRotation.current = { x: y * 0.08, y: x * 0.08 };
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Optimized Animation Loop
    let lastTime = 0;
    const targetFPS = 45; // Slightly higher than basic dev, lower than production
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Throttle animation to target FPS
      if (currentTime - lastTime < frameInterval) {
        return;
      }
      lastTime = currentTime;
      
      if (modelRef.current) {
        // Smooth rotation animation (same as original but slightly simplified)
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
        
        modelRef.current.rotation.x = (INITIAL_TRANSFORM.rotation.x * Math.PI/180) + currentRotation.current.x;
        modelRef.current.rotation.y = (INITIAL_TRANSFORM.rotation.y * Math.PI/180) + currentRotation.current.y;

        // Simplified shadow light following
        if (directionalLightRef.current) {
          const baseOffset = { x: 5, y: 10, z: 5 };
          const rotationInfluence = 0.3;
          
          const targetX = baseOffset.x + Math.sin(currentRotation.current.y) * rotationInfluence * 3;
          const targetY = baseOffset.y + Math.sin(currentRotation.current.x) * rotationInfluence * 2;
          const targetZ = baseOffset.z + Math.cos(currentRotation.current.y) * rotationInfluence * 3;

          // Smooth interpolation to target position
          const shadowSmoothing = 0.02;
          
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

    // Cleanup
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      renderer.dispose();
      
      if (modelRef.current) {
        modelRef.current.traverse((child) => {
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
      {/* Simplified gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 80%, rgba(0,0,0,0) 95%, transparent 100%)'
        }}
      />
    </div>
  );
}
