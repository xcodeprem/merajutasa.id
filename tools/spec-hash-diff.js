#!/usr/bin/env node
/**
 * spec-hash-diff.js
 *
 * Modes:
 *  --mode=seal-first   : Mengisi semua <PENDING_HASH>, update manifest & DEC (hash_of_decision_document), keluarkan artifact.
 *  --mode=verify       : Memastikan tidak ada <PENDING_HASH>; mendeteksi drift (hash mismatch) & laporkan violations.
 *  --mode=report-only  : Tidak menulis apa pun; hanya bandingkan & lapor.
 *
 * Violation Codes:
 *  - PLACEHOLDER_AFTER_SEAL : Placeholder masih ada saat mode verify/report-only (post-baseline).
 *  - HASH_MISMATCH_DEC_REQUIRED : Hash berubah untuk file dengan next_change_requires_dec=true.
 *  - DEC_HASH_FIELD_MISMATCH : hash_of_decision_document di dalam DEC berbeda dari manifest.
 *
 * Output artifact: artifacts/spec-hash-diff.json
 * Struktur:
 * {
 *   mode, timestamp_utc,
 *   updated: [paths],
 *   unchanged: [paths],
 *   placeholders_sealed: [paths],
 *   placeholders_remaining: [paths],
 *   violations: [{code, path, detail}],
 *   summary: { total_entries, updated_count, violation_count }
 * }
 *
 * Exit codes:
 *   0 = success (no violations)
 *   1 = violations found
 *   2 = runtime error
 */
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const MANIFEST_PATH = 'docs/integrity/spec-hash-manifest-v1.json';
const DEC_SELF_CLASS = 'decision';

function sha256File(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function readJSON(p) {
  const raw = await fs.readFile(p, 'utf8');
  return { raw, json: JSON.parse(raw) };
}

function nowUTC() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

function parseArg(name, defVal) {
  const prefix = `--${name}=`;
  const found = process.argv.find(a => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : defVal;
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function sealOrVerify() {
  const mode = parseArg('mode', 'report-only'); // seal-first | verify | report-only
  const { raw: manifestRaw, json: manifest } = await readJSON(MANIFEST_PATH);

  if (!Array.isArray(manifest.files)) {
    throw new Error('Manifest malformed: files array missing');
  }

  const updated = [];
  const unchanged = [];
  const placeholdersSealed = [];
  const placeholdersRemaining = [];
  const violations = [];

  const writeBackDECUpdates = [];
  let manifestModified = false;

  for (const entry of manifest.files) {
    const {
      path: fPath,
      hash_sha256,
      mutable_policy,
      integrity_class,
      next_change_requires_dec
    } = entry;

    if (!(await fileExists(fPath))) {
      violations.push({
        code: 'MISSING_FILE',
        path: fPath,
        detail: 'Path listed in manifest not found on disk'
      });
      continue;
    }

    const contentBuf = await fs.readFile(fPath);
    const currentHash = sha256File(contentBuf);

    // Placeholder sealing path
    const isPlaceholder = hash_sha256 === '<PENDING_HASH>';

    if (mode === 'seal-first' && isPlaceholder) {
      entry.hash_sha256 = currentHash;
      manifestModified = true;
      placeholdersSealed.push(fPath);

      // If DEC file: update hash_of_decision_document inside
      if (integrity_class === DEC_SELF_CLASS) {
        const decText = contentBuf.toString('utf8');
        const replaced = decText.replace(
          /hash_of_decision_document:\s*"<PENDING_HASH>"/,
          `hash_of_decision_document: "${currentHash}"`
        );
        if (replaced !== decText) {
          writeBackDECUpdates.push({ path: fPath, data: replaced });
        } else {
          // If field missing or already set (should not), raise violation
          if (!/hash_of_decision_document:\s*"/.test(decText)) {
            violations.push({
              code: 'DEC_HASH_FIELD_MISSING',
              path: fPath,
              detail: 'DEC missing hash_of_decision_document field placeholder'
            });
          }
        }
      }

      updated.push(fPath);
      continue;
    }

    if (isPlaceholder && mode !== 'seal-first') {
      placeholdersRemaining.push(fPath);
    }

    // Post-seal verify mismatch
    if (!isPlaceholder) {
      if (hash_sha256 === currentHash) {
        unchanged.push(fPath);
      } else {
        // Hash changed; decide violation severity
        // Basic rule: if next_change_requires_dec true => violation
        // (Future: Inspect new DEC referencing path)
        if (next_change_requires_dec) {
          violations.push({
            code: 'HASH_MISMATCH_DEC_REQUIRED',
            path: fPath,
            detail: `Manifest hash ${hash_sha256} vs current ${currentHash}`
          });
        } else {
          violations.push({
            code: 'HASH_MISMATCH',
            path: fPath,
            detail: `Manifest hash ${hash_sha256} vs current ${currentHash}`
          });
        }
      }

      // If DEC file, confirm internal field matches manifest (only in verify / report modes)
      if (integrity_class === DEC_SELF_CLASS) {
        const decText = contentBuf.toString('utf8');
        const m = decText.match(/hash_of_decision_document:\s*"([0-9a-f]{64})"/);
        if (!m) {
            violations.push({
              code: 'DEC_HASH_FIELD_MISSING',
              path: fPath,
              detail: 'DEC missing hash_of_decision_document field (expected to match manifest)'
            });
        } else {
          const internalHash = m[1];
            if (internalHash !== entry.hash_sha256) {
              violations.push({
                code: 'DEC_HASH_FIELD_MISMATCH',
                path: fPath,
                detail: `Internal DEC hash ${internalHash} != manifest ${entry.hash_sha256}`
              });
            }
        }
      }
    }
  }

  // Mode-specific final checks
  if (mode !== 'seal-first' && placeholdersRemaining.length > 0) {
    placeholdersRemaining.forEach(p => {
      violations.push({
        code: 'PLACEHOLDER_AFTER_SEAL',
        path: p,
        detail: 'Placeholder remained after baseline freeze'
      });
    });
  }

  // Write DEC updates first
  for (const dec of writeBackDECUpdates) {
    await fs.writeFile(dec.path, dec.data);
  }

  // Write manifest if modified
  if (manifestModified) {
    // Update generation timestamp
    manifest.generation_timestamp_utc = nowUTC();
    await fs.writeFile(
      MANIFEST_PATH,
      JSON.stringify(manifest, null, 2) + '\n',
      'utf8'
    );
  }

  // Ensure artifacts dir
  await fs.mkdir('artifacts', { recursive: true });
  const report = {
    mode,
    timestamp_utc: nowUTC(),
    updated,
    unchanged,
    placeholders_sealed: placeholdersSealed,
    placeholders_remaining: placeholdersRemaining,
    violations,
    summary: {
      total_entries: manifest.files.length,
      updated_count: updated.length,
      violation_count: violations.length
    }
  };
  await fs.writeFile(
    'artifacts/spec-hash-diff.json',
    JSON.stringify(report, null, 2)
  );

  // Console summary
  console.log(`[spec-hash-diff] mode=${mode}`);
  console.log(` Updated: ${updated.length}`);
  console.log(` Violations: ${violations.length}`);
  if (violations.length > 0) {
    for (const v of violations) {
      console.error(` VIOLATION ${v.code} ${v.path} :: ${v.detail}`);
    }
  }

  if (violations.length > 0) process.exit(1);
}

sealOrVerify().catch(err => {
  console.error('ERROR spec-hash-diff:', err);
  process.exit(2);
});