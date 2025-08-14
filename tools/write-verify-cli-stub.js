#!/usr/bin/env node
import { promises as fs } from 'fs';

const PATH = 'docs/verify-cli.md';
const CONTENT = `# Verify CLI (Draft)

## Steps
- Install Node.js 18+
- Run npm run verify:cli
- Inspect artifacts under artifacts/ for signatures & hashes.

> Draft: expand with platform-specific instructions and signature verification walkthrough.
`;

async function main(){
  await fs.mkdir('docs', { recursive: true });
  await fs.writeFile(PATH, CONTENT, 'utf8');
  console.log('[doc:verify-cli:stub] wrote', PATH);
}

main().catch(e=>{ console.error('[doc:verify-cli:stub] error', e); process.exit(2); });
