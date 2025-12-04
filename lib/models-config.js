// Configuration for all model image sequences

// Check if we're in production environment
const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

// Base URLs for each sequence (fallback)
const CDN_URLS = {
  'initial-load': 'https://foekghdgnwtayw0b.public.blob.vercel-storage.com/initial-load/',
  'initial-scroll': 'https://foekghdgnwtayw0b.public.blob.vercel-storage.com/initial-scroll/', 
  'cast-shadows': 'https://foekghdgnwtayw0b.public.blob.vercel-storage.com/cast-shadows/',
  'third-laptop': 'https://foekghdgnwtayw0b.public.blob.vercel-storage.com/third-laptop/'
};

const LOCAL_PATHS = {
  'initial-load': '/OH WEB OPTIMIZED FRAMES/INITIAL LOAD WEBP/',
  'initial-scroll': '/OH WEB OPTIMIZED FRAMES/INITIAL SCROLL WEBP/',
  'cast-shadows': '/OH WEB OPTIMIZED FRAMES/CAST SHADOWS WEBP 1600 85/',
  'third-laptop': '/OH WEB OPTIMIZED FRAMES/FINAL LAPTOP WEBP 90/'
};

// URL generation functions for each sequence
export function getInitialLoadImageUrl(frameNumber) {
  if (isProduction()) {
    // Use original AVIF filename for CDN
    const filename = `INITIAL${frameNumber.toString().padStart(4, '0')}.avif`;
    return `${CDN_URLS['initial-load']}${filename}`;
  }
  // Use local WebP with new naming pattern
  const filename = `initial_q90_${frameNumber.toString().padStart(4, '0')}.webp`;
  return `${LOCAL_PATHS['initial-load']}${filename}`;
}

export function getInitialScrollImageUrl(frameNumber) {
  if (isProduction()) {
    // Use original AVIF filename for CDN
    const filename = `INITIAL${frameNumber.toString().padStart(4, '0')}.avif`;
    return `${CDN_URLS['initial-scroll']}${filename}`;
  }
  // Use local WebP with new naming pattern
  const filename = `scroll_q90_${frameNumber.toString().padStart(4, '0')}.webp`;
  return `${LOCAL_PATHS['initial-scroll']}${filename}`;
}

export function getCastShadowsImageUrl(frameNumber) {
  if (isProduction()) {
    // Use original AVIF filename for CDN
    const filename = `CAST SHADOWS${frameNumber.toString().padStart(4, '0')}.avif`;
    return `${CDN_URLS['cast-shadows']}${filename}`;
  }
  // Use local WebP with new naming pattern
  const filename = `cast_1600_q85_${frameNumber.toString().padStart(4, '0')}.webp`;
  return `${LOCAL_PATHS['cast-shadows']}${filename}`;
}

export function getThirdLaptopImageUrl(frameNumber) {
  if (isProduction()) {
    // Use original AVIF filename for CDN
    const filename = `THIRD${frameNumber.toString().padStart(4, '0')}.avif`;
    return `${CDN_URLS['third-laptop']}${filename}`;
  }
  // Use local WebP with new naming pattern
  const filename = `out_q90_${frameNumber.toString().padStart(4, '0')}.webp`;
  return `${LOCAL_PATHS['third-laptop']}${filename}`;
}

// Preloading utilities
export function preloadSequence(getUrlFunction, startFrame, endFrame) {
  const images = [];
  for (let i = startFrame; i <= endFrame; i++) {
    const img = new Image();
    img.src = getUrlFunction(i);
    images.push(img);
  }
  return images;
}

// Sequence configurations
export const SEQUENCE_CONFIG = {
  initialLoad: {
    totalFrames: 300,
    getUrl: getInitialLoadImageUrl
  },
  initialScroll: {
    totalFrames: 600,
    getUrl: getInitialScrollImageUrl
  },
  castShadows: {
    totalFrames: 1200,
    getUrl: getCastShadowsImageUrl
  },
  thirdLaptop: {
    totalFrames: 1181,
    getUrl: getThirdLaptopImageUrl
  }
};