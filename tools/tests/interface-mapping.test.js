#!/usr/bin/env node

/**
 * Interface Mapping Test Suite
 *
 * Validates the interface mapping generation meets success criteria:
 * - Each component has upstream/downstream lists based on documented APIs
 * - No conflicts in endpoint names/versions
 * - Output files are generated correctly
 */

import fs from 'fs';
import path from 'path';

class InterfaceMappingTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: [],
    };

    this.interfaceMapping = null;
    this.csvContent = null;
  }

  async runTests() {
    console.log('🧪 Running Interface Mapping Tests...\n');

    try {
      await this.loadGeneratedFiles();
      await this.testFileGeneration();
      await this.testComponentMappings();
      await this.testEndpointMappings();
      await this.testConflictDetection();
      await this.testSuccessCriteria();

      console.log('\n📊 Test Results:');
      console.log(`✅ Passed: ${this.testResults.passed}`);
      console.log(`❌ Failed: ${this.testResults.failed}`);

      if (this.testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.testResults.tests.filter(t => !t.passed).forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
        process.exit(1);
      } else {
        console.log('\n✅ All tests passed!');
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async loadGeneratedFiles() {
    const basePath = path.join(process.cwd(), 'docs/architecture');

    // Load JSON file
    const jsonPath = path.join(basePath, 'interface-mapping.json');
    if (fs.existsSync(jsonPath)) {
      this.interfaceMapping = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } else {
      throw new Error('interface-mapping.json not found');
    }

    // Load CSV file
    const csvPath = path.join(basePath, 'interface-mapping.csv');
    if (fs.existsSync(csvPath)) {
      this.csvContent = fs.readFileSync(csvPath, 'utf8');
    } else {
      throw new Error('interface-mapping.csv not found');
    }
  }

  async testFileGeneration() {
    const basePath = path.join(process.cwd(), 'docs/architecture');

    this.test('JSON file exists', () => {
      return fs.existsSync(path.join(basePath, 'interface-mapping.json'));
    });

    this.test('CSV file exists', () => {
      return fs.existsSync(path.join(basePath, 'interface-mapping.csv'));
    });

    this.test('Summary file exists', () => {
      return fs.existsSync(path.join(basePath, 'interface-mapping-summary.md'));
    });

    this.test('JSON has required structure', () => {
      return this.interfaceMapping &&
             this.interfaceMapping.components &&
             this.interfaceMapping.endpoints &&
             this.interfaceMapping.statistics &&
             Array.isArray(this.interfaceMapping.components);
    });

    this.test('CSV has header row', () => {
      const lines = this.csvContent.split('\n');
      return lines.length > 0 && lines[0].includes('Component Name');
    });
  }

  async testComponentMappings() {
    this.test('Components have upstream/downstream lists', () => {
      return this.interfaceMapping.components.every(comp =>
        Array.isArray(comp.upstreamDependencies) &&
        Array.isArray(comp.downstreamClients),
      );
    });

    this.test('All core services are mapped', () => {
      const serviceNames = this.interfaceMapping.components.map(c => c.name);
      return serviceNames.includes('signer') &&
             serviceNames.includes('chain') &&
             serviceNames.includes('collector') &&
             serviceNames.includes('management');
    });

    this.test('Each component has endpoints', () => {
      return this.interfaceMapping.components.every(comp =>
        Array.isArray(comp.providedEndpoints) &&
        comp.providedEndpoints.length > 0,
      );
    });

    this.test('Service ports are correctly mapped', () => {
      const signerComponent = this.interfaceMapping.components.find(c => c.name === 'signer');
      const chainComponent = this.interfaceMapping.components.find(c => c.name === 'chain');
      const collectorComponent = this.interfaceMapping.components.find(c => c.name === 'collector');

      return signerComponent?.port === 4601 &&
             chainComponent?.port === 4602 &&
             collectorComponent?.port === 4603;
    });

    this.test('Dependencies are logically correct', () => {
      const chainComponent = this.interfaceMapping.components.find(c => c.name === 'chain');
      const collectorComponent = this.interfaceMapping.components.find(c => c.name === 'collector');

      // Chain should depend on signer
      // Collector should depend on both chain and signer
      return chainComponent?.upstreamDependencies.includes('signer') &&
             collectorComponent?.upstreamDependencies.includes('signer') &&
             collectorComponent?.upstreamDependencies.includes('chain');
    });
  }

  async testEndpointMappings() {
    this.test('All OpenAPI endpoints are mapped', () => {
      return this.interfaceMapping.endpoints.length >= 8; // Based on openapi.json
    });

    this.test('Endpoints have required fields', () => {
      return this.interfaceMapping.endpoints.every(endpoint =>
        endpoint.path &&
        endpoint.method &&
        endpoint.summary &&
        endpoint.serviceType &&
        endpoint.version,
      );
    });

    this.test('API versions are extracted correctly', () => {
      const v1Endpoints = this.interfaceMapping.endpoints.filter(e => e.version === '1');
      return v1Endpoints.length > 0;
    });

    this.test('Service types are correctly determined', () => {
      const serviceTypes = this.interfaceMapping.endpoints.map(e => e.serviceType);
      return serviceTypes.includes('signer') &&
             serviceTypes.includes('chain') &&
             serviceTypes.includes('collector') &&
             serviceTypes.includes('management');
    });
  }

  async testConflictDetection() {
    this.test('No endpoint path conflicts detected', () => {
      return this.interfaceMapping.conflicts.length === 0;
    });

    this.test('Endpoint uniqueness validation', () => {
      const endpointKeys = this.interfaceMapping.endpoints.map(e => `${e.method} ${e.path}`);
      const uniqueKeys = new Set(endpointKeys);
      return endpointKeys.length === uniqueKeys.size;
    });

    this.test('Version consistency within services', () => {
      const versionConflicts = this.interfaceMapping.conflicts.filter(c => c.type === 'version_conflict');
      return versionConflicts.length === 0;
    });
  }

  async testSuccessCriteria() {
    this.test('Success Criteria 1: Each component has upstream/downstream lists', () => {
      return this.interfaceMapping.components.every(comp =>
        comp.upstreamDependencies.length >= 0 &&  // Can be 0 for leaf services
        comp.downstreamClients.length >= 0 &&     // Can be 0 for sink services
        Array.isArray(comp.upstreamDependencies) &&
        Array.isArray(comp.downstreamClients),
      );
    });

    this.test('Success Criteria 2: No endpoint name/version conflicts', () => {
      return this.interfaceMapping.conflicts.length === 0;
    });

    this.test('Success Criteria 3: Required artifacts generated', () => {
      const basePath = path.join(process.cwd(), 'docs/architecture');
      return fs.existsSync(path.join(basePath, 'interface-mapping.json')) &&
             fs.existsSync(path.join(basePath, 'interface-mapping.csv'));
    });

    this.test('Dependencies based on documented APIs', () => {
      // Verify that the dependencies make sense based on API relationships
      const signerDownstreams = this.interfaceMapping.components.find(c => c.name === 'signer')?.downstreamClients || [];
      const chainUpstreams = this.interfaceMapping.components.find(c => c.name === 'chain')?.upstreamDependencies || [];

      // Chain service should be downstream of signer (uses signer for signing)
      // Chain service should have signer as upstream dependency
      return signerDownstreams.includes('chain') &&
             chainUpstreams.includes('signer');
    });

    this.test('Statistics are correctly calculated', () => {
      const stats = this.interfaceMapping.statistics;
      return stats.totalComponents > 0 &&
             stats.totalEndpoints > 0 &&
             typeof stats.averageUpstreamsPerComponent === 'number' &&
             typeof stats.averageDownstreamsPerComponent === 'number';
    });
  }

  test(name, testFn) {
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${name}`);
        this.testResults.passed++;
        this.testResults.tests.push({ name, passed: true });
      } else {
        console.log(`❌ ${name}`);
        this.testResults.failed++;
        this.testResults.tests.push({ name, passed: false, error: 'Assertion failed' });
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      this.testResults.failed++;
      this.testResults.tests.push({ name, passed: false, error: error.message });
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new InterfaceMappingTest();
  await test.runTests();
}

export default InterfaceMappingTest;
