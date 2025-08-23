#!/usr/bin/env node
/*
Creates a new DEC file. Default is Markdown (.md) using templates/DEC-template-v1.md.
To generate YAML explicitly, pass an -Out path ending with .yml; the v2 YAML template will be used.
Usage (PowerShell):
  node tools/dec-template-create.cjs -Id DEC-20250815-01 -Title "Min cell threshold baseline" -Area fairness -Out docs/governance/dec/DEC-20250815-01.md
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
  const isYaml = out.toLowerCase().endsWith('.yml') || out.toLowerCase().endsWith('.yaml');
  const tpl = isYaml ? 'DEC-template-v2.yml' : 'DEC-template-v1.md';
  const templatePath = path.join(process.cwd(), 'docs', 'governance', 'dec', 'templates', tpl);
  if (!fs.existsSync(templatePath)) {
    console.error('Template not found at', templatePath);
    process.exit(1);
  }
  let content = fs.readFileSync(templatePath, 'utf8');
  if (isYaml) {
    content = content
      .replace('DEC-YYYYMMDD-XX', id)
      .replace('area: governance', `area: ${area || 'governance'}`)
      .replace('One-line decision summary.', (title || 'Decision summary'));
  } else {
    content = content
      .replace('DEC-YYYYMMDD-XX', id)
      .replace('Decision title', (title || 'Decision title'));
  }
  ensureDir(out);
  fs.writeFileSync(out, content, 'utf8');
  console.log('DEC created at', out);
}

main();
