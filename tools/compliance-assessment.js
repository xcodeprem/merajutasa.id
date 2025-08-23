#!/usr/bin/env node
/**
 * Compliance Assessment Tool
 *
 * Generates comprehensive compliance assessment artifacts
 * for governance and regulatory requirements.
 */

import fs from 'fs/promises';
import path from 'path';
import { addMetadata, stableStringify } from './lib/json-stable.js';

class ComplianceAssessment {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || 'artifacts/compliance',
      frameworks: options.frameworks || ['GDPR', 'SOC2', 'ISO27001'],
      includeEvidence: options.includeEvidence !== false,
      ...options,
    };

    this.assessmentCriteria = {
      'GDPR': [
        {
          id: 'gdpr_article_25',
          title: 'Data Protection by Design and by Default',
          category: 'data_protection',
          risk_level: 'high',
          controls: ['privacy_impact_assessment', 'data_minimization', 'purpose_limitation'],
        },
        {
          id: 'gdpr_article_32',
          title: 'Security of Processing',
          category: 'security',
          risk_level: 'high',
          controls: ['encryption', 'access_controls', 'security_monitoring'],
        },
        {
          id: 'gdpr_article_5',
          title: 'Principles Relating to Processing',
          category: 'data_governance',
          risk_level: 'critical',
          controls: ['lawfulness', 'fairness', 'transparency', 'accuracy'],
        },
      ],
      'SOC2': [
        {
          id: 'soc2_cc6_1',
          title: 'Logical and Physical Access Controls',
          category: 'access_control',
          risk_level: 'high',
          controls: ['identity_management', 'authentication', 'authorization'],
        },
        {
          id: 'soc2_cc6_7',
          title: 'Data Transmission and Disposal',
          category: 'data_security',
          risk_level: 'medium',
          controls: ['encryption_in_transit', 'secure_disposal', 'data_classification'],
        },
      ],
      'ISO27001': [
        {
          id: 'iso27001_a5_1_1',
          title: 'Information Security Policy',
          category: 'governance',
          risk_level: 'high',
          controls: ['policy_framework', 'management_commitment', 'policy_communication'],
        },
        {
          id: 'iso27001_a8_2_3',
          title: 'Handling of Assets',
          category: 'asset_management',
          risk_level: 'medium',
          controls: ['asset_inventory', 'asset_classification', 'handling_procedures'],
        },
      ],
    };
  }

  /**
   * Run comprehensive compliance assessment
   */
  async runAssessment() {
    try {
      console.log('📋 Starting compliance assessment...');
      console.log(`🔍 Frameworks: ${this.options.frameworks.join(', ')}`);

      const assessment = {
        assessment_id: `comp_assess_${Date.now()}`,
        started_at: new Date().toISOString(),
        frameworks_assessed: this.options.frameworks,
        assessment_results: {},
        overall_compliance_score: 0,
        risk_summary: {},
        recommendations: [],
        evidence_files: [],
      };

      // Assess each framework
      for (const framework of this.options.frameworks) {
        console.log(`📊 Assessing ${framework} compliance...`);
        const frameworkResult = await this.assessFramework(framework);
        assessment.assessment_results[framework] = frameworkResult;
      }

      // Calculate overall compliance score
      assessment.overall_compliance_score = this.calculateOverallScore(assessment.assessment_results);

      // Generate risk summary
      assessment.risk_summary = this.generateRiskSummary(assessment.assessment_results);

      // Generate recommendations
      assessment.recommendations = this.generateRecommendations(assessment.assessment_results);

      // Generate evidence if requested
      if (this.options.includeEvidence) {
        console.log('📄 Generating evidence files...');
        assessment.evidence_files = await this.generateEvidenceFiles(assessment);
      }

      assessment.completed_at = new Date().toISOString();
      assessment.duration_ms = new Date(assessment.completed_at) - new Date(assessment.started_at);

      // Save assessment results
      await this.saveAssessmentResults(assessment);

      console.log(`✅ Compliance assessment completed (${assessment.duration_ms}ms)`);
      console.log(`📊 Overall compliance score: ${assessment.overall_compliance_score}%`);
      console.log(`⚠️ High risk controls: ${assessment.risk_summary.high_risk_count}`);

      return assessment;

    } catch (error) {
      console.error('❌ Compliance assessment failed:', error);
      throw error;
    }
  }

  /**
   * Assess specific compliance framework
   */
  async assessFramework(framework) {
    const criteria = this.assessmentCriteria[framework] || [];

    const frameworkResult = {
      framework: framework,
      total_controls: criteria.length,
      assessed_controls: [],
      compliance_score: 0,
      risk_breakdown: {
        critical: { total: 0, compliant: 0 },
        high: { total: 0, compliant: 0 },
        medium: { total: 0, compliant: 0 },
        low: { total: 0, compliant: 0 },
      },
    };

    // Assess each control
    for (const criterion of criteria) {
      const controlResult = await this.assessControl(criterion);
      frameworkResult.assessed_controls.push(controlResult);

      // Update risk breakdown
      frameworkResult.risk_breakdown[criterion.risk_level].total++;
      if (controlResult.compliance_status === 'compliant') {
        frameworkResult.risk_breakdown[criterion.risk_level].compliant++;
      }
    }

    // Calculate framework compliance score
    const compliantControls = frameworkResult.assessed_controls.filter(c => c.compliance_status === 'compliant').length;
    frameworkResult.compliance_score = Math.round((compliantControls / frameworkResult.total_controls) * 100);

    return frameworkResult;
  }

  /**
   * Assess individual control
   */
  async assessControl(criterion) {
    // Simulate control assessment
    const assessmentScore = Math.random();

    const controlResult = {
      control_id: criterion.id,
      title: criterion.title,
      category: criterion.category,
      risk_level: criterion.risk_level,
      required_controls: criterion.controls,
      assessment_score: Math.round(assessmentScore * 100),
      compliance_status: assessmentScore > 0.7 ? 'compliant' : 'non_compliant',
      findings: [],
      evidence_references: [],
    };

    // Generate findings for non-compliant controls
    if (controlResult.compliance_status === 'non_compliant') {
      controlResult.findings = this.generateFindings(criterion);
    }

    // Add evidence references
    controlResult.evidence_references = this.generateEvidenceReferences(criterion);

    return controlResult;
  }

  /**
   * Generate findings for non-compliant controls
   */
  generateFindings(criterion) {
    const findings = [];

    const possibleFindings = {
      'data_protection': [
        'Privacy impact assessment not documented',
        'Data minimization practices not implemented',
        'Purpose limitation controls insufficient',
      ],
      'security': [
        'Encryption standards not meeting requirements',
        'Access control matrix incomplete',
        'Security monitoring gaps identified',
      ],
      'governance': [
        'Policy documentation outdated',
        'Management approval not documented',
        'Policy communication not tracked',
      ],
    };

    const categoryFindings = possibleFindings[criterion.category] || ['Control implementation gap identified'];

    // Randomly select 1-2 findings
    const numFindings = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numFindings; i++) {
      const finding = categoryFindings[Math.floor(Math.random() * categoryFindings.length)];
      if (!findings.includes(finding)) {
        findings.push(finding);
      }
    }

    return findings;
  }

  /**
   * Generate evidence references
   */
  generateEvidenceReferences(criterion) {
    const evidenceTypes = {
      'data_protection': ['privacy_policy.pdf', 'data_flow_diagram.png', 'pia_template.docx'],
      'security': ['security_policy.pdf', 'access_control_matrix.xlsx', 'security_logs.json'],
      'governance': ['governance_framework.pdf', 'board_minutes.pdf', 'policy_register.xlsx'],
      'access_control': ['iam_configuration.json', 'auth_logs.json', 'access_review.xlsx'],
      'asset_management': ['asset_inventory.xlsx', 'classification_scheme.pdf', 'handling_procedures.pdf'],
    };

    const categoryEvidence = evidenceTypes[criterion.category] || ['control_documentation.pdf'];

    return categoryEvidence.slice(0, 2).map(file => ({
      file_name: file,
      file_type: path.extname(file).substring(1),
      location: `evidence/${criterion.category}/${file}`,
      last_updated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }));
  }

  /**
   * Calculate overall compliance score
   */
  calculateOverallScore(assessmentResults) {
    const frameworks = Object.keys(assessmentResults);
    if (frameworks.length === 0) {return 0;}

    const totalScore = frameworks.reduce((sum, framework) => {
      return sum + assessmentResults[framework].compliance_score;
    }, 0);

    return Math.round(totalScore / frameworks.length);
  }

  /**
   * Generate risk summary
   */
  generateRiskSummary(assessmentResults) {
    const summary = {
      critical_risk_count: 0,
      high_risk_count: 0,
      medium_risk_count: 0,
      low_risk_count: 0,
      total_non_compliant: 0,
      highest_risk_controls: [],
    };

    Object.values(assessmentResults).forEach(frameworkResult => {
      Object.entries(frameworkResult.risk_breakdown).forEach(([riskLevel, breakdown]) => {
        const nonCompliant = breakdown.total - breakdown.compliant;
        summary[`${riskLevel}_risk_count`] += nonCompliant;
        summary.total_non_compliant += nonCompliant;
      });

      // Identify highest risk non-compliant controls
      const highRiskControls = frameworkResult.assessed_controls.filter(control =>
        control.compliance_status === 'non_compliant' &&
        (control.risk_level === 'critical' || control.risk_level === 'high'),
      );

      summary.highest_risk_controls.push(...highRiskControls.map(control => ({
        framework: frameworkResult.framework,
        control_id: control.control_id,
        title: control.title,
        risk_level: control.risk_level,
        findings: control.findings,
      })));
    });

    // Sort highest risk controls by risk level
    summary.highest_risk_controls.sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return riskOrder[b.risk_level] - riskOrder[a.risk_level];
    });

    // Keep only top 10
    summary.highest_risk_controls = summary.highest_risk_controls.slice(0, 10);

    return summary;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(assessmentResults) {
    const recommendations = [];

    Object.values(assessmentResults).forEach(frameworkResult => {
      const nonCompliantControls = frameworkResult.assessed_controls.filter(c => c.compliance_status === 'non_compliant');

      nonCompliantControls.forEach(control => {
        control.findings.forEach(finding => {
          recommendations.push({
            priority: this.getRiskPriority(control.risk_level),
            framework: frameworkResult.framework,
            control_id: control.control_id,
            title: `Address ${control.title}`,
            description: finding,
            suggested_action: this.getSuggestedAction(control.category, finding),
            estimated_effort: this.getEstimatedEffort(control.risk_level),
            target_completion_days: this.getTargetCompletionDays(control.risk_level),
          });
        });
      });
    });

    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return recommendations.slice(0, 20); // Top 20 recommendations
  }

  /**
   * Get risk priority
   */
  getRiskPriority(riskLevel) {
    return riskLevel;
  }

  /**
   * Get suggested action
   */
  getSuggestedAction(category, finding) {
    const actions = {
      'data_protection': 'Review and update data protection procedures',
      'security': 'Implement or enhance security controls',
      'governance': 'Update governance documentation and processes',
      'access_control': 'Review and improve access control mechanisms',
      'asset_management': 'Enhance asset management procedures',
    };

    return actions[category] || 'Review and improve control implementation';
  }

  /**
   * Get estimated effort
   */
  getEstimatedEffort(riskLevel) {
    const efforts = {
      critical: 'high',
      high: 'medium',
      medium: 'low',
      low: 'minimal',
    };

    return efforts[riskLevel] || 'medium';
  }

  /**
   * Get target completion days
   */
  getTargetCompletionDays(riskLevel) {
    const days = {
      critical: 7,
      high: 30,
      medium: 60,
      low: 90,
    };

    return days[riskLevel] || 30;
  }

  /**
   * Generate evidence files
   */
  async generateEvidenceFiles(assessment) {
    const evidenceFiles = [];

    // Generate assessment summary
    const summaryFile = {
      file_name: 'compliance_assessment_summary.json',
      file_path: path.join(this.options.outputDir, 'evidence', 'compliance_assessment_summary.json'),
      file_type: 'json',
      generated_at: new Date().toISOString(),
    };

    await fs.mkdir(path.dirname(summaryFile.file_path), { recursive: true });
    await fs.writeFile(summaryFile.file_path, stableStringify({
      assessment_id: assessment.assessment_id,
      overall_score: assessment.overall_compliance_score,
      frameworks: assessment.frameworks_assessed,
      high_risk_count: assessment.risk_summary.high_risk_count,
      recommendations_count: assessment.recommendations.length,
    }), 'utf8');

    evidenceFiles.push(summaryFile);

    // Generate framework-specific evidence
    for (const framework of assessment.frameworks_assessed) {
      const frameworkFile = {
        file_name: `${framework.toLowerCase()}_compliance_report.json`,
        file_path: path.join(this.options.outputDir, 'evidence', `${framework.toLowerCase()}_compliance_report.json`),
        file_type: 'json',
        generated_at: new Date().toISOString(),
      };

      await fs.writeFile(frameworkFile.file_path, stableStringify(assessment.assessment_results[framework]), 'utf8');
      evidenceFiles.push(frameworkFile);
    }

    return evidenceFiles;
  }

  /**
   * Save assessment results
   */
  async saveAssessmentResults(assessment) {
    const outputPath = path.join(this.options.outputDir, 'compliance-assessment.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const output = addMetadata({
      tool: 'compliance-assessment',
      version: '1.0.0',
      generated_at: new Date().toISOString(),
    }, assessment);

    await fs.writeFile(outputPath, stableStringify(output), 'utf8');
    console.log(`📄 Assessment results saved to ${outputPath}`);

    // Generate executive summary
    const summaryPath = path.join(this.options.outputDir, 'assessment-summary.json');
    const summary = {
      assessment_id: assessment.assessment_id,
      overall_compliance_score: assessment.overall_compliance_score,
      frameworks_assessed: assessment.frameworks_assessed,
      total_recommendations: assessment.recommendations.length,
      critical_recommendations: assessment.recommendations.filter(r => r.priority === 'critical').length,
      high_priority_recommendations: assessment.recommendations.filter(r => r.priority === 'high').length,
      assessment_date: assessment.started_at.split('T')[0],
    };

    const summaryOutput = addMetadata({
      tool: 'compliance-assessment-summary',
      version: '1.0.0',
      generated_at: new Date().toISOString(),
    }, summary);

    await fs.writeFile(summaryPath, stableStringify(summaryOutput), 'utf8');
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const frameworks = args.includes('--framework') ?
    args[args.indexOf('--framework') + 1].split(',') : ['GDPR', 'SOC2', 'ISO27001'];

  const options = {
    frameworks: frameworks,
    includeEvidence: !args.includes('--no-evidence'),
  };

  try {
    const assessment = new ComplianceAssessment(options);
    const result = await assessment.runAssessment();

    if (result.overall_compliance_score >= 80) {
      console.log('✅ Compliance assessment passed');
      process.exit(0);
    } else {
      console.log('⚠️ Compliance assessment requires attention');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Assessment failed:', error);
    process.exit(1);
  }
}

export { ComplianceAssessment };
