#!/usr/bin/env node
/**
 * Week 6 Component Import Resolution Tests
 * 
 * Tests that security-hardening and compliance-orchestrator components
 * can import their dependencies correctly and don't have circular imports.
 */

import { strict as assert } from 'assert';
import fs from 'fs/promises';
import path from 'path';

class Week6ComponentImportTests {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
    }

    async runTest(name, testFunction) {
        console.log(`\n🧪 Running test: ${name}`);
        const testStart = Date.now();
        
        try {
            await testFunction();
            const duration = Date.now() - testStart;
            console.log(`✅ ${name} - PASSED (${duration}ms)`);
            this.testResults.push({ name, status: 'PASSED', duration });
            return true;
        } catch (error) {
            const duration = Date.now() - testStart;
            console.log(`❌ ${name} - FAILED (${duration}ms)`);
            console.log(`   Error: ${error.message}`);
            this.testResults.push({ name, status: 'FAILED', duration, error: error.message });
            return false;
        }
    }

    async testAuditSystemExports() {
        const auditPath = 'infrastructure/compliance/audit-system.js';
        const content = await fs.readFile(auditPath, 'utf8');
        
        // Check for named export (the actual pattern used)
        assert(content.includes('export const auditSystem'), 'Missing auditSystem constant export');
        assert(content.includes('export class AuditSystem'), 'Missing AuditSystem class export');
        assert(content.includes('export const auditEvents'), 'Missing auditEvents export');
        assert(content.includes('export default AuditSystem'), 'Missing default export');
        
        console.log('   ✅ audit-system.js has all required exports');
    }

    async testSecurityHardeningImports() {
        const securityPath = 'infrastructure/security/enhanced/security-hardening.js';
        const content = await fs.readFile(securityPath, 'utf8');
        
        // Check import path is correct
        const expectedImport = "import { auditSystem } from '../../compliance/audit-system.js';";
        assert(content.includes(expectedImport), `Expected import: ${expectedImport}`);
        
        // Verify no old incorrect import paths (the specific exact patterns that were wrong)
        const incorrectImports = [
            "from '../compliance/audit-system.js'",  // The old incorrect pattern
            "from './compliance/audit-system.js'",
            "from 'compliance/audit-system.js'"
        ];
        
        for (const incorrectImport of incorrectImports) {
            assert(!content.includes(incorrectImport), `Found old incorrect import pattern: ${incorrectImport}`);
        }
        
        console.log('   ✅ security-hardening.js has correct import path');
    }

    async testComplianceOrchestratorImports() {
        const orchestratorPath = 'infrastructure/compliance/compliance-orchestrator.js';
        const content = await fs.readFile(orchestratorPath, 'utf8');
        
        // Check all required imports
        const requiredImports = [
            "import { auditSystem } from './audit-system.js';",
            "import { complianceAutomation } from './compliance-automation.js';",
            "import { securityHardening } from '../security/enhanced/security-hardening.js';",
            "import { privacyRightsManagement } from './privacy-rights-management.js';"
        ];
        
        for (const requiredImport of requiredImports) {
            assert(content.includes(requiredImport), `Missing required import: ${requiredImport}`);
        }
        
        console.log('   ✅ compliance-orchestrator.js has all required imports');
    }

    async testNoCircularImports() {
        // Test that audit-system doesn't import from security or orchestrator
        const auditPath = 'infrastructure/compliance/audit-system.js';
        const auditContent = await fs.readFile(auditPath, 'utf8');
        
        const circularImports = [
            'security-hardening',
            'compliance-orchestrator',
            '../security/',
            './compliance-orchestrator'
        ];
        
        for (const circularImport of circularImports) {
            assert(!auditContent.includes(circularImport), 
                `Found potential circular import in audit-system: ${circularImport}`);
        }
        
        console.log('   ✅ No circular imports detected');
    }

    async testComponentImportResolution() {
        // Test that we can actually import the components without errors
        console.log('   🔍 Testing actual import resolution...');
        
        try {
            // Test audit system import
            const auditModule = await import('../../infrastructure/compliance/audit-system.js');
            assert(auditModule.auditSystem, 'auditSystem export not found');
            assert(auditModule.AuditSystem, 'AuditSystem class export not found');
            assert(auditModule.auditEvents, 'auditEvents export not found');
            console.log('   ✅ audit-system imports successfully');

            // Test security hardening import
            const securityModule = await import('../../infrastructure/security/enhanced/security-hardening.js');
            assert(securityModule.securityHardening, 'securityHardening export not found');
            assert(securityModule.SecurityHardening, 'SecurityHardening class export not found');
            console.log('   ✅ security-hardening imports successfully');

            // Test compliance orchestrator import
            const orchestratorModule = await import('../../infrastructure/compliance/compliance-orchestrator.js');
            assert(orchestratorModule.complianceOrchestrator, 'complianceOrchestrator export not found');
            assert(orchestratorModule.ComplianceOrchestrator, 'ComplianceOrchestrator class export not found');
            console.log('   ✅ compliance-orchestrator imports successfully');

        } catch (error) {
            throw new Error(`Import resolution failed: ${error.message}`);
        }
    }

    async testComponentInstanceCreation() {
        console.log('   🔍 Testing component instance creation...');
        
        try {
            // Import modules dynamically to avoid side effects during test
            const { AuditSystem } = await import('../../infrastructure/compliance/audit-system.js');
            const { SecurityHardening } = await import('../../infrastructure/security/enhanced/security-hardening.js');
            
            // Test that we can create instances
            const auditInstance = new AuditSystem({ 
                storageDir: '/tmp/test-audit',
                flushInterval: 60000 // 1 minute for testing
            });
            assert(auditInstance, 'Failed to create AuditSystem instance');
            
            const securityInstance = new SecurityHardening({
                scanInterval: 300000, // 5 minutes for testing
                enableRealTimeMonitoring: false, // Disable to avoid side effects
                reportingDir: '/tmp/test-security'
            });
            assert(securityInstance, 'Failed to create SecurityHardening instance');
            
            console.log('   ✅ Component instances created successfully');
            
            // Clean up
            await auditInstance.shutdown();
            await securityInstance.shutdown();
            
        } catch (error) {
            throw new Error(`Component instance creation failed: ${error.message}`);
        }
    }

    async testModuleTypes() {
        // Verify all files are proper ES modules
        const componentFiles = [
            'infrastructure/compliance/audit-system.js',
            'infrastructure/security/enhanced/security-hardening.js',
            'infrastructure/compliance/compliance-orchestrator.js'
        ];
        
        for (const file of componentFiles) {
            const content = await fs.readFile(file, 'utf8');
            
            // Check for ES module syntax
            assert(content.includes('import '), `${file} doesn't use ES module imports`);
            assert(content.includes('export '), `${file} doesn't use ES module exports`);
            
            // Check it doesn't use CommonJS
            assert(!content.includes('require('), `${file} uses CommonJS require (should use ES imports)`);
            assert(!content.includes('module.exports'), `${file} uses CommonJS exports (should use ES exports)`);
        }
        
        console.log('   ✅ All components use proper ES module syntax');
    }

    async generateReport() {
        const totalDuration = Date.now() - this.startTime;
        const passed = this.testResults.filter(t => t.status === 'PASSED').length;
        const failed = this.testResults.filter(t => t.status === 'FAILED').length;
        
        const report = {
            timestamp: new Date().toISOString(),
            test_suite: 'Week 6 Component Import Tests',
            summary: {
                total: this.testResults.length,
                passed,
                failed,
                success_rate: Math.round((passed / this.testResults.length) * 100),
                total_duration: totalDuration
            },
            results: this.testResults,
            component_scores: {
                audit_system: passed >= 1 ? 100 : 0,
                security_hardening: passed >= 3 ? 100 : 0,
                compliance_orchestrator: passed >= 5 ? 100 : 0,
                overall_import_health: Math.round((passed / this.testResults.length) * 100)
            }
        };

        const artifactsDir = path.join(process.cwd(), 'artifacts');
        await fs.mkdir(artifactsDir, { recursive: true });
        
        const reportPath = path.join(artifactsDir, 'week6-component-imports-test.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📊 Week 6 Component Import Test Report:`);
        console.log(`   Total Tests: ${report.summary.total}`);
        console.log(`   Passed: ${report.summary.passed}`);
        console.log(`   Failed: ${report.summary.failed}`);
        console.log(`   Success Rate: ${report.summary.success_rate}%`);
        console.log(`   Duration: ${report.summary.total_duration}ms`);
        console.log(`   Component Scores:`);
        console.log(`     - Audit System: ${report.component_scores.audit_system}/100`);
        console.log(`     - Security Hardening: ${report.component_scores.security_hardening}/100`);
        console.log(`     - Compliance Orchestrator: ${report.component_scores.compliance_orchestrator}/100`);
        console.log(`     - Overall Import Health: ${report.component_scores.overall_import_health}/100`);
        console.log(`   Report saved: ${reportPath}`);
        
        return report;
    }

    async runAllTests() {
        console.log('🚀 Starting Week 6 Component Import Resolution Tests...');
        
        await this.runTest('Audit System Exports', () => this.testAuditSystemExports());
        await this.runTest('Security Hardening Imports', () => this.testSecurityHardeningImports());
        await this.runTest('Compliance Orchestrator Imports', () => this.testComplianceOrchestratorImports());
        await this.runTest('No Circular Imports', () => this.testNoCircularImports());
        await this.runTest('Component Import Resolution', () => this.testComponentImportResolution());
        await this.runTest('Component Instance Creation', () => this.testComponentInstanceCreation());
        await this.runTest('Module Types', () => this.testModuleTypes());
        
        const report = await this.generateReport();
        
        if (report.summary.failed > 0) {
            console.log('\n❌ Some Week 6 component import tests failed');
            process.exit(1);
        } else {
            console.log('\n✅ All Week 6 component import tests passed');
            process.exit(0);
        }
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new Week6ComponentImportTests();
    tester.runAllTests().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

export default Week6ComponentImportTests;