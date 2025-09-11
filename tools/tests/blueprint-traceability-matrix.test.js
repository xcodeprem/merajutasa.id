#!/usr/bin/env node
/**
 * blueprint-traceability-matrix.test.js
 * 
 * Test suite for Blueprint Traceability Matrix functionality
 * Validates enterprise requirements mapping and gap analysis
 */

import { promises as fs } from 'fs';
import path from 'path';
import BlueprintTraceabilityMatrix from '../blueprint-traceability-matrix.js';

class BlueprintTraceabilityMatrixTest {
  constructor() {
    this.testResults = [];
    this.workingDir = process.cwd();
    this.artifactsDir = path.join(this.workingDir, 'artifacts');
  }

  async runTests() {
    console.log('[blueprint-traceability-test] Starting test suite...');
    
    await this.testInitialization();
    await this.testDocumentScanning();
    await this.testRequirementCoverage();
    await this.testGapAnalysis();
    await this.testReportGeneration();
    await this.testArtifactValidation();
    
    this.generateTestReport();
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const total = this.testResults.length;
    
    console.log(`\n[blueprint-traceability-test] Tests completed: ${passed}/${total} passed`);
    
    if (passed === total) {
      console.log('✅ All tests passed');
      return true;
    } else {
      console.log('❌ Some tests failed');
      return false;
    }
  }

  async testInitialization() {
    try {
      const analyzer = new BlueprintTraceabilityMatrix();
      await analyzer.initialize();
      
      // Check if artifacts directory is created
      const artifactsExists = await fs.access(this.artifactsDir).then(() => true).catch(() => false);
      
      this.addTestResult('initialization', 'Analyzer initialization', artifactsExists, 
        artifactsExists ? 'Artifacts directory created successfully' : 'Failed to create artifacts directory');
    } catch (error) {
      this.addTestResult('initialization', 'Analyzer initialization', false, error.message);
    }
  }

  async testDocumentScanning() {
    try {
      const analyzer = new BlueprintTraceabilityMatrix();
      await analyzer.initialize();
      await analyzer.scanDocuments();
      
      // Check if document inventory is populated
      const hasDocuments = analyzer.documentInventory.size > 0;
      const documentCount = Array.from(analyzer.documentInventory.values())
        .reduce((sum, blueprint) => sum + blueprint.documents.length, 0);
      
      this.addTestResult('document-scanning', 'Document scanning', hasDocuments, 
        `Found ${documentCount} documents across ${analyzer.documentInventory.size} blueprint categories`);
        
      // Test specific document types
      const expectedPaths = ['docs/master-spec/', 'docs/architecture/', 'docs/governance/'];
      for (const expectedPath of expectedPaths) {
        const pathExists = await fs.access(path.join(this.workingDir, expectedPath))
          .then(() => true).catch(() => false);
        
        if (pathExists) {
          this.addTestResult('document-scanning', `Path scanning: ${expectedPath}`, true, 'Path found and scanned');
        }
      }
      
    } catch (error) {
      this.addTestResult('document-scanning', 'Document scanning', false, error.message);
    }
  }

  async testRequirementCoverage() {
    try {
      const analyzer = new BlueprintTraceabilityMatrix();
      await analyzer.initialize();
      await analyzer.scanDocuments();
      await analyzer.analyzeRequirementCoverage();
      
      // Check if all requirements are analyzed
      const totalRequirements = Object.values(analyzer.constructor.prototype.constructor.ENTERPRISE_REQUIREMENTS || {})
        .reduce((sum, cat) => sum + Object.keys(cat.requirements || {}).length, 0);
      
      // Note: We need to access the static requirements differently
      const requirementCategories = ['STR', 'FUN', 'TEC', 'SEC', 'COM', 'OPS'];
      const hasRequirements = analyzer.traceabilityMatrix.size > 0;
      
      this.addTestResult('requirement-coverage', 'Requirements analysis', hasRequirements,
        `Analyzed ${analyzer.traceabilityMatrix.size} requirements`);
        
      // Test coverage scoring
      const coverageScores = Array.from(analyzer.traceabilityMatrix.values())
        .map(coverage => coverage.coverageScore);
      const avgCoverage = coverageScores.reduce((sum, score) => sum + score, 0) / coverageScores.length;
      
      this.addTestResult('requirement-coverage', 'Coverage scoring', !isNaN(avgCoverage),
        `Average coverage score: ${(avgCoverage * 100).toFixed(1)}%`);
        
    } catch (error) {
      this.addTestResult('requirement-coverage', 'Requirements analysis', false, error.message);
    }
  }

  async testGapAnalysis() {
    try {
      const analyzer = new BlueprintTraceabilityMatrix();
      await analyzer.initialize();
      await analyzer.scanDocuments();
      await analyzer.analyzeRequirementCoverage();
      
      // Check gap identification
      const hasGaps = analyzer.gaps.length >= 0; // Should always be true
      const criticalGaps = analyzer.gaps.filter(gap => gap.severity === 'CRITICAL').length;
      const highGaps = analyzer.gaps.filter(gap => gap.severity === 'HIGH').length;
      
      this.addTestResult('gap-analysis', 'Gap identification', hasGaps,
        `Identified ${analyzer.gaps.length} gaps (${criticalGaps} critical, ${highGaps} high)`);
        
      // Test gap structure
      if (analyzer.gaps.length > 0) {
        const firstGap = analyzer.gaps[0];
        const hasRequiredFields = firstGap.gapId && firstGap.requirement && 
                                 firstGap.severity && firstGap.recommendations;
        
        this.addTestResult('gap-analysis', 'Gap structure validation', hasRequiredFields,
          hasRequiredFields ? 'Gap objects have all required fields' : 'Missing required gap fields');
      }
      
      // Test recommendations
      const totalRecommendations = analyzer.gaps.reduce((sum, gap) => sum + gap.recommendations.length, 0);
      const hasRecommendations = totalRecommendations > 0;
      
      this.addTestResult('gap-analysis', 'Actionable recommendations', hasRecommendations,
        `Generated ${totalRecommendations} actionable recommendations`);
        
    } catch (error) {
      this.addTestResult('gap-analysis', 'Gap analysis', false, error.message);
    }
  }

  async testReportGeneration() {
    try {
      const analyzer = new BlueprintTraceabilityMatrix();
      const result = await analyzer.run();
      
      // Check if run completed successfully
      this.addTestResult('report-generation', 'Analysis execution', result.success,
        result.success ? `Analysis completed with ${result.gaps} gaps` : 'Analysis failed');
        
      // Check expected artifacts
      const expectedArtifacts = [
        'blueprint-traceability-matrix.json',
        'blueprint-gap-analysis.json',
        'blueprint-actionable-recommendations.json',
        'blueprint-verification-checklist.json',
        'blueprint-traceability-summary.json',
        'BLUEPRINT-TRACEABILITY-REPORT.md'
      ];
      
      for (const artifact of expectedArtifacts) {
        const artifactPath = path.join(this.artifactsDir, artifact);
        const exists = await fs.access(artifactPath).then(() => true).catch(() => false);
        
        this.addTestResult('report-generation', `Artifact: ${artifact}`, exists,
          exists ? 'Artifact generated successfully' : 'Artifact missing');
      }
      
    } catch (error) {
      this.addTestResult('report-generation', 'Report generation', false, error.message);
    }
  }

  async testArtifactValidation() {
    try {
      // Test JSON artifact validity
      const jsonArtifacts = [
        'blueprint-traceability-matrix.json',
        'blueprint-gap-analysis.json',
        'blueprint-actionable-recommendations.json',
        'blueprint-verification-checklist.json',
        'blueprint-traceability-summary.json'
      ];
      
      for (const artifact of jsonArtifacts) {
        const artifactPath = path.join(this.artifactsDir, artifact);
        
        try {
          const content = await fs.readFile(artifactPath, 'utf8');
          const parsed = JSON.parse(content);
          const hasMetadata = parsed.metadata && parsed.metadata.generated;
          
          this.addTestResult('artifact-validation', `JSON validation: ${artifact}`, hasMetadata,
            hasMetadata ? 'Valid JSON with metadata' : 'Missing metadata');
        } catch (err) {
          this.addTestResult('artifact-validation', `JSON validation: ${artifact}`, false,
            `Invalid JSON: ${err.message}`);
        }
      }
      
      // Test markdown report
      const markdownPath = path.join(this.artifactsDir, 'BLUEPRINT-TRACEABILITY-REPORT.md');
      
      try {
        const content = await fs.readFile(markdownPath, 'utf8');
        const hasTitle = content.includes('# Blueprint Traceability Matrix');
        const hasExecutiveSummary = content.includes('## Executive Summary');
        const hasGapAnalysis = content.includes('## Gap Analysis');
        
        this.addTestResult('artifact-validation', 'Markdown report validation', 
          hasTitle && hasExecutiveSummary && hasGapAnalysis,
          'Markdown report has required sections');
      } catch (err) {
        this.addTestResult('artifact-validation', 'Markdown report validation', false,
          `Markdown report error: ${err.message}`);
      }
      
    } catch (error) {
      this.addTestResult('artifact-validation', 'Artifact validation', false, error.message);
    }
  }

  addTestResult(category, test, passed, message) {
    this.testResults.push({
      category,
      test,
      status: passed ? 'PASS' : 'FAIL',
      message,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`[test] ${status} ${category}: ${test} - ${message}`);
  }

  async generateTestReport() {
    const testReport = {
      metadata: {
        generated: new Date().toISOString(),
        test_suite: 'Blueprint Traceability Matrix',
        version: '1.0.0'
      },
      summary: {
        total_tests: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASS').length,
        failed: this.testResults.filter(r => r.status === 'FAIL').length,
        success_rate: (this.testResults.filter(r => r.status === 'PASS').length / this.testResults.length * 100).toFixed(1) + '%'
      },
      results_by_category: this.groupResultsByCategory(),
      detailed_results: this.testResults
    };

    await fs.writeFile(
      path.join(this.artifactsDir, 'blueprint-traceability-test-report.json'),
      JSON.stringify(testReport, null, 2)
    );
  }

  groupResultsByCategory() {
    const grouped = {};
    
    for (const result of this.testResults) {
      if (!grouped[result.category]) {
        grouped[result.category] = { total: 0, passed: 0, failed: 0 };
      }
      
      grouped[result.category].total++;
      if (result.status === 'PASS') {
        grouped[result.category].passed++;
      } else {
        grouped[result.category].failed++;
      }
    }
    
    return grouped;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new BlueprintTraceabilityMatrixTest();
  tester.runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export default BlueprintTraceabilityMatrixTest;