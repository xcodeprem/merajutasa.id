'use strict';

/**
 * json-stable.js
 * Stable JSON stringification for deterministic artifacts
 * Ensures consistent output by sorting object keys and normalizing formatting
 */

/**
 * Recursively sort object keys for deterministic JSON output
 * @param {any} obj - Object to sort
 * @returns {any} Object with sorted keys
 */
function sortKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = sortKeys(obj[key]);
  }
  
  return sorted;
}

/**
 * Stable JSON stringification with sorted keys and consistent formatting
 * @param {any} obj - Object to stringify
 * @param {function|null|Array} replacer - Replacer function or array (default: null)
 * @param {number} space - Number of spaces for indentation (default: 2)
 * @returns {string} Stable JSON string with trailing newline
 */
export function stableStringify(obj, replacer = null, space = 2) {
  const sorted = sortKeys(obj);
  return JSON.stringify(sorted, replacer, space) + '\n';
}

/**
 * Add standard metadata to artifacts for observability
 * @param {Object} artifact - Artifact object to enhance
 * @param {Object} options - Metadata options
 * @returns {Object} Enhanced artifact with metadata
 */
export function addMetadata(artifact, options = {}) {
  const metadata = {
    generated_at: new Date().toISOString(),
    generator: options.generator || 'unknown',
    version: '1.0',
  };
  
  // Add Git/CI metadata if available
  if (process.env.GITHUB_SHA) {
    metadata.git_sha = process.env.GITHUB_SHA;
  }
  if (process.env.GITHUB_RUN_ID) {
    metadata.run_id = process.env.GITHUB_RUN_ID;
  }
  if (process.env.GITHUB_ACTOR) {
    metadata.actor = process.env.GITHUB_ACTOR;
  }
  if (process.env.GITHUB_REF) {
    metadata.git_ref = process.env.GITHUB_REF;
  }
  
  // Extract PR number from GITHUB_REF if available
  if (process.env.GITHUB_REF && process.env.GITHUB_REF.includes('/pull/')) {
    const match = process.env.GITHUB_REF.match(/\/pull\/(\d+)\//);
    if (match) {
      metadata.pr_number = parseInt(match[1], 10);
    }
  }
  
  return {
    ...artifact,
    _metadata: metadata,
  };
}

export { sortKeys };