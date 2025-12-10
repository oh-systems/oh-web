"use client";

import React from "react";

interface CastShadowsDetailsTextProps {
  scrollProgress: number; // 0 to 1 for the Cast Shadows sequence
}

export default function CastShadowsDetailsText({
  scrollProgress,
}: CastShadowsDetailsTextProps) {
  // Show after CastShadowsText fades out
  const calculateOpacity = () => {
    if (scrollProgress < 0.60) {
      // Hidden until 60% of Cast Shadows sequence
      return 0;
    } else if (scrollProgress < 0.70) {
      // Fade in phase (from 60% to 70% of Cast Shadows sequence)
      return (scrollProgress - 0.60) / 0.1;
    } else if (scrollProgress > 0.85) {
      // Fade out phase (last 15% of Cast Shadows sequence)
      return 1 - ((scrollProgress - 0.85) / 0.15);
    } else {
      // Full visibility phase
      return 1;
    }
  };

  const textOpacity = calculateOpacity();

  return (
    <>
      {/* Top Left - Physical Integrations */}
      <div
        className="absolute text-white text-[10px] md:text-[16px]"
        style={{
          top: typeof window !== 'undefined' && window.innerWidth < 768 ? "20px" : "50px",
          left: typeof window !== 'undefined' && window.innerWidth < 768 ? "20px" : "50px",
          opacity: textOpacity,
          transform: `translateY(${20 * (1 - textOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          lineHeight: "1.6",
          maxWidth: typeof window !== 'undefined' && window.innerWidth < 768 ? "45%" : "600px",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          PHYSICAL INTEGRATIONS
        </div>
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          IMMERSIVE INSTALLATIONS
        </div>
        <div style={{ marginBottom: "20px" }}>
          ON-SITE RETAIL AND CULTURAL ACTIVATIONS USING SPATIAL DESIGN,
          PROJECTION, SOUND, AND INTERACTIVE SYSTEMS.
        </div>

        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          HYBRID ENVIRONMENTS
        </div>
        <div style={{ marginBottom: "20px" }}>
          PHYSICALLY INTEGRATED SPACES WITH DIGITAL TWINS, LIVE MOTION CAPTURE,
          AND AI BEHAVIOR SYNC.
        </div>

        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          TECHNICAL ART DIRECTION
        </div>
        <div>
          END-TO-END DESIGN AND EXECUTION FOR EXHIBITIONS, PRODUCT LAUNCHES, AND
          FUTURE-FORWARD RETAIL.
        </div>
      </div>

      {/* Bottom Right - Digital Systems */}
      <div
        className="absolute text-white text-[10px] md:text-[16px]"
        style={{
          bottom: typeof window !== 'undefined' && window.innerWidth < 768 ? "20px" : "50px",
          right: typeof window !== 'undefined' && window.innerWidth < 768 ? "20px" : "50px",
          opacity: textOpacity,
          transform: `translateY(${-20 * (1 - textOpacity)}px)`,
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          fontFamily: "Helvetica, Arial, sans-serif",
          lineHeight: "1.6",
          maxWidth: typeof window !== 'undefined' && window.innerWidth < 768 ? "45%" : "600px",
          textAlign: "right",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          DIGITAL SYSTEMS
        </div>
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          SPATIAL COMMERCE SYSTEMS
        </div>
        <div style={{ marginBottom: "20px" }}>
          FULLY INTERACTIVE ONLINE STORES IN UNREAL ENGINE. STREAMED IN-BROWSER
          VIA LOW-LATENCY INFRASTRUCTURE.
        </div>

        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          AI-POWERED INTERACTIONS
        </div>
        <div style={{ marginBottom: "20px" }}>
          VOICE AGENTS, NPCS, MEMORY LOGIC, AND INTELLIGENT GUIDANCE SYSTEMS.
        </div>

        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          WEB INTEGRATION & DEPLOYMENT
        </div>
        <div style={{ marginBottom: "20px" }}>
          CUSTOM THREE.JS FRONTENDS AND WEBGL PORTALS CONNECTED TO CLOUD-HOSTED
          IMMERSIVE EXPERIENCES.
        </div>

        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          DIGITAL RETAIL ARCHITECTURE
        </div>
        <div>
          PERSISTENT 3D ENVIRONMENTS DESIGNED FOR PRODUCT NAVIGATION, BRAND
          ENGAGEMENT, AND LIVE INTERACTION.
        </div>
      </div>
    </>
  );
}
