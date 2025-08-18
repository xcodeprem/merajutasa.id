/**
 * Tests for infrastructure health contract
 * Validates schema compliance and helper functions
 */

import {
  HEALTH_STATUS,
  validateComponentHealth,
  validateHealthSummary,
  mapStatus,
  createComponentHealth,
  createHealthSummary
} from '../infra/health-contract.js';

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

// Test health status constants
function testHealthStatusConstants() {
  console.log('🧪 Testing health status constants...');
  
  assertEqual(HEALTH_STATUS.HEALTHY, 'HEALTHY', 'HEALTHY status constant');
  assertEqual(HEALTH_STATUS.DEGRADED, 'DEGRADED', 'DEGRADED status constant');
  assertEqual(HEALTH_STATUS.FAILED, 'FAILED', 'FAILED status constant');
  
  console.log('✅ Health status constants test passed');
}

// Test component health validation - happy path
function testValidComponentHealth() {
  console.log('🧪 Testing valid component health validation...');
  
  const validHealth = {
    component: 'test-component',
    category: 'test-category',
    status: HEALTH_STATUS.HEALTHY,
    ts: new Date().toISOString(),
    metrics: { responseTime: 100 }
  };
  
  const result = validateComponentHealth(validHealth);
  assert(result.isValid, 'Valid health should pass validation');
  assertEqual(result.errors.length, 0, 'Valid health should have no errors');
  
  console.log('✅ Valid component health test passed');
}

// Test component health validation - error cases
function testInvalidComponentHealth() {
  console.log('🧪 Testing invalid component health validation...');
  
  // Missing required fields
  const invalidHealth = {
    component: 'test-component'
    // Missing category, status, ts
  };
  
  const result = validateComponentHealth(invalidHealth);
  assert(!result.isValid, 'Invalid health should fail validation');
  assert(result.errors.length > 0, 'Invalid health should have errors');
  
  // Test null input
  const nullResult = validateComponentHealth(null);
  assert(!nullResult.isValid, 'Null input should fail validation');
  
  console.log('✅ Invalid component health test passed');
}

// Test health summary validation - happy path
function testValidHealthSummary() {
  console.log('🧪 Testing valid health summary validation...');
  
  const validSummary = {
    ok: 5,
    degraded: 2,
    failed: 1,
    total: 8,
    byCategory: {
      'test-category': { ok: 3, degraded: 1, failed: 0 }
    },
    ts: new Date().toISOString()
  };
  
  const result = validateHealthSummary(validSummary);
  assert(result.isValid, 'Valid summary should pass validation');
  assertEqual(result.errors.length, 0, 'Valid summary should have no errors');
  
  console.log('✅ Valid health summary test passed');
}

// Test status mapping
function testStatusMapping() {
  console.log('🧪 Testing status mapping...');
  
  // Test healthy mappings
  assertEqual(mapStatus('ok'), HEALTH_STATUS.HEALTHY, 'ok maps to HEALTHY');
  assertEqual(mapStatus('UP'), HEALTH_STATUS.HEALTHY, 'UP maps to HEALTHY');
  assertEqual(mapStatus('green'), HEALTH_STATUS.HEALTHY, 'green maps to HEALTHY');
  
  // Test degraded mappings
  assertEqual(mapStatus('warning'), HEALTH_STATUS.DEGRADED, 'warning maps to DEGRADED');
  assertEqual(mapStatus('YELLOW'), HEALTH_STATUS.DEGRADED, 'YELLOW maps to DEGRADED');
  
  // Test failed mappings
  assertEqual(mapStatus('error'), HEALTH_STATUS.FAILED, 'error maps to FAILED');
  assertEqual(mapStatus('DOWN'), HEALTH_STATUS.FAILED, 'DOWN maps to FAILED');
  
  // Test invalid input
  assertEqual(mapStatus('invalid'), HEALTH_STATUS.FAILED, 'invalid status maps to FAILED');
  assertEqual(mapStatus(null), HEALTH_STATUS.FAILED, 'null maps to FAILED');
  
  console.log('✅ Status mapping test passed');
}

// Test createComponentHealth helper
function testCreateComponentHealth() {
  console.log('🧪 Testing createComponentHealth helper...');
  
  const health = createComponentHealth('test-comp', 'test-cat', 'ok', {
    metrics: { test: true },
    error: { message: 'test error', code: 'TEST_CODE' }
  });
  
  assertEqual(health.component, 'test-comp', 'Component name set correctly');
  assertEqual(health.category, 'test-cat', 'Category set correctly');
  assertEqual(health.status, HEALTH_STATUS.HEALTHY, 'Status mapped correctly');
  assert(health.ts, 'Timestamp should be set');
  assert(health.metrics.test, 'Metrics should be included');
  assertEqual(health.error.message, 'test error', 'Error message set correctly');
  assertEqual(health.error.code, 'TEST_CODE', 'Error code set correctly');
  
  console.log('✅ createComponentHealth test passed');
}

// Test createHealthSummary helper
function testCreateHealthSummary() {
  console.log('🧪 Testing createHealthSummary helper...');
  
  const componentHealths = [
    createComponentHealth('comp1', 'cat1', 'HEALTHY'),
    createComponentHealth('comp2', 'cat1', 'HEALTHY'),
    createComponentHealth('comp3', 'cat2', 'DEGRADED'),
    createComponentHealth('comp4', 'cat2', 'FAILED')
  ];
  
  const summary = createHealthSummary(componentHealths);
  
  assertEqual(summary.ok, 2, 'Correct healthy count');
  assertEqual(summary.degraded, 1, 'Correct degraded count');
  assertEqual(summary.failed, 1, 'Correct failed count');
  assertEqual(summary.total, 4, 'Correct total count');
  
  assertEqual(summary.byCategory.cat1.ok, 2, 'Cat1 healthy count correct');
  assertEqual(summary.byCategory.cat2.degraded, 1, 'Cat2 degraded count correct');
  assertEqual(summary.byCategory.cat2.failed, 1, 'Cat2 failed count correct');
  
  assert(summary.ts, 'Summary timestamp should be set');
  
  console.log('✅ createHealthSummary test passed');
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting infrastructure health contract tests\n');
  
  try {
    testHealthStatusConstants();
    testValidComponentHealth();
    testInvalidComponentHealth();
    testValidHealthSummary();
    testStatusMapping();
    testCreateComponentHealth();
    testCreateHealthSummary();
    
    console.log('\n✅ All infrastructure health contract tests passed!');
    console.log('🎯 Health contract is ready for use');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };