'use client';

interface HeroTextProps {
  className?: string;
}

export default function HeroText({ className = '' }: HeroTextProps) {
  return (
    <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-40 pl-16 w-1/2 ${className}`}>
      <p 
        className="text-white text-lg leading-relaxed font-bold"
        style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
      >
        OH exists to redefine e-commerce by turning online shopping into immersive, spatial experiences. 
        This is the foundation for a new kind of digital reality.
      </p>
    </div>
  );
}
