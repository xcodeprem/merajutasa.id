#!/usr/bin/env node
/**
 * generate-dec-index.js
 * Builds artifacts/dec-index.json: mapping DEC markdown files -> key metadata & content hash.
 */
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import yaml from 'yaml';

const DEC_DIR = 'docs/governance/dec';

async function listDecFiles(){
  const all = await fs.readdir(DEC_DIR);
  return all.filter(f => f.endsWith('.md')).sort();
}

function sha256(txt){ return crypto.createHash('sha256').update(txt,'utf8').digest('hex'); }

async function parseDec(file){
  const full = path.join(DEC_DIR,file);
  const txt = await fs.readFile(full,'utf8');
  const frontMatch = /^---([\s\S]*?)---/m.exec(txt);
  if (!frontMatch) {return null;}
  const frontRaw = frontMatch[1];
  // Normalize tabs → two spaces to satisfy YAML parser (some historical DEC used tabs)
  const normalized = frontRaw.replace(/\t/g,'  ');
  let front = {};
  try {
    front = yaml.parse(normalized) || {};
  } catch (e) {
    // Fallback: regex line parse for simple key: value pairs
    const simple = {};
    normalized.split(/\r?\n/).forEach(line=>{
      const m = /^(id|title|class|status|hash_of_decision_document):\s*(.+)$/.exec(line.trim());
      if (m) {simple[m[1]] = m[2].replace(/^"|"$/g,'');}
    });
    front = simple;
    front._parse_error = e.code || e.message;
  }
  return {
    file,
    id: front.id || null,
    title: front.title || null,
    class: front.class || null,
    status: front.status || null,
    hash_field: front.hash_of_decision_document || null,
    content_sha256: sha256(txt),
    canonicalization_note: front.hash_canonicalization_note || null,
    parse_error: front._parse_error || null,
  };
}

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const files = await listDecFiles();
  const parsed = (await Promise.all(files.map(parseDec))).filter(Boolean);
  const out = {
    generated_utc: new Date().toISOString(),
    count: parsed.length,
    decisions: parsed,
  };
  await fs.writeFile('artifacts/dec-index.json', JSON.stringify(out,null,2));
  console.log(`[dec-index] wrote artifacts/dec-index.json (decisions=${parsed.length})`);
}

main().catch(e=>{ console.error('dec-index generation error', e); process.exit(2); });
