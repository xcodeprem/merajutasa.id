import fs from 'fs';
import { execSync } from 'child_process';

function run(cmd) {
  try {
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: e.stdout?.toString() || '', err: e.stderr?.toString() || e.message };
  }
}

async function main() {
  await fs.promises.mkdir('artifacts', { recursive: true });
  const summary = { ts: new Date().toISOString(), checks: [] };

  const dockerStatus = run(process.platform === 'win32' ? 'cmd /c npm run docker:status' : 'npm run docker:status');
  await fs.promises.writeFile('artifacts/docker-status.txt', (dockerStatus.out || dockerStatus.err || '')); 
  summary.checks.push({ name: 'docker:status', ok: dockerStatus.ok });

  const k8sStatus = run('npm run k8s:status');
  await fs.promises.writeFile('artifacts/k8s-status.txt', (k8sStatus.out || k8sStatus.err || ''));
  summary.checks.push({ name: 'k8s:status', ok: k8sStatus.ok });

  const k8sLogs = run('npm run k8s:logs');
  await fs.promises.writeFile('artifacts/k8s-logs.txt', (k8sLogs.out || k8sLogs.err || ''));
  summary.checks.push({ name: 'k8s:logs', ok: k8sLogs.ok });

  await fs.promises.writeFile('artifacts/container-k8s-verify.json', JSON.stringify(summary, null, 2));
  console.log('Wrote artifacts/container-k8s-verify.json');
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
