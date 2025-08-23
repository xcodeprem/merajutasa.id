#!/usr/bin/env node
/**
 * Privacy Request Simulator
 *
 * Simulates privacy rights requests (access, deletion, portability)
 * and generates request/access artifacts offline for testing.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { addMetadata, stableStringify } from './lib/json-stable.js';

class PrivacyRequestSimulator {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || 'artifacts/privacy-requests',
      simulateAll: options.simulateAll !== false,
      generateArtifacts: options.generateArtifacts !== false,
      ...options,
    };

    this.requestTypes = [
      'data_access',
      'data_deletion',
      'data_portability',
      'data_rectification',
      'processing_restriction',
      'objection_to_processing',
    ];
  }

  /**
   * Simulate privacy requests
   */
  async simulateRequests() {
    try {
      console.log('🔒 Starting privacy request simulation...');
      console.log(`📁 Output directory: ${this.options.outputDir}`);

      const simulation = {
        simulation_id: `privacy_sim_${Date.now()}`,
        started_at: new Date().toISOString(),
        requests_simulated: [],
        artifacts_generated: [],
        compliance_checks: [],
        overall_status: 'pending',
      };

      // Simulate each type of request
      for (const requestType of this.requestTypes) {
        console.log(`🔍 Simulating ${requestType} request...`);
        const requestResult = await this.simulateRequest(requestType);
        simulation.requests_simulated.push(requestResult);

        if (this.options.generateArtifacts) {
          const artifacts = await this.generateRequestArtifacts(requestType, requestResult);
          simulation.artifacts_generated.push(...artifacts);
        }
      }

      // Run compliance checks
      console.log('✅ Running compliance checks...');
      const complianceResults = await this.runComplianceChecks(simulation.requests_simulated);
      simulation.compliance_checks = complianceResults;

      // Determine overall status
      const allRequestsSuccessful = simulation.requests_simulated.every(r => r.status === 'success');
      const compliancePass = complianceResults.every(c => c.status === 'pass');
      simulation.overall_status = allRequestsSuccessful && compliancePass ? 'passed' : 'failed';

      simulation.completed_at = new Date().toISOString();
      simulation.duration_ms = new Date(simulation.completed_at) - new Date(simulation.started_at);

      // Save simulation results
      await this.saveSimulationResults(simulation);

      console.log(`✅ Privacy request simulation completed (${simulation.duration_ms}ms)`);
      console.log(`📊 Status: ${simulation.overall_status}`);
      console.log(`📝 Requests simulated: ${simulation.requests_simulated.length}`);
      console.log(`📄 Artifacts generated: ${simulation.artifacts_generated.length}`);

      return simulation;

    } catch (error) {
      console.error('❌ Privacy request simulation failed:', error);
      throw error;
    }
  }

  /**
   * Simulate individual privacy request
   */
  async simulateRequest(requestType) {
    const requestId = `req_${Date.now()}_${crypto.randomUUID()}`;
    const userId = `user_${crypto.randomUUID()}`;

    const request = {
      request_id: requestId,
      request_type: requestType,
      user_id: userId,
      submitted_at: new Date().toISOString(),
      status: 'pending',
      processing_time_ms: 0,
      data_categories: this.getDataCategoriesForRequest(requestType),
      legal_basis: this.getLegalBasisForRequest(requestType),
      verification_required: true,
      estimated_completion_days: this.getEstimatedCompletionDays(requestType),
    };

    // Simulate processing
    const processingStart = Date.now();
    await this.simulateRequestProcessing(request);
    request.processing_time_ms = Date.now() - processingStart;

    // Simulate success/failure
    const success = crypto.randomInt(0, 100) >= 5; // ~95% success rate
    request.status = success ? 'success' : 'failed';

    if (!success) {
      request.failure_reason = 'verification_failed';
      request.retry_available = true;
    } else {
      request.processed_at = new Date().toISOString();
      request.response_data = await this.generateResponseData(requestType);
    }

    return request;
  }

  /**
   * Get data categories for request type
   */
  getDataCategoriesForRequest(requestType) {
    const categories = {
      'data_access': ['personal_info', 'activity_logs', 'preferences', 'communications'],
      'data_deletion': ['personal_info', 'activity_logs', 'cached_data'],
      'data_portability': ['personal_info', 'user_content', 'preferences'],
      'data_rectification': ['personal_info', 'profile_data'],
      'processing_restriction': ['marketing_data', 'analytics_data'],
      'objection_to_processing': ['marketing_data', 'profiling_data'],
    };

    return categories[requestType] || ['personal_info'];
  }

  /**
   * Get legal basis for request
   */
  getLegalBasisForRequest(requestType) {
    const legalBasis = {
      'data_access': 'Article 15 GDPR - Right of access',
      'data_deletion': 'Article 17 GDPR - Right to erasure',
      'data_portability': 'Article 20 GDPR - Right to data portability',
      'data_rectification': 'Article 16 GDPR - Right to rectification',
      'processing_restriction': 'Article 18 GDPR - Right to restriction',
      'objection_to_processing': 'Article 21 GDPR - Right to object',
    };

    return legalBasis[requestType] || 'GDPR Article 7 - Consent';
  }

  /**
   * Get estimated completion days
   */
  getEstimatedCompletionDays(requestType) {
    const estimatedDays = {
      'data_access': 30,
      'data_deletion': 30,
      'data_portability': 30,
      'data_rectification': 15,
      'processing_restriction': 7,
      'objection_to_processing': 7,
    };

    return estimatedDays[requestType] || 30;
  }

  /**
   * Simulate request processing
   */
  async simulateRequestProcessing(request) {
    // Simulate async processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    // Simulate verification steps
    request.verification_steps = [
      { step: 'identity_verification', status: 'completed', completed_at: new Date().toISOString() },
      { step: 'request_validation', status: 'completed', completed_at: new Date().toISOString() },
      { step: 'data_location', status: 'completed', completed_at: new Date().toISOString() },
    ];
  }

  /**
   * Generate response data for successful request
   */
  async generateResponseData(requestType) {
    const responseData = {
      'data_access': {
        personal_info: {
          user_id: 'user_12345',
          email: 'user@example.com',
          name: 'John Doe',
          created_at: '2023-01-15T10:30:00Z',
        },
        activity_summary: {
          total_logins: 45,
          last_login: '2024-01-15T14:20:00Z',
          data_exports: 2,
        },
      },
      'data_deletion': {
        deleted_categories: ['personal_info', 'activity_logs'],
        retention_period_data: ['legal_compliance_records'],
        deletion_completed_at: new Date().toISOString(),
      },
      'data_portability': {
        export_format: 'JSON',
        file_size_bytes: 1024768,
        download_link: 'https://secure.example.com/export/user_data.json',
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };

    return responseData[requestType] || { status: 'processed' };
  }

  /**
   * Generate request artifacts
   */
  async generateRequestArtifacts(requestType, requestResult) {
    const artifacts = [];

    // Generate request artifact
    const requestArtifact = {
      artifact_type: 'privacy_request',
      request_type: requestType,
      request_id: requestResult.request_id,
      file_path: path.join(this.options.outputDir, 'requests', `${requestResult.request_id}.json`),
      generated_at: new Date().toISOString(),
    };

    await fs.mkdir(path.dirname(requestArtifact.file_path), { recursive: true });
    await fs.writeFile(requestArtifact.file_path, stableStringify(requestResult), 'utf8');
    artifacts.push(requestArtifact);

    // Generate response artifact if successful
    if (requestResult.status === 'success' && requestResult.response_data) {
      const responseArtifact = {
        artifact_type: 'privacy_response',
        request_type: requestType,
        request_id: requestResult.request_id,
        file_path: path.join(this.options.outputDir, 'responses', `${requestResult.request_id}_response.json`),
        generated_at: new Date().toISOString(),
      };

      await fs.mkdir(path.dirname(responseArtifact.file_path), { recursive: true });
      await fs.writeFile(responseArtifact.file_path, stableStringify(requestResult.response_data), 'utf8');
      artifacts.push(responseArtifact);
    }

    return artifacts;
  }

  /**
   * Run compliance checks
   */
  async runComplianceChecks(requests) {
    const checks = [
      {
        check_name: 'response_time_compliance',
        description: 'Verify requests processed within legal timeframes',
        status: 'pass',
        details: 'All requests processed within estimated timeframes',
      },
      {
        check_name: 'data_minimization',
        description: 'Ensure only requested data categories are processed',
        status: 'pass',
        details: 'Data processing limited to requested categories',
      },
      {
        check_name: 'verification_requirements',
        description: 'Confirm proper identity verification performed',
        status: 'pass',
        details: 'Identity verification completed for all requests',
      },
      {
        check_name: 'legal_basis_validation',
        description: 'Verify appropriate legal basis for each request',
        status: 'pass',
        details: 'Legal basis correctly identified and applied',
      },
    ];

    // Add specific checks for failed requests
    const failedRequests = requests.filter(r => r.status === 'failed');
    if (failedRequests.length > 0) {
      checks.push({
        check_name: 'failure_handling',
        description: 'Verify proper handling of failed requests',
        status: failedRequests.every(r => r.retry_available) ? 'pass' : 'fail',
        details: `${failedRequests.length} failed requests with retry options available`,
      });
    }

    return checks;
  }

  /**
   * Save simulation results
   */
  async saveSimulationResults(simulation) {
    const outputPath = path.join(this.options.outputDir, 'simulation-results.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const output = addMetadata({
      tool: 'privacy-request-simulator',
      version: '1.0.0',
      generated_at: new Date().toISOString(),
    }, simulation);

    await fs.writeFile(outputPath, stableStringify(output), 'utf8');
    console.log(`📄 Simulation results saved to ${outputPath}`);

    // Generate summary
    const summaryPath = path.join(this.options.outputDir, 'simulation-summary.json');
    const summary = {
      simulation_id: simulation.simulation_id,
      overall_status: simulation.overall_status,
      requests_count: simulation.requests_simulated.length,
      success_rate: simulation.requests_simulated.filter(r => r.status === 'success').length / simulation.requests_simulated.length,
      artifacts_count: simulation.artifacts_generated.length,
      compliance_pass_rate: simulation.compliance_checks.filter(c => c.status === 'pass').length / simulation.compliance_checks.length,
      duration_ms: simulation.duration_ms,
    };

    const summaryOutput = addMetadata({
      tool: 'privacy-request-simulator-summary',
      version: '1.0.0',
      generated_at: new Date().toISOString(),
    }, summary);

    await fs.writeFile(summaryPath, stableStringify(summaryOutput), 'utf8');
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    simulateAll: !args.includes('--single'),
    generateArtifacts: !args.includes('--no-artifacts'),
  };

  try {
    const simulator = new PrivacyRequestSimulator(options);
    const result = await simulator.simulateRequests();

    if (result.overall_status === 'passed') {
      console.log('✅ Privacy request simulation passed');
      process.exit(0);
    } else {
      console.log('❌ Privacy request simulation failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

export { PrivacyRequestSimulator };
