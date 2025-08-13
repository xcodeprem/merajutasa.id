import { promises as fs } from 'fs';
import crypto from 'crypto';

function canonicalForHash(raw){
  return raw.replace(/hash_of_decision_document:\s*"[a-f0-9<AUTO>]+"/i,'hash_of_decision_document: "<HASH_VALUE>"');
}

async function main(){
  const [id,title,_class,dependsCsv='',supCsv=''] = process.argv.slice(2);
  if(!id||!title||!_class){
    console.error('Args: id title class [depends_csv] [supersedes_csv]');
    process.exit(1);
  }
  const depends = dependsCsv? dependsCsv.split(',').filter(Boolean):[];
  const supersedes = supCsv? supCsv.split(',').filter(Boolean):[];
  const date = new Date().toISOString();
  const front = ['---',
    `id: ${id}`,
    `title: ${title}`,
    `date: ${date}`,
    'status: draft',
    `class: ${_class}`,
    `supersedes: ${JSON.stringify(supersedes)}`,
    `depends_on: ${JSON.stringify(depends)}`,
    'hash_of_decision_document: "<AUTO>"',
    '---','', '## Context','(isi)','', '## Decision','1. ...','', '## Rationale','...', '', '## Hash Canonicalization Note','Immutable once sealed; successor DEC required for edits.',''];
  const path = `docs/governance/dec/${id.toUpperCase()}-${title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)}.md`;
  await fs.writeFile(path, front.join('\n'));
  const raw = await fs.readFile(path,'utf8');
  const hash = crypto.createHash('sha256').update(canonicalForHash(raw),'utf8').digest('hex');
  const updated = raw.replace('hash_of_decision_document: "<AUTO>"',`hash_of_decision_document: "${hash}"`);
  await fs.writeFile(path, updated);
  console.log('Created', path, 'hash', hash);
}
main().catch(e=>{ console.error(e); process.exit(1); });
