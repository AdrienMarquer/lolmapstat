import * as THREE from 'three';
import { CHAMPIONS } from './data.js';
import { loadModel } from './loader.js';
import { scene } from './scene.js';

const championModels = {};
// Each entry is an array of mixers: [championMixer, companionMixer, ...]
const championMixers = {};

export async function loadChampions() {
  const promises = CHAMPIONS.map(async (champ) => {
    const gltf = await loadModel(champ.modelPath);
    const model = gltf.scene;

    model.scale.setScalar(champ.scale);
    model.position.set(champ.position.x, champ.position.y, champ.position.z);
    if (champ.rotation) {
      model.rotation.y = champ.rotation.y;
    }

    const mixers = [];

    // Play idle animation if available
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const clip = gltf.animations[0];
      mixer.clipAction(clip).play();
      mixers.push(mixer);
    }

    model.name = champ.id;
    scene.add(model);
    championModels[champ.id] = model;

    // Load companion (e.g. Daisy for Ivern)
    if (champ.companion) {
      const comp = champ.companion;
      const compGltf = await loadModel(comp.modelPath);
      const compModel = compGltf.scene;

      compModel.scale.setScalar(comp.scale);
      compModel.position.set(comp.position.x, comp.position.y, comp.position.z);
      if (comp.rotation) {
        compModel.rotation.y = comp.rotation.y;
      }

      if (compGltf.animations.length > 0) {
        const compMixer = new THREE.AnimationMixer(compModel);
        const compClip = compGltf.animations[0];
        compMixer.clipAction(compClip).play();
        mixers.push(compMixer);
      }

      compModel.name = `${champ.id}-companion`;
      scene.add(compModel);
    }

    if (mixers.length > 0) {
      championMixers[champ.id] = mixers;
    }
  });

  await Promise.all(promises);
}

/**
 * Update only the visible champion's mixers (including companions).
 * During transitions, update all mixers.
 * Returns true if any mixer was updated (caller uses this for render-on-demand).
 */
export function updateVisibleAnimation(delta, currentId, isAnimating) {
  const mixers = championMixers[currentId];
  if (!mixers) return false;

  for (const mixer of mixers) mixer.update(delta);

  // During fly-to transitions update all others too
  if (isAnimating) {
    for (const id in championMixers) {
      if (id !== currentId) {
        for (const mixer of championMixers[id]) mixer.update(delta);
      }
    }
  }

  return true;
}

export function getChampionModel(id) {
  return championModels[id];
}
