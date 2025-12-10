"use client";

import React, { useState } from "react";
import { playClickSound } from "../lib/playClickSound";

interface MobileMenuProps {
  onNavClick?: (item: string) => void;
}

const NAV_ITEMS = ["ABOUT", "SPACE", "CONTACT"];

export default function MobileMenu({ onNavClick }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    playClickSound();
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: string) => {
    playClickSound();
    setIsOpen(false);

    if (item === "SPACE") {
      window.location.href = "/space";
      return;
    }

    onNavClick?.(item.toLowerCase());
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={handleToggle}
        className="fixed top-4 right-4 z-[99999] md:hidden"
        style={{
          width: "44px",
          height: "44px",
          backgroundColor: "transparent",
          border: "none",
          padding: "8px",
          pointerEvents: "auto",
        }}
        aria-label="Toggle menu"
      >
        <div className="flex flex-col justify-center items-center h-full gap-[6px]">
          <span
            style={{
              display: "block",
              width: "24px",
              height: "2px",
              backgroundColor: "white",
              transition: "all 0.3s ease",
              transform: isOpen ? "rotate(45deg) translateY(8px)" : "none",
            }}
          />
          <span
            style={{
              display: "block",
              width: "24px",
              height: "2px",
              backgroundColor: "white",
              transition: "all 0.3s ease",
              opacity: isOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              display: "block",
              width: "24px",
              height: "2px",
              backgroundColor: "white",
              transition: "all 0.3s ease",
              transform: isOpen ? "rotate(-45deg) translateY(-8px)" : "none",
            }}
          />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
          zIndex: 99998,
        }}
        className="md:hidden"
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => handleItemClick(item)}
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "32px",
                fontWeight: "400",
                color: "white",
                backgroundColor: "transparent",
                border: "none",
                padding: "16px 32px",
                transition: "opacity 0.2s ease",
              }}
              className="hover:opacity-70"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
