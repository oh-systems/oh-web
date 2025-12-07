import React, { useState, useRef, useEffect } from "react";
import GlassSurface from './GlassSurface';
import { playClickSound } from '../lib/playClickSound';

interface DraggableCardProps {
  children: React.ReactNode;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  children,
  onClose,
  initialPosition = {
    x: window.innerWidth / 2 - 191,
    y: window.innerHeight / 2 - 191,
  },
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep card within viewport bounds
      const maxX = window.innerWidth - 382;
      const maxY = window.innerHeight - 382;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <GlassSurface
      width={382}
      height={382}
      borderRadius={42}
      borderWidth={0}
      brightness={50}
      opacity={0.93}
      blur={25}
      displace={0.7}
      backgroundOpacity={0.04}
      saturation={1.5}
      distortionScale={-180}
      redOffset={0}
      greenOffset={10}
      blueOffset={20}
      className="draggable-card"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        zIndex: 50000,
        transition: isDragging ? "none" : "all 0.2s ease",
      }}
    >
      <div
        ref={cardRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
          padding: "24px",
          position: "relative",
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            onClose();
          }}
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            background: "none",
            border: "none",
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "20px",
            cursor: "pointer",
            padding: "5px",
            borderRadius: "50%",
            transition: "color 0.2s ease",
            zIndex: 20000,
            pointerEvents: "auto",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
          }}
        >
          ×
        </button>
        {children}
      </div>
    </GlassSurface>
  );
};

interface AboutSectionProps {
  isVisible: boolean;
  onClose?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-20px)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: isVisible ? 'visible' : 'hidden'
      }}
    >
      <DraggableCard onClose={onClose || (() => {})}>
        <div className="text-center" style={{ paddingTop: "60px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "400",
            color: "white",
            margin: "0 0 16px 0",
            fontFamily: "Helvetica, Arial, sans-serif",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            lineHeight: "1.2",
            position: "absolute",
            top: "24px",
            left: "24px",
            right: "24px",
          }}
        >
          About Us
        </h2>
        <p
          style={{
            fontSize: "12px",
            lineHeight: "1.5",
            color: "rgba(255, 255, 255, 0.9)",
            textAlign: "center",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: "400",
          }}
        >
          Oh builds immersive environments for commerce and culture. We replace
          static websites with spatial systems powered by Unreal Engine, AI, and
          cloud infrastructure. Our work spans both digital and physical domains
          and is built to scale with the future of interaction.
        </p>
        </div>
      </DraggableCard>
    </div>
  );
};

interface ContactSectionProps {
  isVisible: boolean;
  onClose?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-20px)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: isVisible ? 'visible' : 'hidden'
      }}
    >
      <DraggableCard
        onClose={onClose || (() => {})}
        initialPosition={{
          x: window.innerWidth / 2 - 191 + 50,
          y: window.innerHeight / 2 - 191 + 50,
        }}
      >
      <div style={{ paddingTop: "60px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "400",
            color: "white",
            margin: "0 0 16px 0",
            fontFamily: "Helvetica, Arial, sans-serif",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            lineHeight: "1.2",
            position: "absolute",
            top: "24px",
            left: "24px",
            right: "24px",
          }}
        >
          Contact Us
        </h2>
        <style>{`
          .contact-form input::placeholder,
          .contact-form textarea::placeholder {
            color: white !important;
            opacity: 1;
          }
          .contact-form input::-webkit-input-placeholder,
          .contact-form textarea::-webkit-input-placeholder {
            color: white !important;
          }
          .contact-form input::-moz-placeholder,
          .contact-form textarea::-moz-placeholder {
            color: white !important;
            opacity: 1;
          }
        `}</style>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submitted");
          }}
          className="contact-form"
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              type="text"
              placeholder="Name"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: "transparent",
                color: "white",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: "transparent",
                color: "white",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <input
              type="email"
              placeholder="Email"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: "transparent",
                color: "white",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <textarea
              placeholder="Message"
              rows={3}
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: "transparent",
                color: "white",
                outline: "none",
                resize: "vertical",
                minHeight: "60px",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                fontWeight: "400",
                padding: "10px 24px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: "transparent",
                color: "white",
                cursor: "pointer",
                transition: "all 0.2s ease",
                marginTop: "8px",
                width: "100%",
                boxSizing: "border-box",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
      </DraggableCard>
    </div>
  );
};

export function GlassSections({
  showAbout,
  showContact,
  onAboutClose,
  onContactClose,
}: {
  showAbout: boolean;
  showContact: boolean;
  onAboutClose: () => void;
  onContactClose: () => void;
}) {
  return (
    <>
      <AboutSection isVisible={showAbout} onClose={onAboutClose} />
      <ContactSection isVisible={showContact} onClose={onContactClose} />
    </>
  );
}
