async function fetchJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

async function main(){
  const kpiEl = document.getElementById('kpi-json');
  const underEl = document.getElementById('under-json');
  const weeklyEl = document.getElementById('weekly-json');
  const decisionMixEl = document.getElementById('decision-mix');
  const fairnessBadge = document.getElementById('fairness');
  const underBadge = document.getElementById('under');
  const anomsBadge = document.getElementById('anoms');
  try {
    // Quick health check to surface service not running
    const health = await fetch('/health');
    if (!health.ok) throw new Error('equity service is not running');

    const [kpi, under, weekly] = await Promise.all([
      fetchJSON('/kpi/h1'),
      fetchJSON('/under-served'),
      fetchJSON('/kpi/weekly').catch(()=> null)
    ]);
    fairnessBadge.textContent = `fairness: ${kpi?.fairness?.pass ? 'PASS' : 'FAIL'}`;
    underBadge.textContent = `under-served: ${under?.total ?? 'n/a'}`;
    anomsBadge.textContent = `anomalies: ${kpi?.equity?.anomalies_count ?? 'n/a'}`;
    kpiEl.textContent = JSON.stringify(kpi ?? { error: 'missing kpi' }, null, 2);
    underEl.textContent = JSON.stringify(under ?? { error: 'missing under-served' }, null, 2);
    weeklyEl.textContent = JSON.stringify(weekly ?? { note: 'no weekly trends yet' }, null, 2);
    if (weekly && weekly.decision_mix){
      const dm = weekly.decision_mix;
      decisionMixEl.innerHTML = `
        <span class="badge">POS: ${dm.counts.POS} (${Math.round(dm.ratios.POS*100)}%)</span>
        <span class="badge">BND: ${dm.counts.BND} (${Math.round(dm.ratios.BND*100)}%)</span>
        <span class="badge">NEG: ${dm.counts.NEG} (${Math.round(dm.ratios.NEG*100)}%)</span>
      `;
    } else if (decisionMixEl) {
      decisionMixEl.textContent = 'decision mix: n/a';
    }
  } catch (e){
    fairnessBadge.textContent = 'fairness: n/a';
    underBadge.textContent = 'under-served: n/a';
    anomsBadge.textContent = 'anomalies: n/a';
  const msg = `Error: ${e.message}. Hint: start service and generate artifacts.`;
    kpiEl.textContent = msg;
    underEl.textContent = msg;
  const weeklyEl2 = document.getElementById('weekly-json');
  if (weeklyEl2) weeklyEl2.textContent = msg;
  const decisionMixEl2 = document.getElementById('decision-mix');
  if (decisionMixEl2) decisionMixEl2.textContent = msg;
    console.error('[equity-ui] init error', e);
  }
}

main();
