import './style.css';
import * as THREE from 'three';
import { initScene, renderer, scene, camera } from './scene.js';
import { initLoader, loadModel, onAllLoaded } from './loader.js';
import { loadChampions, updateAnimations, getChampionModel } from './champions.js';
import { initControls, updateControls, controls } from './camera.js';
import { initUI, updateLoadingProgress, hideLoadingScreen } from './ui.js';
import { fetchAccountData } from './data.js';
import { getCurrentChampionId } from './camera.js';

const clock = new THREE.Clock();

// ── Debug overlay ──
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.04); // Y ≈ 0.04 ground
const intersectPt = new THREE.Vector3();

const debugMouse = document.getElementById('debug-mouse');
const debugCamPos = document.getElementById('debug-cam-pos');
const debugCamRot = document.getElementById('debug-cam-rot');
const debugZoom = document.getElementById('debug-zoom');
const debugChampRot = document.getElementById('debug-champ-rot');

// ── Champion rotation (Q/E keys) ──
const keysPressed = {};
window.addEventListener('keydown', (e) => { keysPressed[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keysPressed[e.key.toLowerCase()] = false; });

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function updateDebug() {
  // Mouse → world position on map ground plane
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.ray.intersectPlane(groundPlane, intersectPt);
  if (hit) {
    debugMouse.textContent = `X: ${intersectPt.x.toFixed(1)}  Z: ${intersectPt.z.toFixed(1)}`;
  }

  // Camera
  const p = camera.position;
  debugCamPos.textContent = `X: ${p.x.toFixed(1)}  Y: ${p.y.toFixed(1)}  Z: ${p.z.toFixed(1)}`;

  const r = camera.rotation;
  const toDeg = THREE.MathUtils.radToDeg;
  debugCamRot.textContent = `X: ${toDeg(r.x).toFixed(1)}°  Y: ${toDeg(r.y).toFixed(1)}°  Z: ${toDeg(r.z).toFixed(1)}°`;

  // Zoom (distance from camera to orbit target)
  if (controls) {
    const dist = camera.position.distanceTo(controls.target);
    debugZoom.textContent = dist.toFixed(2);
  }

  // Current champion rotation
  const model = getChampionModel(getCurrentChampionId());
  if (model) {
    debugChampRot.textContent = `Y: ${THREE.MathUtils.radToDeg(model.rotation.y).toFixed(1)}°`;
  }
}

async function init() {
  // 1. Setup Three.js scene
  initScene();

  // 2. Setup loader with progress callback
  initLoader((progress) => {
    updateLoadingProgress(progress);
  });

  // 3. Setup the "all loaded" promise before loading starts
  const allLoadedPromise = onAllLoaded();

  // 4. Load map
  const mapGltf = await loadModel('/models/map/SummonersRift.glb');
  const mapRoot = mapGltf.scene;

  // Scale from LoL game units (~44k range) to scene units (~44)
  mapRoot.scale.setScalar(0.001);
  scene.add(mapRoot);

  // Fix map materials for clean rendering
  mapRoot.traverse((child) => {
    if (!child.isMesh) return;

    const mat = child.material;
    if (!mat) return;

    // Switch transparent BLEND → alpha-tested MASK to eliminate sorting artifacts
    if (mat.transparent || mat.alphaTest > 0) {
      mat.transparent = false;
      mat.alphaTest = 0.5;
      mat.depthWrite = true;
    }

    mat.depthWrite = true;
    mat.needsUpdate = true;
  });

  // 5. Fetch live account data + Load champions (in parallel)
  const [_apiResult] = await Promise.all([fetchAccountData(), loadChampions()]);

  // 6. Wait for all assets (textures etc.) to finish
  await allLoadedPromise;

  // 7. Setup camera controls (after scene is populated)
  initControls();

  // 8. Setup UI interactions
  initUI();

  // 9. Hide loading, show scene
  hideLoadingScreen();

  // Debug: expose to console for calibration
  window.__scene = scene;
  window.__camera = camera;
  window.__renderer = renderer;
  window.__THREE = THREE;

  // 10. Start render loop
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Rotate current champion with Q/E
  const model = getChampionModel(getCurrentChampionId());
  if (model) {
    const speed = 2.0; // radians per second
    if (keysPressed['q']) model.rotation.y += speed * delta;
    if (keysPressed['e']) model.rotation.y -= speed * delta;
  }

  updateAnimations(delta);
  updateControls();
  updateDebug();
  renderer.render(scene, camera);
}

init().catch((err) => {
  console.error('Failed to initialize:', err);
});
