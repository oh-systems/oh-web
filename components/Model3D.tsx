'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

// Types and Interfaces
interface Model3DProps {
  modelPath?: string;
  className?: string;
}

// Configuration Constants
const CAMERA_CONFIG = {
  fov: 5,
  near: 0.1,
  far: 2000,
  position: { x: 0, y: 0, z: 10 }
};

const LIGHT_CONFIG = {
  color: 0xffffff,
  intensity: 200,
  width: 2,
  height: 1,
  position: { x: 0.5, y: 2.4, z: -2.2 }
};

const INITIAL_TRANSFORM = {
  position: { x: 0.15, y: 0.1, z: 0 },
  rotation: { x: 4, y: 48, z: 84 }, // degrees
  scale: { x: 1, y: 1, z: 1 }
};

const MATERIAL_CONFIG = {
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

export default function Model3D({ 
  modelPath = '/models/BLENDER OBJECT MID POLYS.glb',
  className = ''
}: Model3DProps) {
  // State for client-side rendering
  const [mounted, setMounted] = useState(false);
  
  // Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mouseLightRef = useRef<THREE.PointLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  
  // Light refs for GUI controls
  const rectLightRef = useRef<THREE.RectAreaLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  
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

  // Mouse light state - commented out for now
  // const lightPosition = useRef({ x: 0, y: 0, z: 1.5 });
  // const lightVelocity = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mounted || !mountRef.current) return;
    
    const container = mountRef.current;
    const containerRect = container.getBoundingClientRect();

    // Scene Setup
    const scene = new THREE.Scene();
    // No environment mapping - using lighting only

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      containerRect.width / containerRect.height,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );
    camera.position.set(CAMERA_CONFIG.position.x, CAMERA_CONFIG.position.y, CAMERA_CONFIG.position.z);
    camera.lookAt(0, 0, 0);

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRect.width, containerRect.height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Helper function to update environment intensity
    const updateEnvironmentIntensity = () => {
      if (modelRef.current) {
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
            child.material.envMapIntensity = 0; // No environment mapping
            child.material.needsUpdate = true;
          }
        });
        console.log('Environment mapping disabled');
      }
    };

    // Environment removed - using lighting only
    updateEnvironmentIntensity();

    // Lighting Setup
    RectAreaLightUniformsLib.init();
    
    const rectLight = new THREE.RectAreaLight(
      LIGHT_CONFIG.color,
      LIGHT_CONFIG.intensity,
      LIGHT_CONFIG.width,
      LIGHT_CONFIG.height
    );
    rectLight.position.set(LIGHT_CONFIG.position.x, LIGHT_CONFIG.position.y, LIGHT_CONFIG.position.z);
    rectLightRef.current = rectLight;
    scene.add(rectLight);
    
    const lightHelper = new RectAreaLightHelper(rectLight);
    rectLight.add(lightHelper);

    // Mouse light - commented out for now
    // const mouseLight = new THREE.PointLight(0xffffff, 0.8, 2, 2);
    // mouseLight.position.set(0, 0, 1);
    // scene.add(mouseLight);
    // mouseLightRef.current = mouseLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
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

    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 2);
    fillLight.position.set(-3, 5, -3);
    fillLightRef.current = fillLight;
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
        
        // Update light target
        rectLight.lookAt(model.position);
        
        // Configure materials
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Ensure smooth normals
            child.geometry.computeVertexNormals();
            
            // Compute tangents if possible
            const hasIndex = child.geometry.index !== null;
            const hasPosition = !!child.geometry.attributes.position;
            const hasNormal = !!child.geometry.attributes.normal;
            const hasUV = !!child.geometry.attributes.uv;
            
            if (!child.geometry.attributes.tangent && hasIndex && hasPosition && hasNormal && hasUV) {
              try {
                child.geometry.computeTangents();
              } catch (error) {
                console.warn('Failed to compute tangents:', error);
              }
            }
            
            // Apply physical material
            const material = new THREE.MeshPhysicalMaterial({
              color: MATERIAL_CONFIG.color,
              metalness: MATERIAL_CONFIG.metalness,
              roughness: MATERIAL_CONFIG.roughness,
              reflectivity: MATERIAL_CONFIG.reflectivity,
              clearcoat: MATERIAL_CONFIG.clearcoat,
              clearcoatRoughness: MATERIAL_CONFIG.clearcoatRoughness,
              ior: MATERIAL_CONFIG.ior,
              transmission: MATERIAL_CONFIG.transmission,
              thickness: MATERIAL_CONFIG.thickness,
              side: THREE.DoubleSide,
              envMapIntensity: 0, // No environment mapping
              flatShading: false,
              displacementScale: MATERIAL_CONFIG.displacementScale
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
        updateEnvironmentIntensity();
        
        // Add a small delay to ensure everything is initialized
        setTimeout(() => {
          setupGUI();
        }, 100);
      },
      undefined,
      (error) => console.error('Error loading model:', error)
    );

    // GUI Setup for Light Controls
    const setupGUI = async () => {
      try {
        const gui = new GUI();
        gui.title('Lighting Controls');
        
        // Light toggle controls
        const lightControls = {
          rectLight: true,
          directionalLight: true,
          ambientLight: true,
          fillLight: true
        };
        
        // RectArea Light Controls
        const rectFolder = gui.addFolder('RectArea Light (Main)');
        rectFolder.add(lightControls, 'rectLight').name('Enable').onChange((value: boolean) => {
          if (rectLightRef.current) {
            rectLightRef.current.visible = value;
          }
        });
        if (rectLightRef.current) {
          rectFolder.add(rectLightRef.current, 'intensity', 0, 100, 1).name('Intensity');
        }
        rectFolder.open();
        
        // Directional Light (Shadow) Controls
        const dirFolder = gui.addFolder('Directional Light (Shadow)');
        dirFolder.add(lightControls, 'directionalLight').name('Enable').onChange((value: boolean) => {
          if (directionalLightRef.current) {
            directionalLightRef.current.visible = value;
          }
        });
        if (directionalLightRef.current) {
          dirFolder.add(directionalLightRef.current, 'intensity', 0, 5, 0.1).name('Intensity');
        }
        dirFolder.open();
        
        // Ambient Light Controls
        const ambientFolder = gui.addFolder('Ambient Light (Fill)');
        ambientFolder.add(lightControls, 'ambientLight').name('Enable').onChange((value: boolean) => {
          if (ambientLightRef.current) {
            ambientLightRef.current.visible = value;
          }
        });
        if (ambientLightRef.current) {
          ambientFolder.add(ambientLightRef.current, 'intensity', 0, 2, 0.1).name('Intensity');
        }
        ambientFolder.open();
        
        // Fill Light Controls
        const fillFolder = gui.addFolder('Fill Light (Secondary)');
        fillFolder.add(lightControls, 'fillLight').name('Enable').onChange((value: boolean) => {
          if (fillLightRef.current) {
            fillLightRef.current.visible = value;
          }
        });
        if (fillLightRef.current) {
          fillFolder.add(fillLightRef.current, 'intensity', 0, 2, 0.1).name('Intensity');
        }
        fillFolder.open();
        
        console.log('Light controls GUI initialized');
      } catch (error) {
        console.error('Error setting up GUI:', error);
      }
    };

    // Mouse Movement Handler
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mousePosition.current = { x, y };
      targetRotation.current = { x: y * 0.08, y: x * 0.08 };
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (modelRef.current) {
        // Smooth rotation animation
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

        rectLight.lookAt(modelRef.current.position);

        // Smooth shadow light following
        if (directionalLightRef.current) {
          // Calculate target position based on model rotation (simplified approach)
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

        // Mouse light animation - commented out for now
        // if (mouseLightRef.current) {
        //   const time = Date.now() * 0.001;
        //   const targetVelocityX = (mousePosition.current.x - lightPosition.current.x) * 0.012;
        //   const targetVelocityY = (mousePosition.current.y - lightPosition.current.y) * 0.012;
        //   const maxLightVelocity = 0.02;
        //   const lightSmoothing = 0.08;

        //   lightVelocity.current.x += (targetVelocityX - lightVelocity.current.x) * lightSmoothing;
        //   lightVelocity.current.y += (targetVelocityY - lightVelocity.current.y) * lightSmoothing;

        //   lightVelocity.current.x = Math.max(Math.min(lightVelocity.current.x, maxLightVelocity), -maxLightVelocity);
        //   lightVelocity.current.y = Math.max(Math.min(lightVelocity.current.y, maxLightVelocity), -maxLightVelocity);

        //   lightPosition.current.x += lightVelocity.current.x;
        //   lightPosition.current.y += lightVelocity.current.y;

        //   mouseLightRef.current.position.set(
        //     lightPosition.current.x,
        //     lightPosition.current.y,
        //     lightPosition.current.z
        //   );

        //   const pulseValue = (Math.sin(time * 1.5) * 0.2) + 0.8;
        //   mouseLightRef.current.intensity = pulseValue * 0.8;
        // }
      }
      
      renderer.render(scene, camera);
    };
    animate();

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
      {/* Black gradient overlay from bottom - extends higher */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 80%, rgba(0,0,0,0) 95%, transparent 100%)'
        }}
      />
    </div>
  );
}
