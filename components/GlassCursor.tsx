import { useEffect, useRef, useState } from "react";
import GlassSurface from "./GlassSurface";
import "./GlassCursor.css";

interface GlassCursorProps {
  scrollAnimationStarted?: boolean;
}

const GlassCursor = ({ scrollAnimationStarted = false }: GlassCursorProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [whiteCursorOpacity, setWhiteCursorOpacity] = useState(0);
  const mousePositionRef = useRef({ x: -100, y: -100 });
  const realMousePositionRef = useRef({ x: -100, y: -100 });
  const cursorPositionRef = useRef({ x: -100, y: -100 });
  const smoothWhiteCursorRef = useRef({ x: -100, y: -100 });
  const glassCursorElementRef = useRef<HTMLDivElement>(null);
  const whiteCursorElementRef = useRef<HTMLDivElement>(null);
  const isHoveringRef = useRef(false);
  const animationFrameRef = useRef<number>(0);
  const whiteCursorAnimationRef = useRef<number>(0);
  const hoverCheckTimeoutRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const exactX = e.clientX;
      const exactY = e.clientY;

      mousePositionRef.current = { x: exactX, y: exactY };
      realMousePositionRef.current = { x: exactX, y: exactY };

      // Throttle hover detection to every 100ms instead of every mousemove
      if (hoverCheckTimeoutRef.current) return;

      hoverCheckTimeoutRef.current = window.setTimeout(() => {
        hoverCheckTimeoutRef.current = 0;

        // Check if hovering over interactive element
        const elementUnderCursor = document.elementFromPoint(exactX, exactY);
        if (elementUnderCursor) {
          const isInteractive =
            elementUnderCursor.closest(
              'a, button, [role="button"], input, textarea, select, [onclick], [tabindex], .section-indicator, .sound-container, .sound-toggle, svg, path, circle, rect'
            ) !== null;

          // Only update state if the value actually changed
          if (isHoveringRef.current !== isInteractive) {
            isHoveringRef.current = isInteractive;
            setIsHovering(isInteractive);
          }
        }
      }, 100);
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (hoverCheckTimeoutRef.current) {
        clearTimeout(hoverCheckTimeoutRef.current);
      }
    };
  }, []);

  // Fade in white cursor on initial load
  useEffect(() => {
    const fadeInDuration = 3000;
    const startTime = performance.now();

    const fadeIn = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / fadeInDuration, 1);

      const easedProgress = progress * progress * (3 - 2 * progress);
      setWhiteCursorOpacity(easedProgress);

      if (progress < 1) {
        requestAnimationFrame(fadeIn);
      }
    };

    requestAnimationFrame(fadeIn);
  }, []);

  // Animation loop for crystal cursor
  useEffect(() => {
    const animate = () => {
      const targetX = mousePositionRef.current.x;
      const targetY = mousePositionRef.current.y;

      const easeAmount = 0.025;
      const newX =
        cursorPositionRef.current.x +
        (targetX - cursorPositionRef.current.x) * easeAmount;
      const newY =
        cursorPositionRef.current.y +
        (targetY - cursorPositionRef.current.y) * easeAmount;

      cursorPositionRef.current = { x: newX, y: newY };

      if (glassCursorElementRef.current) {
        glassCursorElementRef.current.style.left = `${newX}px`;
        glassCursorElementRef.current.style.top = `${newY}px`;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Animation loop for white cursor
  useEffect(() => {
    if (whiteCursorElementRef.current) {
      smoothWhiteCursorRef.current = {
        x: realMousePositionRef.current.x,
        y: realMousePositionRef.current.y,
      };
      whiteCursorElementRef.current.style.left = `${realMousePositionRef.current.x}px`;
      whiteCursorElementRef.current.style.top = `${realMousePositionRef.current.y}px`;
    }

    const animateWhiteCursor = () => {
      const targetX = realMousePositionRef.current.x;
      const targetY = realMousePositionRef.current.y;

      const easeAmount = 0.1;
      const newX =
        smoothWhiteCursorRef.current.x +
        (targetX - smoothWhiteCursorRef.current.x) * easeAmount;
      const newY =
        smoothWhiteCursorRef.current.y +
        (targetY - smoothWhiteCursorRef.current.y) * easeAmount;

      smoothWhiteCursorRef.current = { x: newX, y: newY };

      if (whiteCursorElementRef.current) {
        whiteCursorElementRef.current.style.left = `${newX}px`;
        whiteCursorElementRef.current.style.top = `${newY}px`;
      }

      whiteCursorAnimationRef.current =
        requestAnimationFrame(animateWhiteCursor);
    };

    whiteCursorAnimationRef.current = requestAnimationFrame(animateWhiteCursor);

    return () => {
      if (whiteCursorAnimationRef.current) {
        cancelAnimationFrame(whiteCursorAnimationRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Glass crystal with delayed/smooth movement - always visible */}
      <div
        ref={glassCursorElementRef}
        className={`glass-cursor`}
        style={{
          position: "fixed",
          left: -100,
          top: -100,
          opacity: 1,
          transform: "translate(-50%, -50%)",
          transition: "none",
          pointerEvents: "none",
          zIndex: 999999999,
        }}
      >
        <GlassSurface
          width={78}
          height={78}
          borderRadius={39}
          borderWidth={0}
          brightness={50}
          opacity={0.93}
          blur={30}
          displace={0.5}
          backgroundOpacity={0.08}
          saturation={1.3}
          distortionScale={-180}
          redOffset={0}
          greenOffset={8}
          blueOffset={16}
          className="glass-cursor__surface"
        >
          <div className="glass-cursor__content" />
        </GlassSurface>
      </div>

      {/* Small white circle indicator showing real cursor position - always visible */}
      <div
        ref={whiteCursorElementRef}
        style={{
          position: "fixed",
          left: -100,
          top: -100,
          width: isHovering ? "12px" : "6px",
          height: isHovering ? "12px" : "6px",
          borderRadius: "50%",
          backgroundColor: "white",
          transform: "translate(-50%, -50%)",
          transition: "width 0.2s ease-out, height 0.2s ease-out",
          pointerEvents: "none",
          zIndex: 999999999,
          opacity: whiteCursorOpacity,
        }}
      />
    </>
  );
};

export default GlassCursor;
