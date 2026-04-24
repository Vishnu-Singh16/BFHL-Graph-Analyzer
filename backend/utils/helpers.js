/**
 * Graph construction helpers:
 *   - Duplicate edge removal
 *   - Connected component detection (BFS on undirected projection)
 */

/**
 * Removes duplicate edges, keeping only the first occurrence.
 * If an edge appears N times (N > 1), one instance is added to duplicateEdges.
 *
 * @param {string[]} edges - Array of valid edge strings
 * @returns {{ uniqueEdges: string[], duplicateEdges: string[] }}
 */
function removeDuplicates(edges) {
  const seen = new Set();
  const uniqueEdges = [];
  const duplicateSet = new Set();

  for (const edge of edges) {
    if (seen.has(edge)) {
      // Already seen — mark as duplicate (Set ensures single entry)
      duplicateSet.add(edge);
    } else {
      seen.add(edge);
      uniqueEdges.push(edge);
    }
  }

  return {
    uniqueEdges,
    duplicateEdges: Array.from(duplicateSet)
  };
}

/**
 * Finds connected components via BFS on the undirected projection of the graph.
 *
 * @param {Set<string>} allNodes - Every node label in the graph
 * @param {Object<string, string[]>} undirectedAdj - Undirected adjacency list
 * @returns {Set<string>[]} Array of node-sets, one per component
 */
function findConnectedComponents(allNodes, undirectedAdj) {
  const visited = new Set();
  const components = [];

  for (const node of allNodes) {
    if (visited.has(node)) continue;

    const component = new Set();
    const queue = [node];
    visited.add(node);

    while (queue.length > 0) {
      const current = queue.shift();
      component.add(current);

      const neighbors = undirectedAdj[current] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  return components;
}

module.exports = { removeDuplicates, findConnectedComponents };
