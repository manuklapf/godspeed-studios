/**
 * Walk up an object's parent chain to find a node with a given name.
 * Useful for hit-testing named groups in a GLTF scene graph.
 *
 * @param {THREE.Object3D} obj - Starting object
 * @param {string} name - Name to search for
 * @returns {THREE.Object3D | null}
 */
export function findNamed(obj, name) {
  let node = obj;
  while (node) {
    if (node.name === name) return node;
    node = node.parent;
  }
  return null;
}
