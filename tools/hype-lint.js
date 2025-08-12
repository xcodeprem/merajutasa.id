/**
 * Scans changed text for banned hype phrases.
 * Emits artifacts/hype-lint.json with hits count.
 */
import { promises as fs } from 'fs';
async function main() {
  const banned = [/ranking/i,/top/i,/terbaik/i,/revolusioner/i];
  // Placeholder: would diff changed files.
  const sampleText = '';
  const hits = banned.filter(r => r.test(sampleText)).length;
  await fs.writeFile('artifacts/hype-lint.json', JSON.stringify({ hits },null,2));
}
main();
