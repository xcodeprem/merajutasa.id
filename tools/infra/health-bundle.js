#!/usr/bin/env node
/**
 * Unified Infrastructure Health Bundle
 * Runs integrated health + infra category health, aggregates into one deterministic bundle
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { stableStringify, addMetadata } from '../lib/json-stable.js';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runIntegratedHealth() {
  const mod = await import(pathToFileURL(path.resolve(process.cwd(), 'tools/integrated-health-check.js')).href);
  const checker = new mod.IntegratedHealthChecker();
  const report = await checker.checkAll();
  await checker.saveReport(report);
  return report;
}

function spawnNode(args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit', ...opts });
    child.on('exit', (code) => resolve(code));
    child.on('error', () => resolve(1));
  });
}

async function runInfraHealth(category = null) {
  // Run as separate Node process to avoid process.exit side-effects
  const scriptPath = path.resolve(process.cwd(), 'tools/infra/health-check-all.js');
  const args = [scriptPath].concat(category ? [category] : []);
  await spawnNode(args);
  // Best-effort: read summary artifact
  const artifactsDir = path.resolve(process.cwd(), 'artifacts');
  const filePrefix = !category ? 'infra-health' : `infra-health-${category}`;
  const summaryPath = path.join(artifactsDir, `${filePrefix}-summary.json`);
  try {
    const raw = await fs.readFile(summaryPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const artifactsDir = path.resolve(process.cwd(), 'artifacts');
  await fs.mkdir(artifactsDir, { recursive: true });

  // 1) Integrated health (all components)
  const integrated = await runIntegratedHealth();

  // 2) Infra categories health (deterministic artifacts already produced)
  const categories = ['observability','performance','api-gateway','high-availability','compliance','security','monitoring','integrations','dependencies'];
  const summaries = {};
  for (const cat of categories) {
    summaries[cat] = await runInfraHealth(cat);
  }

  // 3) Compose bundle
  const bundle = addMetadata({
    integrated,
    categories: summaries,
  }, { generator: 'infra-health-bundle' });

  const outPath = path.join(artifactsDir, 'infra-health-bundle.json');
  await fs.writeFile(outPath, stableStringify(bundle));
  console.log(`✅ Wrote ${outPath}`);
  // CI-safe success exit
  if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exit(0);
  }
}

// Run if direct
const __isDirectRun = (() => {
  try {
    const argv1 = process.argv && process.argv[1] ? process.argv[1] : '';
    return import.meta.url === pathToFileURL(argv1).href;
  } catch {
    return false;
  }
})();

if (__isDirectRun) {
  main().catch(e => { console.error('Health bundle failed:', e); process.exit(1); });
}

export { main as runHealthBundle };
