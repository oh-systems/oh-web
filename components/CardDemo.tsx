"use client";

import React from "react";
import Card from "./Card";

interface CardDemoProps {
  activeCard?: string | null;
}

export default function CardDemo({ activeCard }: CardDemoProps) {
  return (
    <>
      {/* About Card */}
      {activeCard === 'about' && (
        <Card
          type="about"
          title="About Us"
          body="OH builds immersive environments for commerce and culture. We replace static websites with spatial systems powered by Unreal Engine, AI, and cloud infrastructure. Our work spans both digital and physical domains and is built to scale with the future of interaction."
        />
      )}

      {/* Contact Card */}
      {activeCard === 'contact' && (
        <Card
          type="contact"
          title="Contact Us"
          onSubmit={(data) => {
            console.log("Form submitted:", data);
            // Handle form submission here
          }}
        />
      )}
    </>
  );
}