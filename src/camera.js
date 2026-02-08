import { gsap } from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { camera, renderer } from './scene.js';
import { CHAMPIONS, NAV_ORDER, getChampionById, getNavNeighbors } from './data.js';

export let controls;
let currentChampionId = NAV_ORDER[0];
let isAnimating = false;

export function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minDistance = 0.3;
  controls.maxDistance = 60;
  controls.enablePan = true;

  // Set initial camera to Ivern
  const ivern = getChampionById('ivern');
  const cp = ivern.camera.position;
  const cl = ivern.camera.lookAt;
  camera.position.set(cp.x, cp.y, cp.z);
  controls.target.set(cl.x, cl.y, cl.z);
  controls.update();
}

export function flyToChampion(id, onComplete) {
  if (isAnimating) return;
  const champ = getChampionById(id);
  if (!champ) return;

  isAnimating = true;
  controls.enabled = false;
  currentChampionId = id;

  const cp = champ.camera.position;
  const cl = champ.camera.lookAt;

  // Calculate arc height based on distance between current and target positions
  const dx = cp.x - camera.position.x;
  const dz = cp.z - camera.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  // Lift proportional to distance: short hops barely rise, long flights go high
  const arcHeight = Math.max(cp.y, camera.position.y) + dist * 0.25 + 0.5;

  // Proxy object for the arc — GSAP will tween progress 0→1
  const arc = { t: 0 };
  const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };

  const tl = gsap.timeline({
    onComplete: () => {
      controls.enabled = true;
      isAnimating = false;
      if (onComplete) onComplete();
    },
  });

  // Animate position along a vertical arc
  tl.to(arc, {
    t: 1,
    duration: 1.4,
    ease: 'power2.inOut',
    onUpdate: () => {
      const t = arc.t;
      // Lerp X/Z linearly
      camera.position.x = startPos.x + (cp.x - startPos.x) * t;
      camera.position.z = startPos.z + (cp.z - startPos.z) * t;
      // Y follows a parabolic arc: rises in the middle, lands at target height
      const yLerp = startPos.y + (cp.y - startPos.y) * t;
      const arcOffset = 4 * t * (1 - t) * (arcHeight - yLerp); // parabola peaking at t=0.5
      camera.position.y = yLerp + arcOffset;
      controls.update();
    },
  }, 0);

  // Animate lookAt target smoothly
  tl.to(controls.target, {
    x: cl.x,
    y: cl.y,
    z: cl.z,
    duration: 1.4,
    ease: 'power2.inOut',
    onUpdate: () => controls.update(),
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

export function updateControls() {
  if (controls) controls.update();
}
