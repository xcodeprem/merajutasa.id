/**
 * Scans changed text for banned hype phrases.
 * Emits artifacts/hype-lint.json with hits count.
 */
import { promises as fs } from 'fs';
import { glob } from 'glob';

async function main(){
  const banned = [/\branking\b/i,/\btop\b/i,/terbaik/i,/revolusioner/i];
  const files = await glob('docs/**/*.md');
  const findings = [];
  for (const f of files){
    const text = await fs.readFile(f,'utf8');
    banned.forEach(r=>{
      let m; while((m = r.exec(text))){
        const idx = m.index;
        const line = text.slice(0,idx).split(/\n/).length;
        findings.push({ file:f, line, match:m[0], pattern:r.toString() });
      }
    });
  }
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/hype-lint.json', JSON.stringify({ total_hits: findings.length, findings },null,2));
}
main().catch(e=>{ console.error('hype-lint error',e); process.exit(2); });
