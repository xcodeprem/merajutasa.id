#!/usr/bin/env node
/**
 * Test component dependency checker field compatibility
 * Ensures the checker can read both 'dependsOn' and 'dependencies' fields
 */

import { promises as fs } from 'fs';
import { ComponentDependencyChecker } from '../component-dependency-check.js';

async function testFieldCompatibility() {
  console.log('🧪 Testing component dependency field compatibility...');
  
  // Test 1: Registry with 'dependsOn' field (new format)
  const testRegistryDependsOn = {
    "version": "1.0.0",
    "description": "Test component registry with dependsOn field",
    "components": [
      {
        "id": "service-a",
        "name": "Service A",
        "type": "service",
        "category": "test",
        "dependsOn": ["service-b"],
        "description": "Test service A"
      },
      {
        "id": "service-b",
        "name": "Service B",
        "type": "service", 
        "category": "test",
        "dependsOn": [],
        "description": "Test service B"
      }
    ]
  };
  
  // Test 2: Registry with 'dependencies' field (old format)
  const testRegistryDependencies = {
    "version": "1.0.0",
    "description": "Test component registry with dependencies field",
    "components": [
      {
        "id": "service-x",
        "name": "Service X",
        "type": "service",
        "category": "test",
        "dependencies": ["service-y"],
        "description": "Test service X"
      },
      {
        "id": "service-y",
        "name": "Service Y",
        "type": "service",
        "category": "test", 
        "dependencies": [],
        "description": "Test service Y"
      }
    ]
  };
  
  // Backup original registry
  const originalRegistry = await fs.readFile('config/component-registry.json', 'utf8');
  
  try {
    // Test dependsOn field
    console.log('  🔍 Testing dependsOn field compatibility...');
    await fs.writeFile('config/component-registry.json', JSON.stringify(testRegistryDependsOn, null, 2));
    
    const checker1 = new ComponentDependencyChecker();
    await checker1.checkComponents();
    
    const graph1 = JSON.parse(await fs.readFile('build/deps/graph.json', 'utf8'));
    if (graph1.metadata.totalDependencies !== 1) {
      throw new Error(`Expected 1 dependency with dependsOn field, got ${graph1.metadata.totalDependencies}`);
    }
    console.log('  ✅ dependsOn field works correctly');
    
    // Test dependencies field  
    console.log('  🔍 Testing dependencies field compatibility...');
    await fs.writeFile('config/component-registry.json', JSON.stringify(testRegistryDependencies, null, 2));
    
    const checker2 = new ComponentDependencyChecker();
    await checker2.checkComponents();
    
    const graph2 = JSON.parse(await fs.readFile('build/deps/graph.json', 'utf8'));
    if (graph2.metadata.totalDependencies !== 1) {
      throw new Error(`Expected 1 dependency with dependencies field, got ${graph2.metadata.totalDependencies}`);
    }
    console.log('  ✅ dependencies field works correctly');
    
  } finally {
    // Restore original registry
    await fs.writeFile('config/component-registry.json', originalRegistry);
    console.log('🔄 Restored original component registry');
  }
  
  console.log('✅ Component dependency field compatibility test passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testFieldCompatibility().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

export { testFieldCompatibility };