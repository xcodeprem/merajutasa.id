#!/usr/bin/env node
/**
 * policy-aggregation-threshold.test.js
 * Lightweight simulation test for aggregation min cell threshold (OPA rule mirror).
 */
import assert from 'assert';

// Threshold (must align with DEC specifying baseline min_cell_threshold)
const THRESHOLD = 20; // DEC-20250812-04 reference

function evaluate(cells){
  const violations = [];
  for (const [k,v] of Object.entries(cells)) {
    if (v.count < THRESHOLD) {violations.push({ cell:k, count:v.count });}
  }
  return violations;
}

// Test cases
const v1 = evaluate({ a:{count:5}, b:{count:25} });
assert(v1.length === 1 && v1[0].cell === 'a', 'Expected single violation for cell a');
const v2 = evaluate({ a:{count:20}, b:{count:21} });
assert(v2.length === 0, 'Expected no violations at or above threshold');
console.log('[test] policy-aggregation-threshold OK');
