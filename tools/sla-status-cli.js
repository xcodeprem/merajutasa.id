/**
 * Print SLA status, preferring artifacts/sla-status.json if present.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readArtifact() {
  try {
    const artifactPath = path.resolve(__dirname, '..', 'artifacts', 'sla-status.json');
    const data = await fs.readFile(artifactPath, 'utf8');
    const json = JSON.parse(data);
    console.log('SLA Status (artifact):', JSON.stringify(json, null, 2));
    return true;
  } catch (err) {
    return false;
  }
}

async function readLive() {
  const { getSLAMonitor } = await import('../infrastructure/performance/monitoring/sla-monitor.js');
  const monitor = getSLAMonitor();
  const status = await monitor.getCurrentStatus();
  console.log('SLA Status (live):', JSON.stringify(status, null, 2));
}

async function main() {
  const ok = await readArtifact();
  if (!ok) {
    await readLive();
  }
}

main().catch(err => {
  console.error('sla-status-cli failed:', err);
  process.exitCode = 1;
});
