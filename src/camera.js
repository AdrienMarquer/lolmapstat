import * as THREE from 'three';
import { gsap } from 'gsap';
import { camera, renderer } from './scene.js';
import { NAV_ORDER, getChampionById } from './data.js';
import { requestRender } from './render.js';

let currentChampionId = NAV_ORDER[0];
let isAnimating = false;

// Track where the camera is looking (camera.lookAt() doesn't store it)
const currentLookAt = new THREE.Vector3();

// ── Dev-only OrbitControls (lazy-loaded) ──
let controls = null;
const isDev = import.meta.env.DEV;

export function initCamera() {
  const ivern = getChampionById('ivern');
  const cp = ivern.camera.position;
  const cl = ivern.camera.lookAt;

  camera.position.set(cp.x, cp.y, cp.z);
  currentLookAt.set(cl.x, cl.y, cl.z);
  camera.lookAt(currentLookAt);

  if (isDev) {
    import('three/addons/controls/OrbitControls.js').then(({ OrbitControls }) => {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.maxPolarAngle = Math.PI / 2.1;
      controls.minDistance = 0.3;
      controls.maxDistance = 60;
      controls.enablePan = true;
      controls.target.copy(currentLookAt);
      controls.update();
      controls.addEventListener('change', requestRender);
    });
  }
}

export function flyToChampion(id, onComplete) {
  if (isAnimating) return;
  const champ = getChampionById(id);
  if (!champ) return;

  isAnimating = true;
  currentChampionId = id;

  if (controls) controls.enabled = false;

  const cp = champ.camera.position;
  const cl = champ.camera.lookAt;

  const dx = cp.x - camera.position.x;
  const dz = cp.z - camera.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const arcHeight = Math.max(cp.y, camera.position.y) + dist * 0.25 + 0.5;

  const arc = { t: 0 };
  const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  const startLook = { x: currentLookAt.x, y: currentLookAt.y, z: currentLookAt.z };

  gsap.timeline({
    onUpdate: () => {
      const t = arc.t;
      // Lerp X/Z linearly
      camera.position.x = startPos.x + (cp.x - startPos.x) * t;
      camera.position.z = startPos.z + (cp.z - startPos.z) * t;
      // Y follows a parabolic arc
      const yLerp = startPos.y + (cp.y - startPos.y) * t;
      const arcOffset = 4 * t * (1 - t) * (arcHeight - yLerp);
      camera.position.y = yLerp + arcOffset;

      // Lerp lookAt
      currentLookAt.x = startLook.x + (cl.x - startLook.x) * t;
      currentLookAt.y = startLook.y + (cl.y - startLook.y) * t;
      currentLookAt.z = startLook.z + (cl.z - startLook.z) * t;
      camera.lookAt(currentLookAt);

      requestRender();
    },
    onComplete: () => {
      if (controls) {
        controls.target.copy(currentLookAt);
        controls.update();
        controls.enabled = true;
      }
      isAnimating = false;
      if (onComplete) onComplete();
    },
  }).to(arc, {
    t: 1,
    duration: 1.4,
    ease: 'power2.inOut',
  }, 0);
}

export function navigateLeft(onComplete) {
  const idx = NAV_ORDER.indexOf(currentChampionId);
  const newIdx = (idx - 1 + NAV_ORDER.length) % NAV_ORDER.length;
  flyToChampion(NAV_ORDER[newIdx], onComplete);
}

export function navigateRight(onComplete) {
  const idx = NAV_ORDER.indexOf(currentChampionId);
  const newIdx = (idx + 1) % NAV_ORDER.length;
  flyToChampion(NAV_ORDER[newIdx], onComplete);
}

export function getCurrentChampionId() {
  return currentChampionId;
}

export function getIsAnimating() {
  return isAnimating;
}

// Expose for dev debug panel
export function getControls() {
  return controls;
}
