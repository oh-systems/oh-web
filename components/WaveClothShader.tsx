"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WaveClothShaderProps {
  progress?: number; // 0 to 1, for fade out
}

const WaveClothShader = ({ progress = 0 }: WaveClothShaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const progressRef = useRef(progress);

  // Update progress ref when prop changes
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any existing canvas elements first
    const container = containerRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    let animationId: number;
    
    // Vertex Shader
    const vertexShader = `
      float hash(float n) { return fract(sin(n) * 1e4); }
      float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

      float noise(float x) {
        float i = floor(x);
        float f = fract(x);
        float u = f * f * (3.0 - 2.0 * f);
        return mix(hash(i), hash(i + 1.0), u);
      }

      float noise(vec2 x) {
        vec2 i = floor(x);
        vec2 f = fract(x);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float noise(vec3 x) {
        const vec3 step = vec3(110, 241, 171);
        vec3 i = floor(x);
        vec3 f = fract(x);
        float n = dot(i, step);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                       mix(hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
                   mix(mix(hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                       mix(hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
      }

      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vPosition;

      float xmbNoise(vec3 x) {
        return cos(x.z * 4.0) * cos(x.z + uTime / 10.0 + x.x);
      }

      void main() {
        vec3 p = vec3(position.x, 0.0, position.y);
        p.y = xmbNoise(p) / 8.0;
        
        vec3 p2 = p;
        p2.x -= uTime / 5.0;
        p2.x /= 4.0;
        p2.y -= uTime / 100.0;
        p2.z -= uTime / 10.0;
        p.y -= noise(p2 * 8.0) / 12.0 + cos(p.x * 2.0 - uTime / 2.0) / 5.0 - 0.3;
        p.z -= noise(p2 * 8.0) / 12.0;
        
        vec4 modelPosition = modelMatrix * vec4(p, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;
        
        vUv = uv;
        vPosition = p;
      }
    `;

    // Fragment Shader
    const fragmentShader = `
      vec3 computeNormal(vec3 normal) {
        vec3 X = dFdx(normal);
        vec3 Y = dFdy(normal);
        vec3 cNormal = normalize(cross(X, Y));
        return cNormal;
      }

      float fresnel(float bias, float scale, float power, vec3 I, vec3 N) {
        return bias + scale * pow(1.0 + dot(I, N), power);
      }

      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vec3 color = vec3(0.5, 0.5, 0.5);
        
        vec3 cNormal = computeNormal(vPosition);
        vec3 eyeVector = vec3(0.0, 0.0, -1.0);
        float F = fresnel(0.0, 0.5, 4.0, eyeVector, cNormal);
        float alpha = (F * 0.3 + 0.15) * uOpacity; // More transparent: reduced from 0.5/0.3 to 0.3/0.15
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Setup camera
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 1000);
    camera.position.set(0, 0, 2);

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create wave material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 }, // Start at full opacity (CSS will handle fade in)
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      transparent: true,
      depthTest: false
    });
    materialRef.current = material;

    // Check for shader compilation errors
    renderer.compile(scene, camera);

    // Create plane
    const geometry = new THREE.PlaneGeometry(2, 2, 128, 128);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Clock for animation
    const clock = new THREE.Clock();

    // Animation loop
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsedTime;
      
      // Apply fade out based on progress prop (85% to 100%)
      const fadeOutStart = 0.85;
      const currentProgress = progressRef.current;
      const fadeOutProgress = currentProgress < fadeOutStart ? 1 : 1 - ((currentProgress - fadeOutStart) / (1 - fadeOutStart));
      
      // Set opacity based on fade out only (CSS handles fade in)
      material.uniforms.uOpacity.value = fadeOutProgress;
      
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      material.uniforms.uResolution.value.set(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      // Remove canvas from DOM
      if (containerRef.current && renderer.domElement) {
        const canvas = renderer.domElement;
        if (containerRef.current.contains(canvas)) {
          containerRef.current.removeChild(canvas);
        }
      }
      
      // Dispose of Three.js resources
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      materialRef.current = null;
    };
  }, []); // Empty dependency array - only initialize once

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    />
  );
};

export default WaveClothShader;
