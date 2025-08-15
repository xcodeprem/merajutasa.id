#!/usr/bin/env node
/**
 * rotate-pii-salt.js
 * Generates a new daily salt and updates tools/config/privacy-policy.json, keeping a short history.
 * Output: artifacts/pii-salt-rotation.json summary.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';

const CONFIG_PATH = 'tools/config/privacy-policy.json';
const HISTORY_MAX = 7; // keep last 7 salts for analysis

async function safeReadJSON(p){ try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; } }
function randSalt(){ return crypto.randomBytes(16).toString('hex'); }

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const cfg = await safeReadJSON(CONFIG_PATH) || {};
  const now = new Date().toISOString();
  const prev = cfg.hash_salt || 'salt';
  const history = Array.isArray(cfg.previous_salts) ? cfg.previous_salts : [];
  const next = randSalt();
  const nextCfg = { ...cfg, hash_salt: next, previous_salts: [prev, ...history].slice(0,HISTORY_MAX), last_rotated_utc: now };
  await fs.mkdir('tools/config',{recursive:true});
  await fs.writeFile(CONFIG_PATH, JSON.stringify(nextCfg,null,2));
  const report = { rotated_at: now, new_salt_len: next.length, history_count: nextCfg.previous_salts.length };
  await fs.writeFile('artifacts/pii-salt-rotation.json', JSON.stringify(report,null,2));
  console.log('[pii-salt-rotation] rotated at', now);
}

main().catch(e=>{ console.error('[pii-salt-rotation] error', e); process.exit(2); });
