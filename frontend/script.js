/**
 * BFHL Frontend — Client-side logic
 *
 * - Parses edge input (newline or comma-separated)
 * - Sends POST to /bfhl
 * - Renders: stats, tree visualization, JSON view, validation issues
 */

// ── Config ──
// Empty string = same origin (backend serves frontend).
// For separate deployments, set to the backend URL, e.g. 'https://your-api.onrender.com'
const API_BASE = '';

// ── DOM References ──
const $input       = document.getElementById('edgeInput');
const $btnSubmit   = document.getElementById('btnSubmit');
const $btnSample   = document.getElementById('btnSample');
const $btnClear    = document.getElementById('btnClear');
const $results     = document.getElementById('results');
const $toast       = document.getElementById('errorToast');
const $rawJson     = document.getElementById('rawJson');
const $rawToggle   = document.getElementById('rawToggle');
const $toggleIcon  = $rawToggle.querySelector('.toggle-icon');
const $hierarchies = document.getElementById('hierarchiesContent');
const $validation  = document.getElementById('validationContent');
const $viewTabs    = document.getElementById('viewTabs');

// Stat elements
const $statTrees      = document.querySelector('#statTrees .stat-value');
const $statCycles     = document.querySelector('#statCycles .stat-value');
const $statLargest    = document.querySelector('#statLargest .stat-value');
const $statInvalid    = document.querySelector('#statInvalid .stat-value');
const $statDuplicates = document.querySelector('#statDuplicates .stat-value');

// State
let currentView = 'tree';   // 'tree' or 'json'
let lastResponse = null;

// ── Sample data sets ──
const SAMPLES = [
  'A->B\nA->C\nB->D\nB->E\nC->F',
  'A->B\nB->C\nC->A\nD->E\nE->F',
  'A->B\nA->B\nA->B\nhello\n1->2\nC->D\nA->A',
  'X->Y\nY->Z\nZ->W\nP->Q\nQ->R\nR->S\nS->T',
];
let sampleIdx = 0;

/* ═══════════════════════════════════════════════════════════════════════
   Event Listeners
   ═══════════════════════════════════════════════════════════════════════ */

$btnSubmit.addEventListener('click', handleSubmit);
$btnSample.addEventListener('click', loadSample);
$btnClear.addEventListener('click', clearAll);
$rawToggle.addEventListener('click', toggleRawJson);

// Tab switching
$viewTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  const view = tab.dataset.view;
  if (view === currentView) return;

  currentView = view;
  $viewTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  if (lastResponse) renderHierarchies(lastResponse.hierarchies);
});

// Submit on Ctrl+Enter
$input.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleSubmit();
  }
});

/* ═══════════════════════════════════════════════════════════════════════
   Core Logic
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Parses the textarea input into an array of edge strings.
 * Supports newline-separated and/or comma-separated input.
 */
function parseInput(raw) {
  return raw
    .split(/[\n,]+/)          // split on newlines or commas
    .map(s => s.trim())       // trim whitespace
    .filter(s => s.length > 0); // drop empty strings
}

/**
 * Handles the Analyze button click.
 */
async function handleSubmit() {
  const raw = $input.value.trim();
  if (!raw) {
    showToast('Please enter at least one edge (e.g. A->B)');
    return;
  }

  const data = parseInput(raw);
  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/bfhl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    lastResponse = await res.json();
    renderResults(lastResponse);
  } catch (err) {
    showToast(err.message || 'Failed to connect to the server');
  } finally {
    setLoading(false);
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Renderers
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Renders the full response into the UI.
 */
function renderResults(data) {
  $results.classList.remove('hidden');

  // ── Stats ──
  const s = data.summary || {};
  $statTrees.textContent      = s.total_trees ?? '—';
  $statCycles.textContent     = s.total_cycles ?? '—';
  $statLargest.textContent    = s.largest_tree_root ?? '—';
  $statInvalid.textContent    = (data.invalid_entries || []).length;
  $statDuplicates.textContent = (data.duplicate_edges || []).length;

  // ── Hierarchies ──
  renderHierarchies(data.hierarchies || []);

  // ── Validation ──
  renderValidation(data.invalid_entries || [], data.duplicate_edges || []);

  // ── Raw JSON ──
  $rawJson.querySelector('code').textContent = JSON.stringify(data, null, 2);

  // Re-trigger fade-in animations
  $results.querySelectorAll('.fade-in').forEach(el => {
    el.style.animation = 'none';
    // Force reflow
    void el.offsetHeight;
    el.style.animation = '';
  });

  // Smooth scroll to results
  $results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Renders hierarchies in the selected view mode (tree or JSON).
 */
function renderHierarchies(hierarchies) {
  if (!hierarchies.length) {
    $hierarchies.innerHTML = '<p class="empty-state">No hierarchies to display.</p>';
    return;
  }

  $hierarchies.innerHTML = hierarchies.map((h, i) => {
    const isCycle = h.has_cycle;
    const badgeClass = isCycle ? 'badge-cycle' : 'badge-tree';
    const badgeText  = isCycle ? 'CYCLE' : 'TREE';
    const depthStr   = !isCycle && h.depth != null ? `<span class="depth-tag">Depth: ${h.depth}</span>` : '';

    let content = '';
    if (currentView === 'tree') {
      content = isCycle
        ? '<p class="empty-state">Cycle detected — no tree structure available.</p>'
        : renderTreeVisual(h.tree);
    } else {
      content = `<div class="json-view">${JSON.stringify(h, null, 2)}</div>`;
    }

    return `
      <div class="hierarchy-block">
        <div class="hierarchy-label">
          <span class="${badgeClass}">${badgeText}</span>
          ${depthStr}
        </div>
        ${content}
      </div>
    `;
  }).join('');
}

/**
 * Builds an HTML tree visualization from a nested tree object.
 *
 * @param {Object} tree - e.g. { "A": { "B": {}, "C": {} } }
 * @returns {string} HTML string
 */
function renderTreeVisual(tree) {
  if (!tree || Object.keys(tree).length === 0) {
    return '<p class="empty-state">Empty tree.</p>';
  }

  function buildUL(obj, isRoot) {
    const keys = Object.keys(obj).sort();
    if (keys.length === 0) return '';

    let html = isRoot ? '<div class="tree-visual">' : '<ul>';
    for (const key of keys) {
      const nodeClass = isRoot ? 'tree-node root-node' : 'tree-node';
      html += `<li><span class="${nodeClass}">${escapeHtml(key)}</span>`;
      html += buildUL(obj[key], false);
      html += '</li>';
    }
    html += isRoot ? '</div>' : '</ul>';
    return html;
  }

  // The tree has a single top-level key (root)
  const rootKey = Object.keys(tree)[0];
  let html = '<div class="tree-visual"><ul>';
  html += `<li><span class="tree-node root-node">${escapeHtml(rootKey)}</span>`;
  html += buildUL(tree[rootKey], false);
  html += '</li></ul></div>';

  return html;
}

/**
 * Renders validation issues (invalid entries and duplicate edges).
 */
function renderValidation(invalidEntries, duplicateEdges) {
  let html = '';

  // Invalid entries
  html += '<div class="validation-group">';
  html += `<h3>Invalid Entries <span class="count">${invalidEntries.length}</span></h3>`;
  if (invalidEntries.length > 0) {
    html += '<div class="tag-list">';
    html += invalidEntries.map(e => `<span class="tag tag-invalid">${escapeHtml(e)}</span>`).join('');
    html += '</div>';
  } else {
    html += '<p class="empty-state">None — all entries are valid.</p>';
  }
  html += '</div>';

  // Duplicate edges
  html += '<div class="validation-group">';
  html += `<h3>Duplicate Edges <span class="count">${duplicateEdges.length}</span></h3>`;
  if (duplicateEdges.length > 0) {
    html += '<div class="tag-list">';
    html += duplicateEdges.map(e => `<span class="tag tag-duplicate">${escapeHtml(e)}</span>`).join('');
    html += '</div>';
  } else {
    html += '<p class="empty-state">None — all edges are unique.</p>';
  }
  html += '</div>';

  $validation.innerHTML = html;
}

/* ═══════════════════════════════════════════════════════════════════════
   UI Helpers
   ═══════════════════════════════════════════════════════════════════════ */

function setLoading(on) {
  const $label  = $btnSubmit.querySelector('.btn-label');
  const $loader = $btnSubmit.querySelector('.btn-loader');

  $btnSubmit.disabled = on;
  $label.hidden  = on;
  $loader.hidden = !on;
}

function loadSample() {
  $input.value = SAMPLES[sampleIdx % SAMPLES.length];
  sampleIdx++;
  // Subtle focus effect
  $input.focus();
}

function clearAll() {
  $input.value = '';
  $results.classList.add('hidden');
  lastResponse = null;
  $input.focus();
}

function toggleRawJson() {
  $rawJson.classList.toggle('collapsed');
  $toggleIcon.classList.toggle('open');
}

let toastTimeout = null;
function showToast(msg) {
  $toast.textContent = msg;
  $toast.classList.remove('hidden');
  // Trigger reflow for transition
  void $toast.offsetHeight;
  $toast.classList.add('visible');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    $toast.classList.remove('visible');
    setTimeout(() => $toast.classList.add('hidden'), 300);
  }, 3500);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
