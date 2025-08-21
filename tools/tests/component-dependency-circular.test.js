#!/usr/bin/env node
/**
 * Test component dependency checker with circular dependencies
 */

import { promises as fs } from 'fs';
import { ComponentDependencyChecker } from '../component-dependency-check.js';

async function testCircularDependencyDetection() {
  console.log('🧪 Testing circular dependency detection...');
  
  // Create a temporary registry with circular deps
  const testRegistry = {
    "version": "1.0.0",
    "description": "Test component registry with circular dependencies",
    "components": [
      {
        "id": "service-a",
        "name": "Service A",
        "type": "service",
        "category": "test",
        "healthEndpoint": "/health",
        "dependencies": ["service-b"],
        "description": "Test service A"
      },
      {
        "id": "service-b", 
        "name": "Service B",
        "type": "service",
        "category": "test",
        "healthEndpoint": "/health",
        "dependencies": ["service-c"],
        "description": "Test service B"
      },
      {
        "id": "service-c",
        "name": "Service C",
        "type": "service",
        "category": "test",
        "healthEndpoint": "/health",
        "dependencies": ["service-a"],
        "description": "Test service C - creates cycle A->B->C->A"
      }
    ]
  };
  
  // Backup original registry
  const originalRegistry = await fs.readFile('config/component-registry.json', 'utf8');
  
  try {
    // Write test registry with circular deps
    await fs.writeFile('config/component-registry.json', JSON.stringify(testRegistry, null, 2));
    
    // Run checker - should fail due to circular dependency
    const checker = new ComponentDependencyChecker();
    let failed = false;
    
    try {
      await checker.checkComponents();
    } catch (error) {
      failed = true;
      console.log('✅ Expected failure caught:', error.message);
    }
    
    if (!failed) {
      // Check if process would have exited
      const hasCircularIssues = checker.issues.some(i => i.type === 'CIRCULAR_DEPENDENCY');
      if (hasCircularIssues) {
        console.log('✅ Circular dependencies detected correctly');
      } else {
        throw new Error('Test failed: Circular dependencies not detected');
      }
    }
    
  } finally {
    // Restore original registry
    await fs.writeFile('config/component-registry.json', originalRegistry);
    console.log('🔄 Restored original component registry');
  }
  
  console.log('✅ Circular dependency detection test passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCircularDependencyDetection().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}