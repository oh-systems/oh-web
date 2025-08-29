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
uniform vec2 u_resolution;

float sdRing(vec2 p, float r, float w) {
    return abs(length(p) - r) - w * 0.5;
}

void main() {
    vec2 centeredUV = vUv - 0.5;
    vec2 p = centeredUV * vec2(u_aspect, 1.0);

    float transitionProgress = 1.0;
    
    float endSize = 15.0;
    float radius = (endSize * 0.5) / u_resolution.y;
    float thick = 0.002;
    
    float leftOffset = -u_aspect * 0.5 + (35.0) / u_resolution.x * u_aspect;
    float topOffset = 0.5 - (20.0) / u_resolution.y;
    vec2 ringPosition = vec2(leftOffset, topOffset);
    
    vec2 adjustedP = p - ringPosition;
    float blur = 0.0001;

    float d = sdRing(adjustedP, radius, thick);
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
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
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
      uniforms.u_resolution.value.set(width, height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Simple animation loop for opacity only
    let raf = 0;
    let targetOpacity = visible ? 1.0 : 0.0;
    
    const animate = () => {
      const newTargetOpacity = visible ? 1.0 : 0.0;
      
      // Update target when visibility changes
      if (newTargetOpacity !== targetOpacity) {
        targetOpacity = newTargetOpacity;
      }
      
      const currentOpacity = uniforms.u_opacity.value;
      
      // Smooth opacity transition
      const opacityDiff = targetOpacity - currentOpacity;
      if (Math.abs(opacityDiff) > 0.001) {
        const easeSpeed = targetOpacity > currentOpacity ? 0.15 : 0.1;
        uniforms.u_opacity.value += opacityDiff * easeSpeed;
      } else {
        uniforms.u_opacity.value = targetOpacity;
      }
      
      // Only render if we need to show something or are transitioning
      if (targetOpacity > 0 || Math.abs(opacityDiff) > 0.001) {
        renderer.render(scene, camera);
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
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    />
  );
}
