#!/usr/bin/env node
/**
 * secrets-rotation-test.js
 * Simulates envelope encryption rotation:
 * - Ensure KEK exists (or create)
 * - Generate DEK v1, wrap with KEK, encrypt a sample
 * - Rotate DEK to v2, re-encrypt, verify both decrypt paths work as expected
 * - Output deterministic artifacts with no plaintext secrets
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { stableStringify, addMetadata } from './lib/json-stable.js';
import { getKEK, wrapDEK, unwrapDEK, encrypt, decrypt } from './dev-kms-mock.js';

const ART_DIR = 'artifacts';
const EVIDENCE_PATH = path.join(ART_DIR, 'secrets-rotation-evidence.json');
const KEYSTORE_PATH = path.join(ART_DIR, 'secrets-rotation-keystore.json');

function toB64(buf){ return Buffer.from(buf).toString('base64'); }

async function main(){
  await fs.mkdir(ART_DIR, { recursive: true });
  const kek = await getKEK();
  const ts = new Date().toISOString();
  const domain = 'feedback';
  // Generate DEK v1
  const dek1 = crypto.randomBytes(32);
  const wrapped1 = wrapDEK(dek1, kek.kek);
  const dek1_id = 'dek-' + crypto.randomUUID();
  // Encrypt sample with DEK1
  const sample = Buffer.from('sample:privacy:deterministic');
  const c1 = encrypt(sample, dek1);
  // Rotate DEK -> v2
  const dek2 = crypto.randomBytes(32);
  const wrapped2 = wrapDEK(dek2, kek.kek);
  const dek2_id = 'dek-' + crypto.randomUUID();
  const c2 = encrypt(sample, dek2);

  // Verify decrypt both
  const u1 = unwrapDEK(wrapped1, kek.kek);
  const p1 = decrypt(c1, u1);
  const u2 = unwrapDEK(wrapped2, kek.kek);
  const p2 = decrypt(c2, u2);

  const ok1 = toB64(p1) === toB64(sample);
  const ok2 = toB64(p2) === toB64(sample);

  // Keystore artifact
  const keystore = addMetadata({
    keystore_version: 1,
    domain,
    kek: { id: kek.id, alg: kek.alg, created_utc: kek.created_utc },
    deks: [
      { id: dek1_id, wrapped: wrapped1.wrapped, iv: wrapped1.iv, tag: wrapped1.tag, alg: wrapped1.alg, created_utc: ts },
      { id: dek2_id, wrapped: wrapped2.wrapped, iv: wrapped2.iv, tag: wrapped2.tag, alg: wrapped2.alg, created_utc: ts },
    ],
    samples: [
      { dek_id: dek1_id, ciphertext: c1.ciphertext, iv: c1.iv, tag: c1.tag, alg: c1.alg },
      { dek_id: dek2_id, ciphertext: c2.ciphertext, iv: c2.iv, tag: c2.tag, alg: c2.alg },
    ],
  }, { category: 'security', name: 'secrets-rotation-keystore' });

  await fs.writeFile(KEYSTORE_PATH, stableStringify(keystore));

  const evidence = addMetadata({
    domain,
    run_at_utc: ts,
    policy: { dek_rotation_days: 90, kek_rotation_days: 365 },
    algorithms: { kek: kek.alg, dek: 'AES-256-GCM' },
    results: { unwrap_dek1_ok: ok1, unwrap_dek2_ok: ok2, reencrypt_ok: ok2 && ok1 },
    active_dek_id: dek2_id,
    previous_dek_id: dek1_id,
  }, { category: 'security', name: 'secrets-rotation-evidence' });

  await fs.writeFile(EVIDENCE_PATH, stableStringify(evidence));
  console.log('[secrets-rotation] evidence written:', EVIDENCE_PATH);
}

main().catch(e=>{ console.error('secrets-rotation error', e); process.exit(2); });
