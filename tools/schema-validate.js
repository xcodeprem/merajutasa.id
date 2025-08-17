#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { validateFileArg } from './lib/security-validators.js';
import { stableStringify } from './lib/json-stable.js';

const root = process.cwd();
const schemaPath = path.join(root, 'docs', 'schemas', 'portal-panti.profile.schema.json');
const DATA_ROOT = path.join(root, 'docs', 'data');

// Use secure path validation
const dataPath = validateFileArg(DATA_ROOT, process.argv[2], 'portal-panti-sample.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

(async () => {
  try {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    const schema = loadJson(schemaPath);
    const validate = ajv.compile(schema);
    const data = loadJson(dataPath);
    const ok = validate(data);
    
    // Create validation result for artifact
    const result = {
      schema_path: schemaPath,
      data_path: dataPath,
      validation_passed: ok,
      timestamp: new Date().toISOString(),
      errors: ok ? null : validate.errors
    };
    
    // Write stable artifact
    await fs.promises.mkdir('artifacts', { recursive: true });
    await fs.promises.writeFile('artifacts/schema-validation.json', stableStringify(result));
    
    if (!ok) {
      console.error('Schema validation FAILED for', dataPath);
      console.error(stableStringify(validate.errors, 2));
      process.exit(1);
    }
    console.log('Schema validation OK for', dataPath);
  } catch (error) {
    console.error('Schema validation error:', error.message);
    process.exit(1);
  }
})();
