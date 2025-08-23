import React, { useEffect, useMemo, useState } from 'react';

// Canonical fallback disclaimers (non-ranking, privacy, limitations)
const FALLBACK = {
  default: [
    'This interface presents aggregated insights and is not a ranking of people, groups, or entities.',
    'Metrics may be approximate and subject to change. See the methodology for definitions and caveats.',
    'Personal data and feedback are redacted/aggregated to protect privacy and prevent re-identification.',
    'Decisions should be made in context; visuals here are not eligibility, performance, or creditworthiness determinations.',
  ],
  dashboard: [],
  analytics: [],
  compliance: [],
};

async function fetchJson(path) {
  try {
    const r = await fetch(path, { cache: 'no-store' });
    if (!r.ok) throw new Error('fetch failed');
    return await r.json();
  } catch {
    return null;
  }
}

export function Disclaimers({ pageId = 'default', className = '' }) {
  const [master, setMaster] = useState(null);
  const [bindings, setBindings] = useState(null);

  useEffect(() => {
    // Allow overrides via global or fetch from repository content when served
    const global = typeof window !== 'undefined' ? window.__DISCLAIMERS__ : null;
    if (global?.master && global?.bindings) {
      setMaster(global.master);
      setBindings(global.bindings);
      return;
    }
    // Best-effort fetch (may 404 in dev/preview; we fallback)
    Promise.all([
      fetchJson('/content/disclaimers/master.json'),
      fetchJson('/content/disclaimers/bindings.json'),
    ]).then(([m, b]) => {
      if (m) setMaster(m);
      if (b) setBindings(b);
    });
  }, []);

  const items = useMemo(() => {
    // Use binding map if available
    if (master && bindings) {
      const ids = bindings[pageId] || bindings.default || [];
      return ids
        .map((id) => master[id])
        .filter(Boolean)
        .map((d) => (typeof d === 'string' ? d : d.text))
        .filter(Boolean);
    }
    // Fallback
    const fb = FALLBACK[pageId] || [];
    const def = FALLBACK.default || [];
    return [...def, ...fb];
  }, [master, bindings, pageId]);

  if (!items || items.length === 0) return null;

  return (
    <section
      className={`mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 text-xs text-gray-600 dark:text-gray-300 ${className}`}
      data-testid="disclaimers"
    >
      <h3 className="sr-only">Disclaimers</h3>
      <ul className="list-disc pl-5 space-y-1">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </section>
  );
}

export default Disclaimers;
