import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

export let renderer, scene, camera;

export function initScene() {
  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas3d'),
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.05,
    1000
  );
  camera.position.set(0, 10, 30);

  // Sky — warm golden-hour LoL atmosphere
  const sky = new Sky();
  sky.scale.setScalar(450);
  scene.add(sky);

  const sunPosition = new THREE.Vector3();
  const phi = THREE.MathUtils.degToRad(88); // sun near horizon
  const theta = THREE.MathUtils.degToRad(220);
  sunPosition.setFromSphericalCoords(1, phi, theta);

  sky.material.uniforms.sunPosition.value.copy(sunPosition);
  sky.material.uniforms.turbidity.value = 4;
  sky.material.uniforms.rayleigh.value = 1.5;
  sky.material.uniforms.mieCoefficient.value = 0.005;
  sky.material.uniforms.mieDirectionalG.value = 0.8;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xfff4e0, 1.0);
  directional.position.set(10, 20, 10);
  scene.add(directional);

  const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x362a1f, 0.4);
  scene.add(hemisphere);

  // Resize handler
  window.addEventListener('resize', onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
