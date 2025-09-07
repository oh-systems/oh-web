import ArcwareGame from '../../../../components/ArcwareGame';

export default function GamePage() { 
  return (
    <div className="mx-auto max-w-7xl py-12">
      <h1 className="text-2xl font-semibold mb-6">Game Showcase</h1>
      <p className="mb-6 text-gray-600">
        Live web demo powered by Arcware cloud rendering. 
        Recommended: wired connection, modern GPU, Chrome/Edge.
      </p>
      
      <div className="rounded-lg overflow-hidden shadow-lg">
        <ArcwareGame 
          style={{ height: '80vh', minHeight: '600px' }}
        />
      </div>
      
      <p className="mt-4 text-sm text-gray-500">
        Interactive 3D experience streamed in real-time from the cloud
      </p>
    </div>
  ); 
}
