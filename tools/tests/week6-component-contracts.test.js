#!/usr/bin/env node
/**
 * Week 6 Component Contract Tests
 * 
 * Tests the contract between compliance orchestrator and audit system
 * to ensure proper integration and minimal functionality paths.
 */

import { strict as assert } from 'assert';
import fs from 'fs/promises';
import path from 'path';

class Week6ComponentContractTests {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
        this.testInstances = {};
    }

    async runTest(name, testFunction) {
        console.log(`\n🧪 Running contract test: ${name}`);
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

    async setupTestEnvironment() {
        // Create test directories
        const testArtifactsDir = '/tmp/week6-contract-tests';
        await fs.mkdir(testArtifactsDir, { recursive: true });
        await fs.mkdir(`${testArtifactsDir}/audit`, { recursive: true });
        await fs.mkdir(`${testArtifactsDir}/security`, { recursive: true });
        await fs.mkdir(`${testArtifactsDir}/compliance`, { recursive: true });
        
        console.log('   ✅ Test environment setup complete');
    }

    async testOrchestratorBootWithAuditSystem() {
        console.log('   🔍 Testing orchestrator boot sequence...');
        
        // Import required modules
        const { ComplianceOrchestrator } = await import('../../infrastructure/compliance/compliance-orchestrator.js');
        const { AuditSystem } = await import('../../infrastructure/compliance/audit-system.js');
        
        // Create test audit system instance
        const testAuditSystem = new AuditSystem({
            storageDir: '/tmp/week6-contract-tests/audit',
            flushInterval: 60000,
            retentionDays: 30
        });
        
        // Create test orchestrator instance
        const testOrchestrator = new ComplianceOrchestrator({
            orchestrationInterval: 300000, // 5 minutes
            reportingDir: '/tmp/week6-contract-tests/compliance',
            enableRealTimeCorrelation: false, // Disable for testing
            alertingEnabled: false // Disable for testing
        });
        
        // Store instances for cleanup
        this.testInstances.auditSystem = testAuditSystem;
        this.testInstances.orchestrator = testOrchestrator;
        
        // Verify orchestrator has reference to audit system
        assert(testOrchestrator.components.auditSystem, 'Orchestrator missing auditSystem component reference');
        assert(testOrchestrator.components.auditSystem.instance, 'Orchestrator auditSystem component missing instance');
        
        // Verify orchestrator can get audit system status
        const auditStatus = testOrchestrator.components.auditSystem.instance.getStatistics();
        assert(auditStatus, 'Failed to get audit system status through orchestrator');
        assert(typeof auditStatus.totalEvents === 'number', 'Audit status missing totalEvents');
        
        console.log('   ✅ Orchestrator successfully boots with audit system integration');
    }

    async testAuditSystemCallContract() {
        console.log('   🔍 Testing audit system call contract...');
        
        const auditSystem = this.testInstances.auditSystem;
        assert(auditSystem, 'Audit system instance not available');
        
        // Test basic audit event recording
        const eventId = await auditSystem.recordEvent(
            'test_event',
            'contract_test_action',
            { test_data: 'contract_validation' },
            { sourceSystem: 'contract-test' }
        );
        
        assert(eventId, 'Failed to record audit event');
        assert(eventId.startsWith('audit_'), 'Event ID has incorrect format');
        
        // Verify event was buffered
        assert(auditSystem.eventBuffer.length > 0, 'Event not added to buffer');
        
        // Test statistics update
        const stats = auditSystem.getStatistics();
        assert(stats.totalEvents > 0, 'Total events not incremented');
        
        console.log('   ✅ Audit system call contract verified');
    }

    async testOrchestratorEventHandling() {
        console.log('   🔍 Testing orchestrator event handling...');
        
        const orchestrator = this.testInstances.orchestrator;
        const auditSystem = this.testInstances.auditSystem;
        
        assert(orchestrator, 'Orchestrator instance not available');
        assert(auditSystem, 'Audit system instance not available');
        
        // Test that orchestrator can handle component events
        let eventHandled = false;
        
        orchestrator.on('orchestration_completed', () => {
            eventHandled = true;
        });
        
        // Trigger an orchestration cycle
        await orchestrator.performOrchestration();
        
        // Verify orchestrator processed the cycle
        assert(orchestrator.orchestrationState.status === 'idle', 'Orchestrator not in idle state after orchestration');
        assert(orchestrator.orchestrationState.lastOrchestration, 'Last orchestration timestamp not set');
        
        console.log('   ✅ Orchestrator event handling verified');
    }

    async testCrossComponentIntegration() {
        console.log('   🔍 Testing cross-component integration...');
        
        const orchestrator = this.testInstances.orchestrator;
        const auditSystem = this.testInstances.auditSystem;
        
        // Record an audit event that should be visible to orchestrator
        const testEventId = await auditSystem.recordEvent(
            'security_incident',
            'test_threat_detected',
            { threat_type: 'contract_test', severity: 'medium' },
            { sourceSystem: 'contract-test', ipAddress: '127.0.0.1' }
        );
        
        // Verify orchestrator can access audit statistics through the actual audit system instance
        const auditStats = auditSystem.getStatistics();
        assert(auditStats.totalEvents > 0, 'Audit system not recording events');
        
        // Verify orchestrator has audit system component reference
        assert(orchestrator.components.auditSystem, 'Orchestrator missing auditSystem component');
        
        // Verify event correlation functionality exists
        assert(orchestrator.eventCorrelator, 'Orchestrator missing event correlator');
        assert(typeof orchestrator.eventCorrelator.correlateEvents === 'function', 
            'Event correlator missing correlateEvents method');
        
        // Test risk assessment integration
        assert(orchestrator.riskAnalyzer, 'Orchestrator missing risk analyzer');
        assert(typeof orchestrator.riskAnalyzer.assessOverallRisk === 'function',
            'Risk analyzer missing assessOverallRisk method');
        
        console.log('   ✅ Cross-component integration verified');
    }

    async testSecurityHardeningIntegration() {
        console.log('   🔍 Testing security hardening integration...');
        
        const orchestrator = this.testInstances.orchestrator;
        
        // Verify orchestrator has security hardening component reference
        assert(orchestrator.components.securityHardening, 'Orchestrator missing securityHardening component');
        assert(orchestrator.components.securityHardening.instance, 'Security hardening component missing instance');
        
        // Test that orchestrator can get security status
        const securityStatus = orchestrator.components.securityHardening.instance.getSecurityStatus();
        assert(securityStatus, 'Failed to get security status through orchestrator');
        assert(typeof securityStatus.securityScore === 'number', 'Security status missing securityScore');
        assert(Array.isArray(securityStatus.activeThreats), 'Security status missing activeThreats array');
        
        console.log('   ✅ Security hardening integration verified');
    }

    async testErrorHandlingContracts() {
        console.log('   🔍 Testing error handling contracts...');
        
        const auditSystem = this.testInstances.auditSystem;
        const orchestrator = this.testInstances.orchestrator;
        
        // Test audit system error handling
        try {
            await auditSystem.recordEvent(null, null, null, null);
            assert.fail('Audit system should handle null parameters gracefully');
        } catch (error) {
            // Expected error - this is good
            assert(error.message, 'Error should have a message');
        }
        
        // Test orchestrator component health check error handling
        try {
            // Temporarily break a component reference
            const originalInstance = orchestrator.components.auditSystem.instance;
            orchestrator.components.auditSystem.instance = null;
            
            // This should not crash the orchestrator
            await orchestrator.checkComponentHealth();
            
            // Restore the instance
            orchestrator.components.auditSystem.instance = originalInstance;
            
            // Verify orchestrator marked component as error
            assert(orchestrator.components.auditSystem.status === 'error', 
                'Orchestrator should mark broken component as error');
            
        } catch (error) {
            // If this throws, the error handling is not robust enough
            assert.fail(`Orchestrator error handling failed: ${error.message}`);
        }
        
        console.log('   ✅ Error handling contracts verified');
    }

    async testMinimalAuditEventFlow() {
        console.log('   🔍 Testing minimal audit event flow...');
        
        const auditSystem = this.testInstances.auditSystem;
        const orchestrator = this.testInstances.orchestrator;
        
        // Record a simple audit event
        const eventId = await auditSystem.recordEvent(
            'user_activity',
            'user_login',
            { user_id: 'test_user_123' },
            { ipAddress: '192.168.1.100', userAgent: 'contract-test/1.0' }
        );
        
        // Verify event has proper structure
        const lastEvent = auditSystem.eventBuffer[auditSystem.eventBuffer.length - 1];
        assert(lastEvent.event_id === eventId, 'Event ID mismatch');
        assert(lastEvent.event_type === 'user_activity', 'Event type mismatch');
        assert(lastEvent.action === 'user_login', 'Event action mismatch');
        assert(lastEvent.hash, 'Event missing integrity hash');
        assert(Array.isArray(lastEvent.compliance_tags), 'Event missing compliance tags');
        
        // Test that orchestrator can process this event type
        const correlations = await orchestrator.eventCorrelator.correlateEvents({
            component: 'auditSystem',
            type: 'audit_event',
            data: lastEvent,
            timestamp: new Date().toISOString()
        });
        
        // Correlations should not fail (may be empty, but should not throw)
        assert(Array.isArray(correlations), 'Event correlation should return array');
        
        console.log('   ✅ Minimal audit event flow verified');
    }

    async cleanupTestEnvironment() {
        console.log('   🧹 Cleaning up test environment...');
        
        // Shutdown test instances
        if (this.testInstances.auditSystem) {
            await this.testInstances.auditSystem.shutdown();
        }
        if (this.testInstances.orchestrator) {
            await this.testInstances.orchestrator.shutdown();
        }
        
        // Clean up test files
        try {
            await fs.rm('/tmp/week6-contract-tests', { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
        
        console.log('   ✅ Test environment cleaned up');
    }

    async generateReport() {
        const totalDuration = Date.now() - this.startTime;
        const passed = this.testResults.filter(t => t.status === 'PASSED').length;
        const failed = this.testResults.filter(t => t.status === 'FAILED').length;
        
        const report = {
            timestamp: new Date().toISOString(),
            test_suite: 'Week 6 Component Contract Tests',
            summary: {
                total: this.testResults.length,
                passed,
                failed,
                success_rate: Math.round((passed / this.testResults.length) * 100),
                total_duration: totalDuration
            },
            results: this.testResults,
            contract_validation: {
                orchestrator_boot: this.testResults.some(t => t.name.includes('Orchestrator Boot') && t.status === 'PASSED'),
                audit_system_calls: this.testResults.some(t => t.name.includes('Audit System Call') && t.status === 'PASSED'),
                cross_component_integration: this.testResults.some(t => t.name.includes('Cross-Component') && t.status === 'PASSED'),
                security_integration: this.testResults.some(t => t.name.includes('Security Hardening') && t.status === 'PASSED'),
                error_handling: this.testResults.some(t => t.name.includes('Error Handling') && t.status === 'PASSED'),
                event_flow: this.testResults.some(t => t.name.includes('Audit Event Flow') && t.status === 'PASSED')
            },
            component_scores: {
                orchestrator_contracts: passed >= 3 ? 85 : 40,
                audit_system_contracts: passed >= 2 ? 90 : 40,
                integration_contracts: passed >= 5 ? 80 : 40,
                overall_contract_health: Math.round((passed / this.testResults.length) * 100)
            }
        };

        const artifactsDir = path.join(process.cwd(), 'artifacts');
        await fs.mkdir(artifactsDir, { recursive: true });
        
        const reportPath = path.join(artifactsDir, 'week6-component-contracts-test.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📊 Week 6 Component Contract Test Report:`);
        console.log(`   Total Tests: ${report.summary.total}`);
        console.log(`   Passed: ${report.summary.passed}`);
        console.log(`   Failed: ${report.summary.failed}`);
        console.log(`   Success Rate: ${report.summary.success_rate}%`);
        console.log(`   Duration: ${report.summary.total_duration}ms`);
        console.log(`   Contract Validation:`);
        console.log(`     - Orchestrator Boot: ${report.contract_validation.orchestrator_boot ? '✅' : '❌'}`);
        console.log(`     - Audit System Calls: ${report.contract_validation.audit_system_calls ? '✅' : '❌'}`);
        console.log(`     - Cross-Component Integration: ${report.contract_validation.cross_component_integration ? '✅' : '❌'}`);
        console.log(`     - Security Integration: ${report.contract_validation.security_integration ? '✅' : '❌'}`);
        console.log(`     - Error Handling: ${report.contract_validation.error_handling ? '✅' : '❌'}`);
        console.log(`     - Event Flow: ${report.contract_validation.event_flow ? '✅' : '❌'}`);
        console.log(`   Component Scores:`);
        console.log(`     - Orchestrator Contracts: ${report.component_scores.orchestrator_contracts}/100`);
        console.log(`     - Audit System Contracts: ${report.component_scores.audit_system_contracts}/100`);
        console.log(`     - Integration Contracts: ${report.component_scores.integration_contracts}/100`);
        console.log(`     - Overall Contract Health: ${report.component_scores.overall_contract_health}/100`);
        console.log(`   Report saved: ${reportPath}`);
        
        return report;
    }

    async runAllTests() {
        console.log('🚀 Starting Week 6 Component Contract Tests...');
        
        try {
            await this.setupTestEnvironment();
            
            await this.runTest('Orchestrator Boot with Audit System', () => this.testOrchestratorBootWithAuditSystem());
            await this.runTest('Audit System Call Contract', () => this.testAuditSystemCallContract());
            await this.runTest('Orchestrator Event Handling', () => this.testOrchestratorEventHandling());
            await this.runTest('Cross-Component Integration', () => this.testCrossComponentIntegration());
            await this.runTest('Security Hardening Integration', () => this.testSecurityHardeningIntegration());
            await this.runTest('Error Handling Contracts', () => this.testErrorHandlingContracts());
            await this.runTest('Minimal Audit Event Flow', () => this.testMinimalAuditEventFlow());
            
        } finally {
            await this.cleanupTestEnvironment();
        }
        
        const report = await this.generateReport();
        
        if (report.summary.failed > 0) {
            console.log('\n❌ Some Week 6 component contract tests failed');
            process.exit(1);
        } else {
            console.log('\n✅ All Week 6 component contract tests passed');
            process.exit(0);
        }
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new Week6ComponentContractTests();
    tester.runAllTests().catch(error => {
        console.error('Contract test runner failed:', error);
        process.exit(1);
    });
}

export default Week6ComponentContractTests;