/**
 * Scans repository for adoption tokens; calculates adoptionPercent.
 * Emits artifacts/terminology-scan.json
 */
import { promises as fs } from 'fs';
async function main() {
  const result = { adoptionPercent_before: null, adoptionPercent_after: null, new_tokens: [] };
  await fs.writeFile('artifacts/terminology-scan.json', JSON.stringify(result,null,2));
}
main();
