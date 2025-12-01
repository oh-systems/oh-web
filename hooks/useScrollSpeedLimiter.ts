import { useRef, useCallback } from 'react';

interface ScrollSpeedLimiterConfig {
  maxVelocity?: number;
  smoothingFactor?: number;
  momentumDecay?: number;
  velocityThreshold?: number;
  deviceMultipliers?: {
    mouse?: number;
    trackpad?: number;
    touch?: number;
  };
  enabled?: boolean;
  onScrollUpdate?: (progress: number, velocity: number, isHighVelocity: boolean) => void;
}

interface AdaptiveQualityConfig {
  velocityThresholds?: {
    medium?: number;
    low?: number;
    critical?: number;
  };
  qualityLevels?: {
    full?: number;
    medium?: number;
    low?: number;
    critical?: number;
  };
  enabled?: boolean;
}

interface ScrollSpeedLimiterResult {
  processScrollProgress: (progress: number, maxFrame: number) => { limitedFrame: number; velocity: number };
  processWheelEvent: (e: WheelEvent) => { limitedDelta: number; velocity: number; isHighVelocity: boolean };
  processTouchEvent: (deltaY: number, deltaTime: number) => { limitedDelta: number; velocity: number; isHighVelocity: boolean };
}

interface AdaptiveQualityResult {
  shouldSkipFrame: (frame: number, velocity: number) => boolean;
  getCurrentQuality: () => number;
}

export function useScrollSpeedLimiter(config: ScrollSpeedLimiterConfig = {}): ScrollSpeedLimiterResult {
  const {
    maxVelocity = 800,
    smoothingFactor = 0.15,
    momentumDecay = 0.92,
    velocityThreshold = 50,
    deviceMultipliers = { mouse: 1.2, trackpad: 0.8, touch: 1.5 },
    enabled = true,
    onScrollUpdate
  } = config;

  const velocityRef = useRef(0);
  const lastProgressRef = useRef(0);
  const lastTimeRef = useRef(0);
  const smoothedVelocityRef = useRef(0);

  const processScrollProgress = useCallback((progress: number, maxFrame: number) => {
    if (!enabled) {
      return { limitedFrame: Math.floor(progress * maxFrame), velocity: 0 };
    }

    const now = performance.now();
    const deltaTime = Math.max(16, now - lastTimeRef.current);
    const deltaProgress = progress - lastProgressRef.current;
    
    // Calculate velocity in frames per second
    const currentVelocity = Math.abs(deltaProgress * maxFrame * 1000 / deltaTime);
    
    // Smooth velocity using exponential moving average
    smoothedVelocityRef.current = smoothedVelocityRef.current * (1 - smoothingFactor) + currentVelocity * smoothingFactor;
    
    // Limit velocity if needed
    let limitedProgress = progress;
    if (smoothedVelocityRef.current > maxVelocity) {
      const velocityRatio = maxVelocity / smoothedVelocityRef.current;
      const targetProgress = lastProgressRef.current + deltaProgress * velocityRatio;
      limitedProgress = lastProgressRef.current + (targetProgress - lastProgressRef.current) * smoothingFactor;
    }
    
    lastProgressRef.current = limitedProgress;
    lastTimeRef.current = now;
    velocityRef.current = smoothedVelocityRef.current;
    
    const limitedFrame = Math.floor(limitedProgress * maxFrame);
    
    if (onScrollUpdate) {
      onScrollUpdate(limitedProgress, smoothedVelocityRef.current, smoothedVelocityRef.current > maxVelocity * 0.8);
    }
    
    return { limitedFrame, velocity: smoothedVelocityRef.current };
  }, [enabled, maxVelocity, smoothingFactor, onScrollUpdate]);

  const processWheelEvent = useCallback((e: WheelEvent) => {
    if (!enabled) {
      return { limitedDelta: e.deltaY * 1.5, velocity: 0, isHighVelocity: false };
    }

    const multiplier = deviceMultipliers.mouse || 1.2;
    const rawDelta = e.deltaY * multiplier;
    const velocity = Math.abs(rawDelta);
    const isHighVelocity = velocity > maxVelocity * 0.6;
    
    // Limit delta based on velocity
    let limitedDelta = rawDelta;
    if (isHighVelocity) {
      limitedDelta = rawDelta * (maxVelocity * 0.6 / velocity);
    }
    
    return { limitedDelta, velocity, isHighVelocity };
  }, [enabled, maxVelocity, deviceMultipliers.mouse]);

  const processTouchEvent = useCallback((deltaY: number, deltaTime: number) => {
    if (!enabled) {
      return { limitedDelta: deltaY * 3, velocity: 0, isHighVelocity: false };
    }

    const multiplier = deviceMultipliers.touch || 1.5;
    const rawDelta = deltaY * multiplier;
    const velocity = Math.abs(rawDelta * 1000 / deltaTime);
    const isHighVelocity = velocity > maxVelocity * 0.5;
    
    // Limit delta based on velocity
    let limitedDelta = rawDelta;
    if (isHighVelocity) {
      limitedDelta = rawDelta * (maxVelocity * 0.5 / velocity * deltaTime / 1000);
    }
    
    return { limitedDelta, velocity, isHighVelocity };
  }, [enabled, maxVelocity, deviceMultipliers.touch]);

  return {
    processScrollProgress,
    processWheelEvent,
    processTouchEvent
  };
}

export function useAdaptiveQuality(config: AdaptiveQualityConfig = {}): AdaptiveQualityResult {
  const {
    velocityThresholds = { medium: 200, low: 400, critical: 600 },
    qualityLevels = { full: 1.0, medium: 0.85, low: 0.7, critical: 0.5 },
    enabled = true
  } = config;

  const lastFrameRef = useRef(0);
  const skipCountRef = useRef(0);

  const shouldSkipFrame = useCallback((frame: number, velocity: number) => {
    if (!enabled) return false;
    
    // Determine quality level based on velocity
    let skipRate = 0;
    if (velocity > velocityThresholds.critical!) {
      skipRate = 3; // Skip 2 out of every 3 frames
    } else if (velocity > velocityThresholds.low!) {
      skipRate = 2; // Skip 1 out of every 2 frames
    } else if (velocity > velocityThresholds.medium!) {
      skipRate = 4; // Skip 1 out of every 4 frames
    }
    
    if (skipRate === 0) return false;
    
    skipCountRef.current++;
    const shouldSkip = skipCountRef.current % skipRate !== 0;
    
    if (!shouldSkip) {
      lastFrameRef.current = frame;
    }
    
    return shouldSkip;
  }, [enabled, velocityThresholds]);

  const getCurrentQuality = useCallback(() => {
    // This could be expanded to return current quality level
    return qualityLevels.full || 1.0;
  }, [qualityLevels.full]);

  return {
    shouldSkipFrame,
    getCurrentQuality
  };
}