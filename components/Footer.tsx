"use client";

import React, { useEffect } from "react";
import ClosingRing from "./ClosingRing";
import { useAppContext } from "../src/app/AppContent";

interface FooterProps {
  className?: string;
  style?: React.CSSProperties;
  scrollProgress?: number; // Progress within the footer section
  onRingCenterComplete?: () => void; // Callback when ring reaches center
}

export default function Footer({ className = "", style, scrollProgress = 0, onRingCenterComplete }: FooterProps) {
  const { setPermanentRingVisible } = useAppContext();
  
  // Calculate if we're scrolling back up (should hide text and return ring to corner)
  const shouldReturnToCorner = scrollProgress < 0.5; // If less than halfway through footer
  const textOpacity = scrollProgress > 0.5 ? 1 : 0; // Show text only when fully in footer
  
  // Trigger callback when ring should be in center (not returning to corner and text is visible)
  useEffect(() => {
    if (!shouldReturnToCorner && scrollProgress >= 0.8 && onRingCenterComplete) {
      // Trigger when we're well into the footer section and ring animation should be complete
      const timer = setTimeout(() => {
        onRingCenterComplete();
      }, 2000); // Reduced timing for quicker lock
      
      return () => clearTimeout(timer);
    }
  }, [shouldReturnToCorner, scrollProgress, onRingCenterComplete]);

  useEffect(() => {
    // Hide permanent ring when footer mounts
    setPermanentRingVisible(false);
    
    // Show permanent ring again when footer unmounts
    return () => {
      setPermanentRingVisible(true);
    };
  }, [setPermanentRingVisible]);
  return (
    <div 
      className={`footer-container ${className}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "black",
        zIndex: 150,
        ...style,
      }}
    >
      {/* Top Left - Locations */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "40px",
          fontFamily: "Be Vietnam Pro, Arial, sans-serif",
          fontSize: "15px",
          fontWeight: "400",
          color: "white",
          lineHeight: "3.2",
          opacity: textOpacity,
          transition: "opacity 0.5s ease",
        }}
      >
        <div>NEW YORK, NEW YORK</div>
        <div>LOS ANGELES, CALIFORNIA</div>
        <div>MIAMI, FLORIDA</div>
      </div>

      {/* Middle Left - Email Subscription */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "40px",
          transform: "translateY(-50%)",
          opacity: textOpacity,
          transition: "opacity 0.5s ease",
        }}
      >
        {/* Email Input */}
        <input
          type="email"
          placeholder="YOUR EMAIL"
          className="email-input"
          style={{
            width: "320px",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid white",
            outline: "none",
            padding: "8px 0",
            fontFamily: "Be Vietnam Pro, Arial, sans-serif",
            fontSize: "10px",
            fontWeight: "400",
            color: "white",
          }}
        />
        
        {/* Newsletter Text */}
        <div
          style={{
            marginTop: "8px",
            fontFamily: "Be Vietnam Pro, Arial, sans-serif",
            fontSize: "10px",
            fontWeight: "400",
            color: "white",
          }}
        >
          Subscribe to our newsletter
        </div>
      </div>

      {/* Closing Ring Animation - starts from permanent ring position, grows to center */}
      <ClosingRing shouldReturnToCorner={shouldReturnToCorner} />

      {/* Bottom Left - Copyright */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "40px",
          fontFamily: "Be Vietnam Pro, Arial, sans-serif",
          fontSize: "15px",
          fontWeight: "400",
          color: "white",
          opacity: textOpacity,
          transition: "opacity 0.5s ease",
        }}
      >
        OH © 2025
      </div>

      {/* Right Middle - Socials */}
      <div
        style={{
          position: "absolute",
          top: "75%",
          right: "40px",
          transform: "translateY(-50%)",
          fontFamily: "Be Vietnam Pro, Arial, sans-serif",
          opacity: textOpacity,
          transition: "opacity 0.5s ease",
          display: "flex",
          alignItems: "center",
          gap: "60px", // Greater space between SOCIALS and links
        }}
      >
        {/* SOCIALS Label */}
        <div
          style={{
            fontSize: "15px",
            fontWeight: "400",
            color: "#484848",
          }}
        >
          SOCIALS
        </div>
        
        {/* Social Links */}
        <div
          style={{
            display: "flex",
            gap: "20px",
          }}
        >
          <a 
            href="https://www.instagram.com/oh.systems/?hl=en" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              color: "white", 
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "400",
            }}
          >
            INSTAGRAM
          </a>
          <a 
            href="https://www.linkedin.com/company/oh-systems/" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              color: "white", 
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "400",
            }}
          >
            LINKEDIN
          </a>
        </div>
      </div>

      {/* Bottom Right - Legal Links */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "40px",
          fontFamily: "Be Vietnam Pro, Arial, sans-serif",
          fontSize: "10px",
          fontWeight: "400",
          color: "#484848",
          display: "flex",
          gap: "40px",
          opacity: textOpacity,
          transition: "opacity 0.5s ease",
        }}
      >
        <a 
          href="#" 
          style={{ 
            color: "#484848", 
            textDecoration: "none",
            cursor: "pointer"
          }}
        >
          PRIVACY POLICY
        </a>
        <a 
          href="#" 
          style={{ 
            color: "#484848", 
            textDecoration: "none",
            cursor: "pointer"
          }}
        >
          TERMS
        </a>
      </div>

      {/* Font Loading and Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        .email-input::placeholder {
          color: #484848;
          font-family: 'Be Vietnam Pro', Arial, sans-serif;
          font-size: 10px;
          font-weight: 400;
        }
        
        .email-input:focus::placeholder {
          color: #484848;
        }
      `}</style>
    </div>
  );
}