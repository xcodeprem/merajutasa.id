// Verifies compliance orchestrator one-shot (--once) exits with code 0 and writes a result artifact
// Deterministic output: artifacts/week6-orchestrator-exit.json
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

function runOnce() {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn(process.execPath, [
      path.join('infrastructure', 'compliance', 'compliance-orchestrator.js'),
      '--once',
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
    }, 30000);

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr, durationMs: Date.now() - start });
    });
  });
}

function summarizeLines(s, max = 20) {
  const lines = s.split(/\r?\n/).filter(Boolean);
  if (lines.length <= max) {return lines;}
  return [...lines.slice(0, max - 3), '...', ...lines.slice(-2)];
}

(async () => {
  const res = await runOnce();
  const artifact = {
    test: 'week6-orchestrator-exit-code',
    ts: new Date().toISOString(),
    code: res.code,
    signal: res.signal || null,
    duration_ms: res.durationMs,
    status: res.code === 0 ? 'PASS' : 'FAIL',
    stdout_preview: summarizeLines(res.stdout),
    stderr_preview: summarizeLines(res.stderr),
  };
  await ensureDir('artifacts');
  await fs.writeFile('artifacts/week6-orchestrator-exit.json', JSON.stringify(artifact, null, 2), 'utf8');
  if (artifact.status !== 'PASS') {
    console.error('Orchestrator one-shot exit test FAILED:', artifact);
    process.exit(1);
  }
  console.log('Orchestrator one-shot exit test PASS:', JSON.stringify({ code: artifact.code, duration_ms: artifact.duration_ms }, null, 2));
})();
