import * as THREE from 'three';
import { requestRender } from './render.js';

export let renderer, scene, camera;

export function initScene() {
  // Renderer — transparent so CSS gradient shows through
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas3d'),
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearAlpha(0);

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.05,
    200
  );
  camera.position.set(0, 10, 30);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xfff4e0, 1.0);
  directional.position.set(10, 20, 10);
  scene.add(directional);

  const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x362a1f, 0.4);
  scene.add(hemisphere);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    requestRender();
  });
}
