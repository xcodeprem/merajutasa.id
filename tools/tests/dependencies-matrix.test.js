#!/usr/bin/env node
/**
 * Test dependencies matrix generation and validation
 */

import { promises as fs } from 'fs';
import { DependencyMatrixGenerator } from '../dependencies-matrix-generator.js';

async function testDependenciesMatrix() {
  console.log('🧪 Testing dependencies matrix generation...');

  try {
    // Test generation
    const generator = new DependencyMatrixGenerator();
    await generator.generate();

    // Validate the generated file exists
    const dependenciesPath = 'docs/architecture/dependencies.json';
    const exists = await fs.access(dependenciesPath).then(() => true).catch(() => false);

    if (!exists) {
      throw new Error('dependencies.json was not generated');
    }

    // Load and validate structure
    const content = await fs.readFile(dependenciesPath, 'utf8');
    const data = JSON.parse(content);

    // Check required fields
    const requiredFields = ['version', 'generated_at', 'metadata', 'nodes', 'edges'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check metadata structure
    if (!data.metadata.total_components || typeof data.metadata.total_components !== 'number') {
      throw new Error('Invalid metadata.total_components');
    }

    // Check nodes structure
    if (!Array.isArray(data.nodes)) {
      throw new Error('nodes must be an array');
    }

    for (const node of data.nodes) {
      if (!node.id || !node.name || !node.criticality) {
        throw new Error(`Invalid node structure: ${JSON.stringify(node)}`);
      }

      // Check criticality is valid
      if (!['critical', 'high', 'medium', 'low'].includes(node.criticality)) {
        throw new Error(`Invalid criticality: ${node.criticality}`);
      }
    }

    // Check edges structure
    if (!Array.isArray(data.edges)) {
      throw new Error('edges must be an array');
    }

    const nodeIds = new Set(data.nodes.map(n => n.id));

    for (const edge of data.edges) {
      if (!edge.from || !edge.to || !edge.type) {
        throw new Error(`Invalid edge structure: ${JSON.stringify(edge)}`);
      }

      // Check for orphaned references
      if (!nodeIds.has(edge.from)) {
        throw new Error(`Orphaned edge reference: ${edge.from} not found in nodes`);
      }

      if (!nodeIds.has(edge.to)) {
        throw new Error(`Orphaned edge reference: ${edge.to} not found in nodes`);
      }

      // Check edge type is valid
      if (!['dependency', 'optional', 'peer'].includes(edge.type)) {
        throw new Error(`Invalid edge type: ${edge.type}`);
      }
    }

    // Check for circular dependencies (should be 0)
    if (data.metadata.circular_dependencies > 0) {
      console.warn(`⚠️  Found ${data.metadata.circular_dependencies} circular dependencies`);
    }

    console.log('✅ Dependencies matrix validation passed');
    console.log(`   Components: ${data.metadata.total_components}`);
    console.log(`   Dependencies: ${data.metadata.total_dependencies}`);
    console.log(`   Nodes: ${data.nodes.length}`);
    console.log(`   Edges: ${data.edges.length}`);

    return true;

  } catch (error) {
    console.error('❌ Dependencies matrix test failed:', error.message);
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = await testDependenciesMatrix();
  process.exit(success ? 0 : 1);
}

export { testDependenciesMatrix };
