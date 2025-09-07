'use client';

interface ArcwareGameProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function ArcwareGame({ className = '', style }: ArcwareGameProps) {
  return (
    <div 
      className={`arcware-game-container ${className}`}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        ...style
      }}
    >
      <iframe
        src="https://share.arcware.cloud/v1/share-0f37f899-cf1e-4d94-817a-ec1edad2e1f5"
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        style={{
          border: 'none',
          borderRadius: '8px'
        }}
        title="Interactive 3D Game"
      />
    </div>
  );
}
