// Normalizers for incoming JSON feeds

export function adaptKPI(data) {
  if (!data) return { equity: {}, fairness: {} };
  const equity = data.equity || {};
  const fairness = data.fairness || {};
  return { equity, fairness };
}

export function adaptWeeklyTrends(data) {
  if (!data) return { weeks: [], decision_mix: null };
  const weeks = Array.isArray(data.weeks) ? data.weeks : [];
  const decision_mix = data.decision_mix || null;
  return { weeks, decision_mix };
}

export function adaptUnderServed(data) {
  if (!data) return { total: 0, groups: [] };
  const total = Number.isFinite(data.total) ? data.total : 0;
  const groups = Array.isArray(data.groups) ? data.groups : [];
  return { total, groups };
}

export function adaptAnomalies(data) {
  return Array.isArray(data) ? data : [];
}

export function adaptRiskDigest(data) {
  const fallback = { collector: {}, chain: {}, privacy: {} };
  if (!data || typeof data !== 'object') return fallback;
  return {
    collector: data.collector || {},
    chain: data.chain || {},
    privacy: data.privacy || {},
  };
}
