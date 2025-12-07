"use client";

import React from "react";

interface LaptopTextProps {
  progress: number; // 0 to 1 representing laptop animation progress
}

export default function LaptopText({ progress }: LaptopTextProps) {
  // Fade in starts at 10% of laptop animation, completes at 30%
  const fadeInStart = 0.2;
  const fadeInEnd = 0.4;

  // Fade out starts at 85% of laptop animation, completes at 95%
  const fadeOutStart = 0.85;
  const fadeOutEnd = 0.95;

  // Debug: log progress
  if (progress > 0) {
    console.log("LaptopText progress:", progress);
  }

  let opacity = 0;
  let translateY = 20; // Start 20px below, animate to 0

  if (progress < fadeInStart) {
    // Before fade in
    opacity = 0;
    translateY = 20;
  } else if (progress >= fadeInStart && progress <= fadeInEnd) {
    // Fading in
    const fadeProgress = (progress - fadeInStart) / (fadeInEnd - fadeInStart);
    opacity = fadeProgress;
    translateY = 20 * (1 - fadeProgress);
  } else if (progress > fadeInEnd && progress < fadeOutStart) {
    // Fully visible
    opacity = 1;
    translateY = 0;
  } else if (progress >= fadeOutStart && progress <= fadeOutEnd) {
    // Fading out
    const fadeProgress =
      (progress - fadeOutStart) / (fadeOutEnd - fadeOutStart);
    opacity = 1 - fadeProgress;
    translateY = -20 * fadeProgress; // Move up slightly while fading out
  } else {
    // After fade out
    opacity = 0;
    translateY = -20;
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center pointer-events-none"
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: "none",
        zIndex: 300,
        paddingTop: "40vh",
        justifyContent: "flex-start",
      }}
    >
      {/* SPACE PROTOTYPE title */}
      <h1
        className="text-[96px] font-normal text-white"
        style={{
          fontFamily: "Helvetica, Arial, sans-serif",
          letterSpacing: "0.02em",
        }}
      >
        SPACE PROTOTYPE
      </h1>

      {/* Links container */}
      <div
        className="flex flex-col items-center gap-4 pointer-events-auto"
        style={{ marginTop: "15rem" }}
      >
        {/* ENTER EXPERIENCE link */}
        <a
          href="/space"
          className="text-[20px] font-normal text-white hover:opacity-70 transition-opacity mb-8"
          style={{
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
          }}
        >
          ENTER EXPERIENCE
        </a>

        {/* DOWNLOAD FOR PC link */}
        <a
          href="#"
          className="text-[15px] font-normal text-white hover:opacity-70 transition-opacity"
          style={{
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
          }}
        >
          DOWNLOAD FOR PC
        </a>
      </div>
    </div>
  );
}
