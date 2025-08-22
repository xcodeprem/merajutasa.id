import fs from 'fs';
import path from 'path';

async function main() {
  const { getHighAvailabilityOrchestrator } = await import('../../infrastructure/high-availability/ha-orchestrator.js');
  const ha = getHighAvailabilityOrchestrator({ autoInitialize: true });
  const status = await ha.healthCheck();

  const artifactsDir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
  const outPath = path.join(artifactsDir, 'ha-system-health.json');
  fs.writeFileSync(outPath, JSON.stringify(status, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
