#!/usr/bin/env node
/**
 * evidence-bundle-prefix.test.js
 * Validates evidence bundle hash prefix length & correctness (DEC-20250813-08).
 */
import assert from 'assert';
import { execSync } from 'child_process';
import fs from 'fs';

// Generate / refresh bundle
execSync('node tools/evidence-bundle.js', { stdio:'inherit' });
const raw = fs.readFileSync('artifacts/evidence-bundle.json','utf8');
const bundle = JSON.parse(raw);
bundle.artifacts.forEach(a => {
  if (a.sha256) {
    assert(a.display_hash_prefix === a.sha256.slice(0,16), 'Incorrect prefix for '+a.path);
    assert(a.display_hash_prefix.length === 16, 'Prefix len mismatch');
  }
});
console.log('[test] evidence-bundle-prefix OK');
