import { promises as fs } from 'fs';
import path from 'path';

async function run() {
  console.log('🧪 Running infra health bundle smoke test');
  const { runHealthBundle } = await import('../infra/health-bundle.js');
  await runHealthBundle();
  const p = path.resolve(process.cwd(), 'artifacts/infra-health-bundle.json');
  const raw = await fs.readFile(p, 'utf8');
  const data = JSON.parse(raw);
  if (!data || !data._meta || !data.integrated) {
    throw new Error('Bundle missing required fields');
  }
  console.log('✅ infra-health-bundle.json present with metadata');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(e => { console.error(e); process.exit(1); });
}

export { run };
