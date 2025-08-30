'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Model3DProps {
  modelPath?: string;
  className?: string;
  cameraPosition?: [number, number, number];
  enableControls?: boolean;
  autoRotate?: boolean;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export default function Model3D({ 
  modelPath = '/models/INITIAL OBJECT MID POLYS.glb',
  className = '',
  cameraPosition = [0, 0, 3],
  enableControls = false,
  autoRotate = false,
  scale = 2.3,
  position = [0.4, 0.2, -1.4],
  rotation = [THREE.MathUtils.degToRad(8), THREE.MathUtils.degToRad(40), THREE.MathUtils.degToRad(84)]
}: Model3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number | null>(null);
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });
  const baseRotationRef = useRef({
    x: rotation[0],
    y: rotation[1],
    z: rotation[2]
  });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    mousePositionRef.current = { x, y };
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const containerRect = container.getBoundingClientRect();

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Pure black background
    sceneRef.current = scene;

    // Camera setup with exact control
    const camera = new THREE.PerspectiveCamera(
      5, // FOV
      containerRect.width / containerRect.height, // Aspect ratio
      0.1, // Near
      1000 // Far
    );
    camera.position.set(...cameraPosition);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup with maximum quality settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance",
      precision: "highp",
      stencil: true,
      depth: true,
      premultipliedAlpha: true
    });
    renderer.setSize(containerRect.width, containerRect.height);
    renderer.setPixelRatio(window.devicePixelRatio); // No limiting for maximum quality
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap; // Variance Shadow Maps for highest quality
    renderer.shadowMap.autoUpdate = true;
    renderer.shadowMap.needsUpdate = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Enable high-end features
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Enable high quality settings
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.physicallyCorrectLights = true;

    // Add environment map for realistic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Add minimal ambient light to preserve some detail in shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.02);
    scene.add(ambientLight);

    // Main dramatic spotlight with increased intensity
    const spotLight = new THREE.SpotLight(0xffffff, 100); // Increased from 40 to 100
    spotLight.position.set(-2, 6, -4);
    spotLight.angle = Math.PI / 16;
    spotLight.penumbra = 0.1;
    spotLight.decay = 1.2; // Reduced decay for brighter light
    spotLight.distance = 25; // Reduced distance for stronger light
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 4096;
    spotLight.shadow.mapSize.height = 4096;
    spotLight.shadow.radius = 3;
    spotLight.shadow.bias = -0.00005;
    spotLight.shadow.normalBias = 0.02;
    scene.add(spotLight);

    // Add rim light for silhouette effect with increased brightness
    const rimLight = new THREE.SpotLight(0xffffff, 120); // Increased intensity
    rimLight.position.set(0.4, 0.2, -4); // Aligned with model position but further back
    rimLight.target.position.set(0.4, 0.2, 3); // Point towards camera
    rimLight.angle = Math.PI / 6; // Wider angle
    rimLight.penumbra = 0.3; // Softer edges
    rimLight.decay = 1.0; // Reduced decay for brighter light
    rimLight.distance = 8; // Reduced distance for stronger effect
    scene.add(rimLight);
    scene.add(rimLight.target);

    // Add a second rim light for better coverage
    const rimLight2 = new THREE.SpotLight(0xffffff, 60);
    rimLight2.position.set(0.4, 2, -3);
    rimLight2.target.position.set(0.4, 0.2, 3);
    rimLight2.angle = Math.PI / 6;
    rimLight2.penumbra = 0.3;
    rimLight2.decay = 1.2;
    rimLight2.distance = 10;
    scene.add(rimLight2);
    scene.add(rimLight2.target);

    // Target the spotlight at the center where the model will be
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight.target);

    // dat.GUI setup for toneMapping
    let gui: any;
    import('dat.gui').then((dat) => {
      gui = new dat.GUI();
      // Make GUI appear above other elements
      const guiContainer = gui.domElement.parentElement;
      if (guiContainer) {
        guiContainer.style.zIndex = '1000';
      }
      const params = {
        // Tone mapping options
        toneMapping: renderer.toneMapping,
        // Position controls
        positionX: position[0],
        positionY: position[1],
        positionZ: position[2],
        // Rotation controls (in degrees for easier understanding)
        rotationX: THREE.MathUtils.radToDeg(rotation[0]),
        rotationY: THREE.MathUtils.radToDeg(rotation[1]),
        rotationZ: THREE.MathUtils.radToDeg(rotation[2])
      };

      // Tone mapping controls
      const toneMappingOptions = {
        No: THREE.NoToneMapping,
        Linear: THREE.LinearToneMapping,
        Reinhard: THREE.ReinhardToneMapping,
        Cineon: THREE.CineonToneMapping,
        ACESFilmic: THREE.ACESFilmicToneMapping
      };
      gui.add(params, 'toneMapping', toneMappingOptions).onChange((value: THREE.ToneMapping) => {
        renderer.toneMapping = value as THREE.ToneMapping;
      });

      // Position controls
      const positionFolder = gui.addFolder('Position');
      positionFolder.add(params, 'positionX', -5, 5, 0.1).onChange((value: number) => {
        if (modelRef.current) {
          modelRef.current.position.x = value;
        }
      });
      positionFolder.add(params, 'positionY', -5, 5, 0.1).onChange((value: number) => {
        if (modelRef.current) {
          modelRef.current.position.y = value;
        }
      });
      positionFolder.add(params, 'positionZ', -5, 5, 0.1).onChange((value: number) => {
        if (modelRef.current) {
          modelRef.current.position.z = value;
        }
      });
      positionFolder.open();

      // Rotation controls
      const rotationFolder = gui.addFolder('Rotation');
      rotationFolder.add(params, 'rotationX', -180, 180, 1).onChange((value: number) => {
        if (modelRef.current && baseRotationRef.current) {
          baseRotationRef.current.x = THREE.MathUtils.degToRad(value);
        }
      });
      rotationFolder.add(params, 'rotationY', -180, 180, 1).onChange((value: number) => {
        if (modelRef.current && baseRotationRef.current) {
          baseRotationRef.current.y = THREE.MathUtils.degToRad(value);
        }
      });
      rotationFolder.add(params, 'rotationZ', -180, 180, 1).onChange((value: number) => {
        if (modelRef.current && baseRotationRef.current) {
          baseRotationRef.current.z = THREE.MathUtils.degToRad(value);
        }
      });
      rotationFolder.open();
    });

    // No ambient light to keep the environment dark

    // Controls setup (if enabled)
    if (enableControls) {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 1;
      controls.minDistance = 2;
      controls.maxDistance = 20;
      controlsRef.current = controls;
    }

    // Load model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(...position);
        model.rotation.set(...rotation);
        
        // Traverse and setup materials
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Convert to MeshPhysicalMaterial for maximum realism
            if (child.material) {
              const physicalMaterial = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0xffffff).convertSRGBToLinear(), // Pure white base color
                roughness: 0.5,            // Reduced roughness for more reflections
                metalness: 0.1,            // Slight metalness for brighter reflections
                envMapIntensity: 0.2,      // Slight environment reflections
                clearcoat: 0.1,            // Slight clearcoat for extra shine
                reflectivity: 0.5,         // Increased reflectivity
                ior: 1.2,                  // Slight refraction for brightness
                transmission: 0.0,         // No transmission
                sheen: 0.0,               // No sheen
                anisotropy: 0.0           // No anisotropy
              });
              
              // Copy any maps from the original material
              if (child.material.map) physicalMaterial.map = child.material.map;
              if (child.material.normalMap) physicalMaterial.normalMap = child.material.normalMap;
              
              // Replace the original material
              child.material = physicalMaterial;
              
              // High quality geometry processing
              if (child.geometry) {
                child.geometry.computeVertexNormals();
                // Ensure proper normal calculations
                child.geometry.computeBoundingSphere();
                child.geometry.computeBoundingBox();
              }
              
              // Material quality settings
              child.material.precision = 'highp';
              child.material.flatShading = false;
              child.material.needsUpdate = true;
            }
          }
        });
        
        scene.add(model);
        modelRef.current = model;
      },
      (progress) => {
        console.log('Loading progress:', progress);
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Mouse interaction for slight rotation
      if (modelRef.current && baseRotationRef.current) {
        const rotationX = (mousePositionRef.current.y - 0.5) * 0.3;
        const rotationY = (mousePositionRef.current.x - 0.5) * 0.3;
        
        modelRef.current.rotation.x = baseRotationRef.current.x + rotationX;
        modelRef.current.rotation.y = baseRotationRef.current.y + rotationY;
        modelRef.current.rotation.z = baseRotationRef.current.z;
      }

      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer || !container) return;
      
      const newRect = container.getBoundingClientRect();
      camera.aspect = newRect.width / newRect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(newRect.width, newRect.height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }

      // Remove dat.GUI
      if (gui) {
        gui.destroy();
      }
    };
  }, [modelPath, scale, position, rotation, cameraPosition, enableControls, autoRotate]);

  return (
    <div 
      ref={mountRef}
      className={`w-full h-full ${className}`}
      onMouseMove={handleMouseMove}
      style={{ background: 'transparent' }}
    />
  );
}
