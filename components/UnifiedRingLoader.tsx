'use client';

import { useEffect, useRef } from 'react';
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
uniform vec2 u_resolution; // Screen resolution for pixel-perfect sizing
uniform float u_stable; // 1=stable (no pulse), 0=loading (with pulse)

float sdRing(vec2 p, float r, float w) {
    return abs(length(p) - r) - w * 0.5;
}

float ease(float t) {
    return smoothstep(0.0, 1.0, t);
}

void main() {
    vec2 centeredUV = vUv - 0.5;
    vec2 p = centeredUV * vec2(u_aspect, 1.0);

    float initialPulsePhase = step(u_progress, 0.001);
    
    float basePulse;
    float pulseStrength;
    
    if (initialPulsePhase > 0.5) {
        basePulse = 0.3 + 0.7 * sin(u_time * 1.8);
        pulseStrength = 0.6;
    } else {
        basePulse = 0.5 + 0.5 * sin(u_time * mix(1.6, 0.6, u_progress));
        pulseStrength = mix(0.5, 0.0, u_phase);
    }
    
    float stableTransition = u_stable;
    if (u_stable > 0.5) {
        pulseStrength = pulseStrength * (1.0 - smoothstep(0.5, 1.0, u_stable));
    }
    
    float pulse = 1.0 + pulseStrength * basePulse;

    float t = ease(u_progress);
    
    // Lock final values when in permanent phase
    if (u_phase > 0.5) {
        t = 1.0; // Force final state values
    }
    
    float radius;
    float thick;
    vec2 ringPosition = vec2(0.0, 0.0);
    
    if (u_phase < 0.5) {
        float targetPixelSize = 276.0;
        float targetRadius = (targetPixelSize * 0.5) / u_resolution.y;
        
        if (u_stable > 0.5) {
            float pulsedRadius = mix(0.22, targetRadius, t) * pulse;
            float fixedRadius = mix(0.22, targetRadius, t);
            radius = mix(pulsedRadius, fixedRadius, smoothstep(0.5, 1.0, u_stable));
        } else {
            radius = mix(0.22, targetRadius, t) * pulse;
        }
        
        thick = mix(0.02, 0.04, t);
    } else {
        float transitionProgress = (u_phase - 0.5) * 2.0;
        
        float startSize = 276.0;
        float endSize = 30.0;
        float currentSize = mix(startSize, endSize, transitionProgress);
        radius = (currentSize * 0.5) / u_resolution.y;
        thick = mix(0.04, 0.006, transitionProgress);
        
        float leftOffset = -u_aspect * 0.5 + (70.0) / u_resolution.x * u_aspect;
        float topOffset = 0.5 - (40.0) / u_resolution.y;
        vec2 targetPosition = vec2(leftOffset, topOffset);
        ringPosition = mix(vec2(0.0, 0.0), targetPosition, transitionProgress);
    }
    
    vec2 adjustedP = p - ringPosition;
    
    float focusProgress = u_progress;
    float blurCurve;
    if (focusProgress < 0.01) {
        blurCurve = 0.0;
    } else if (focusProgress < 0.5) {
        blurCurve = focusProgress / 0.5 * 0.2;
    } else if (focusProgress < 0.75) {
        float t = (focusProgress - 0.5) / 0.25;
        float smoothT = smoothstep(0.0, 1.0, t);
        blurCurve = 0.2 + smoothT * 0.5;
    } else {
        float t = (focusProgress - 0.75) / 0.25;
        float extraSmoothT = smoothstep(0.0, 1.0, smoothstep(0.0, 1.0, t));
        blurCurve = 0.7 + extraSmoothT * 0.3;
    }
    
    float blur = mix(1.2, 0.0001, blurCurve);
    
    if (u_phase > 0.5) {
        blur = 0.0001;
    }

    float d = sdRing(adjustedP, radius, thick);
    float alpha = 1.0 - smoothstep(-blur, blur, d);
    
    if (initialPulsePhase > 0.5) {
        float fadeInProgress = min(u_time / 3.0, 1.0);
        float alphaReduction = fadeInProgress * 0.6;
        alpha *= alphaReduction;
    } else {
        float alphaReduction = mix(0.4, 1.0, blurCurve);
        alpha *= alphaReduction;
    }
    
    if (alpha < 0.002) discard;
    
    gl_FragColor = vec4(u_color, alpha);
}
`;

interface UnifiedRingLoaderProps {
  onContentShow?: () => void;
  onTransitionComplete?: () => void;
}

export default function UnifiedRingLoader({ onContentShow, onTransitionComplete }: UnifiedRingLoaderProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const setupRef = useRef<boolean>(false); // Prevent double setup
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Prevent multiple setups (React strict mode or hot reload protection)
    if (setupRef.current) {
      return;
    }
    setupRef.current = true;

    // Check if loading already completed to prevent restart
    if (appLoading.ratio >= 1.0 && appLoading.shouldComplete) {
      setTimeout(() => {
        if (onContentShow) onContentShow();
      }, 600);
      setTimeout(() => {
        if (onTransitionComplete) onTransitionComplete();
      }, 4800);
      return;
    }

    if (!mountRef.current || reduced) {
      // Reduced motion fallback
      const off = appLoading.on((r: number) => { 
        if (r >= 1) {
          setTimeout(() => {
            if (onContentShow) onContentShow();
          }, 600);
          setTimeout(() => {
            if (onTransitionComplete) onTransitionComplete();
          }, 4800);
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
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_stable: { value: 0 }, // New uniform to indicate stable state (no pulse)
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
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    const t0 = performance.now();
    let stableStartTime = 0;
    let contentShowTime = 0;
    let transitionStartTime = 0;
    let overlayFadeStartTime = 0;
    let contentShown = false;
    
    let targetProgress = appLoading.ratio;
    let currentProgress = appLoading.ratio;
    
    const STABLE_DURATION = 800;
    const CONTENT_DISPLAY_DURATION = 2000;
    const TRANSITION_DURATION = 1000;
    const OVERLAY_FADE_DURATION = 600;

    const loop = (now: number) => {
      uniforms.u_time.value = (now - t0) / 1000;

      if (targetProgress > currentProgress) {
        const progressDiff = targetProgress - currentProgress;
        if (Math.abs(progressDiff) > 0.001) {
          const lerpSpeed = Math.min(0.05 + Math.abs(progressDiff) * 0.1, 0.15);
          currentProgress += progressDiff * lerpSpeed;
        }
      }
      
      // Snap to 1.0 when close enough to prevent floating point issues
      if (targetProgress >= 1.0 && currentProgress >= 0.995) {
        currentProgress = 1.0;
      }
      
      uniforms.u_progress.value = currentProgress;

      if (currentProgress >= 1.0 && stableStartTime === 0) {
        stableStartTime = now;
        uniforms.u_stable.value = 1.0;
      }

      if (stableStartTime > 0 && (now - stableStartTime) >= STABLE_DURATION && contentShowTime === 0) {
        contentShowTime = now;
        if (onContentShow && !contentShown) {
          onContentShow();
          contentShown = true;
        }
        overlayFadeStartTime = now;
      }

      if (contentShowTime > 0 && (now - contentShowTime) >= CONTENT_DISPLAY_DURATION && transitionStartTime === 0) {
        transitionStartTime = now;
      }

      if (transitionStartTime > 0) {
        const elapsed = now - transitionStartTime;
        const transitionProgress = Math.min(elapsed / TRANSITION_DURATION, 1);
        
        uniforms.u_phase.value = transitionProgress;
        
        if (transitionProgress >= 1 && onTransitionComplete) {
          onTransitionComplete();
        }
      }

      if (overlayFadeStartTime > 0) {
        const elapsed = now - overlayFadeStartTime;
        const fadeProgress = Math.min(elapsed / OVERLAY_FADE_DURATION, 1);
        const overlayOpacity = 1 - fadeProgress;
        
        if (mountRef.current) {
          if (fadeProgress >= 1) {
            mountRef.current.style.backgroundColor = 'transparent';
            mountRef.current.style.zIndex = '1000';
            mountRef.current.style.pointerEvents = 'none';
          } else {
            mountRef.current.style.backgroundColor = `rgba(0, 0, 0, ${overlayOpacity})`;
            mountRef.current.style.zIndex = '9999';
            mountRef.current.style.pointerEvents = 'auto';
          }
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const off = appLoading.on((r: number) => {
      if (targetProgress !== r) {
        targetProgress = r;
        if (r >= 1) {
          targetProgress = 1.0;
        }
      }
    });    function cleanup() {
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
      setupRef.current = false;
    };
  }, [reduced, onContentShow, onTransitionComplete]);

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
        transition: 'none'
      }}
    >
      {reduced && <div className="ring-fallback" />}
    </div>
  );
}
