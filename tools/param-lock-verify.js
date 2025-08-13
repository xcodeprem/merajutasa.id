#!/usr/bin/env node
/**
 * param-lock-verify.js (Wave 1 - 5.2)
 * Computes SHA256 hash of governed config (hysteresis-config-v1.yml) and compares against manifest entry.
 * Emits artifacts/param-lock-status.json with status PASS/FAIL and details.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';

const CONFIG_PATH = 'docs/fairness/hysteresis-config-v1.yml';
const MANIFEST_PATH = 'docs/integrity/spec-hash-manifest-v1.json';

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  let configRaw, manifestRaw;
  try { configRaw = await fs.readFile(CONFIG_PATH); } catch { console.error('[param-lock] missing config'); process.exit(2); }
  try { manifestRaw = await fs.readFile(MANIFEST_PATH,'utf8'); } catch { console.error('[param-lock] missing manifest'); process.exit(2); }
  const manifest = JSON.parse(manifestRaw);
  const entry = manifest.files.find(f=> f.path === CONFIG_PATH.replace(/^docs\\/,'docs/'));
  const actualHash = crypto.createHash('sha256').update(configRaw).digest('hex');
  const manifestHash = entry?.hash_sha256;
  const status = (manifestHash && manifestHash === actualHash) ? 'PASS' : 'FAIL';
  const report = { version:1, generated_utc:new Date().toISOString(), status, actualHash, manifestHash, path:CONFIG_PATH };
  await fs.writeFile('artifacts/param-lock-status.json', JSON.stringify(report,null,2));
  if(status !== 'PASS') { console.error('[param-lock] hash mismatch'); process.exit(5); }
  console.log('[param-lock] PASS');
}

main().catch(e=>{ console.error('[param-lock] error', e); process.exit(2); });
