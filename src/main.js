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
const isDev = import.meta.env.DEV;

// ── Debug (dev only) ──
let updateDebug = () => {};

if (isDev) {
  // Show debug panel (hidden by default in CSS)
  document.getElementById('debug-panel').style.display = 'block';

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.04);
  const intersectPt = new THREE.Vector3();

  const debugMouse = document.getElementById('debug-mouse');
  const debugCamPos = document.getElementById('debug-cam-pos');
  const debugCamRot = document.getElementById('debug-cam-rot');
  const debugZoom = document.getElementById('debug-zoom');
  const debugChampPos = document.getElementById('debug-champ-pos');
  const debugChampRot = document.getElementById('debug-champ-rot');

  const STEP = 0.1;
  const ROT_STEP = 5;

  document.getElementById('debug-copy').addEventListener('click', () => {
    const id = getCurrentChampionId();
    const m = getChampionModel(id);
    const p = camera.position;
    const r = camera.rotation;
    const toDeg = THREE.MathUtils.radToDeg;
    const dist = controls ? camera.position.distanceTo(controls.target).toFixed(2) : '?';
    const config = [
      `Champion: ${id}`,
      `Champ pos: X: ${m.position.x.toFixed(1)}  Z: ${m.position.z.toFixed(1)}`,
      `Champ rot: Y: ${toDeg(m.rotation.y).toFixed(1)}°`,
      `Cam pos: X: ${p.x.toFixed(1)}  Y: ${p.y.toFixed(1)}  Z: ${p.z.toFixed(1)}`,
      `Cam rot: X: ${toDeg(r.x).toFixed(1)}°  Y: ${toDeg(r.y).toFixed(1)}°  Z: ${toDeg(r.z).toFixed(1)}°`,
      `Zoom: ${dist}`,
    ].join('\n');
    navigator.clipboard.writeText(config);
    const btn = document.getElementById('debug-copy');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy config'; }, 1500);
  });

  document.getElementById('debug-controls').addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    const m = getChampionModel(getCurrentChampionId());

    if (action.startsWith('cam-')) {
      const t = controls.target;
      switch (action) {
        case 'cam-left':  camera.position.x -= STEP; t.x -= STEP; break;
        case 'cam-right': camera.position.x += STEP; t.x += STEP; break;
        case 'cam-down':  camera.position.y -= STEP; t.y -= STEP; break;
        case 'cam-up':    camera.position.y += STEP; t.y += STEP; break;
        case 'cam-back':  camera.position.z -= STEP; t.z -= STEP; break;
        case 'cam-fwd':   camera.position.z += STEP; t.z += STEP; break;
      }
      controls.update();
    }

    if (action.startsWith('champ-') && m) {
      switch (action) {
        case 'champ-left':  m.position.x -= STEP; break;
        case 'champ-right': m.position.x += STEP; break;
        case 'champ-back':  m.position.z -= STEP; break;
        case 'champ-fwd':   m.position.z += STEP; break;
        case 'champ-rotl':  m.rotation.y += THREE.MathUtils.degToRad(ROT_STEP); break;
        case 'champ-rotr':  m.rotation.y -= THREE.MathUtils.degToRad(ROT_STEP); break;
      }
    }
  });

  const keysPressed = {};
  window.addEventListener('keydown', (e) => { keysPressed[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', (e) => { keysPressed[e.key.toLowerCase()] = false; });

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  updateDebug = () => {
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.ray.intersectPlane(groundPlane, intersectPt);
    if (hit) {
      debugMouse.textContent = `X: ${intersectPt.x.toFixed(1)}  Z: ${intersectPt.z.toFixed(1)}`;
    }

    const p = camera.position;
    debugCamPos.textContent = `X: ${p.x.toFixed(1)}  Y: ${p.y.toFixed(1)}  Z: ${p.z.toFixed(1)}`;

    const r = camera.rotation;
    const toDeg = THREE.MathUtils.radToDeg;
    debugCamRot.textContent = `X: ${toDeg(r.x).toFixed(1)}°  Y: ${toDeg(r.y).toFixed(1)}°  Z: ${toDeg(r.z).toFixed(1)}°`;

    if (controls) {
      const dist = camera.position.distanceTo(controls.target);
      debugZoom.textContent = dist.toFixed(2);
    }

    const model = getChampionModel(getCurrentChampionId());
    if (model) {
      debugChampPos.textContent = `X: ${model.position.x.toFixed(1)}  Z: ${model.position.z.toFixed(1)}`;
      debugChampRot.textContent = `Y: ${THREE.MathUtils.radToDeg(model.rotation.y).toFixed(1)}°`;
    }

    // Rotate current champion with Q/E
    const champModel = getChampionModel(getCurrentChampionId());
    if (champModel) {
      const speed = 2.0;
      const delta = clock.getDelta() || 0.016;
      if (keysPressed['q']) champModel.rotation.y += speed * delta;
      if (keysPressed['e']) champModel.rotation.y -= speed * delta;
    }
  };
} else {
  // Remove debug panel in production
  const debugPanel = document.getElementById('debug-panel');
  if (debugPanel) debugPanel.remove();
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

    mat.side = THREE.DoubleSide;
    mat.depthWrite = true;
    mat.needsUpdate = true;

    // Ensure each mesh has a tight bounding box for frustum culling
    if (child.geometry) {
      child.geometry.computeBoundingBox();
      child.geometry.computeBoundingSphere();
    }
    child.frustumCulled = true;
  });

  // 5. Fetch live account data + Load champions (in parallel)
  const [_apiResult] = await Promise.all([fetchAccountData(), loadChampions()]);

  // 6. Wait for all assets (textures etc.) to finish
  await allLoadedPromise;

  // 7. Pre-compile all shaders & upload textures while loading screen is visible
  await renderer.compileAsync(scene, camera);

  // 8. Setup camera controls (after scene is populated)
  initControls();

  // 8. Setup UI interactions
  initUI();

  // 9. Hide loading, show scene
  hideLoadingScreen();

  // Debug: expose to console for calibration
  if (isDev) {
    window.__scene = scene;
    window.__camera = camera;
    window.__renderer = renderer;
    window.__THREE = THREE;
  }

  // 10. Start render loop
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updateAnimations(delta);
  updateControls();
  updateDebug();
  renderer.render(scene, camera);
}

init().catch((err) => {
  console.error('Failed to initialize:', err);
});
