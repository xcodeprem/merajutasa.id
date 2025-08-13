#!/usr/bin/env node
/**
 * feedback-categories-ingestion.test.js
 * Ensures canonical category mapping per DEC-20250813-10.
 */
import assert from 'assert';

const CANON = ['governance','improvement','fairness','other'];
assert(new Set(CANON).size === CANON.length, 'Duplicate canonical categories');

function mapRaw(raw){
  const lc = (raw||'').toLowerCase();
  return CANON.includes(lc) ? lc : 'other';
}

// Cases
assert(mapRaw('Governance') === 'governance');
assert(mapRaw('IMPROVEMENT') === 'improvement');
assert(mapRaw('Fairness') === 'fairness');
assert(mapRaw('random-tag') === 'other');
console.log('[test] feedback-categories-ingestion OK');
