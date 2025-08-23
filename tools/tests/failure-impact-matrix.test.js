#!/usr/bin/env node
/**
 * Test failure impact matrix generation and validation
 */

import { promises as fs } from 'fs';
import { FailureImpactMatrixGenerator } from '../failure-impact-matrix-generator.js';

async function testFailureImpactMatrix() {
  console.log('🧪 Testing failure impact matrix generation...');

  try {
    // Test generation
    const generator = new FailureImpactMatrixGenerator();
    await generator.generate();

    // Validate the generated files exist
    const markdownPath = 'docs/architecture/failure-impact-matrix.md';
    const jsonPath = 'docs/architecture/failure-impact-matrix.json';

    const markdownExists = await fs.access(markdownPath).then(() => true).catch(() => false);
    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);

    if (!markdownExists) {
      throw new Error('failure-impact-matrix.md was not generated');
    }

    if (!jsonExists) {
      throw new Error('failure-impact-matrix.json was not generated');
    }

    // Load and validate JSON structure
    const content = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(content);

    // Check required fields
    const requiredFields = ['version', 'generated_at', 'metadata', 'critical_paths', 'sla_affecting_dependencies', 'impact_matrix', 'blast_radius'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check metadata structure
    if (!data.metadata.total_components || typeof data.metadata.total_components !== 'number') {
      throw new Error('Invalid metadata.total_components');
    }

    // Check impact matrix structure
    if (!Array.isArray(data.impact_matrix)) {
      throw new Error('impact_matrix must be an array');
    }

    for (const component of data.impact_matrix) {
      const requiredComponentFields = ['id', 'name', 'type', 'failureImpact', 'criticality', 'totalImpacted', 'slaAffecting'];
      for (const field of requiredComponentFields) {
        if (!(field in component)) {
          throw new Error(`Missing required component field: ${field}`);
        }
      }

      // Validate impact levels
      if (!['critical', 'high', 'medium', 'low'].includes(component.failureImpact)) {
        throw new Error(`Invalid failure impact level: ${component.failureImpact}`);
      }

      if (!['critical', 'high', 'medium', 'low'].includes(component.criticality)) {
        throw new Error(`Invalid criticality level: ${component.criticality}`);
      }
    }

    // Check critical paths
    if (!Array.isArray(data.critical_paths)) {
      throw new Error('critical_paths must be an array');
    }

    // Check SLA affecting dependencies
    if (!Array.isArray(data.sla_affecting_dependencies)) {
      throw new Error('sla_affecting_dependencies must be an array');
    }

    for (const sla of data.sla_affecting_dependencies) {
      if (!sla.id || !sla.name || !sla.impact || typeof sla.blastRadius !== 'number') {
        throw new Error(`Invalid SLA affecting dependency structure: ${JSON.stringify(sla)}`);
      }
    }

    // Check blast radius
    if (typeof data.blast_radius !== 'object') {
      throw new Error('blast_radius must be an object');
    }

    for (const [componentId, radius] of Object.entries(data.blast_radius)) {
      if (!radius.directImpact || !radius.cascadingImpact || typeof radius.totalImpacted !== 'number') {
        throw new Error(`Invalid blast radius structure for ${componentId}`);
      }
    }

    // Validate markdown content
    const markdownContent = await fs.readFile(markdownPath, 'utf8');

    // Check for required sections
    const requiredSections = [
      '# Failure Impact Matrix',
      '## Critical Path Analysis',
      '## SLA-Affecting Dependencies',
      '## Component Failure Impact Matrix',
      '## Blast Radius Analysis',
      '## Recovery Prioritization',
      '## Incident Response Guidelines',
    ];

    for (const section of requiredSections) {
      if (!markdownContent.includes(section)) {
        throw new Error(`Missing required section in markdown: ${section}`);
      }
    }

    // Check for matrix table
    if (!markdownContent.includes('| Component | Type | Failure Impact | Criticality |')) {
      throw new Error('Missing failure impact matrix table in markdown');
    }

    // Check for tier-based prioritization
    if (!markdownContent.includes('### Tier 1 - Critical')) {
      throw new Error('Missing recovery tier prioritization in markdown');
    }

    console.log('✅ Failure impact matrix validation passed');
    console.log(`   Components: ${data.metadata.total_components}`);
    console.log(`   Critical Paths: ${data.metadata.critical_paths}`);
    console.log(`   SLA Affecting: ${data.metadata.sla_affecting_deps}`);
    console.log(`   Matrix Entries: ${data.impact_matrix.length}`);

    return true;

  } catch (error) {
    console.error('❌ Failure impact matrix test failed:', error.message);
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = await testFailureImpactMatrix();
  process.exit(success ? 0 : 1);
}

export { testFailureImpactMatrix };
