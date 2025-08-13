#!/usr/bin/env node
/**
 * rounding-util.js
 * Implements rounding & equity index helpers per DEC-20250813-09 (equity index rounding precision).
 * Rounding Method: round half up to configured decimals (default 2).
 */

export function roundHalfUp(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor; // half-up
}

/**
 * computeEquityIndex
 * Given buckets { unit: count }, derives Gini then EquityIndex = 1 - Gini.
 * Returns { raw, rounded } with rounding per DEC-20250813-09.
 */
export function computeEquityIndex(buckets) {
  const counts = Object.values(buckets || {});
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return { raw: 0, rounded: 0 };
  const sorted = counts.slice().sort((a, b) => a - b);
  const n = sorted.length;
  let cumulative = 0;
  let lorenzArea = 0; // area under Lorenz curve
  for (let i = 0; i < n; i++) {
    const prev = cumulative;
    cumulative += sorted[i];
    lorenzArea += ((prev / total) + (cumulative / total)) / 2 * (1 / n);
  }
  const gini = 1 - 2 * lorenzArea;
  const equityRaw = 1 - gini;
  return { raw: equityRaw, rounded: roundHalfUp(equityRaw, 2) };
}

// CLI demo if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = { A: 10, B: 10, C: 10 };
  const r = computeEquityIndex(demo);
  console.log(JSON.stringify({ demo, result: r }, null, 2));
}
