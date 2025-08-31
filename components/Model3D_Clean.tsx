'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import type { GUI } from 'dat.gui';

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
  intensity: 20,
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

const ENVIRONMENT_CONFIG = {
  environmentIntensity: 0.2,
  backgroundVisible: false,
  backgroundBlurriness: 0.0,
  backgroundIntensity: 1.0,
  environmentRotationY: 0.0
};

export default function Model3D({ 
  modelPath = '/models/BLENDER OBJECT MID POLYS.glb',
  className = ''
}: Model3DProps) {
  // Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mouseLightRef = useRef<THREE.PointLight | null>(null);
  
  // Mouse interaction state
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });
  const lightPosition = useRef({ x: 0, y: 0, z: 1.5 });
  const lightVelocity = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;
    
    const container = mountRef.current;
    const containerRect = container.getBoundingClientRect();

    // Scene Setup
    const scene = new THREE.Scene();
    let hdriTexture: THREE.Texture | null = null;
    const environmentSettings = { ...ENVIRONMENT_CONFIG };

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
            child.material.envMapIntensity = environmentSettings.environmentIntensity;
            child.material.needsUpdate = true;
          }
        });
        console.log(`Environment intensity applied: ${environmentSettings.environmentIntensity}`);
      }
    };

    // HDRI Environment Setup
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('/hdris/overcast_industrial_courtyard_4k.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      hdriTexture = texture;
      scene.environment = texture;
      scene.background = environmentSettings.backgroundVisible ? texture : null;
      scene.backgroundBlurriness = environmentSettings.backgroundBlurriness;
      scene.backgroundIntensity = environmentSettings.backgroundIntensity;
      updateEnvironmentIntensity();
      console.log('HDRI environment map loaded');
    }, undefined, (error) => {
      console.error('Error loading HDRI:', error);
    });

    // Lighting Setup
    RectAreaLightUniformsLib.init();
    
    const rectLight = new THREE.RectAreaLight(
      LIGHT_CONFIG.color,
      LIGHT_CONFIG.intensity,
      LIGHT_CONFIG.width,
      LIGHT_CONFIG.height
    );
    rectLight.position.set(LIGHT_CONFIG.position.x, LIGHT_CONFIG.position.y, LIGHT_CONFIG.position.z);
    scene.add(rectLight);
    
    const lightHelper = new RectAreaLightHelper(rectLight);
    rectLight.add(lightHelper);

    const mouseLight = new THREE.PointLight(0xffffff, 0.8, 2, 2);
    mouseLight.position.set(0, 0, 1);
    scene.add(mouseLight);
    mouseLightRef.current = mouseLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
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
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
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
              envMapIntensity: environmentSettings.environmentIntensity,
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
        
        setupGUI();
      },
      undefined,
      (error) => console.error('Error loading model:', error)
    );

    // GUI Setup
    const setupGUI = async () => {
      const dat = await import('dat.gui');
      const gui = new dat.GUI();

      const guiContainer = gui.domElement.parentElement;
      if (guiContainer) {
        guiContainer.style.cssText = 'position: fixed !important; z-index: 999999 !important; top: 0 !important; right: 16px !important;';
      }

      if (!modelRef.current) return;
      const model = modelRef.current;

      // Transform Controls
      const transformFolder = gui.addFolder('Transform');
      const position = { x: model.position.x, y: model.position.y, z: model.position.z };
      
      transformFolder.add(position, 'x', 0, 0.3, 0.01).onChange((value: number) => { 
        model.position.x = value;
        rectLight.lookAt(model.position);
      });
      transformFolder.add(position, 'y', 0, 0.2, 0.01).onChange((value: number) => { 
        model.position.y = value;
        rectLight.lookAt(model.position);
      });
      transformFolder.add(position, 'z', -0.1, 0.1, 0.01).onChange((value: number) => { 
        model.position.z = value;
        rectLight.lookAt(model.position);
      });

      const rotation = {
        x: THREE.MathUtils.radToDeg(model.rotation.x),
        y: THREE.MathUtils.radToDeg(model.rotation.y),
        z: THREE.MathUtils.radToDeg(model.rotation.z)
      };
      transformFolder.add(rotation, 'x', -10, 20, 1).onChange((value: number) => { 
        model.rotation.x = THREE.MathUtils.degToRad(value); 
      });
      transformFolder.add(rotation, 'y', 30, 66, 1).onChange((value: number) => { 
        model.rotation.y = THREE.MathUtils.degToRad(value); 
      });
      transformFolder.add(rotation, 'z', 70, 98, 1).onChange((value: number) => { 
        model.rotation.z = THREE.MathUtils.degToRad(value); 
      });

      const scale = { uniform: 1.0 };
      transformFolder.add(scale, 'uniform', 0.5, 2, 0.1).onChange((value: number) => { 
        model.scale.set(value, value, value); 
      });

      // Material Controls
      const materialFolder = gui.addFolder('Material');
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshPhysicalMaterial;
          
          const materialColor = { color: '#' + material.color.getHexString() };
          materialFolder.addColor(materialColor, 'color').onChange((value: string) => {
            material.color.set(value);
          });
          
          materialFolder.add(material, 'metalness', 0, 1, 0.01);
          materialFolder.add(material, 'roughness', 0, 1, 0.01);
          materialFolder.add(material, 'reflectivity', 0, 1, 0.01);
          
          const physicalFolder = materialFolder.addFolder('Physical Properties');
          physicalFolder.add(material, 'clearcoat', 0, 1, 0.01);
          physicalFolder.add(material, 'clearcoatRoughness', 0, 1, 0.01);
          physicalFolder.add(material, 'ior', 1, 2.33, 0.01);
          physicalFolder.add(material, 'transmission', 0, 1, 0.01);
          physicalFolder.add(material, 'thickness', 0, 5, 0.01);
          
          const surfaceFolder = materialFolder.addFolder('Surface Properties');
          surfaceFolder.add(material, 'wireframe');
          surfaceFolder.add(material, 'flatShading').onChange(() => material.needsUpdate = true);
        }
      });

      // Environment Controls
      const environmentFolder = gui.addFolder('Environment');
      
      environmentFolder.add(environmentSettings, 'environmentIntensity', 0, 3, 0.1)
        .name('Environment Intensity')
        .onChange((value: number) => {
          environmentSettings.environmentIntensity = value;
          updateEnvironmentIntensity();
        });

      environmentFolder.add(environmentSettings, 'backgroundVisible')
        .name('Show Background')
        .onChange((value: boolean) => {
          scene.background = value ? hdriTexture : null;
        });

      environmentFolder.add(environmentSettings, 'backgroundBlurriness', 0, 1, 0.01)
        .name('Background Blur')
        .onChange((value: number) => {
          scene.backgroundBlurriness = value;
        });

      environmentFolder.add(environmentSettings, 'backgroundIntensity', 0, 3, 0.1)
        .name('Background Intensity')
        .onChange((value: number) => {
          scene.backgroundIntensity = value;
        });

      // Lighting Controls
      const lightFolder = gui.addFolder('Area Light');
      
      const lightColor = { color: '#' + rectLight.color.getHexString() };
      lightFolder.addColor(lightColor, 'color').onChange((value: string) => {
        rectLight.color.set(value);
      });

      lightFolder.add(rectLight, 'intensity', 0, 10, 0.1);
      lightFolder.add(rectLight, 'width', 0.1, 5, 0.1).onChange(() => {
        rectLight.remove(lightHelper);
        const newHelper = new RectAreaLightHelper(rectLight);
        rectLight.add(newHelper);
      });
      lightFolder.add(rectLight, 'height', 0.1, 5, 0.1).onChange(() => {
        rectLight.remove(lightHelper);
        const newHelper = new RectAreaLightHelper(rectLight);
        rectLight.add(newHelper);
      });

      const lightPosition = { x: rectLight.position.x, y: rectLight.position.y, z: rectLight.position.z };
      lightFolder.add(lightPosition, 'x', -10, 10, 0.1).onChange((value: number) => { 
        rectLight.position.x = value;
        rectLight.lookAt(model.position);
      });
      lightFolder.add(lightPosition, 'y', -10, 10, 0.1).onChange((value: number) => { 
        rectLight.position.y = value;
        rectLight.lookAt(model.position);
      });
      lightFolder.add(lightPosition, 'z', -10, 10, 0.1).onChange((value: number) => { 
        rectLight.position.z = value;
        rectLight.lookAt(model.position);
      });

      // Renderer Controls
      const rendererFolder = gui.addFolder('Renderer Settings');
      
      const shadowSettings = { enableShadows: renderer.shadowMap.enabled };
      rendererFolder.add(shadowSettings, 'enableShadows').onChange((value: boolean) => {
        renderer.shadowMap.enabled = value;
        directionalLight.castShadow = value;
        if (modelRef.current) {
          modelRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = value;
              child.receiveShadow = value;
            }
          });
        }
      });

      const rendererSettings = { exposure: 1.0 };
      rendererFolder.add(rendererSettings, 'exposure', 0, 2, 0.01).onChange((value: number) => {
        renderer.toneMappingExposure = value;
      });

      // Open folders
      transformFolder.open();
      materialFolder.open();
      environmentFolder.open();
      lightFolder.open();
    };

    // Mouse Movement Handler
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mousePosition.current = { x, y };
      targetRotation.current = { x: y * 0.03, y: x * 0.03 };
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (modelRef.current) {
        // Smooth rotation animation
        const targetVelocityX = (targetRotation.current.x - currentRotation.current.x) * 0.012;
        const targetVelocityY = (targetRotation.current.y - currentRotation.current.y) * 0.012;
        const maxVelocity = 0.0005;
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

        // Animate mouse light
        if (mouseLightRef.current) {
          const time = Date.now() * 0.001;
          const targetVelocityX = (mousePosition.current.x - lightPosition.current.x) * 0.012;
          const targetVelocityY = (mousePosition.current.y - lightPosition.current.y) * 0.012;
          const maxLightVelocity = 0.02;
          const lightSmoothing = 0.08;

          lightVelocity.current.x += (targetVelocityX - lightVelocity.current.x) * lightSmoothing;
          lightVelocity.current.y += (targetVelocityY - lightVelocity.current.y) * lightSmoothing;

          lightVelocity.current.x = Math.max(Math.min(lightVelocity.current.x, maxLightVelocity), -maxLightVelocity);
          lightVelocity.current.y = Math.max(Math.min(lightVelocity.current.y, maxLightVelocity), -maxLightVelocity);

          lightPosition.current.x += lightVelocity.current.x;
          lightPosition.current.y += lightVelocity.current.y;

          mouseLightRef.current.position.set(
            lightPosition.current.x,
            lightPosition.current.y,
            lightPosition.current.z
          );

          const pulseValue = (Math.sin(time * 1.5) * 0.2) + 0.8;
          mouseLightRef.current.intensity = pulseValue * 0.8;
        }
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
  }, [modelPath]);

  return (
    <div 
      ref={mountRef}
      className={`w-full h-full ${className}`}
      style={{ background: 'transparent' }}
    />
  );
}
