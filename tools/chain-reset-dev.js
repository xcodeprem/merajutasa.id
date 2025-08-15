#!/usr/bin/env node
/**
 * Dev-only chain reset helper.
 * - Backs up existing artifacts/chain.json to artifacts/chain-archive-<UTC>.json
 * - Writes an empty array to artifacts/chain.json
 * Use when local chain continuity is broken during development.
 * This does NOT modify any governed specs.
 */
import { promises as fs } from 'fs';
import path from 'path';

async function exists(p){
  try { await fs.access(p); return true; } catch { return false; }
}

async function main(){
  const dir = 'artifacts';
  const chainPath = path.join(dir, 'chain.json');
  await fs.mkdir(dir, { recursive: true });

  if (await exists(chainPath)){
    try {
      const ts = new Date().toISOString().replace(/[:.]/g,'-');
      const backup = path.join(dir, `chain-archive-${ts}.json`);
      const data = await fs.readFile(chainPath, 'utf8');
      await fs.writeFile(backup, data);
      console.log(`[chain-reset-dev] Backed up current chain to ${backup}`);
    } catch (e){
      console.warn('[chain-reset-dev] Warning: failed to create backup', e?.message||e);
    }
  } else {
    console.log('[chain-reset-dev] No existing chain.json found; creating a new empty chain.');
  }

  await fs.writeFile(chainPath, '[]\n');
  console.log('[chain-reset-dev] chain.json has been reset to an empty chain ([]).');
  console.log('[chain-reset-dev] Next: run your pipeline to create a fresh genesis entry.');
}

main().catch(e=>{ console.error('[chain-reset-dev] error', e); process.exit(1); });
