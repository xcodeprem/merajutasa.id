#!/usr/bin/env node
/**
 * pii-scan.test.js
 * Runs the PII scanner against a synthetic fixture and validates key categories.
 */
import assert from 'assert';
import { execSync } from 'child_process';
import fs from 'fs';

// Ensure artifacts dir and run scanner with SARIF for consistency
execSync('node tools/pii-scan.js --sarif', { stdio: 'inherit' });

const raw = fs.readFileSync('artifacts/pii-scan-report.json', 'utf8');
const report = JSON.parse(raw);
assert(report && report.summary, 'Report missing summary');

// Expect these categories to be detected from docs/privacy/pii-scan-fixture.md
const expected = [
  'CONTACT_EMAIL',
  'CONTACT_PHONE',
  'DOB',
  'ADDRESS_STREET',
  'PLATE_ID',
  'BANK_ACCOUNT',
  'IDN_NIK',
  'IDN_NKK',
  'CHILD_NAME_AGE',
  'GEO_FINE',
];

const counts = report.summary.categoryCounts || {};
for (const cat of expected) {
  assert((counts[cat] || 0) > 0, `Expected category ${cat} to be detected`);
}

// High risk should be non-zero due to NIK/NKK/BANK/CHILD/GEO
assert((report.summary.highRiskHits || 0) > 0, 'Expected highRiskHits > 0');

console.log('[test] pii-scan OK');
