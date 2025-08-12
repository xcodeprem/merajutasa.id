/**
 * Collects paths for evidence artifacts, ensures required files exist for Section 27.
 * Emits artifacts/evidence-bundle-status.json
 */
import { promises as fs } from 'fs';
async function main() {
  const required = [
    'disclaimers-lint-report.json',
    'event-schema-validation-report.json',
    'pii-scan-test-summary.json'
  ];
  const status = [];
  for (const r of required) {
    try { await fs.access(`artifacts/${r}`); status.push({ file: r, exists: true }); }
    catch { status.push({ file: r, exists: false }); }
  }
  await fs.writeFile('artifacts/evidence-bundle-status.json', JSON.stringify(status,null,2));
}
main();
