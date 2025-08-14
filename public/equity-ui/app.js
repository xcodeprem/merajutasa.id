async function fetchJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

async function main(){
  const kpiEl = document.getElementById('kpi-json');
  const underEl = document.getElementById('under-json');
  const weeklyEl = document.getElementById('weekly-json');
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
  } catch (e){
    fairnessBadge.textContent = 'fairness: n/a';
    underBadge.textContent = 'under-served: n/a';
    anomsBadge.textContent = 'anomalies: n/a';
  const msg = `Error: ${e.message}. Hint: start service and generate artifacts.`;
    kpiEl.textContent = msg;
    underEl.textContent = msg;
  const weeklyEl = document.getElementById('weekly-json');
  if (weeklyEl) weeklyEl.textContent = msg;
    console.error('[equity-ui] init error', e);
  }
}

main();
