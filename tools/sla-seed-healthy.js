/**
 * Seed SLA monitor with healthy sample data and write an artifact.
 */
import fs from 'fs/promises';
import path from 'path';
import { getSLAMonitor } from '../infrastructure/performance/monitoring/sla-monitor.js';

async function seedService(monitor, service, options = {}) {
  const samples = options.samples || 50;
  for (let i = 0; i < samples; i++) {
    monitor.recordMetric(service, {
      responseTime: options.responseTimeMs ?? 50,
      success: true,
      statusCode: 200,
      endpoint: '/health',
    });
  }
}

async function main() {
  const monitor = getSLAMonitor({ enableAlerts: false });
  await seedService(monitor, 'signing_service', { responseTimeMs: 60 });
  await seedService(monitor, 'chain_service', { responseTimeMs: 80 });
  await seedService(monitor, 'collector_service', { responseTimeMs: 40 });
  await seedService(monitor, 'backup_service', { responseTimeMs: 100 });

  const status = await monitor.getCurrentStatus();
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile(path.join('artifacts', 'sla-status.json'), JSON.stringify(status, null, 2));
  console.log('Wrote artifacts/sla-status.json');
}

main().catch(err => {
  console.error('sla-seed-healthy failed:', err);
  process.exitCode = 1;
});
