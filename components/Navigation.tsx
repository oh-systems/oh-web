'use client';

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className = '' }: NavigationProps) {
  return (
    <nav className={`absolute top-0 right-0 z-50 py-4 pl-8 pr-16 ${className}`}>
      <ul className="flex space-x-32 text-white">
        <li>
          <a 
            href="/about" 
            className="text-white text-lg font-bold hover:opacity-70 transition-opacity duration-200"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            About
          </a>
        </li>
        <li>
          <a 
            href="/game" 
            className="text-white text-lg font-bold hover:opacity-70 transition-opacity duration-200"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            Space
          </a>
        </li>
        <li>
          <a 
            href="/contact" 
            className="text-white text-lg font-bold hover:opacity-70 transition-opacity duration-200"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            Contact
          </a>
        </li>
      </ul>
    </nav>
  );
}
