'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { appLoading } from '../src/lib/three/loadingManager';
import '../src/styles/ring-loader.css';

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
uniform float u_time;
uniform float u_progress;
uniform float u_aspect;
uniform vec3 u_color;
uniform float u_phase; // 0=loading, 1=permanent

float sdRing(vec2 p, float r, float w) {
    return abs(length(p) - r) - w * 0.5;
}

float ease(float t) {
    return smoothstep(0.0, 1.0, t);
}

void main() {
    vec2 p = (vUv - 0.5) * vec2(u_aspect, 1.0);

    // Breathing pulse (slower over time as progress rises)
    float basePulse = 0.5 + 0.5 * sin(u_time * mix(1.6, 0.6, u_progress));
    float pulseStrength = mix(0.5, 0.0, u_phase); // Reduce pulse as we transition to permanent
    float pulse = 1.0 + pulseStrength * basePulse;

    // Map progress → ring params with very smooth transitions
    float t = ease(u_progress);
    
    // Lock final values when in permanent phase
    if (u_phase > 0.5) {
        t = 1.0; // Force final state values
    }
    
    float radius = mix(0.22, 0.18, t) * pulse;
    float thick = mix(0.02, 0.04, t);
    
    // Natural camera-like focus transition
    // Use a combination of different easing curves for most natural feel
    float focusProgress = u_progress;
    
    // Apply smooth curves for different blur ranges
    float blurCurve;
    if (focusProgress < 0.3) {
        // Very blurry phase - slow change
        blurCurve = focusProgress / 0.3 * 0.1; // 0-10% sharpening in first 30%
    } else if (focusProgress < 0.8) {
        // Main focusing phase - faster change
        float t = (focusProgress - 0.3) / 0.5;
        blurCurve = 0.1 + t * t * 0.7; // 10-80% sharpening in middle 50%
    } else {
        // Final sharpening - very fast to reach crystal clear
        float t = (focusProgress - 0.8) / 0.2;
        blurCurve = 0.8 + t * t * t * 0.2; // 80-100% sharpening in final 20%
    }
    
    // Blur range: very blurry to crystal clear
    float blur = mix(0.4, 0.0001, blurCurve);
    
    // FORCE SHARP STATE when in permanent phase
    if (u_phase > 0.5) {
        blur = 0.0001; // Force razor sharp in permanent state
    }

    float d = sdRing(p, radius, thick);
    float alpha = 1.0 - smoothstep(-blur, blur, d);
    
    if (alpha < 0.002) discard;
    
    gl_FragColor = vec4(u_color, alpha);
}
`;

interface UnifiedRingLoaderProps {
  onTransitionComplete?: () => void;
}

export default function UnifiedRingLoader({ onTransitionComplete }: UnifiedRingLoaderProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!mountRef.current || reduced) {
      // Reduced motion fallback
      const off = appLoading.on((r: number) => { 
        if (r >= 1) {
          setTimeout(() => {
            if (onTransitionComplete) onTransitionComplete();
          }, 1200);
        }
      });
      return () => off();
    }

    // renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const el = renderer.domElement;
    el.className = 'ring-loader-canvas';
    mountRef.current.appendChild(el);

    // scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      u_time: { value: 0 },
      u_progress: { value: 0 },
      u_aspect: { value: window.innerWidth / window.innerHeight },
      u_color: { value: new THREE.Color('#ffffff') },
      u_phase: { value: 0 }, // New uniform for transition phase
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
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      uniforms.u_aspect.value = window.innerWidth / window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let t0 = performance.now();
    let stableStartTime = 0;
    let transitionStartTime = 0;
    let overlayFadeStartTime = 0;
    
    // Progress interpolation variables
    let targetProgress = 0;
    let currentProgress = 0;
    
    const STABLE_DURATION = 800; // Hold at clear state
    const TRANSITION_DURATION = 1000; // Transition to permanent
    const OVERLAY_FADE_DURATION = 600; // Fade overlay

    const loop = (now: number) => {
      uniforms.u_time.value = (now - t0) / 1000;

      // Smooth progress interpolation in render loop
      const progressDiff = targetProgress - currentProgress;
      if (Math.abs(progressDiff) > 0.001) {
        // Adaptive lerp speed - slower when far, faster when close
        const lerpSpeed = Math.min(0.05 + Math.abs(progressDiff) * 0.1, 0.15);
        currentProgress += progressDiff * lerpSpeed;
      } else {
        currentProgress = targetProgress; // Snap to target when very close
      }
      
      uniforms.u_progress.value = currentProgress;

      // Phase 1: Loading (progress 0-1)
      // Ring breathes and sharpens as progress increases

      // Phase 2: Stable clear state
      if (currentProgress >= 0.999 && stableStartTime === 0) {
        stableStartTime = now;
        currentProgress = 1.0; // Force to exactly 1.0
        uniforms.u_progress.value = 1.0;
        console.log('Reached stable state - ring should be razor sharp now');
      }

      // Phase 3: Transition to permanent (smooth phase change)
      if (stableStartTime > 0 && (now - stableStartTime) >= STABLE_DURATION && transitionStartTime === 0) {
        transitionStartTime = now;
      }

      if (transitionStartTime > 0) {
        const elapsed = now - transitionStartTime;
        const transitionProgress = Math.min(elapsed / TRANSITION_DURATION, 1);
        
        // Smoothly transition from loading phase to permanent phase
        uniforms.u_phase.value = transitionProgress;
        
        // Start overlay fade when transition is nearly complete
        if (transitionProgress >= 0.7 && overlayFadeStartTime === 0) {
          overlayFadeStartTime = now;
        }
      }

      // Phase 4: Overlay fade and transition to permanent
      if (overlayFadeStartTime > 0) {
        const elapsed = now - overlayFadeStartTime;
        const fadeProgress = Math.min(elapsed / OVERLAY_FADE_DURATION, 1);
        const overlayOpacity = 1 - fadeProgress;
        
        // Fade the black overlay
        if (mountRef.current) {
          mountRef.current.style.backgroundColor = `rgba(0, 0, 0, ${overlayOpacity})`;
          mountRef.current.style.zIndex = overlayOpacity > 0 ? '9999' : '1000';
          mountRef.current.style.pointerEvents = overlayOpacity > 0 ? 'auto' : 'none';
        }
        
        if (fadeProgress >= 1) {
          if (onTransitionComplete) onTransitionComplete();
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const off = appLoading.on((r: number) => {
      // Set target progress - the render loop will smoothly interpolate to it
      targetProgress = r;
      
      // Debug logging
      if (r >= 0.9) {
        console.log(`Target progress: ${r}, Current: ${currentProgress.toFixed(3)}`);
      }
      if (r >= 1.0) {
        console.log('Loading complete - forcing progress to 1.0 for sharpest state');
      }
    });

    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      el.remove();
    }

    return () => {
      off();
      cleanup();
    };
  }, [reduced, onTransitionComplete]);

  // Component only renders during loading phase
  return (
    <div 
      ref={mountRef}
      className="ring-loader-overlay" 
      aria-label="Loading"
      role="status"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        transition: 'none' // We handle transitions manually for smoother control
      }}
    >
      {/* reduced-motion fallback */}
      {reduced && <div className="ring-fallback" />}
    </div>
  );
}
