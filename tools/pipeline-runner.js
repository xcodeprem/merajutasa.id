#!/usr/bin/env node
import { spawn } from 'child_process';

function startService(script, env = {}){
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { env: { ...process.env, ...env }, stdio: ['ignore','pipe','pipe'] });
    let ready = false;
    const onData = (d) => {
      const s = String(d);
      if (s.includes('listening')) {
        ready = true;
        child.stdout.off('data', onData);
        resolve(child);
      }
    };
    child.stdout.on('data', onData);
    child.on('error', reject);
    // Fallback timeout in case no output (treat as ready after 4s)
    setTimeout(() => {
      if (!ready) {
        resolve(child);
      }
    }, 4000);
  });
}

function runNode(script){
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { stdio: 'inherit' });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`)));
    child.on('error', reject);
  });
}

async function main(){
  const signer = await startService('tools/services/signer.js', { SIGNER_PORT: String(process.env.SIGNER_PORT || 4601) });
  const chain = await startService('tools/services/chain.js', { CHAIN_PORT: String(process.env.CHAIN_PORT || 4602) });
  try {
    await runNode('tools/credential-pipeline.js');
  } finally {
    try { signer.kill('SIGTERM'); } catch {}
    try { chain.kill('SIGTERM'); } catch {}
  }
}

main().catch(e => { console.error('[pipeline-runner] error', e); process.exit(1); });
