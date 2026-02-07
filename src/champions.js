import * as THREE from 'three';
import { CHAMPIONS } from './data.js';
import { loadModel } from './loader.js';
import { scene } from './scene.js';

const championModels = {};
const mixers = [];

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
      mixers.push(mixer);
    }

    model.name = champ.id;
    scene.add(model);
    championModels[champ.id] = model;
  });

  await Promise.all(promises);
}

export function updateAnimations(delta) {
  for (const mixer of mixers) {
    mixer.update(delta);
  }
}

export function getChampionModel(id) {
  return championModels[id];
}
