import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache for images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'foekghdgnwtayw0b.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Enable production-grade optimizations
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  // Optimize bundle
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react', 'react-dom'],
  },
};

export default nextConfig;
