
// Strict pattern: exactly one uppercase letter, arrow, one uppercase letter
const EDGE_PATTERN = /^([A-Z])->([A-Z])$/;

/**
 * Validates a single edge entry string.
 *
 * @param {*} entry - The raw input (could be any type)
 * @returns {{ isValid: boolean, trimmed: string }}
 */
function validateEntry(entry) {
  // Coerce to string and trim whitespace
  const trimmed = String(entry).trim();

  // Match against the strict pattern
  const match = trimmed.match(EDGE_PATTERN);

  if (!match) {
    return { isValid: false, trimmed };
  }

  const [, source, target] = match;

  // Reject self-loops (A->A)
  if (source === target) {
    return { isValid: false, trimmed };
  }

  return { isValid: true, trimmed };
}

/**
 * Separates an array of raw entries into valid edges and invalid entries.
 *
 * @param {Array} data - Array of raw edge strings
 * @returns {{ validEdges: string[], invalidEntries: string[] }}
 */
function validateAll(data) {
  const validEdges = [];
  const invalidEntries = [];

  for (const entry of data) {
    const { isValid, trimmed } = validateEntry(entry);
    if (isValid) {
      validEdges.push(trimmed);
    } else {
      invalidEntries.push(trimmed);
    }
  }

  return { validEdges, invalidEntries };
}

module.exports = { validateEntry, validateAll };
