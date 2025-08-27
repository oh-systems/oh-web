import * as THREE from 'three';

type Listener = (ratio: number, loaded: number, total: number) => void;

class AppLoading {
  manager = new THREE.LoadingManager();
  private listeners = new Set<Listener>();
  ratio = 0;
  private _shouldComplete = false;

  constructor() {
    this.manager.onProgress = (_url, loaded, total) => {
      this.ratio = total ? loaded / total : 0;
      this.emit();
    };
    this.manager.onLoad = () => { 
      this.ratio = 1; 
      this.emit(); 
    };
  }

  on(l: Listener) { 
    this.listeners.add(l); 
    return () => this.listeners.delete(l); 
  }

  emit() { 
    this.listeners.forEach(l => l(this.ratio, 0, 0)); 
  }

  // Call this when you want to trigger the final outro animation
  complete() {
    this._shouldComplete = true;
    this.emit();
  }

  get shouldComplete() {
    return this._shouldComplete;
  }
}

export const appLoading = new AppLoading();

// Example loaders anywhere else: new THREE.TextureLoader(appLoading.manager).load(...)
