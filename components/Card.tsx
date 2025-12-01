"use client";

import React, { useState, useRef } from "react";

interface CardProps {
  title: string;
  className?: string;
  style?: React.CSSProperties;
}

interface AboutCardProps extends CardProps {
  type: "about";
  body: string;
}

interface ContactCardProps extends CardProps {
  type: "contact";
  onSubmit?: (data: {
    name: string;
    phone: string;
    email: string;
    message: string;
  }) => void;
}

type CardComponentProps = AboutCardProps | ContactCardProps;

export default function Card(props: CardComponentProps) {
  const { title, className = "", style = {} } = props;
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  // Draggable state
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (props.type === "contact" && props.onSubmit) {
      props.onSubmit(formData);
    }
  };

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      setPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const onMouseUp = () => {
      setDragging(false);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  return (
    <div
      className={`card-component ${className}`}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: 382,
        borderRadius: "16px",
        padding: 0,
        backgroundColor: "rgba(20, 20, 30, 0.45)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        cursor: dragging ? "grabbing" : "grab",
        zIndex: dragging ? 1001 : 1000,
        overflow: "hidden",
        ...style,
      }}
      onMouseDown={onMouseDown}
    >
      {/* Wavy backdrop filter layer - only affects the background reflection */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "16px",
          backdropFilter: "blur(5px) contrast(1.2) brightness(1.1) saturate(1.3)",
          WebkitBackdropFilter: "blur(5px) contrast(1.2) brightness(1.1) saturate(1.3)",
          filter: "url('/wavy-glass-filter.svg#wavy-glass')",
          zIndex: -1,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      {/* Card content */}
      <div style={{ position: "relative", zIndex: 2, padding: "24px" }}>
      {/* Title */}
      <h2
        style={{
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "20px",
          fontWeight: "400",
          color: "white",
          margin: "0 0 16px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: "1.2",
        }}
      >
        {title}
      </h2>

      {/* Content based on type */}
      {props.type === "about" && (
        <p
          style={{
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: "12px",
            fontWeight: "400",
            color: "rgba(255, 255, 255, 0.9)",
            margin: "0",
            lineHeight: "1.5",
          }}
        >
          {props.body}
        </p>
      )}

        {props.type === "contact" && (
          <form onSubmit={handleSubmit}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Name Input */}
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                style={{
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: "12px",
                  padding: "10px 12px",
                  borderRadius: "20px",
                  border: "1px solid white",
                  backgroundColor: "transparent",
                  color: "white",
                  outline: "none",
                }}
              />

              {/* Phone Number Input */}
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                style={{
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: "12px",
                  padding: "10px 12px",
                  borderRadius: "20px",
                  border: "1px solid white",
                  backgroundColor: "transparent",
                  color: "white",
                  outline: "none",
                }}
              />

              {/* Email Input */}
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                style={{
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: "12px",
                  padding: "10px 12px",
                  borderRadius: "20px",
                  border: "1px solid white",
                  backgroundColor: "transparent",
                  color: "white",
                  outline: "none",
                }}
              />

              {/* Message Input */}
              <textarea
                placeholder="Message"
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                rows={4}
                style={{
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: "12px",
                  padding: "10px 12px",
                  borderRadius: "20px",
                  border: "1px solid white",
                  backgroundColor: "transparent",
                  color: "white",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "80px",
                }}
              />

              {/* Send Button */}
              <button
                type="submit"
                style={{
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: "12px",
                  fontWeight: "400",
                  padding: "12px 24px",
                  borderRadius: "20px",
                  border: "1px solid white",
                  backgroundColor: "transparent",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginTop: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .card-component input::placeholder,
        .card-component textarea::placeholder {
          color: white;
        }

        .card-component input:focus,
        .card-component textarea:focus {
          border-color: white;
          background-color: transparent;
        }
      `}</style>
    </div>
  );
}