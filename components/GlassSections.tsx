import React, { useState, useRef, useEffect } from "react";

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

  // Generate displacement map for glass effect
  const generateDisplacementMap = () => {
    const width = 382;
    const height = 382;
    const radius = 42;
    const border = Math.min(width, height) * 0.035; // 3.5% border

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${width}" height="${height}" fill="black"/>
        <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#red)"/>
        <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#blue)" style="mix-blend-mode: difference"/>
        <rect x="${border}" y="${border}" width="${
      width - border * 2
    }" height="${
      height - border * 2
    }" rx="${radius}" fill="hsl(0 0% 50% / 0.88)" style="filter:blur(15px)"/>
      </svg>
    `;

    const encoded = encodeURIComponent(svg);
    return `data:image/svg+xml,${encoded}`;
  };

  return (
    <>
      {/* Advanced SVG displacement filter */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter
            id="glassDisplacement"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            {/* Displacement map source */}
            <feImage
              x="0"
              y="0"
              width="100%"
              height="100%"
              href={generateDisplacementMap()}
              result="map"
            />

            {/* RED channel with strongest displacement */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="G"
              scale="-160"
              result="dispRed"
            />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />

            {/* GREEN channel (reference / least displaced) */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="G"
              scale="-170"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />

            {/* BLUE channel with medium displacement */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="G"
              scale="-140"
              result="dispBlue"
            />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />

            {/* Blend channels back together */}
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />

            {/* Final output blur for smoothing */}
            <feGaussianBlur in="output" stdDeviation="1.2" />
          </filter>
        </defs>
      </svg>

      <div
        ref={cardRef}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: "382px",
          height: "382px",
          borderRadius: "42px",

          // Enhanced glass effect based on provided CSS
          background: "rgba(255, 255, 255, 0.04)",
          border: "2px solid transparent",
          boxShadow:
            "0 0 0 2px rgba(255, 255, 255, 0.6), 0 16px 32px rgba(0, 0, 0, 0.12)",
          backdropFilter:
            "url(#glassDisplacement) blur(8px) brightness(1.05) saturate(1.3)",
          WebkitBackdropFilter:
            "url(#glassDisplacement) blur(8px) brightness(1.05) saturate(1.3)",

          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
          padding: "24px",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          zIndex: 1000,
          transition: isDragging ? "none" : "all 0.2s ease",
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
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
    </>
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
  if (!isVisible) return null;

  return (
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
  if (!isVisible) return null;

  return (
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
