"use client";

import WaveClothShader from "@/../components/WaveClothShader";

export default function SpacePage() {
  return (
    <>
      {/* Wave shader background - renders behind iframe */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
        }}
      >
        <WaveClothShader />
      </div>

      {/* Iframe content */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000000",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <iframe
          src="https://share.arcware.cloud/v1/share-0f37f899-cf1e-4d94-817a-ec1edad2e1f5"
          title="OH Space Experience"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
          allowFullScreen
        />
      </div>
    </>
  );
}
