#!/usr/bin/env node
'use strict';

/**
 * Unit tests for json-stable.js utility
 * Validates stable JSON stringification and metadata addition
 */

import { stableStringify, addMetadata, sortKeys } from '../lib/json-stable.js';

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertJsonEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log('JSON Stable Utility Tests');
console.log('=========================');

// Test 1: Basic key sorting
test('sortKeys - basic object', () => {
  const input = { z: 1, a: 2, m: 3 };
  const result = sortKeys(input);
  const keys = Object.keys(result);
  assertEqual(keys[0], 'a', 'First key should be "a"');
  assertEqual(keys[1], 'm', 'Second key should be "m"');
  assertEqual(keys[2], 'z', 'Third key should be "z"');
});

// Test 2: Nested object sorting
test('sortKeys - nested objects', () => {
  const input = { 
    z: { y: 1, x: 2 },
    a: { c: 3, b: 4 }
  };
  const result = sortKeys(input);
  const topKeys = Object.keys(result);
  assertEqual(topKeys[0], 'a', 'Top level should be sorted');
  assertEqual(topKeys[1], 'z', 'Top level should be sorted');
  
  const nestedKeys = Object.keys(result.a);
  assertEqual(nestedKeys[0], 'b', 'Nested keys should be sorted');
  assertEqual(nestedKeys[1], 'c', 'Nested keys should be sorted');
});

// Test 3: Array handling
test('sortKeys - arrays preserved', () => {
  const input = { 
    items: [{ z: 1, a: 2 }, { y: 3, x: 4 }],
    name: 'test'
  };
  const result = sortKeys(input);
  assertEqual(Array.isArray(result.items), true, 'Arrays should be preserved');
  assertEqual(result.items.length, 2, 'Array length should be preserved');
  
  // Check that array elements are sorted
  const firstItem = result.items[0];
  const firstKeys = Object.keys(firstItem);
  assertEqual(firstKeys[0], 'a', 'Array element keys should be sorted');
  assertEqual(firstKeys[1], 'z', 'Array element keys should be sorted');
});

// Test 4: Stable stringification
test('stableStringify - deterministic output', () => {
  const obj1 = { z: 1, a: 2, m: 3 };
  const obj2 = { a: 2, m: 3, z: 1 }; // Same content, different order
  
  const result1 = stableStringify(obj1);
  const result2 = stableStringify(obj2);
  
  assertEqual(result1, result2, 'Objects with same content should produce identical output');
  assertEqual(result1.endsWith('\n'), true, 'Output should end with newline');
});

// Test 5: Metadata addition
test('addMetadata - basic metadata', () => {
  const artifact = { data: 'test' };
  const result = addMetadata(artifact, { generator: 'test-runner' });
  
  assertEqual(typeof result._metadata, 'object', 'Metadata should be added');
  assertEqual(result._metadata.generator, 'test-runner', 'Custom generator should be set');
  assertEqual(result._metadata.version, '1.0', 'Version should be set');
  assertEqual(typeof result._metadata.generated_at, 'string', 'Timestamp should be added');
  assertEqual(result.data, 'test', 'Original data should be preserved');
});

// Test 6: Environment variable metadata
test('addMetadata - environment variables', () => {
  // Set test environment variables
  process.env.GITHUB_SHA = 'test-sha-123';
  process.env.GITHUB_RUN_ID = 'test-run-456';
  process.env.GITHUB_ACTOR = 'test-actor';
  process.env.GITHUB_REF = 'refs/pull/123/merge';
  
  const artifact = { test: true };
  const result = addMetadata(artifact);
  
  assertEqual(result._metadata.git_sha, 'test-sha-123', 'GitHub SHA should be included');
  assertEqual(result._metadata.run_id, 'test-run-456', 'Run ID should be included');
  assertEqual(result._metadata.actor, 'test-actor', 'Actor should be included');
  assertEqual(result._metadata.git_ref, 'refs/pull/123/merge', 'Git ref should be included');
  assertEqual(result._metadata.pr_number, 123, 'PR number should be extracted');
  
  // Cleanup
  delete process.env.GITHUB_SHA;
  delete process.env.GITHUB_RUN_ID;
  delete process.env.GITHUB_ACTOR;
  delete process.env.GITHUB_REF;
});

// Test 7: Null and primitive handling
test('sortKeys - null and primitives', () => {
  assertEqual(sortKeys(null), null, 'Null should pass through');
  assertEqual(sortKeys('string'), 'string', 'Strings should pass through');
  assertEqual(sortKeys(123), 123, 'Numbers should pass through');
  assertEqual(sortKeys(true), true, 'Booleans should pass through');
});

// Test 8: Complex nested structure
test('stableStringify - complex structure', () => {
  const complex = {
    config: {
      z_setting: true,
      a_setting: false,
      nested: {
        y: [{ b: 2, a: 1 }],
        x: 'value'
      }
    },
    metadata: {
      version: '1.0',
      created: '2024-01-01'
    }
  };
  
  const result = stableStringify(complex);
  const parsed = JSON.parse(result.trim());
  
  // Verify structure is preserved and sorted
  const topKeys = Object.keys(parsed);
  assertEqual(topKeys[0], 'config', 'Top level keys should be sorted');
  assertEqual(topKeys[1], 'metadata', 'Top level keys should be sorted');
  
  const configKeys = Object.keys(parsed.config);
  assertEqual(configKeys[0], 'a_setting', 'Config keys should be sorted');
  assertEqual(configKeys[1], 'nested', 'Config keys should be sorted');
  assertEqual(configKeys[2], 'z_setting', 'Config keys should be sorted');
});

console.log('\nTest Results:');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('\nAll tests passed! ✨');
}