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
    console.log('🚀 Starting preload of all sequences...');
    
    const totalFrames = 
      SEQUENCE_CONFIG.initialScroll.totalFrames +
      SEQUENCE_CONFIG.castShadows.totalFrames +
      SEQUENCE_CONFIG.thirdLaptop.totalFrames;

    const sequenceProgress = {
      initialScroll: 0,
      castShadows: 0,
      thirdLaptop: 0,
    };

    const updateProgress = (sequence: keyof Omit<PreloadProgress, 'overall'>, loaded: number, total: number) => {
      sequenceProgress[sequence] = loaded;
      this.progressState[sequence] = loaded / total;
      
      // Calculate overall progress based on actual frames loaded from all sequences
      const totalLoaded = sequenceProgress.initialScroll + sequenceProgress.castShadows + sequenceProgress.thirdLaptop;
      this.progressState.overall = totalLoaded / totalFrames;
      
      if (onProgress) {
        onProgress({ ...this.progressState });
      }
    };

    // Preload all sequences in parallel with batch processing
    await Promise.all([
      this.preloadSequence(
        'initialScroll',
        getInitialScrollImageUrl,
        SEQUENCE_CONFIG.initialScroll.totalFrames,
        (loaded, total) => updateProgress('initialScroll', loaded, total)
      ),
      this.preloadSequence(
        'castShadows',
        getCastShadowsImageUrl,
        SEQUENCE_CONFIG.castShadows.totalFrames,
        (loaded, total) => updateProgress('castShadows', loaded, total)
      ),
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
    onProgress: (loaded: number, total: number) => void
  ): Promise<void> {
    console.log(`📦 Preloading ${name}: ${totalFrames} frames`);
    
    const batchSize = 50;
    let loaded = 0;

    for (let batchStart = 0; batchStart < totalFrames; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalFrames);
      const promises: Promise<void>[] = [];

      for (let i = batchStart; i < batchEnd; i++) {
        promises.push(this.preloadFrame(`${name}-${i}`, getUrl(i + 1)));
      }

      await Promise.all(promises);
      loaded = batchEnd;
      onProgress(loaded, totalFrames);

      // Small delay between batches
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

      img.onload = () => {
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
