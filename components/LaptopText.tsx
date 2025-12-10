"use client";

import React from "react";

interface LaptopTextProps {
  progress: number; // 0 to 1 representing laptop animation progress
}

export default function LaptopText({ progress }: LaptopTextProps) {
  // Fade in starts at 30% of laptop animation, completes at 40%
  const fadeInStart = 0.3;
  const fadeInEnd = 0.4;

  // Fade out starts at 85% of laptop animation, completes at 95%
  const fadeOutStart = 0.90;
  const fadeOutEnd = 0.95;

  let opacity = 0;

  if (progress < fadeInStart) {
    // Before fade in
    opacity = 0;
  } else if (progress >= fadeInStart && progress <= fadeInEnd) {
    // Fading in
    const fadeProgress = (progress - fadeInStart) / (fadeInEnd - fadeInStart);
    opacity = fadeProgress;
  } else if (progress > fadeInEnd && progress < fadeOutStart) {
    // Fully visible
    opacity = 1;
  } else if (progress >= fadeOutStart && progress <= fadeOutEnd) {
    // Fading out
    const fadeProgress =
      (progress - fadeOutStart) / (fadeOutEnd - fadeOutStart);
    opacity = 1 - fadeProgress;
  } else {
    // After fade out
    opacity = 0;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        opacity,
        transition: "none",
        zIndex: 300,
      }}
    >
      {/* SPACE PROTOTYPE title */}
      <h1
        className="text-[36px] md:text-[96px] font-normal text-white absolute left-1/2"
        style={{
          fontFamily: "Helvetica, Arial, sans-serif",
          letterSpacing: "0.02em",
          top: "40vh",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
        }}
      >
        SPACE PROTOTYPE
      </h1>

      {/* ENTER EXPERIENCE link */}
      <a
        href="/space"
        className="text-[14px] md:text-[20px] font-normal text-white hover:opacity-70 transition-opacity absolute left-1/2 pointer-events-auto"
        style={{
          fontFamily: "var(--font-be-vietnam-pro), sans-serif",
          top: "82vh",
          transform: "translateX(-50%)",
        }}
      >
        ENTER EXPERIENCE
      </a>

      {/* DOWNLOAD FOR PC link */}
      <a
        href="#"
        className="text-[12px] md:text-[15px] font-normal text-white hover:opacity-70 transition-opacity absolute left-1/2 pointer-events-auto"
        style={{
          fontFamily: "var(--font-be-vietnam-pro), sans-serif",
          top: "90vh",
          transform: "translateX(-50%)",
        }}
      >
        DOWNLOAD FOR PC
      </a>
    </div>
  );
}
