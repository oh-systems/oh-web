'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

varying vec2 vUv;
uniform float u_aspect;
uniform vec3 u_color;
uniform float u_opacity;

float sdRing(vec2 p, float r, float w) {
    return abs(length(p) - r) - w * 0.5;
}

void main() {
    vec2 p = (vUv - 0.5) * vec2(u_aspect, 1.0);
    
    // Fixed final ring parameters (clear, sharp state)
    float radius = 0.18;
    float thick = 0.04;  // Made thinner (was 0.07)
    float blur = 0.002;

    float d = sdRing(p, radius, thick);
    float alpha = 1.0 - smoothstep(-blur, blur, d);
    
    if (alpha < 0.002) discard;
    
    gl_FragColor = vec4(u_color, alpha * u_opacity);
}
`;

interface PermanentRingProps {
  visible: boolean;
  className?: string;
}

export default function PermanentRing({ visible, className = '' }: PermanentRingProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const el = renderer.domElement;
    el.className = 'permanent-ring-canvas';
    mountRef.current.appendChild(el);

    // scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      u_aspect: { value: window.innerWidth / window.innerHeight },
      u_color: { value: new THREE.Color('#ffffff') },
      u_opacity: { value: visible ? 1.0 : 0.0 },
    };
    
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms,
      vertexShader,
      fragmentShader
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const width = mountRef.current?.clientWidth || window.innerWidth;
      const height = mountRef.current?.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      uniforms.u_aspect.value = width / height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Animation loop for smooth opacity transitions
    let raf = 0;
    let targetOpacity = visible ? 1.0 : 0.0;
    
    const animate = () => {
      const newTargetOpacity = visible ? 1.0 : 0.0;
      
      // Smooth transition when visibility changes
      if (newTargetOpacity !== targetOpacity) {
        targetOpacity = newTargetOpacity;
      }
      
      const currentOpacity = uniforms.u_opacity.value;
      const diff = targetOpacity - currentOpacity;
      
      if (Math.abs(diff) > 0.001) {
        // Smooth easing for fade in/out
        const easeSpeed = targetOpacity > currentOpacity ? 0.15 : 0.1; // Slightly faster fade in
        uniforms.u_opacity.value += diff * easeSpeed;
        renderer.render(scene, camera);
      } else {
        uniforms.u_opacity.value = targetOpacity;
        if (targetOpacity > 0) {
          renderer.render(scene, camera);
        }
      }
      
      raf = requestAnimationFrame(animate);
    };
    animate();

    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      el.remove();
    }

    return cleanup;
  }, [visible]); // Include visible since it's used in the initial setup

  // The second useEffect is no longer needed since visible is in the main useEffect dependency

  return (
    <div 
      ref={mountRef}
      className={`permanent-ring-container ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    />
  );
}
