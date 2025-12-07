"use client";

import React from "react";
import { playClickSound } from "../lib/playClickSound";

interface SectionIndicatorProps {
  currentSection: "overview" | "mission" | "space" | "information";
  onSectionClick?: (
    section: "overview" | "mission" | "space" | "information"
  ) => void;
  className?: string;
  style?: React.CSSProperties;
}

const SECTIONS = [
  { id: "overview", label: "OVERVIEW", description: "First model" },
  { id: "mission", label: "MISSION", description: "Cast shadow" },
  { id: "space", label: "SPACE", description: "Laptop" },
  { id: "information", label: "INFORMATION", description: "Footer" },
] as const;

export default function SectionIndicator({
  currentSection,
  onSectionClick,
  className = "",
  style,
}: SectionIndicatorProps) {
  const handleSectionClick = (
    sectionId: "overview" | "mission" | "space" | "information"
  ) => {
    playClickSound();
    onSectionClick?.(sectionId);
  };

  return (
    <div
      className={`section-indicator ${className}`}
      style={{
        position: "fixed",
        right: "40px",
        top: "50vh",
        transform: "translateY(-50%)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "44px",
        ...style,
      }}
    >
      {SECTIONS.map((section, index) => {
        const isActive = currentSection === section.id;
        const isLast = index === SECTIONS.length - 1;

        return (
          <div
            key={section.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              justifyContent: "flex-end",
              position: "relative",
            }}
          >
            {/* Label - clickable */}
            <span
              onClick={() =>
                handleSectionClick(
                  section.id as "overview" | "mission" | "space" | "information"
                )
              }
              style={{
                fontFamily: "Be Vietnam, Arial, sans-serif",
                fontSize: "10px",
                fontWeight: "400",
                color: isActive ? "white" : "#1E1E1E",
                letterSpacing: "0.5px",
                lineHeight: "8px",
                minWidth: "95px",
                textAlign: "right",
                cursor: "pointer",
                transition: "color 0.6s ease-in-out",
              }}
            >
              {section.label}
            </span>

            {/* Circle - clickable */}
            <div
              onClick={() =>
                handleSectionClick(
                  section.id as "overview" | "mission" | "space" | "information"
                )
              }
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                borderColor: isActive ? "white" : "#1E1E1E",
                backgroundColor: isActive ? "white" : "transparent",
                borderWidth: "1px",
                borderStyle: "solid",
                flexShrink: 0,
                cursor: "pointer",
                transition:
                  "background-color 0.6s ease-in-out, border-color 0.6s ease-in-out",
              }}
            />

            {/* Connecting Line */}
            {!isLast && (
              <div
                style={{
                  width: "1px",
                  height: "44px",
                  backgroundColor: "#1E1E1E",
                  position: "absolute",
                  bottom: "-44px",
                  right: "3.5px",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        );
      })}

      {/* Custom font loading */}
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@100;200;300;400;500;600;700;800;900&display=swap");
      `}</style>
    </div>
  );
}
