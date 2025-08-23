#!/usr/bin/env node
'use strict';

/**
 * Policy validation script
 * Validates policy.json against schema and checks for common issues
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`❌ Failed to load ${path}: ${error.message}`);
    process.exit(1);
  }
}

function validatePolicy() {
  console.log('Policy Validation');
  console.log('=================');

  // Load schema and policy
  const schemaPath = join(REPO_ROOT, 'schemas', 'policy.json');
  const policyPath = join(REPO_ROOT, 'tools', 'policy', 'policy.json');

  const schema = loadJson(schemaPath);
  const policy = loadJson(policyPath);

  // Setup AJV validator
  const ajv = new Ajv({ allErrors: true, verbose: true });
  addFormats(ajv);

  const validate = ajv.compile(schema);

  console.log(`📄 Validating: ${policyPath}`);
  console.log(`📋 Schema: ${schemaPath}`);

  // Validate against schema
  const isValid = validate(policy);

  if (!isValid) {
    console.error('\n❌ Schema validation failed:');
    validate.errors.forEach(error => {
      console.error(`  • ${error.instancePath || 'root'}: ${error.message}`);
      if (error.data !== undefined) {
        console.error(`    Value: ${JSON.stringify(error.data)}`);
      }
    });
    return false;
  }

  console.log('✅ Schema validation passed');

  // Additional validation checks
  let hasIssues = false;

  // Check for duplicate keys in checks
  const checkNames = Object.keys(policy.checks);
  const uniqueCheckNames = [...new Set(checkNames)];
  if (checkNames.length !== uniqueCheckNames.length) {
    console.error('❌ Duplicate check names found');
    hasIssues = true;
  }

  // Validate route references
  policy.routes.forEach((route, index) => {
    route.requires.forEach(checkName => {
      if (!policy.checks[checkName]) {
        console.error(`❌ Route ${index} references unknown check: ${checkName}`);
        hasIssues = true;
      }
    });
  });

  // Check version consistency
  const latestVersionEntry = policy.metadata.version_history[policy.metadata.version_history.length - 1];
  if (latestVersionEntry && latestVersionEntry.version !== policy.version) {
    console.error(`❌ Version mismatch: policy.version=${policy.version}, latest history entry=${latestVersionEntry.version}`);
    hasIssues = true;
  }

  if (!hasIssues) {
    console.log('✅ Additional validation passed');
  }

  return !hasIssues;
}

function validateAllPolicies() {
  console.log('Validating all policy files...\n');

  let allValid = true;

  // For now, just validate the main policy file
  // In the future, this could scan for multiple policy files
  allValid = validatePolicy() && allValid;

  console.log('\nSummary:');
  if (allValid) {
    console.log('✅ All policy files are valid');
    process.exit(0);
  } else {
    console.log('❌ Some policy files have validation errors');
    process.exit(1);
  }
}

// Run validation
validateAllPolicies();
