import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

let loadingManager;
let gltfLoader;
let onProgressCallback = null;
let allLoadedResolve = null;
let allLoadedPromise = null;

export function initLoader(onProgress) {
  onProgressCallback = onProgress;

  loadingManager = new THREE.LoadingManager();

  loadingManager.onProgress = (_url, loaded, total) => {
    const progress = loaded / total;
    if (onProgressCallback) onProgressCallback(progress);
  };

  // Create the promise immediately so onLoad is captured before any loads start
  allLoadedPromise = new Promise((resolve) => {
    allLoadedResolve = resolve;
  });

  loadingManager.onLoad = () => {
    if (allLoadedResolve) allLoadedResolve();
  };

  // Draco decoder for compressed geometry
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

  gltfLoader = new GLTFLoader(loadingManager);
  gltfLoader.setDRACOLoader(dracoLoader);
}

export function loadModel(path) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => resolve(gltf),
      undefined,
      (error) => reject(error)
    );
  });
}

export function onAllLoaded() {
  return allLoadedPromise;
}
