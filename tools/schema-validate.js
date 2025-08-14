#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const schemaPath = path.join(root, 'docs', 'schemas', 'portal-panti.profile.schema.json');
const dataPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'docs', 'data', 'portal-panti-sample.json');

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
