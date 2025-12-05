"use client";

import React from "react";

interface CastShadowsTextProps {
  scrollProgress: number; // 0 to 1 for the Cast Shadows sequence
  fadeOutProgress: number; // 0 to 1 for fading out "THE FUTURE OF..."
}

export default function CastShadowsText({
  scrollProgress,
  fadeOutProgress,
}: CastShadowsTextProps) {


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

  return (
    <>
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
        className="absolute text-white"
        style={{
          top: "10%",
          right: "8%",
          opacity: operatingPrinciplesOpacity,
          transform: `translateY(${20 * (1 - operatingPrinciplesOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "32px",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        OPERATING PRINCIPLES
      </div>

      {/* Everything is built - Lower Left Area */}
      <div
        className="absolute text-white"
        style={{
          top: "18%",
          left: "15%",
          opacity: everythingBuiltOpacity,
          transform: `translateY(${30 * (1 - everythingBuiltOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "48px",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        EVERYTHING IS BUILT
      </div>

      {/* Interactivity is a requirement - Lower Center-Right */}
      <div
        className="absolute text-white"
        style={{
          top: "30%",
          left: "40%",
          opacity: interactivityOpacity,
          transform: `translateY(${25 * (1 - interactivityOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "36px",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        INTERACTIVITY IS A REQUIREMENT
      </div>

      {/* Deployments must be live - Lower Left */}
      <div
        className="absolute text-white"
        style={{
          top: "45%",
          left: "5%",
          opacity: deploymentsOpacity,
          transform: `translateY(${35 * (1 - deploymentsOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "64px",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        <div>DEPLOYMENTS MUST</div>
        <div style={{ paddingLeft: "440px" }}>BE LIVE</div>
      </div>

      {/* All systems are modular - Below Deployments */}
      <div
        className="absolute text-white"
        style={{
          top: "68%",
          left: "10%",
          opacity: modularOpacity,
          transform: `translateY(${30 * (1 - modularOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "40px",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        ALL SYSTEMS ARE MODULAR
      </div>

      {/* AI is built in, not added on - Same line as modular, to the right */}
      <div
        className="absolute text-white"
        style={{
          top: "68%",
          left: "62%",
          opacity: aiBuiltInOpacity,
          transform: `translateY(${30 * (1 - aiBuiltInOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "32px",
          fontWeight: "normal",
          lineHeight: "1.2",
        }}
      >
        AI IS BUILT IN, NOT ADDED ON
      </div>

      {/* LATENCY MATTERS - Lower Center-Right */}
      <div
        className="absolute text-white"
        style={{
          top: "82%",
          left: "45%",
          opacity: latencyOpacity,
          transform: `translateY(${40 * (1 - latencyOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "64px",
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