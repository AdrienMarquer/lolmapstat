// Shared render-on-demand signal — breaks circular dependency between main↔camera
let _needsRender = true; // start true so first frame renders

export function requestRender() {
  _needsRender = true;
}

export function consumeRender() {
  const v = _needsRender;
  _needsRender = false;
  return v;
}
