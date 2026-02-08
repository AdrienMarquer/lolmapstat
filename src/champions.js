import * as THREE from 'three';
import { CHAMPIONS } from './data.js';
import { loadModel } from './loader.js';
import { scene } from './scene.js';

const championModels = {};
const championMixers = {}; // keyed by champion id

export async function loadChampions() {
  const promises = CHAMPIONS.map(async (champ) => {
    const gltf = await loadModel(champ.modelPath);
    const model = gltf.scene;

    model.scale.setScalar(champ.scale);
    model.position.set(champ.position.x, champ.position.y, champ.position.z);
    if (champ.rotation) {
      model.rotation.y = champ.rotation.y;
    }

    // Play idle animation if available
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const clip = gltf.animations[0];
      mixer.clipAction(clip).play();
      championMixers[champ.id] = mixer;
    }

    model.name = champ.id;
    scene.add(model);
    championModels[champ.id] = model;
  });

  await Promise.all(promises);
}

/**
 * Update only the visible champion's mixer. During transitions, update both
 * the previous and next champion so both animate smoothly.
 * Returns true if any mixer was updated (caller uses this for render-on-demand).
 */
export function updateVisibleAnimation(delta, currentId, isAnimating) {
  const mixer = championMixers[currentId];
  if (!mixer) return false;

  mixer.update(delta);

  // During fly-to transitions we don't know the "previous" champion here,
  // so just update all mixers — transitions are short (1.4s) and rare
  if (isAnimating) {
    for (const id in championMixers) {
      if (id !== currentId) championMixers[id].update(delta);
    }
  }

  return true;
}

export function getChampionModel(id) {
  return championModels[id];
}
