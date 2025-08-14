#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';

function parseFrontMatter(p) {
  const t = fs.readFileSync(p, 'utf8');
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) {
    console.log(`${p}: NO_FRONT_MATTER`);
    return;
  }
  try {
    parse(m[1]);
    console.log(`${p}: OK`);
  } catch (e) {
    console.log(`${p}: ERR ${e.message}`);
    const lines = m[1].split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const num = String(i + 1).padStart(3, ' ');
      console.log(`${num}: ${lines[i]}`);
    }
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node tools/tmp-parse-frontmatter.js <file> [<file2> ...]');
  process.exit(1);
}
files.forEach(f => parseFrontMatter(path.resolve(f)));
