# OH Web

High-performance Next.js website featuring advanced scroll-driven animations, WebP image sequences, and cloud-rendered 3D experiences.

## Overview

This project showcases cinematic web experiences using frame-by-frame animation sequences with intelligent preloading, smooth scroll-driven animations, and Arcware cloud-rendered 3D content.

## Tech Stack

- **Framework**: Next.js 16 with App Router & Turbopack
- **UI**: React 19, Tailwind CSS 4
- **Storage**: Vercel Blob Storage for CDN-hosted assets
- **TypeScript**: Full type safety across the codebase

## Key Features

### Image Sequence Engine
- **4 Animation Sequences**: Initial Load (300 frames), Initial Scroll (600 frames), Cast Shadows (1200 frames), Laptop (1181 frames)
- **WebP Optimization**: High-quality frames at 85-90% quality, 1600px width
- **Intelligent Preloading**: Progressive loading with real-time progress tracking
- **Smart Caching**: Shared static image cache across all sequences
- **Adaptive Rendering**: Canvas-based rendering with frame-perfect playback

### Scroll-Driven Animations
- **Multi-Stage Sequences**: Coordinated fade, slide, and transition effects
- **Performance Optimized**: RequestAnimationFrame-based smooth animations
- **Responsive Design**: Adapts to viewport and scroll behavior
- **Section Indicators**: Visual progress tracking through experience stages

### 3D Cloud Rendering
- **Arcware Integration**: Real-time cloud-rendered Unreal Engine experiences
- **Game Showcase**: Interactive 3D demo at `/game`
- **Space Experience**: Immersive environment at `/space`

### UI Components
- **UnifiedRingLoader**: Custom SVG-based loading animation with progress
- **GlassCursor**: Custom cursor with glassmorphism effect
- **Navigation**: Fade-aware navigation with scroll progress
- **TransitionScreen**: Smooth scene transitions
- **Footer**: Responsive footer with section awareness

## Scripts

```bash
npm run dev          # Local development with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint code quality check
npm run type-check   # TypeScript validation
npm run format       # Prettier code formatting
npm run upload-images # Upload sequences to Vercel Blob Storage
```

## Project Structure

```
/src/app/
  ├── page.tsx              # Main homepage with scroll sequences
  ├── AppContent.tsx        # App-level state & loading orchestration
  ├── ConditionalAppContent.tsx
  ├── layout.tsx            # Root layout
  ├── globals.css           # Global styles
  ├── (site)/
  │   ├── page.tsx          # Homepage redirect
  │   ├── game/             # Game showcase
  │   ├── space/            # Space experience
  │   └── team/             # Team page
  └── (system)/
      ├── robots.txt
      └── sitemap.xml

/components/
  ├── *Sequence.tsx         # 4 image sequence components
  ├── UnifiedRingLoader.tsx # Loading animation
  ├── PermanentRing.tsx     # Corner navigation ring
  ├── Navigation.tsx        # Main navigation
  ├── GlassCursor.tsx       # Custom cursor
  ├── GlassSurface.tsx      # Glass effect components
  ├── TransitionScreen.tsx  # Scene transitions
  ├── ArcwareGame.tsx       # Cloud-rendered game embed
  └── index.ts              # Component exports

/lib/
  ├── models-config.js      # Image URL generation & CDN config
  ├── sequence-preloader.ts # Preloading orchestration
  └── playClickSound.ts     # Audio utilities

/hooks/
  └── useScrollSpeedLimiter.ts

/public/
  ├── OH WEB OPTIMIZED FRAMES/  # Local development frames
  │   ├── INITIAL LOAD WEBP/
  │   ├── INITIAL SCROLL WEBP/
  │   ├── CAST SHADOWS WEBP 1600 85/
  │   └── FINAL LAPTOP WEBP 90/
  ├── assets/               # Static assets
  └── sounds/               # Audio files

/scripts/
  └── upload-to-vercel.js   # Blob storage upload utility
```

## Image Sequence System

### Configuration (`lib/models-config.js`)
- Automatic environment detection (production/local)
- CDN URLs for production (Vercel Blob Storage)
- Local paths for development
- Frame URL generators for each sequence

### Preloader (`lib/sequence-preloader.ts`)
- Progressive loading with priority
- Real-time progress callbacks
- Shared static cache
- Memory-efficient cleanup

### Sequence Components
- Canvas-based rendering
- Scroll & time-based playback
- Intersection Observer for performance
- Smart frame caching and cleanup

## Environment Setup

For Vercel Blob Storage integration:
1. Create `.env.local` from example
2. Add `BLOB_READ_WRITE_TOKEN`
3. Run upload script to deploy frames

## Performance Optimizations

- **Turbopack**: Fast builds and HMR
- **Image Optimization**: WebP format, optimized quality
- **Lazy Loading**: Sequences load on demand
- **Frame Caching**: Persistent cache across sequences
- **Canvas Rendering**: Hardware-accelerated playback
- **Intersection Observer**: Only render visible sequences
- **CDN Distribution**: Vercel Blob Storage for global delivery

## Development

The site uses a sophisticated loading sequence:
1. **UnifiedRingLoader** shows progress of all sequences preloading
2. **InitialLoadSequence** plays on completion
3. Ring morphs and moves to corner
4. Main scroll experience begins with coordinated animations
5. Multiple scroll-driven sequences with text overlays
6. Closing ring animation and footer

## Routes

- `/` - Main scroll experience with animation sequences
- `/game` - Interactive 3D game demo (Arcware)
- `/space` - Immersive space experience (Arcware)
- `/team` - Team page
