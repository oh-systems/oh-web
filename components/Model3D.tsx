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
  modelPath = '/models/INITIAL OBJECT LOWER POLYS.glb',
  className = '',
  cameraPosition = [0, 0, 3],
  enableControls = false,
  autoRotate = false,
  scale = 2.3,
  position = [0.5, -0.9, 0],
  rotation = [0, -0.7, 0]
}: Model3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number | null>(null);
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });

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

    // Renderer setup with full control
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRect.width, containerRect.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

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
      if (modelRef.current) {
        const rotationX = (mousePositionRef.current.y - 0.5) * 0.3;
        const rotationY = (mousePositionRef.current.x - 0.5) * 0.3;
        
        modelRef.current.rotation.x = rotation[0] + rotationX;
        modelRef.current.rotation.y = rotation[1] + rotationY;
        modelRef.current.rotation.z = rotation[2];
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
