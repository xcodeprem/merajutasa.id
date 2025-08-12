#!/usr/bin/env node
/**
 * spec-hash-diff.js (verbose diagnostic edition)
 * See previous header for design; added extra debug logs.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';

const MANIFEST_PATH = 'docs/integrity/spec-hash-manifest-v1.json';
const DEC_SELF_CLASS = 'decision';
const VALID_MODES = new Set(['seal-first','verify','report-only']);

function sha256File(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
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
async function fileExists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function main() {
  const mode = parseArg('mode','report-only');
  if (!VALID_MODES.has(mode)) {
    console.error(`[spec-hash-diff] ERROR: Invalid mode "${mode}". Use seal-first|verify|report-only.`);
    process.exit(2);
  }
  console.log(`[spec-hash-diff] START mode=${mode}`);

  const { json: manifest } = await readJSON(MANIFEST_PATH);
  if (!Array.isArray(manifest.files)) {
    console.error('Manifest malformed: no "files" array.');
    process.exit(2);
  }

  const placeholdersInitial = manifest.files.filter(f => f.hash_sha256 === '<PENDING_HASH>').length;
  console.log(`[spec-hash-diff] Initial placeholders: ${placeholdersInitial}`);

  const updated = [];
  const unchanged = [];
  const placeholdersSealed = [];
  const placeholdersRemaining = [];
  const violations = [];
  const writeBackDECUpdates = [];
  let manifestModified = false;

  for (const entry of manifest.files) {
    const { path: fPath, hash_sha256, integrity_class, next_change_requires_dec } = entry;
    const isPlaceholder = hash_sha256 === '<PENDING_HASH>';

    if (!(await fileExists(fPath))) {
      violations.push({ code: 'MISSING_FILE', path: fPath, detail: 'Listed but not found' });
      continue;
    }

    const buf = await fs.readFile(fPath);
    const currentHash = sha256File(buf);

    if (mode === 'seal-first' && isPlaceholder) {
      entry.hash_sha256 = currentHash;
      manifestModified = true;
      placeholdersSealed.push(fPath);
      updated.push(fPath);

      if (integrity_class === DEC_SELF_CLASS) {
        const text = buf.toString('utf8');
        if (/hash_of_decision_document:\s*"<PENDING_HASH>"/.test(text)) {
          const replaced = text.replace(/hash_of_decision_document:\s*"<PENDING_HASH>"/, `hash_of_decision_document: "${currentHash}"`);
          writeBackDECUpdates.push({ path: fPath, data: replaced });
        } else {
          // If missing placeholder, attempt to detect existing hash
            if (!/hash_of_decision_document:\s*"[0-9a-f]{64}"/.test(text)) {
              violations.push({ code: 'DEC_HASH_FIELD_MISSING', path: fPath, detail: 'No placeholder & no existing hash field' });
            }
        }
      }
      continue;
    }

    if (isPlaceholder && mode !== 'seal-first') {
      placeholdersRemaining.push(fPath);
    }

    if (!isPlaceholder) {
      if (hash_sha256 === currentHash) {
        unchanged.push(fPath);
      } else {
        violations.push({
          code: next_change_requires_dec ? 'HASH_MISMATCH_DEC_REQUIRED' : 'HASH_MISMATCH',
          path: fPath,
          detail: `Manifest=${hash_sha256} current=${currentHash}`
        });
      }
      if (integrity_class === DEC_SELF_CLASS) {
        const text = buf.toString('utf8');
        const m = text.match(/hash_of_decision_document:\s*"([0-9a-f]{64})"/);
        if (!m) {
          violations.push({ code: 'DEC_HASH_FIELD_MISSING', path: fPath, detail: 'Expected hash_of_decision_document field' });
        } else if (m[1] !== entry.hash_sha256) {
          violations.push({ code: 'DEC_HASH_FIELD_MISMATCH', path: fPath, detail: `Internal=${m[1]} manifest=${entry.hash_sha256}` });
        }
      }
    }
  }

  if (mode !== 'seal-first' && placeholdersRemaining.length > 0) {
    placeholdersRemaining.forEach(p =>
      violations.push({ code: 'PLACEHOLDER_AFTER_SEAL', path: p, detail: 'Placeholder remained post-freeze' })
    );
  }

  // Write DEC changes
  for (const dec of writeBackDECUpdates) {
    await fs.writeFile(dec.path, dec.data);
  }

  if (manifestModified) {
    manifest.generation_timestamp_utc = nowUTC();
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`[spec-hash-diff] Manifest updated with ${placeholdersSealed.length} sealed placeholders.`);
  } else {
    console.log('[spec-hash-diff] Manifest not modified in this run.');
  }

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
      violation_count: violations.length,
      placeholders_remaining_count: placeholdersRemaining.length
    }
  };

  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile('artifacts/spec-hash-diff.json', JSON.stringify(report, null, 2));

  console.log(`[spec-hash-diff] Summary: updated=${updated.length} violations=${violations.length} remaining_placeholders=${placeholdersRemaining.length}`);
  if (violations.length > 0) {
    violations.forEach(v => console.error(` VIOLATION ${v.code} ${v.path} :: ${v.detail}`));
    process.exit(1);
  }
}

main().catch(e => {
  console.error('ERROR spec-hash-diff:', e);
  process.exit(2);
});