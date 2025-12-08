'use client';

import { 
  getInitialScrollImageUrl, 
  getCastShadowsImageUrl, 
  getThirdLaptopImageUrl,
  SEQUENCE_CONFIG 
} from './models-config';

interface PreloadProgress {
  initialScroll: number;
  castShadows: number;
  thirdLaptop: number;
  overall: number;
}

type ProgressCallback = (progress: PreloadProgress) => void;

class SequencePreloader {
  // Make imageCache static and public so sequences can access it
  public static imageCache = new Map<string, HTMLImageElement>();
  
  private progressState: PreloadProgress = {
    initialScroll: 0,
    castShadows: 0,
    thirdLaptop: 0,
    overall: 0,
  };

  async preloadAllSequences(onProgress?: ProgressCallback): Promise<void> {
    console.log('🚀 Starting progressive preload strategy...');
    
    const totalFrames = 
      SEQUENCE_CONFIG.initialScroll.totalFrames +
      SEQUENCE_CONFIG.castShadows.totalFrames +
      SEQUENCE_CONFIG.thirdLaptop.totalFrames;

    let loadedFrames = 0;

    const updateProgress = (sequence: keyof Omit<PreloadProgress, 'overall'>, loaded: number, total: number) => {
      this.progressState[sequence] = loaded / total;
      loadedFrames++;
      this.progressState.overall = loadedFrames / totalFrames;
      
      if (onProgress) {
        onProgress({ ...this.progressState });
      }
    };

    // ========== PRIORITY 1: First 60 frames of Initial Scroll ==========
    // Load critical frames first so user sees motion immediately
    console.log('⚡ Priority 1: Loading first 60 frames of Initial Scroll...');
    await this.preloadSequence(
      'initialScroll',
      getInitialScrollImageUrl,
      60, // Just first 60 frames
      (loaded, total) => updateProgress('initialScroll', loaded, SEQUENCE_CONFIG.initialScroll.totalFrames),
      0 // Start from frame 0
    );
    console.log('✅ Priority 1 complete - user can start seeing motion!');

    // ========== PRIORITY 2: Rest of sequences in parallel ==========
    // Load everything else in background while user engages with first 60 frames
    console.log('📦 Priority 2: Loading remaining frames in parallel...');
    await Promise.all([
      // Finish Initial Scroll (frames 61-600)
      this.preloadSequence(
        'initialScroll',
        getInitialScrollImageUrl,
        SEQUENCE_CONFIG.initialScroll.totalFrames,
        (loaded, total) => updateProgress('initialScroll', loaded, total),
        60 // Start from frame 60
      ),
      // Cast Shadows - full sequence
      this.preloadSequence(
        'castShadows',
        getCastShadowsImageUrl,
        SEQUENCE_CONFIG.castShadows.totalFrames,
        (loaded, total) => updateProgress('castShadows', loaded, total)
      ),
      // Third Laptop - full sequence
      this.preloadSequence(
        'thirdLaptop',
        getThirdLaptopImageUrl,
        SEQUENCE_CONFIG.thirdLaptop.totalFrames,
        (loaded, total) => updateProgress('thirdLaptop', loaded, total)
      ),
    ]);

    console.log('🎯 All sequences preloaded successfully!');
  }

  private async preloadSequence(
    name: string,
    getUrl: (frameNumber: number) => string,
    totalFrames: number,
    onProgress: (loaded: number, total: number) => void,
    startFrame: number = 0
  ): Promise<void> {
    console.log(`📦 Preloading ${name}: frames ${startFrame + 1}-${totalFrames}`);
    
    // Adaptive batch size based on network speed (detected via timing)
    let batchSize = 50;
    let loaded = startFrame;

    for (let batchStart = startFrame; batchStart < totalFrames; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalFrames);
      const promises: Promise<void>[] = [];
      
      const batchStartTime = performance.now();

      for (let i = batchStart; i < batchEnd; i++) {
        promises.push(this.preloadFrame(`${name}-${i}`, getUrl(i + 1)));
      }

      await Promise.all(promises);
      loaded = batchEnd;
      onProgress(loaded, totalFrames);
      
      // Adaptive batch sizing: if batch took > 3s, reduce size for slower connections
      const batchDuration = performance.now() - batchStartTime;
      if (batchDuration > 3000 && batchSize > 20) {
        batchSize = Math.max(20, Math.floor(batchSize * 0.7));
        console.log(`🐌 Slow connection detected, reducing batch size to ${batchSize}`);
      } else if (batchDuration < 1000 && batchSize < 100) {
        batchSize = Math.min(100, Math.floor(batchSize * 1.3));
        console.log(`⚡ Fast connection detected, increasing batch size to ${batchSize}`);
      }

      // Small delay between batches to avoid overwhelming the browser
      if (batchEnd < totalFrames) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }

    console.log(`✅ ${name} preloaded: ${totalFrames} frames`);
  }

  private preloadFrame(key: string, url: string): Promise<void> {
    if (SequencePreloader.imageCache.has(key)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Performance hints for browser
      img.decoding = 'async'; // Decode off main thread
      img.loading = 'eager'; // Load immediately (not lazy)

      img.onload = async () => {
        // Pre-decode the image for smoother rendering
        try {
          await img.decode();
        } catch (e) {
          // Decode failed, but image still loaded
        }
        SequencePreloader.imageCache.set(key, img);
        resolve();
      };

      img.onerror = () => {
        console.error(`Failed to load frame: ${url}`);
        reject(new Error(`Failed to load: ${url}`));
      };

      img.src = url;
    });
  }

  getProgress(): PreloadProgress {
    return { ...this.progressState };
  }

  // Helper to get cached image by sequence name and frame index
  static getCachedImage(sequenceName: string, frameIndex: number): HTMLImageElement | undefined {
    return SequencePreloader.imageCache.get(`${sequenceName}-${frameIndex}`);
  }

  // Helper to check if a frame is cached
  static isFrameCached(sequenceName: string, frameIndex: number): boolean {
    return SequencePreloader.imageCache.has(`${sequenceName}-${frameIndex}`);
  }
}

// Singleton instance
const preloader = new SequencePreloader();

export { preloader, type PreloadProgress, SequencePreloader };
