// Configuration for all model image sequences

// Force CDN usage - all images are now hosted on Vercel Blob
const isProduction = () => {
  return true; // Always use CDN since local images have been removed
};

// Base URLs for each sequence
const CDN_URLS = {
  'initial-load': 'https://foekghdgnwtayw0b.public.blob.vercel-storage.com/initial-load/',
  'initial-scroll': 'https://foekghdgnwtayw0b.public.blob.vercel-storage.com/initial-scroll/', 
  'cast-shadows': 'https://foekghdgnwtayw0b.public.blob.vercel-storage.com/cast-shadows/',
  'third-laptop': 'https://foekghdgnwtayw0b.public.blob.vercel-storage.com/third-laptop/'
};

const LOCAL_PATHS = {
  'initial-load': '/images/models/INITIAL LOAD/',
  'initial-scroll': '/images/models/INITIAL SCROLL/',
  'cast-shadows': '/SECOND CAST SHADOWS/',
  'third-laptop': '/images/models/THIRD LAPTOP/'
};

// URL generation functions for each sequence
export function getInitialLoadImageUrl(filename) {
  if (isProduction()) {
    return `${CDN_URLS['initial-load']}${filename}`;
  }
  return `${LOCAL_PATHS['initial-load']}${filename}`;
}

export function getInitialScrollImageUrl(filename) {
  if (isProduction()) {
    return `${CDN_URLS['initial-scroll']}${filename}`;
  }
  return `${LOCAL_PATHS['initial-scroll']}${filename}`;
}

export function getCastShadowsImageUrl(filename) {
  if (isProduction()) {
    return `${CDN_URLS['cast-shadows']}${filename}`;
  }
  return `${LOCAL_PATHS['cast-shadows']}${filename}`;
}

export function getThirdLaptopImageUrl(filename) {
  if (isProduction()) {
    return `${CDN_URLS['third-laptop']}${filename}`;
  }
  return `${LOCAL_PATHS['third-laptop']}${filename}`;
}

// Preloading utilities
export function preloadSequence(getUrlFunction, startFrame, endFrame, prefix) {
  const images = [];
  for (let i = startFrame; i <= endFrame; i++) {
    const filename = `${prefix}${i.toString().padStart(4, '0')}.avif`;
    const img = new Image();
    img.src = getUrlFunction(filename);
    images.push(img);
  }
  return images;
}

// Sequence configurations
export const SEQUENCE_CONFIG = {
  initialLoad: {
    totalFrames: 300,
    prefix: 'INITIAL',
    getUrl: getInitialLoadImageUrl
  },
  initialScroll: {
    totalFrames: 601,
    prefix: 'INITIAL', // Check the actual prefix in your files
    getUrl: getInitialScrollImageUrl
  },
  castShadows: {
    totalFrames: 1199,
    prefix: 'CAST SHADOWS',
    getUrl: getCastShadowsImageUrl
  },
  thirdLaptop: {
    totalFrames: 450,
    prefix: 'THIRD', // Check the actual prefix in your files
    getUrl: getThirdLaptopImageUrl
  }
};