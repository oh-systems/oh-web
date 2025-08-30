'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import type { GUI } from 'dat.gui';

// Types and Interfaces
interface Model3DProps {
  modelPath?: string;    // Path to the 3D model file
  className?: string;    // CSS classes for styling
}

// Constants for Three.js setup
const CAMERA_CONFIG = {
  fov: 5,               // Field of view in degrees
  near: 0.1,            // Near clipping plane
  far: 2000,            // Far clipping plane
  position: {           // Camera position
    x: 0,
    y: 0,
    z: 10
  }
};

const LIGHT_CONFIG = {
  color: 0xffffff,      // White light
  intensity: 20,        // Higher intensity for rect area light
  width: 2,             // Width of the area light
  height: 1,            // Height of the area light
  position: {           // Light position
    x: 0.5,
    y: 2.4,
    z: -2.2
  }
};

export default function Model3D({ 
  modelPath = '/models/INITIAL OBJECT LOWER POLYS.glb',
  className = ''
}: Model3DProps) {
  // Component refs
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  
  // Mouse interaction refs
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const mouseLightRef = useRef<THREE.PointLight | null>(null);

  // Main Three.js setup and rendering logic
  useEffect(() => {
    // Initial setup validation
    if (!mountRef.current) return;
    const container = mountRef.current;
    const containerRect = container.getBoundingClientRect();

    // Scene initialization
    const scene = new THREE.Scene();

    // Camera initialization
    const camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      containerRect.width / containerRect.height,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );
    const { x, y, z } = CAMERA_CONFIG.position;
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);

    // Renderer initialization
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(containerRect.width, containerRect.height);
    container.appendChild(renderer.domElement);

    // Initialize RectAreaLight
    RectAreaLightUniformsLib.init();

        // Create mouse light - smaller and more subtle
    const mouseLight = new THREE.PointLight(0xffffff, 0.8, 2, 2);
    mouseLight.position.set(0, 0, 1);
    scene.add(mouseLight);
    mouseLightRef.current = mouseLight;
    
    // Main area light initialization
    const light = new THREE.RectAreaLight(
      LIGHT_CONFIG.color,
      LIGHT_CONFIG.intensity,
      LIGHT_CONFIG.width,
      LIGHT_CONFIG.height
    );
    light.position.set(
      LIGHT_CONFIG.position.x,
      LIGHT_CONFIG.position.y,
      LIGHT_CONFIG.position.z
    );
    // Initial lookAt will be updated once model is loaded
    scene.add(light);

    // Add light helper for visualization
    const lightHelper = new RectAreaLightHelper(light);
    light.add(lightHelper);

    // Model loading and setup
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        
        // Center the model
        const boundingBox = new THREE.Box3().setFromObject(model);
        const center = boundingBox.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Apply initial transformations
        model.position.set(0.15, 0.1, 0);  // Match GUI values
        model.rotation.set(
          4 * Math.PI/180,     // 4 degrees
          48 * Math.PI/180,    // 48 degrees
          84 * Math.PI/180     // 84 degrees
        );
        model.scale.set(1, 1, 1);          // Scale of 1
        
        // Update light to look at the model
        light.lookAt(model.position);
        
        // Set initial material properties
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshStandardMaterial;
            material.color.set(0xffffff);  // White color (#ffffff)
            material.roughness = 0.3;     // Set initial roughness
          }
        });
        
        scene.add(model);
        modelRef.current = model;
        // Initialize GUI controls
        const setupGUI = async () => {
          const dat = await import('dat.gui');
          const gui = new dat.GUI();

          // Configure GUI container
          const guiContainer = gui.domElement.parentElement;
          if (guiContainer) {
            guiContainer.style.cssText = 'position: fixed !important; z-index: 999999 !important; top: 0 !important; right: 16px !important;';
          }

          // Create transform controls folder
          const transformFolder = gui.addFolder('Transform');
          
          // Position controls
          const position = { x: model.position.x, y: model.position.y, z: model.position.z };
          transformFolder.add(position, 'x', 0, 0.3, 0.01)
            .onChange((value: number) => { 
              model.position.x = value;
              light.lookAt(model.position);
            });
          transformFolder.add(position, 'y', 0, 0.2, 0.01)
            .onChange((value: number) => { 
              model.position.y = value;
              light.lookAt(model.position);
            });
          transformFolder.add(position, 'z', -0.1, 0.1, 0.01)
            .onChange((value: number) => { 
              model.position.z = value;
              light.lookAt(model.position);
            });

          // Rotation controls
          const rotation = {
            x: THREE.MathUtils.radToDeg(model.rotation.x),
            y: THREE.MathUtils.radToDeg(model.rotation.y),
            z: THREE.MathUtils.radToDeg(model.rotation.z)
          };
          transformFolder.add(rotation, 'x', -10, 20, 1).name('rotate X')
            .onChange((value: number) => { model.rotation.x = THREE.MathUtils.degToRad(value); });
          transformFolder.add(rotation, 'y', 30, 66, 1).name('rotate Y')
            .onChange((value: number) => { model.rotation.y = THREE.MathUtils.degToRad(value); });
          transformFolder.add(rotation, 'z', 70, 98, 1).name('rotate Z')
            .onChange((value: number) => { model.rotation.z = THREE.MathUtils.degToRad(value); });

          // Scale control
          const scale = { uniform: 1.0 };
          transformFolder.add(scale, 'uniform', 0.5, 2, 0.1).name('scale')
            .onChange((value: number) => { model.scale.set(value, value, value); });

          // Create material folder with advanced properties
          const materialFolder = gui.addFolder('Material');
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial;
              
              // Color control
              const materialColor = { color: '#' + material.color.getHexString() };
              materialFolder.addColor(materialColor, 'color')
                .onChange((value: string) => {
                  material.color.set(value);
                });
              
              // Main Material properties
              materialFolder.add(material, 'metalness', 0, 1, 0.01)
                .name('metalness');
              materialFolder.add(material, 'roughness', 0, 1, 0.01)
                .name('roughness');
              materialFolder.add(material, 'envMapIntensity', 0, 1, 0.01)
                .name('environment');
                
              // Surface Properties
              const surfaceFolder = materialFolder.addFolder('Surface Properties');
              surfaceFolder.add(material, 'wireframe');
              surfaceFolder.add(material, 'flatShading')
                .onChange(() => material.needsUpdate = true);
              surfaceFolder.add(material, 'aoMapIntensity', 0, 1, 0.01)
                .name('ambient occlusion');
              
              // Advanced Properties
              const advancedFolder = materialFolder.addFolder('Advanced Properties');
              // Add normal scale control (affects normal mapping)
              const normalScaleFolder = advancedFolder.addFolder('Normal Scale');
              normalScaleFolder.add(material.normalScale, 'x', 0, 1, 0.01)
                .name('X scale');
              normalScaleFolder.add(material.normalScale, 'y', 0, 1, 0.01)
                .name('Y scale');
              
              // Displacement control
              advancedFolder.add(material, 'displacementScale', 0, 1, 0.01)
                .name('displacement');
              
              // Emission Properties
              const emissionFolder = materialFolder.addFolder('Emission');
              emissionFolder.add(material, 'emissiveIntensity', 0, 1, 0.01)
                .name('intensity');
              const emissiveColor = { color: '#000000' };
              emissionFolder.addColor(emissiveColor, 'color')
                .name('color')
                .onChange((value: string) => {
                  material.emissive.set(value);
                });
              
              // Material Rendering
              const renderFolder = materialFolder.addFolder('Render Settings');
              renderFolder.add(material, 'transparent');
              renderFolder.add(material, 'opacity', 0, 1, 0.01)
                .name('opacity');
              renderFolder.add(material, 'alphaTest', 0, 1, 0.01)
                .name('alpha test');
              renderFolder.add(material, 'side', {
                Front: THREE.FrontSide,
                Back: THREE.BackSide,
                Double: THREE.DoubleSide
              })
                .onChange(() => material.needsUpdate = true);
            }
          });

          // Create light controls folder
          const lightFolder = gui.addFolder('Area Light');
          
          // Light color
          const lightColor = { color: '#' + light.color.getHexString() };
          lightFolder.addColor(lightColor, 'color')
            .onChange((value: string) => {
              light.color.set(value);
            });

          // Light intensity
          const lightIntensity = { value: light.intensity };
          lightFolder.add(lightIntensity, 'value', 0, 10, 0.1)
            .name('intensity')
            .onChange((value: number) => {
              light.intensity = value;
            });

          // Light dimensions
          const lightDimensions = {
            width: light.width,
            height: light.height
          };
          lightFolder.add(lightDimensions, 'width', 0.1, 5, 0.1)
            .onChange((value: number) => { 
              light.width = value;
              // Re-create helper when dimensions change
              light.remove(lightHelper);
              const newHelper = new RectAreaLightHelper(light);
              light.add(newHelper);
            });
          lightFolder.add(lightDimensions, 'height', 0.1, 5, 0.1)
            .onChange((value: number) => { 
              light.height = value;
              // Re-create helper when dimensions change
              light.remove(lightHelper);
              const newHelper = new RectAreaLightHelper(light);
              light.add(newHelper);
            });

          // Light position
          const lightPosition = {
            x: light.position.x,
            y: light.position.y,
            z: light.position.z
          };
          lightFolder.add(lightPosition, 'x', -10, 10, 0.1)
            .onChange((value: number) => { 
              light.position.x = value;
              light.lookAt(modelRef.current?.position || new THREE.Vector3());
            });
          lightFolder.add(lightPosition, 'y', -10, 10, 0.1)
            .onChange((value: number) => { 
              light.position.y = value;
              light.lookAt(modelRef.current?.position || new THREE.Vector3());
            });
          lightFolder.add(lightPosition, 'z', -10, 10, 0.1)
            .onChange((value: number) => { 
              light.position.z = value;
              light.lookAt(modelRef.current?.position || new THREE.Vector3());
            });

          // Open folders
          transformFolder.open();
          materialFolder.open();
          lightFolder.open();
        };

        setupGUI().catch(console.error);
      },
      undefined,
      (error) => console.error('Error loading model:', error)
    );

    // Mouse movement handler
    const handleMouseMove = (event: MouseEvent) => {
      // Calculate mouse position relative to container
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mousePosition.current = { x, y };
      
      // Set target rotation (scaled down for subtle effect)
      targetRotation.current = {
        x: y * 0.05,
        y: x * 0.05
      };

      // Update mouse light position with subtle movement
      if (mouseLightRef.current) {
        mouseLightRef.current.position.set(
          x * 1.5,  // Reduced range of movement
          y * 1.5,  // Reduced range of movement
          1.5      // Slightly further from the model for softer lighting
        );
      }
    };

    // Add mouse event listener
    container.addEventListener('mousemove', handleMouseMove);

    // Animation loop with smooth interpolation
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (modelRef.current) {
        // Smoothly interpolate current rotation towards target rotation
        currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.1;
        currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.1;
        
        // Apply rotation while preserving initial rotation
        modelRef.current.rotation.x = (4 * Math.PI/180) + currentRotation.current.x;
        modelRef.current.rotation.y = (48 * Math.PI/180) + currentRotation.current.y;

        // Update light to keep looking at the model
        light.lookAt(modelRef.current.position);

        // Animate mouse light with subtle pulsing
        if (mouseLightRef.current) {
          const time = Date.now() * 0.001; // Convert to seconds
          // Gentle pulsing intensity
          const pulseValue = (Math.sin(time * 1.5) * 0.2) + 0.8; // Values between 0.6 and 1.0
          mouseLightRef.current.intensity = pulseValue * 0.8; // Keep intensity subtle
        }
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup function
    return () => {
      // Remove event listener
      container.removeEventListener('mousemove', handleMouseMove);
      
      // Stop animation loop
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      // Dispose of Three.js resources
      renderer.dispose();
      
      // Clean up model geometries and materials
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
  }, [modelPath]);

  // Render the container div that will hold the Three.js canvas
  return (
    <div 
      ref={mountRef}                           // Attach our ref
      className={`w-full h-full ${className}`} // Apply sizing and custom classes
      style={{ background: 'transparent' }}    // Make background transparent
    />
  );
}
