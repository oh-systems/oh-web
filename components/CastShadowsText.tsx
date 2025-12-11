"use client";

import React, { useEffect, useState, useRef } from "react";

interface CastShadowsTextProps {
  scrollProgress: number; // 0 to 1 for the Cast Shadows sequence
  fadeOutProgress: number; // 0 to 1 for fading out "THE FUTURE OF..."
}

// Helper to generate smooth random offset using sine waves
const getRandomOffset = (time: number, seed: number, range: number) => {
  return Math.sin(time * 0.0004 + seed) * range; // Slower oscillation for smoother movement
};

export default function CastShadowsText({
  scrollProgress,
  fadeOutProgress,
}: CastShadowsTextProps) {
  const [time, setTime] = useState(0);
  const [glitchLines, setGlitchLines] = useState<Array<{ id: number; x1: number; y1: number; x2: number; y2: number }>>([]);
  const mousePositionRef = useRef({ x: 50, y: 50 }); // Use ref instead of state
  const [smoothMousePosition, setSmoothMousePosition] = useState({ x: 50, y: 50 }); // Interpolated position

  // Track mouse position using ref to avoid re-renders
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = {
        x: (e.clientX / window.innerWidth) * 100, // Convert to percentage
        y: (e.clientY / window.innerHeight) * 100,
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smoothly interpolate mouse position
  useEffect(() => {
    let animationFrameId: number;
    
    const smoothUpdate = () => {
      setSmoothMousePosition(prev => ({
        x: prev.x + (mousePositionRef.current.x - prev.x) * 0.1, // Lerp factor: 0.1 for smooth following
        y: prev.y + (mousePositionRef.current.y - prev.y) * 0.1,
      }));
      animationFrameId = requestAnimationFrame(smoothUpdate);
    };

    animationFrameId = requestAnimationFrame(smoothUpdate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Animate time for smooth random movement
  useEffect(() => {
    let animationFrameId: number;
    const startTime = Date.now();

    const animate = () => {
      setTime(Date.now() - startTime);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Generate random glitch lines that appear and disappear
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly decide whether to show glitch lines (30% chance)
      if (Math.random() > 0.7 && scrollProgress > 0.1 && scrollProgress < 0.85) {
        const numLines = Math.floor(Math.random() * 3) + 1; // 1-3 lines
        const newGlitchLines = Array.from({ length: numLines }, (_, i) => ({
          id: Date.now() + i,
          x1: Math.random() * 100,
          y1: Math.random() * 100,
          x2: Math.random() * 100,
          y2: Math.random() * 100,
        }));
        
        setGlitchLines(newGlitchLines);
        
        // Remove them quickly
        setTimeout(() => {
          setGlitchLines([]);
        }, 50 + Math.random() * 100); // 50-150ms duration
      }
    }, 200 + Math.random() * 800); // Random interval between 200-1000ms

    return () => clearInterval(interval);
  }, [scrollProgress]);

  // Flickering effect for lines - randomly change opacity
  const [lineFlicker, setLineFlicker] = useState<Record<string, number>>({});

  useEffect(() => {
    const flickerInterval = setInterval(() => {
      // Create flicker values for each line
      const newFlicker: Record<string, number> = {};
      
      // Randomly select 2 lines to flicker
      const linesToFlicker = new Set<number>();
      while (linesToFlicker.size < 2) {
        linesToFlicker.add(Math.floor(Math.random() * 9) + 1);
      }
      
      for (let i = 1; i <= 9; i++) {
        if (linesToFlicker.has(i)) {
          newFlicker[`line${i}`] = 0; // Fully invisible
        } else {
          newFlicker[`line${i}`] = 1; // Full opacity
        }
      }
      setLineFlicker(newFlicker);
    }, 100); // Flicker every 100ms for faster glitchy effect

    return () => clearInterval(flickerInterval);
  }, []); // Empty dependency array - runs independently of scroll

  // Calculate random offsets for each text element with cursor-induced rotation
  const calculateOffset = (baseX: number, baseY: number, seed: number, range: number) => {
    // Random component (50% influence)
    const randomX = getRandomOffset(time, seed, range) * 0.5;
    const randomY = getRandomOffset(time, seed + 100, range) * 0.5;
    
    // Cursor-induced rotation (50% influence)
    // Calculate angle from cursor to text element using smoothed mouse position
    const deltaX = baseX - smoothMousePosition.x;
    const deltaY = baseY - smoothMousePosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Rotate around the element's position based on cursor location
    const rotationStrength = 2.5; // Increased rotation strength significantly
    const angle = Math.atan2(deltaY, deltaX);
    const perpAngle = angle + Math.PI / 2; // Perpendicular for orbital movement
    
    const rotationX = Math.cos(perpAngle) * (100 - distance) * rotationStrength * 0.3;
    const rotationY = Math.sin(perpAngle) * (100 - distance) * rotationStrength * 0.3;
    
    return {
      x: randomX + rotationX,
      y: randomY + rotationY,
    };
  };

  const offsets = {
    operatingPrinciples: calculateOffset(90, 12, 1, 15),
    everythingBuilt: calculateOffset(28, 20, 3, 20),
    interactivity: calculateOffset(60, 32, 5, 25),
    deployments: calculateOffset(33, 47, 7, 30),
    modular: calculateOffset(25, 70, 9, 20),
    aiBuiltIn: calculateOffset(72, 70, 11, 20),
    latency: calculateOffset(60, 84, 13, 30),
  };

  // Calculate dynamic line positions based on text offsets
  const getLinePos = (basePercent: number, offset: number, isHorizontal: boolean) => {
    const pixelOffset = offset / (isHorizontal ? window.innerWidth : window.innerHeight) * 100;
    return `${basePercent + pixelOffset}%`;
  };

  // All text elements appear together and fade out together
  const calculateOpacity = () => {
    if (scrollProgress < 0.1) {
      // Fade in phase (first 10% of Cast Shadows sequence)
      return scrollProgress / 0.1;
    } else if (scrollProgress > 0.85) {
      // Fade out phase (last 15% of Cast Shadows sequence)
      return 1 - ((scrollProgress - 0.85) / 0.15);
    } else {
      // Full visibility phase (middle 75%)
      return 1;
    }
  };

  const allTextOpacity = calculateOpacity();

  // All elements use the same opacity
  const operatingPrinciplesOpacity = allTextOpacity;
  const everythingBuiltOpacity = allTextOpacity;
  const interactivityOpacity = allTextOpacity;
  const deploymentsOpacity = allTextOpacity;
  const modularOpacity = allTextOpacity;
  const aiBuiltInOpacity = allTextOpacity;
  const latencyOpacity = allTextOpacity;

  // Helper function to draw SVG line with circle at connection point
  const renderLine = (x1: string, y1: string, x2: string, y2: string, key: string) => {
    const flickerOpacity = lineFlicker[key] !== undefined ? lineFlicker[key] : 1;
    const finalOpacity = flickerOpacity * allTextOpacity;
    
    return (
      <svg
        key={key}
        className="absolute inset-0 pointer-events-none"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="white"
          strokeWidth="1.5"
          opacity={finalOpacity}
        />
        {/* Small white circle at the connection point (x2, y2) */}
        <circle
          cx={x2}
          cy={y2}
          r="3"
          fill="white"
          opacity={finalOpacity}
        />
      </svg>
    );
  };

  return (
    <>
      {/* Connecting Lines - dynamically adjust to text positions */}
      {/* Operating Principles to Interactivity */}
      {renderLine(
        getLinePos(84, offsets.operatingPrinciples.x, true),
        getLinePos(13, offsets.operatingPrinciples.y, false),
        getLinePos(60, offsets.interactivity.x, true),
        getLinePos(32, offsets.interactivity.y, false),
        "line1"
      )}
      
      {/* Everything is built to Interactivity */}
      {renderLine(
        getLinePos(28, offsets.everythingBuilt.x, true),
        getLinePos(22, offsets.everythingBuilt.y, false),
        getLinePos(60, offsets.interactivity.x, true),
        getLinePos(32, offsets.interactivity.y, false),
        "line2"
      )}
      
      {/* Everything is built to Deployments Must */}
      {renderLine(
        getLinePos(28, offsets.everythingBuilt.x, true),
        getLinePos(22, offsets.everythingBuilt.y, false),
        getLinePos(33, offsets.deployments.x, true),
        getLinePos(50, offsets.deployments.y, false),
        "line3"
      )}
      
      {/* Interactivity to Deployments Must */}
      {renderLine(
        getLinePos(60, offsets.interactivity.x, true),
        getLinePos(32, offsets.interactivity.y, false),
        getLinePos(33, offsets.deployments.x, true),
        getLinePos(50, offsets.deployments.y, false),
        "line4"
      )}
      
      {/* Interactivity to Latency Matters */}
      {renderLine(
        getLinePos(60, offsets.interactivity.x, true),
        getLinePos(32, offsets.interactivity.y, false),
        getLinePos(60, offsets.latency.x, true),
        getLinePos(84, offsets.latency.y, false),
        "line5"
      )}
      
      {/* Interactivity to AI is built in */}
      {renderLine(
        getLinePos(60, offsets.interactivity.x, true),
        getLinePos(32, offsets.interactivity.y, false),
        getLinePos(72, offsets.aiBuiltIn.x, true),
        getLinePos(70, offsets.aiBuiltIn.y, false),
        "line6"
      )}
      
      {/* Deployments to All systems are modular */}
      {renderLine(
        getLinePos(33, offsets.deployments.x, true),
        getLinePos(50, offsets.deployments.y, false),
        getLinePos(25, offsets.modular.x, true),
        getLinePos(70, offsets.modular.y, false),
        "line7"
      )}
      
      {/* Deployments to Latency Matters */}
      {renderLine(
        getLinePos(33, offsets.deployments.x, true),
        getLinePos(50, offsets.deployments.y, false),
        getLinePos(60, offsets.latency.x, true),
        getLinePos(84, offsets.latency.y, false),
        "line8"
      )}
      
      {/* Latency Matters to AI is built in */}
      {renderLine(
        getLinePos(60, offsets.latency.x, true),
        getLinePos(84, offsets.latency.y, false),
        getLinePos(72, offsets.aiBuiltIn.x, true),
        getLinePos(70, offsets.aiBuiltIn.y, false),
        "line9"
      )}

      {/* Random glitch lines that appear/disappear */}
      {glitchLines.map((line) => (
        <svg
          key={line.id}
          className="absolute inset-0 pointer-events-none"
          style={{
            width: "100%",
            height: "100%",
            opacity: allTextOpacity * 0.7,
          }}
        >
          <line
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="white"
            strokeWidth="2.5"
            opacity="0.6"
          />
        </svg>
      ))}

      {/* "THE FUTURE OF..." fade out overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 1 - fadeOutProgress,
          transition: "opacity 0.3s ease-out",
        }}
      >
        {/* This will be handled by the existing hero text component */}
      </div>

      {/* Operating Principles - Top Right */}
      <div
        className="absolute text-white text-[18px] md:text-[32px]"
        style={{
          top: "12%",
          right: "8%",
          opacity: operatingPrinciplesOpacity,
          transform: `translate(${offsets.operatingPrinciples.x}px, ${offsets.operatingPrinciples.y + 20 * (1 - operatingPrinciplesOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.15s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        OPERATING PRINCIPLES
      </div>

      {/* Everything is built - Lower Left Area */}
      <div
        className="absolute text-white text-[24px] md:text-[48px]"
        style={{
          top: "20%",
          left: "15%",
          opacity: everythingBuiltOpacity,
          transform: `translate(${offsets.everythingBuilt.x}px, ${offsets.everythingBuilt.y + 30 * (1 - everythingBuiltOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.15s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        EVERYTHING IS BUILT
      </div>

      {/* Interactivity is a requirement - Lower Center-Right */}
      <div
        className="absolute text-white text-[20px] md:text-[36px]"
        style={{
          top: "32%",
          left: "40%",
          opacity: interactivityOpacity,
          transform: `translate(${offsets.interactivity.x}px, ${offsets.interactivity.y + 25 * (1 - interactivityOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.15s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        INTERACTIVITY IS A REQUIREMENT
      </div>

      {/* Deployments must be live - Lower Left */}
      <div
        className="absolute text-white text-[32px] md:text-[64px]"
        style={{
          top: "47%",
          left: "5%",
          opacity: deploymentsOpacity,
          transform: `translate(${offsets.deployments.x}px, ${offsets.deployments.y + 35 * (1 - deploymentsOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.15s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        <div>DEPLOYMENTS MUST</div>
        <div style={{ paddingLeft: typeof window !== 'undefined' && window.innerWidth <= 768 ? "220px" : "440px" }}>BE LIVE</div>
      </div>

      {/* All systems are modular - Below Deployments */}
      <div
        className="absolute text-white text-[22px] md:text-[40px]"
        style={{
          top: "70%",
          left: "10%",
          opacity: modularOpacity,
          transform: `translate(${offsets.modular.x}px, ${offsets.modular.y + 30 * (1 - modularOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.15s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        ALL SYSTEMS ARE MODULAR
      </div>

      {/* AI is built in, not added on - Same line as modular, to the right */}
      <div
        className="absolute text-white text-[18px] md:text-[32px]"
        style={{
          top: "70%",
          left: "62%",
          opacity: aiBuiltInOpacity,
          transform: `translate(${offsets.aiBuiltIn.x}px, ${offsets.aiBuiltIn.y + 30 * (1 - aiBuiltInOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.15s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        AI IS BUILT IN, NOT ADDED ON
      </div>

      {/* LATENCY MATTERS - Lower Center-Right */}
      <div
        className="absolute text-white text-[32px] md:text-[64px]"
        style={{
          top: "84%",
          left: "50%",
          opacity: latencyOpacity,
          transform: `translate(${offsets.latency.x}px, ${offsets.latency.y + 40 * (1 - latencyOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.15s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: "normal",
          lineHeight: "1.2",
          letterSpacing: "2px",
          whiteSpace: "nowrap",
        }}
      >
        LATENCY MATTERS
      </div>
    </>
  );
}