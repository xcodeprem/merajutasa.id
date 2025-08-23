#!/usr/bin/env node
/*
Creates a new DEC YAML file from the v2 template.
Usage (PowerShell):
  node tools/dec-template-create.js -Id DEC-20250815-01 -Title "Min cell threshold baseline" -Area fairness -Out docs/governance/dec/DEC-20250815-01.yml
*/

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const val = args[i + 1];
    if (!key || !val) {break;}
    switch (key.toLowerCase()) {
    case '-id': out.id = val; break;
    case '-title': out.title = val; break;
    case '-area': out.area = val; break;
    case '-out': out.out = val; break;
    default: break;
    }
  }
  return out;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const { id, title, area, out } = parseArgs();
  if (!id || !out) {
    console.error('Missing -Id and/or -Out');
    process.exit(1);
  }
  const templatePath = path.join(__dirname, '..', 'docs', 'governance', 'dec', 'templates', 'DEC-template-v2.yml');
  // In case script is moved, also try relative to cwd
  const fallbackPath = path.join(process.cwd(), 'docs', 'governance', 'dec', 'templates', 'DEC-template-v2.yml');
  const tplPath = fs.existsSync(templatePath) ? templatePath : fallbackPath;
  if (!fs.existsSync(tplPath)) {
    console.error('Template not found at', tplPath);
    process.exit(1);
  }
  let content = fs.readFileSync(tplPath, 'utf8');
  content = content
    .replace('DEC-YYYYMMDD-XX', id)
    .replace('area: governance', `area: ${area || 'governance'}`)
    .replace('One-line decision summary.', (title || 'Decision summary'));
  ensureDir(out);
  fs.writeFileSync(out, content, 'utf8');
  console.log('DEC created at', out);
}

main();
