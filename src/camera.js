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

  const tl = gsap.timeline({
    onComplete: () => {
      controls.enabled = true;
      isAnimating = false;
      if (onComplete) onComplete();
    },
    onUpdate: () => {
      controls.update();
    },
  });

  tl.to(
    camera.position,
    {
      x: cp.x,
      y: cp.y,
      z: cp.z,
      duration: 2,
      ease: 'power2.inOut',
    },
    0
  );

  tl.to(
    controls.target,
    {
      x: cl.x,
      y: cl.y,
      z: cl.z,
      duration: 2,
      ease: 'power2.inOut',
    },
    0
  );
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
