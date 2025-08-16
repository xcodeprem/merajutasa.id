#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const schemaPath = path.join(root, 'docs', 'schemas', 'portal-panti.profile.schema.json');
// Sanitize CLI path input: only allow files within docs/data and block traversal
const DATA_ROOT = path.join(root, 'docs', 'data');
function sanitizeDataPath(arg) {
  if (!arg) return path.join(DATA_ROOT, 'portal-panti-sample.json');
  const decoded = arg;
  if (decoded.includes('..') || decoded.includes('\\') || decoded.startsWith('/') || /[\0]/.test(decoded)) {
    throw new Error('Unsafe path provided');
  }
  const abs = path.join(DATA_ROOT, decoded);
  const resolved = path.resolve(abs);
  if (!resolved.startsWith(DATA_ROOT + path.sep)) {
    throw new Error('Path escapes allowed directory');
  }
  return resolved;
}
const dataPath = sanitizeDataPath(process.argv[2]);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

(async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = loadJson(schemaPath);
  const validate = ajv.compile(schema);
  const data = loadJson(dataPath);
  const ok = validate(data);
  if (!ok) {
    console.error('Schema validation FAILED for', dataPath);
    console.error(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
  }
  console.log('Schema validation OK for', dataPath);
})();
