import { useEffect, useRef, useState } from "react";
import GlassSurface from "./GlassSurface";
import "./GlassCursor.css";

interface GlassCursorProps {
  scrollAnimationStarted?: boolean;
}

const GlassCursor = ({ scrollAnimationStarted = false }: GlassCursorProps) => {
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100 });
  const [smoothWhiteCursor, setSmoothWhiteCursor] = useState({
    x: -100,
    y: -100,
  });
  const [crystalOpacity, setCrystalOpacity] = useState(0);
  const mousePositionRef = useRef({ x: -100, y: -100 });
  const realMousePositionRef = useRef({ x: -100, y: -100 });
  const smoothWhiteCursorRef = useRef({ x: -100, y: -100 }); // Track in ref too
  const animationFrameRef = useRef<number>(0);
  const whiteCursorAnimationRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const exactX = e.clientX;
      const exactY = e.clientY;

      mousePositionRef.current = { x: exactX, y: exactY };
      realMousePositionRef.current = { x: exactX, y: exactY };
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Fade in crystal when scroll animation starts
  useEffect(() => {
    if (scrollAnimationStarted) {
      // Gradually fade in the crystal over 3 seconds with scale effect
      const fadeInDuration = 3000; // 3 seconds
      const startTime = performance.now();

      const fadeIn = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / fadeInDuration, 1);

        // Smooth ease-in-out
        const easedProgress = progress * progress * (3 - 2 * progress);
        setCrystalOpacity(easedProgress);

        if (progress < 1) {
          requestAnimationFrame(fadeIn);
        }
      };

      requestAnimationFrame(fadeIn);
    } else {
      setCrystalOpacity(0);
    }
  }, [scrollAnimationStarted]);

  // Separate effect for animation loop
  useEffect(() => {
    if (!scrollAnimationStarted) return; // Don't animate until scroll animation starts

    const animate = () => {
      setCursorPosition((prevPos) => {
        const targetX = mousePositionRef.current.x;
        const targetY = mousePositionRef.current.y;

        // Smooth easing - lower values = more lag/trailing effect
        const easeAmount = 0.025;
        const newX = prevPos.x + (targetX - prevPos.x) * easeAmount;
        const newY = prevPos.y + (targetY - prevPos.y) * easeAmount;

        return { x: newX, y: newY };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scrollAnimationStarted]);

  // Smooth animation for white cursor with delay
  useEffect(() => {
    const animateWhiteCursor = () => {
      const targetX = realMousePositionRef.current.x;
      const targetY = realMousePositionRef.current.y;

      // Smooth easing for white cursor - slightly higher for subtle delay
      const easeAmount = 0.1;
      const newX = smoothWhiteCursorRef.current.x + (targetX - smoothWhiteCursorRef.current.x) * easeAmount;
      const newY = smoothWhiteCursorRef.current.y + (targetY - smoothWhiteCursorRef.current.y) * easeAmount;

      // Only update if there's a meaningful change (> 0.1px)
      if (Math.abs(newX - smoothWhiteCursorRef.current.x) > 0.1 || Math.abs(newY - smoothWhiteCursorRef.current.y) > 0.1) {
        smoothWhiteCursorRef.current = { x: newX, y: newY };
        setSmoothWhiteCursor({ x: newX, y: newY });
      }

      whiteCursorAnimationRef.current = requestAnimationFrame(animateWhiteCursor);
    };

    animateWhiteCursor();

    return () => {
      if (whiteCursorAnimationRef.current) {
        cancelAnimationFrame(whiteCursorAnimationRef.current);
      }
    };
  }, []); // Empty dependency array - runs once and uses ref

  return (
    <>
      {/* Glass crystal with delayed/smooth movement - only after scroll starts */}
      {scrollAnimationStarted && (
        <div
          className={`glass-cursor`}
          style={{
            left: cursorPosition.x,
            top: cursorPosition.y,
            opacity: crystalOpacity,
            transform: `translate(-50%, -50%) scale(${
              0.7 + crystalOpacity * 0.3
            })`,
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
            blur={15}
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
      )}

      {/* Small white circle indicator showing real cursor position - always visible */}
      <div
        style={{
          position: "fixed",
          left: smoothWhiteCursor.x,
          top: smoothWhiteCursor.y,
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "white",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 999999999,
          opacity: 1,
        }}
      />
    </>
  );
};

export default GlassCursor;
