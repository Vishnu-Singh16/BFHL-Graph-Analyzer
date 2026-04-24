

const { validateAll } = require('../utils/validator');
const { removeDuplicates, findConnectedComponents } = require('../utils/helpers');

/* ──────────────────────────── Graph Construction ──────────────────────────── */

/**
 * Builds a directed graph from unique edges, enforcing single-parent rule.
 * If a node already has a parent, subsequent parent edges are silently dropped.
 *
 * Also builds an undirected adjacency list (from retained edges only)
 * for connected component detection.
 *
 * @param {string[]} uniqueEdges - Deduplicated valid edge strings
 * @returns {{ parentMap: Object, childrenMap: Object, allNodes: Set<string>, undirectedAdj: Object }}
 */
function buildGraph(uniqueEdges) {
  const parentMap = {};
  const childrenMap = {};
  const allNodes = new Set();
  const undirectedAdj = {};

  for (const edge of uniqueEdges) {
    const [parent, child] = edge.split('->');
    allNodes.add(parent);
    allNodes.add(child);


    if (!(child in parentMap)) {
      parentMap[child] = parent;

      if (!childrenMap[parent]) childrenMap[parent] = [];
      childrenMap[parent].push(child);


      if (!undirectedAdj[parent]) undirectedAdj[parent] = [];
      if (!undirectedAdj[child]) undirectedAdj[child] = [];
      undirectedAdj[parent].push(child);
      undirectedAdj[child].push(parent);
    }

  }

  return { parentMap, childrenMap, allNodes, undirectedAdj };
}

/* ──────────────────────────── Tree Construction ──────────────────────────── */

/**
 * Recursively builds a nested tree object from a root node.
 * Children are sorted alphabetically for deterministic output.
 *
 * @param {string} root - Node label to start from
 * @param {Object} childrenMap - parent → [children]
 * @returns {Object} e.g. { "A": { "B": { "D": {} }, "C": {} } }
 */
function buildTreeFromRoot(root, childrenMap) {
  const children = childrenMap[root] || [];
  const sortedChildren = [...children].sort();

  const subtree = {};
  for (const child of sortedChildren) {
    // Recursively build each child's subtree
    const childResult = buildTreeFromRoot(child, childrenMap);
    subtree[child] = childResult[child];
  }

  return { [root]: subtree };
}

/* ──────────────────────────── Depth Calculation ──────────────────────────── */

/**
 * Calculates tree depth (number of nodes in the longest root-to-leaf path).
 *
 * @param {Object} tree - Top-level tree object { "root": { ... } }
 * @returns {number}
 */
function calculateDepth(tree) {
  if (!tree || Object.keys(tree).length === 0) return 0;

  let maxDepth = 0;
  for (const key of Object.keys(tree)) {
    const childDepth = depthHelper(tree[key]);
    maxDepth = Math.max(maxDepth, 1 + childDepth);
  }
  return maxDepth;
}

/**
 * Recursive helper for depth calculation.
 * @param {Object} subtree
 * @returns {number}
 */
function depthHelper(subtree) {
  if (!subtree || Object.keys(subtree).length === 0) return 0;

  let maxDepth = 0;
  for (const key of Object.keys(subtree)) {
    const childDepth = depthHelper(subtree[key]);
    maxDepth = Math.max(maxDepth, 1 + childDepth);
  }
  return maxDepth;
}

/* ──────────────────────────── Main Orchestrator ──────────────────────────── */

/**
 * Processes an array of raw edge strings through the full pipeline.
 *
 * @param {string[]} data - Raw input array, e.g. ["A->B", "hello", "B->C"]
 * @returns {{ hierarchies, invalid_entries, duplicate_edges, summary }}
 */
function processData(data) {
  // ── Step 1: Validate every entry ──
  const { validEdges, invalidEntries } = validateAll(data);

  // ── Step 2: Remove duplicate edges ──
  const { uniqueEdges, duplicateEdges } = removeDuplicates(validEdges);

  // ── Step 3: Build directed graph (single-parent enforced) ──
  const { parentMap, childrenMap, allNodes, undirectedAdj } = buildGraph(uniqueEdges);

  // ── Step 4: Identify connected components ──
  const components = findConnectedComponents(allNodes, undirectedAdj);

  // ── Step 5: Process each component into a hierarchy ──
  const hierarchies = [];

  for (const component of components) {
    const nodes = [...component];

    // Find roots: nodes that never appear as a child (no entry in parentMap)
    const roots = nodes.filter(n => !(n in parentMap)).sort();

    if (roots.length > 0) {
      // ── Tree component ──
      // With single-parent enforcement, exactly one root per component
      const root = roots[0];
      const tree = buildTreeFromRoot(root, childrenMap);
      const depth = calculateDepth(tree);

      hierarchies.push({ tree, has_cycle: false, depth });
    } else {
      // ── Cycle component ──
      // Every node has a parent → guaranteed cycle
      // Spec says: use lex-smallest node as root (for identification),
      // but output the cycle format regardless.
      hierarchies.push({ tree: {}, has_cycle: true });
    }
  }

  // ── Step 6: Build summary ──
  const nonCyclicTrees = hierarchies.filter(h => !h.has_cycle);
  const cycleCount = hierarchies.filter(h => h.has_cycle).length;

  let largestTreeRoot = null;
  let maxDepth = 0;

  for (const h of nonCyclicTrees) {
    const root = Object.keys(h.tree)[0];
    const depth = h.depth;

    if (depth > maxDepth) {
      maxDepth = depth;
      largestTreeRoot = root;
    } else if (depth === maxDepth && root < largestTreeRoot) {
      // Tie-break: lexicographically smaller root wins
      largestTreeRoot = root;
    }
  }

  const summary = {
    total_trees: nonCyclicTrees.length,
    total_cycles: cycleCount,
    largest_tree_root: largestTreeRoot
  };

  // ── Step 7: Format hierarchies for response ──
  // Remove internal 'depth' property from cycles (spec: "Do NOT include depth for cycles")
  const formattedHierarchies = hierarchies.map(h => {
    if (h.has_cycle) {
      return { tree: h.tree, has_cycle: true };
    }
    return { tree: h.tree, has_cycle: false, depth: h.depth };
  });

  return {
    hierarchies: formattedHierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary
  };
}

module.exports = {
  processData,
  // Exported for unit testing
  buildGraph,
  buildTreeFromRoot,
  calculateDepth
};
