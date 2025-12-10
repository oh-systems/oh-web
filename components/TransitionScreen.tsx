"use client";

import React from "react";
import Image from "next/image";

interface TransitionScreenProps {
  progress: number; // 0 to 1 for the transition period
  laptopProgress: number; // 0 to 1 for laptop animation progress
}

export default function TransitionScreen({
  progress,
  laptopProgress,
}: TransitionScreenProps) {
  // Calculate opacity based on progress
  const calculateOpacity = () => {
    if (progress < 0.6) {
      // Fade in
      return progress / 0.6;
    } else {
      // Stay fully visible - no fade out
      return 1;
    }
  };

  const opacity = calculateOpacity();

  // Remove once laptop animation has progressed
  if (laptopProgress > 0.3) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        opacity,
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      {/* Three Lines Image */}
      <div className="mb-8">
        <Image
          src="/assets/three-lines.png"
          alt=""
          width={typeof window !== 'undefined' && window.innerWidth < 768 ? 44 : 88}
          height={typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 121}
          priority
        />
      </div>

      {/* Main Text */}
      <div
        className="text-white text-center mb-4 text-[16px] md:text-[24px]"
        style={{
          fontFamily: "'Be Vietnam', sans-serif",
          fontWeight: "bold",
          letterSpacing: "0.02em",
        }}
      >
        TRY OUR VIRTUAL SHOWROOM FROM THE WEB
      </div>

      {/* Secondary Text */}
      <div
        className="text-white text-center text-[12px] md:text-[16px]"
        style={{
          fontFamily: "'Be Vietnam', sans-serif",
          fontWeight: "normal",
          letterSpacing: "0.02em",
        }}
      >
        DOWNLOAD OUR EXTENDED EXPERIENCE FOR WINDOWS MACHINES
      </div>
    </div>
  );
}
