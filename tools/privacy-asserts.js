#!/usr/bin/env node
/**
 * privacy-asserts.js
 * Low-risk checks for privacy salt rotation policy.
 * - Critical: previous_salts length must not exceed cap (14)
 * - Advisory: hash format validity (hex, 32 chars) and rotation freshness
 * Outputs: artifacts/privacy-asserts.json
 */
import { promises as fs } from 'fs';

const CONFIG_PATH = 'tools/config/privacy-policy.json';
const ARTIFACT_PATH = 'artifacts/privacy-asserts.json';
const RETENTION_CAP = 14; // must match rotate script and policy
const SALT_HEX_LEN = 32; // 16 bytes hex

function isHex(str, len){
  return typeof str === 'string' && /^[0-9a-f]+$/i.test(str) && (len? str.length === len : true);
}

async function readJSON(p){
  try { return JSON.parse(await fs.readFile(p,'utf8')); } catch { return null; }
}

function hoursBetweenISO(a, b){
  try {
    const t1 = new Date(a).getTime();
    const t2 = new Date(b).getTime();
    if (!isFinite(t1) || !isFinite(t2)) {return null;}
    return Math.abs(t2 - t1) / 36e5;
  } catch { return null; }
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const nowIso = new Date().toISOString();
  const cfg = await readJSON(CONFIG_PATH);
  if (!cfg){
    const out = { status: 'advisory', error: 'missing_config', message: `${CONFIG_PATH} not found or invalid JSON`, ts: nowIso };
    await fs.writeFile(ARTIFACT_PATH, JSON.stringify(out,null,2));
    console.warn('[privacy-asserts] WARN config missing; advisory only');
    process.exit(0);
  }

  const prevList = Array.isArray(cfg.previous_salts) ? cfg.previous_salts : [];
  const retentionLen = prevList.length;
  const invalidPrev = prevList.filter(s => !isHex(s, SALT_HEX_LEN));
  const hashSaltValid = isHex(cfg.hash_salt, SALT_HEX_LEN);
  const ageHours = cfg.last_rotated_utc ? hoursBetweenISO(cfg.last_rotated_utc, nowIso) : null;
  const freshnessOk = ageHours == null ? false : ageHours <= 48; // advisory threshold

  const violations = [];
  if (retentionLen > RETENTION_CAP) {violations.push({ code:'RETENTION_OVERFLOW', message:`previous_salts length ${retentionLen} exceeds cap ${RETENTION_CAP}` });}

  const out = {
    status: violations.length ? 'fail' : 'ok',
    ts: nowIso,
    config_path: CONFIG_PATH,
    checks: {
      retention: { cap: RETENTION_CAP, length: retentionLen, ok: retentionLen <= RETENTION_CAP },
      format: { hash_salt_valid: hashSaltValid, invalid_previous_count: invalidPrev.length, sample_invalid: invalidPrev.slice(0,3) },
      freshness: { last_rotated_utc: cfg.last_rotated_utc || null, age_hours: ageHours, ok: freshnessOk },
    },
    violations,
  };
  await fs.writeFile(ARTIFACT_PATH, JSON.stringify(out,null,2));

  if (violations.length){
    console.error('[privacy-asserts] FAIL', violations.map(v=>v.code).join(','));
    process.exit(2);
  }
  if (!hashSaltValid) {console.warn('[privacy-asserts] WARN hash_salt not valid hex/length (advisory)');}
  if (invalidPrev.length) {console.warn(`[privacy-asserts] WARN ${invalidPrev.length} invalid previous_salts entries (advisory)`);}
  if (freshnessOk === false) {console.warn('[privacy-asserts] WARN rotation freshness > 48h or unknown (advisory)');}
  console.log('[privacy-asserts] OK');
}

main().catch(e=>{ console.error('[privacy-asserts] error', e); process.exit(2); });
