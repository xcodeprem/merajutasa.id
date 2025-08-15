async function fetchJSON(path){
  const onPages = (typeof window !== 'undefined' && /github\.io/.test(location.host));
  let url = path;
  if (onPages){
    // Map API-like endpoints to project-relative data/*.json
    const map = {
      '/kpi/h1': 'data/h1-kpi-summary.json',
      '/kpi/weekly': 'data/weekly-trends.json',
      '/under-served': 'data/under-served.json',
      '/equity/anomalies': 'data/equity-anomalies.json',
  '/revocations': 'data/revocations.json',
  '/feedback/monthly': 'data/feedback-monthly-rollup.json'
    };
    url = map[path] || path;
  }
  const res = await fetch(url);
  if(!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

async function loadI18n(){
  try{
    const params = new URLSearchParams(location.search);
    const lang = (params.get('lang')||'id').toLowerCase();
    const base = await fetch('ui/i18n/id.json').then(r=>r.json()).catch(()=>({}));
    if (lang==='id') return base;
    const override = await fetch(`ui/i18n/${lang}.json`).then(r=>r.json()).catch(()=>({}));
    return { ...base, ...override };
  } catch { return {}; }
}

async function main(){
  const kpiEl = document.getElementById('kpi-json');
  const underEl = document.getElementById('under-json');
  const weeklyEl = document.getElementById('weekly-json');
  const decisionMixEl = document.getElementById('decision-mix');
  const decisionSparkEl = document.getElementById('decision-spark');
  const fairnessBadge = document.getElementById('fairness');
  const underBadge = document.getElementById('under');
  const anomsBadge = document.getElementById('anoms');
  const revocBadge = document.getElementById('revoc');
  const monthlyEl = document.getElementById('monthly-json');
  const monthlyCard = document.getElementById('monthly-summary');
  const updatedEl = document.getElementById('updated');
  try {
    const t = await loadI18n();
    // Best-effort health check (skip on Pages)
    const onPages = (typeof window !== 'undefined' && /github\.io/.test(location.host));
    if (!onPages) {
      const health = await fetch('/health');
      if (!health.ok) throw new Error('equity service is not running');
    }

    const [kpi, under, weekly, monthly] = await Promise.all([
      fetchJSON('/kpi/h1').catch(()=> null),
      fetchJSON('/under-served').catch(()=> null),
      fetchJSON('/kpi/weekly').catch(()=> null),
      fetchJSON('/feedback/monthly').catch(()=> null)
    ]);
  fairnessBadge.textContent = `${t['badge.fairness']||'fairness'}: ${kpi?.fairness?.pass ? 'PASS' : 'FAIL'}`;
  underBadge.textContent = `${t['badge.under']||'under-served'}: ${under?.total ?? 'n/a'}`;
  anomsBadge.textContent = `${t['badge.anoms']||'anomalies'}: ${kpi?.equity?.anomalies_count ?? 'n/a'}`;
    kpiEl.textContent = JSON.stringify(kpi ?? { error: 'missing kpi' }, null, 2);
    if (updatedEl && kpi?.generated_utc){
      const dt = new Date(kpi.generated_utc);
      updatedEl.textContent = `${t['label.updated']||'Last updated:'} ${dt.toLocaleString()}`;
    }
    underEl.textContent = JSON.stringify(under ?? { error: 'missing under-served' }, null, 2);
  weeklyEl.textContent = JSON.stringify(weekly ?? { note: 'no weekly trends yet' }, null, 2);
  if (monthlyEl) monthlyEl.textContent = JSON.stringify(monthly ?? { note: 'no monthly roll-up yet' }, null, 2);
  // Render compact monthly summary card for latest month
  if (monthly && Array.isArray(monthly.months) && monthly.months.length>0 && monthlyCard){
    const latest = monthly.months[monthly.months.length-1];
    const cats = latest.categories || {};
    const pii = latest.pii || {};
    const fmt = (o)=> Object.keys(o).sort().map(k=> `${k.toUpperCase()}: ${o[k]}`).join(' · ');
    monthlyCard.innerHTML = `
      <div><strong>${t['monthly.latest']||'Latest month'}</strong>: ${latest.month}</div>
      <div>${t['monthly.total']||'Total'}: <strong>${latest.total}</strong> · ${t['monthly.avglen']||'Avg len'}: ${latest.avg_len}</div>
      <div class="muted">${t['monthly.categories']||'Categories'}: ${fmt(cats) || '—'}</div>
      <div class="muted">${t['monthly.pii']||'PII'}: ${fmt(pii) || '—'}</div>
    `;
    monthlyCard.style.display = 'block';
  }
  if (revocBadge) revocBadge.textContent = 'revocations: 0';
    if (weekly && weekly.decision_mix){
      const dm = weekly.decision_mix;
      decisionMixEl.innerHTML = `
        <span class="badge">POS: ${dm.counts.POS} (${Math.round(dm.ratios.POS*100)}%)</span>
        <span class="badge">BND: ${dm.counts.BND} (${Math.round(dm.ratios.BND*100)}%)</span>
        <span class="badge">NEG: ${dm.counts.NEG} (${Math.round(dm.ratios.NEG*100)}%)</span>
      `;
    } else if (decisionMixEl) {
      decisionMixEl.textContent = t['decision.mix.na']||'decision mix: n/a';
    }

    // Tiny sparkline for per-week decisions if available
    if (weekly && Array.isArray(weekly.weeks)){
      const weeks = weekly.weeks.filter(w=>w.decisions && w.decisions.ratios);
      if (weeks.length > 0){
        const W = 260, H = 60, pad = 4;
        const xs = weeks.map((_,i)=> pad + i * ((W-2*pad)/Math.max(1, weeks.length-1)));
        const toY = (v)=> pad + (1 - v) * (H - 2*pad);
        const series = {
          POS: weeks.map(w=>w.decisions.ratios.POS||0),
          BND: weeks.map(w=>w.decisions.ratios.BND||0),
          NEG: weeks.map(w=>w.decisions.ratios.NEG||0)
        };
        const color = { POS:'#2b8a3e', BND:'#f59f00', NEG:'#e03131' };
        function pathFor(key){
          return xs.map((x,i)=> `${i===0? 'M':'L'}${x.toFixed(1)},${toY(series[key][i]).toFixed(1)}`).join(' ');
        }
        decisionSparkEl.innerHTML = `
          <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
            <rect x="0" y="0" width="${W}" height="${H}" fill="#fafafa" stroke="#eee" />
            <path d="${pathFor('POS')}" fill="none" stroke="${color.POS}" stroke-width="2" />
            <path d="${pathFor('BND')}" fill="none" stroke="${color.BND}" stroke-width="2" />
            <path d="${pathFor('NEG')}" fill="none" stroke="${color.NEG}" stroke-width="2" />
          </svg>`;
      } else {
        decisionSparkEl.textContent = t['spark.na']||'sparkline: n/a';
      }
    }
  } catch (e){
    fairnessBadge.textContent = 'fairness: n/a';
    underBadge.textContent = 'under-served: n/a';
    anomsBadge.textContent = 'anomalies: n/a';
  if (revocBadge) revocBadge.textContent = 'revocations: 0';
  const msg = `Error: ${e.message}. Hint: start service and generate artifacts.`;
    kpiEl.textContent = msg;
    underEl.textContent = msg;
  const weeklyEl2 = document.getElementById('weekly-json');
  if (weeklyEl2) weeklyEl2.textContent = msg;
  const monthlyEl2 = document.getElementById('monthly-json');
  if (monthlyEl2) monthlyEl2.textContent = msg;
  if (updatedEl) updatedEl.textContent = 'Last updated: n/a';
  const decisionMixEl2 = document.getElementById('decision-mix');
  if (decisionMixEl2) decisionMixEl2.textContent = msg;
  const decisionSparkEl2 = document.getElementById('decision-spark');
  if (decisionSparkEl2) decisionSparkEl2.textContent = msg;
    console.error('[equity-ui] init error', e);
  }
}

main();
