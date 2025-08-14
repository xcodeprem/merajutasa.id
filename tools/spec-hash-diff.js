#!/usr/bin/env node
/**
 * spec-hash-diff.js (verbose diagnostic edition)
 * See previous header for design; added extra debug logs.
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';

const MANIFEST_PATH = 'docs/integrity/spec-hash-manifest-v1.json';
const DEC_SELF_CLASS = 'decision';
const VALID_MODES = new Set(['seal-first','verify','report-only','accept']);
const WRITE_SARIF = process.env.SPEC_HASH_SARIF === '1';
const SUMMARY_PATH = 'artifacts/spec-hash-summary.json';
const SARIF_PATH = 'artifacts/spec-hash-diff.sarif.json';

function canonicalizeDecContent(text){
  // Remove the hash_of_decision_document value for stable external hashing
  return text.replace(/hash_of_decision_document:\s*"[0-9a-f]{64}"/,'hash_of_decision_document:"<CANON>"');
}

function computeDecHash(buf){
  const txt = buf.toString('utf8');
  return sha256File(Buffer.from(canonicalizeDecContent(txt),'utf8'));
}

function sha256File(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
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
    console.error(`[spec-hash-diff] ERROR: Invalid mode "${mode}". Use seal-first|verify|report-only|accept.`);
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
  const decRefInconsistencies = [];
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
  const currentHash = integrity_class === DEC_SELF_CLASS ? computeDecHash(buf) : sha256File(buf);

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
        } else if (!/hash_of_decision_document:\s*"[0-9a-f]{64}"/.test(text)) {
          violations.push({ code: 'DEC_HASH_FIELD_MISSING', path: fPath, detail: 'No placeholder & no existing hash field' });
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
  } else if (integrity_class === DEC_SELF_CLASS && mode === 'accept') {
        // DEC canonical reseal: update manifest to canonical current hash
        entry.hash_sha256 = currentHash;
        manifestModified = true;
        updated.push(fPath);
      } else if (mode === 'accept') {
        // Accept drift for non-DEC entries by updating manifest to current content hash
        entry.hash_sha256 = currentHash;
        manifestModified = true;
        updated.push(fPath);
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
        } else {
          const internal = m[1];
          const canonicalHash = computeDecHash(buf);
          if (entry.hash_sha256 !== canonicalHash && mode !== 'accept') {
            violations.push({ code: 'DEC_CANONICAL_HASH_MISMATCH', path: fPath, detail: `canonical=${canonicalHash} manifest=${entry.hash_sha256}` });
          }
            if (internal !== canonicalHash) {
              if (mode === 'accept') {
                const replaced = text.replace(/hash_of_decision_document:\s*"[0-9a-f]{64}"/, `hash_of_decision_document: "${canonicalHash}"`);
                writeBackDECUpdates.push({ path: fPath, data: replaced });
                updated.push(fPath);
              } else {
                violations.push({ code: 'DEC_INTERNAL_HASH_DIFFERS', path: fPath, detail: `internal=${internal} canonical=${canonicalHash}` });
              }
            }
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

  // dec_ref consistency pass (manifest self-integrity)
  for (const entry of manifest.files) {
    if (entry.dec_ref && /SELF/.test(entry.dec_ref) && entry.integrity_class !== DEC_SELF_CLASS && entry.path.includes('/dec/')) {
      decRefInconsistencies.push({ path: entry.path, issue: 'Non-decision file marked SELF dec_ref' });
    }
    if (entry.integrity_class === DEC_SELF_CLASS && entry.dec_ref !== 'SELF') {
      decRefInconsistencies.push({ path: entry.path, issue: 'Decision file dec_ref must be SELF' });
    }
  }
  decRefInconsistencies.forEach(x=>violations.push({ code: 'DEC_REF_INCONSISTENT', path: x.path, detail: x.issue }));

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

  const summaryOut = {
    updated_count: updated.length,
    violations: violations.map(v=>v.code),
    violation_count: violations.length,
    remaining_placeholders: placeholdersRemaining.length,
    dec_ref_inconsistencies: decRefInconsistencies.length
  };
  await fs.writeFile(SUMMARY_PATH, JSON.stringify(summaryOut,null,2));

  // Optional SARIF output
  if (WRITE_SARIF) {
    const sarif = {
      version: '2.1.0',
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      runs: [
        {
          tool: { driver: { name: 'spec-hash-diff', informationUri: 'https://example.local/spec-hash', rules: [] } },
          results: violations.map(v=>({
            ruleId: v.code,
            level: 'error',
            message: { text: `${v.code}: ${v.detail}` },
            locations: [ { physicalLocation: { artifactLocation: { uri: v.path } } } ]
          }))
        }
      ]
    };
    await fs.writeFile(SARIF_PATH, JSON.stringify(sarif,null,2));
  }

  console.log(`[spec-hash-diff] Summary: updated=${updated.length} violations=${violations.length} remaining_placeholders=${placeholdersRemaining.length} dec_ref_inconsistencies=${decRefInconsistencies.length}`);
  if (violations.length > 0) {
    violations.forEach(v => console.error(` VIOLATION ${v.code} ${v.path} :: ${v.detail}`));
    process.exit(1);
  }
}

main().catch(e => {
  console.error('ERROR spec-hash-diff:', e);
  process.exit(2);
});