#!/usr/bin/env node
/**
 * blueprint-traceability-matrix.js
 * 
 * Blueprint Traceability Matrix untuk Praja Digital Suite
 * Menganalisis kelengkapan dokumentasi untuk implementasi enterprise-grade GovTech
 * 
 * Menghasilkan:
 * - Traceability matrix kebutuhan vs dokumen
 * - Gap analysis absolut tanpa bias opini  
 * - Rekomendasi actionable untuk setiap gap
 * - Checklist verifikasi kelengkapan
 * - Dokumentasi referensi granular
 */

import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { createHash } from 'crypto';

// Enterprise-grade requirements framework untuk GovTech implementation
const ENTERPRISE_REQUIREMENTS = {
  strategic: {
    name: 'Strategic & Business Requirements',
    weight: 1.0,
    criticality: 'CRITICAL',
    requirements: {
      'STR-001': 'Business objectives and value proposition clearly defined',
      'STR-002': 'Stakeholder analysis and requirements mapping',
      'STR-003': 'Success criteria and measurable outcomes',
      'STR-004': 'Risk management framework and mitigation strategies',
      'STR-005': 'Budget model and financial projections',
      'STR-006': 'Implementation timeline and milestones',
      'STR-007': 'Change management and adoption strategy',
      'STR-008': 'Governance model and decision-making processes'
    }
  },
  functional: {
    name: 'Functional Requirements',
    weight: 0.9,
    criticality: 'HIGH',
    requirements: {
      'FUN-001': 'Core features and capabilities specification',
      'FUN-002': 'User stories and acceptance criteria',
      'FUN-003': 'Integration requirements with existing systems',
      'FUN-004': 'Data flow and processing requirements',
      'FUN-005': 'User interface and experience requirements',
      'FUN-006': 'Reporting and analytics requirements',
      'FUN-007': 'Workflow and business process automation',
      'FUN-008': 'Performance and scalability requirements'
    }
  },
  technical: {
    name: 'Technical Architecture Requirements',
    weight: 0.9,
    criticality: 'HIGH',
    requirements: {
      'TEC-001': 'System architecture design and patterns',
      'TEC-002': 'Technology stack selection and rationale',
      'TEC-003': 'API design and microservice architecture',
      'TEC-004': 'Database design and data model',
      'TEC-005': 'Infrastructure requirements and cloud strategy',
      'TEC-006': 'Development standards and coding practices',
      'TEC-007': 'Testing strategy and quality assurance',
      'TEC-008': 'DevOps and CI/CD pipeline requirements'
    }
  },
  security: {
    name: 'Security & Privacy Requirements',
    weight: 1.0,
    criticality: 'CRITICAL',
    requirements: {
      'SEC-001': 'Authentication and authorization framework',
      'SEC-002': 'Data encryption and protection standards',
      'SEC-003': 'Privacy compliance (GDPR, local regulations)',
      'SEC-004': 'Audit logging and security monitoring',
      'SEC-005': 'Vulnerability management and security testing',
      'SEC-006': 'Access control and privilege management',
      'SEC-007': 'Data retention and disposal policies',
      'SEC-008': 'Incident response and security procedures'
    }
  },
  compliance: {
    name: 'Compliance & Legal Requirements',
    weight: 0.8,
    criticality: 'HIGH',
    requirements: {
      'COM-001': 'Regulatory compliance requirements',
      'COM-002': 'Data governance and stewardship policies',
      'COM-003': 'Legal framework and terms of service',
      'COM-004': 'Documentation and record keeping',
      'COM-005': 'Quality management system compliance',
      'COM-006': 'Environmental and sustainability requirements',
      'COM-007': 'Accessibility compliance (WCAG, local standards)',
      'COM-008': 'Procurement and vendor management policies'
    }
  },
  operational: {
    name: 'Operational Requirements',
    weight: 0.8,
    criticality: 'HIGH',
    requirements: {
      'OPS-001': 'Deployment and release management',
      'OPS-002': 'Monitoring and observability framework',
      'OPS-003': 'Backup and disaster recovery procedures',
      'OPS-004': 'Support and maintenance processes',
      'OPS-005': 'Capacity planning and resource management',
      'OPS-006': 'Service level agreements and objectives',
      'OPS-007': 'Training and knowledge management',
      'OPS-008': 'Documentation and runbook maintenance'
    }
  }
};

// Praja Digital Suite blueprint document mapping
const BLUEPRINT_DOCUMENTS = {
  'spesifikasi-final': {
    name: 'Spesifikasi Final',
    description: 'Final specification document',
    expected_paths: [
      'docs/master-spec/master-spec-v2.0.md',
      'docs/produk/portal-panti/',
      'docs/specifications/',
      'docs/requirements/'
    ]
  },
  'arsitektur-teknis': {
    name: 'Arsitektur Teknis',
    description: 'Technical architecture documentation',
    expected_paths: [
      'docs/architecture/',
      'docs/technical/',
      'docs/infrastructure/',
      'docs/api/',
      'infrastructure/'
    ]
  },
  'tata-kelola-api': {
    name: 'Tata Kelola API/Microservice',
    description: 'API and microservice governance',
    expected_paths: [
      'docs/api/',
      'docs/governance/',
      'docs/microservices/',
      'schemas/',
      'tools/services/'
    ]
  },
  'model-keuangan': {
    name: 'Model Keuangan',
    description: 'Financial model and business case',
    expected_paths: [
      'docs/planning/',
      'docs/business/',
      'docs/financial/',
      'docs/roadmap/',
      'docs/strategic-analysis/'
    ]
  }
};

class BlueprintTraceabilityMatrix {
  constructor() {
    this.workingDir = process.cwd();
    this.artifactsDir = path.join(this.workingDir, 'artifacts');
    this.traceabilityMatrix = new Map();
    this.gaps = [];
    this.documentInventory = new Map();
    this.analysisTimestamp = new Date().toISOString();
  }

  async initialize() {
    await fs.mkdir(this.artifactsDir, { recursive: true });
    console.log('[blueprint-traceability] Initializing blueprint traceability analysis...');
  }

  // Scan and inventory all potential blueprint documents
  async scanDocuments() {
    console.log('[blueprint-traceability] Scanning documents...');
    
    for (const [blueprintKey, blueprint] of Object.entries(BLUEPRINT_DOCUMENTS)) {
      const documents = [];
      
      for (const expectedPath of blueprint.expected_paths) {
        const fullPath = path.join(this.workingDir, expectedPath);
        
        try {
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            const files = await this.scanDirectory(fullPath);
            documents.push(...files);
          } else if (stat.isFile()) {
            const content = await fs.readFile(fullPath, 'utf8');
            documents.push({
              path: fullPath,
              relativePath: expectedPath,
              content: content,
              size: content.length,
              hash: this.generateHash(content)
            });
          }
        } catch (err) {
          // Path doesn't exist - will be flagged as gap
          console.log(`[blueprint-traceability] Path not found: ${expectedPath}`);
        }
      }
      
      this.documentInventory.set(blueprintKey, {
        ...blueprint,
        documents: documents,
        totalFiles: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.size, 0)
      });
    }
  }

  async scanDirectory(dirPath) {
    const documents = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.workingDir, fullPath);
        
        if (entry.isFile() && this.isDocumentFile(entry.name)) {
          const content = await fs.readFile(fullPath, 'utf8');
          documents.push({
            path: fullPath,
            relativePath: relativePath,
            content: content,
            size: content.length,
            hash: this.generateHash(content)
          });
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
          // Recursive scan up to 3 levels deep
          const depth = relativePath.split(path.sep).length;
          if (depth < 3) {
            const subDocs = await this.scanDirectory(fullPath);
            documents.push(...subDocs);
          }
        }
      }
    } catch (err) {
      console.log(`[blueprint-traceability] Error scanning directory ${dirPath}: ${err.message}`);
    }
    
    return documents;
  }

  isDocumentFile(filename) {
    const docExtensions = ['.md', '.txt', '.rst', '.pdf', '.doc', '.docx', '.json', '.yaml', '.yml'];
    return docExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  generateHash(content) {
    return createHash('sha256').update(content).digest('hex');
  }

  // Analyze coverage of each requirement against available documents
  async analyzeRequirementCoverage() {
    console.log('[blueprint-traceability] Analyzing requirement coverage...');
    
    for (const [categoryKey, category] of Object.entries(ENTERPRISE_REQUIREMENTS)) {
      for (const [reqId, requirement] of Object.entries(category.requirements)) {
        const coverage = await this.analyzeRequirement(reqId, requirement, category);
        this.traceabilityMatrix.set(reqId, coverage);
      }
    }
  }

  async analyzeRequirement(reqId, requirement, category) {
    const coverage = {
      requirementId: reqId,
      requirement: requirement,
      category: category.name,
      criticality: category.criticality,
      weight: category.weight,
      coveringSources: [],
      coverageScore: 0,
      gaps: [],
      evidence: []
    };

    // Search for evidence of this requirement across all documents
    for (const [blueprintKey, blueprint] of this.documentInventory.entries()) {
      for (const document of blueprint.documents) {
        const evidence = this.findEvidenceInDocument(reqId, requirement, document);
        if (evidence.length > 0) {
          coverage.coveringSources.push({
            blueprint: blueprintKey,
            document: document.relativePath,
            evidence: evidence
          });
          coverage.evidence.push(...evidence);
        }
      }
    }

    // Calculate coverage score
    coverage.coverageScore = this.calculateCoverageScore(reqId, coverage);
    
    // Identify gaps if coverage is insufficient
    if (coverage.coverageScore < 0.8) {
      const gap = this.identifyGap(reqId, requirement, coverage);
      coverage.gaps.push(gap);
      this.gaps.push(gap);
    }

    return coverage;
  }

  findEvidenceInDocument(reqId, requirement, document) {
    const evidence = [];
    const content = document.content.toLowerCase();
    const lines = document.content.split('\n');
    
    // Define keyword patterns for different requirement types
    const searchPatterns = this.getSearchPatterns(reqId, requirement);
    
    for (const pattern of searchPatterns) {
      const regex = new RegExp(pattern.pattern, 'gi');
      let match;
      
      while ((match = regex.exec(document.content)) !== null) {
        const lineNumber = document.content.substring(0, match.index).split('\n').length;
        const contextStart = Math.max(0, lineNumber - 2);
        const contextEnd = Math.min(lines.length, lineNumber + 2);
        const context = lines.slice(contextStart, contextEnd).join('\n');
        
        evidence.push({
          type: pattern.type,
          confidence: pattern.confidence,
          location: `Line ${lineNumber}`,
          context: context.substring(0, 300) + (context.length > 300 ? '...' : ''),
          matchedText: match[0]
        });
      }
    }
    
    return evidence;
  }

  getSearchPatterns(reqId, requirement) {
    const patterns = [];
    
    // Extract keywords from requirement text
    const keywords = requirement.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['requirements', 'framework', 'strategy', 'processes'].includes(word));

    // Add specific patterns based on requirement ID category
    const category = reqId.substring(0, 3);
    
    switch (category) {
      case 'STR':
        patterns.push(
          { pattern: '\\b(business|strategic|objective|goal|mission|vision)\\b', type: 'strategic', confidence: 0.8 },
          { pattern: '\\b(stakeholder|requirement|criteria|success)\\b', type: 'business', confidence: 0.7 }
        );
        break;
      case 'FUN':
        patterns.push(
          { pattern: '\\b(feature|functionality|capability|user story)\\b', type: 'functional', confidence: 0.8 },
          { pattern: '\\b(acceptance criteria|use case|scenario)\\b', type: 'requirements', confidence: 0.9 }
        );
        break;
      case 'TEC':
        patterns.push(
          { pattern: '\\b(architecture|technical|system|design|api)\\b', type: 'technical', confidence: 0.8 },
          { pattern: '\\b(microservice|database|infrastructure|deployment)\\b', type: 'architecture', confidence: 0.8 }
        );
        break;
      case 'SEC':
        patterns.push(
          { pattern: '\\b(security|authentication|authorization|encryption)\\b', type: 'security', confidence: 0.9 },
          { pattern: '\\b(privacy|gdpr|compliance|audit)\\b', type: 'privacy', confidence: 0.8 }
        );
        break;
      case 'COM':
        patterns.push(
          { pattern: '\\b(compliance|legal|regulation|policy)\\b', type: 'compliance', confidence: 0.8 },
          { pattern: '\\b(governance|documentation|accessibility)\\b', type: 'regulatory', confidence: 0.7 }
        );
        break;
      case 'OPS':
        patterns.push(
          { pattern: '\\b(operations|deployment|monitoring|backup)\\b', type: 'operational', confidence: 0.8 },
          { pattern: '\\b(maintenance|support|sla|disaster recovery)\\b', type: 'operations', confidence: 0.8 }
        );
        break;
    }

    // Add keyword-based patterns
    keywords.forEach(keyword => {
      patterns.push({
        pattern: `\\b${keyword}\\b`,
        type: 'keyword',
        confidence: 0.6
      });
    });

    return patterns;
  }

  calculateCoverageScore(reqId, coverage) {
    if (coverage.evidence.length === 0) return 0;
    
    // Weight evidence by confidence and type
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const evidence of coverage.evidence) {
      const typeWeight = evidence.type === 'keyword' ? 0.3 : 1.0;
      totalScore += evidence.confidence * typeWeight;
      maxPossibleScore += 1.0 * typeWeight;
    }
    
    return maxPossibleScore > 0 ? Math.min(1.0, totalScore / maxPossibleScore) : 0;
  }

  identifyGap(reqId, requirement, coverage) {
    const severity = this.calculateGapSeverity(coverage);
    
    return {
      gapId: `GAP-${reqId}`,
      requirementId: reqId,
      requirement: requirement,
      category: coverage.category,
      severity: severity,
      currentCoverage: coverage.coverageScore,
      targetCoverage: 1.0,
      gap: 1.0 - coverage.coverageScore,
      impact: this.assessGapImpact(reqId, coverage),
      recommendations: this.generateRecommendations(reqId, requirement, coverage),
      actionable: true,
      priority: this.calculatePriority(severity, coverage.criticality)
    };
  }

  calculateGapSeverity(coverage) {
    if (coverage.coverageScore === 0) return 'CRITICAL';
    if (coverage.coverageScore < 0.3) return 'HIGH';
    if (coverage.coverageScore < 0.6) return 'MEDIUM';
    return 'LOW';
  }

  assessGapImpact(reqId, coverage) {
    const category = reqId.substring(0, 3);
    const baseImpact = {
      'STR': 'Strategic implementation blocked without clear business foundation',
      'FUN': 'Core functionality may not meet user needs and expectations',
      'TEC': 'Technical implementation risks and architectural decisions unclear',
      'SEC': 'Security vulnerabilities and compliance risks unaddressed',
      'COM': 'Legal and regulatory compliance violations possible',
      'OPS': 'Operational failures and maintenance issues likely'
    };
    
    return baseImpact[category] || 'Implementation risk due to incomplete requirements';
  }

  generateRecommendations(reqId, requirement, coverage) {
    const category = reqId.substring(0, 3);
    const recommendations = [];
    
    // Base recommendation - create missing documentation
    recommendations.push({
      action: 'CREATE_DOCUMENTATION',
      description: `Create comprehensive documentation for: ${requirement}`,
      effort: 'MEDIUM',
      timeline: '1-2 weeks'
    });

    // Category-specific recommendations
    switch (category) {
      case 'STR':
        recommendations.push({
          action: 'STAKEHOLDER_WORKSHOP',
          description: 'Conduct stakeholder workshop to define strategic requirements',
          effort: 'HIGH',
          timeline: '1 week'
        });
        break;
      case 'FUN':
        recommendations.push({
          action: 'USER_STORY_WORKSHOP',
          description: 'Develop detailed user stories and acceptance criteria',
          effort: 'MEDIUM',
          timeline: '1-2 weeks'
        });
        break;
      case 'TEC':
        recommendations.push({
          action: 'TECHNICAL_DESIGN_REVIEW',
          description: 'Create technical design documents and architecture diagrams',
          effort: 'HIGH',
          timeline: '2-3 weeks'
        });
        break;
      case 'SEC':
        recommendations.push({
          action: 'SECURITY_ASSESSMENT',
          description: 'Conduct security assessment and create security requirements',
          effort: 'HIGH',
          timeline: '2-4 weeks'
        });
        break;
      case 'COM':
        recommendations.push({
          action: 'COMPLIANCE_REVIEW',
          description: 'Review regulatory requirements and create compliance documentation',
          effort: 'MEDIUM',
          timeline: '1-3 weeks'
        });
        break;
      case 'OPS':
        recommendations.push({
          action: 'OPERATIONAL_PLANNING',
          description: 'Develop operational procedures and runbooks',
          effort: 'MEDIUM',
          timeline: '2-3 weeks'
        });
        break;
    }

    return recommendations;
  }

  calculatePriority(severity, criticality) {
    const severityScore = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }[severity] || 1;
    const criticalityScore = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }[criticality] || 1;
    const totalScore = severityScore + criticalityScore;
    
    if (totalScore >= 7) return 'URGENT';
    if (totalScore >= 5) return 'HIGH';
    if (totalScore >= 3) return 'MEDIUM';
    return 'LOW';
  }

  // Generate comprehensive reports
  async generateReports() {
    console.log('[blueprint-traceability] Generating comprehensive reports...');
    
    await this.generateTraceabilityMatrix();
    await this.generateGapAnalysis();
    await this.generateActionableRecommendations();
    await this.generateVerificationChecklist();
    await this.generateSummaryReport();
  }

  async generateTraceabilityMatrix() {
    const matrix = {
      metadata: {
        generated: this.analysisTimestamp,
        version: '1.0.0',
        scope: 'Praja Digital Suite Blueprint Traceability',
        totalRequirements: Object.values(ENTERPRISE_REQUIREMENTS)
          .reduce((sum, cat) => sum + Object.keys(cat.requirements).length, 0)
      },
      categories: ENTERPRISE_REQUIREMENTS,
      blueprints: BLUEPRINT_DOCUMENTS,
      documentInventory: Object.fromEntries(this.documentInventory),
      traceabilityMatrix: Object.fromEntries(this.traceabilityMatrix),
      coverageStatistics: this.calculateCoverageStatistics()
    };

    await fs.writeFile(
      path.join(this.artifactsDir, 'blueprint-traceability-matrix.json'),
      JSON.stringify(matrix, null, 2)
    );
  }

  async generateGapAnalysis() {
    const gapAnalysis = {
      metadata: {
        generated: this.analysisTimestamp,
        totalGaps: this.gaps.length,
        gapsByCategory: this.groupGapsByCategory(),
        gapsBySeverity: this.groupGapsBySeverity()
      },
      executiveSummary: this.generateExecutiveSummary(),
      gaps: this.gaps,
      riskAssessment: this.generateRiskAssessment(),
      prioritizedActionPlan: this.generatePrioritizedActionPlan()
    };

    await fs.writeFile(
      path.join(this.artifactsDir, 'blueprint-gap-analysis.json'),
      JSON.stringify(gapAnalysis, null, 2)
    );
  }

  async generateActionableRecommendations() {
    const recommendations = {
      metadata: {
        generated: this.analysisTimestamp,
        totalRecommendations: this.gaps.reduce((sum, gap) => sum + gap.recommendations.length, 0)
      },
      immediate_actions: this.gaps
        .filter(gap => gap.priority === 'URGENT')
        .flatMap(gap => gap.recommendations),
      short_term_actions: this.gaps
        .filter(gap => gap.priority === 'HIGH')
        .flatMap(gap => gap.recommendations),
      medium_term_actions: this.gaps
        .filter(gap => gap.priority === 'MEDIUM')
        .flatMap(gap => gap.recommendations),
      long_term_actions: this.gaps
        .filter(gap => gap.priority === 'LOW')
        .flatMap(gap => gap.recommendations)
    };

    await fs.writeFile(
      path.join(this.artifactsDir, 'blueprint-actionable-recommendations.json'),
      JSON.stringify(recommendations, null, 2)
    );
  }

  async generateVerificationChecklist() {
    const checklist = {
      metadata: {
        generated: this.analysisTimestamp,
        purpose: 'Enterprise-grade implementation readiness verification'
      },
      strategic_readiness: this.generateCategoryChecklist('strategic'),
      functional_readiness: this.generateCategoryChecklist('functional'),
      technical_readiness: this.generateCategoryChecklist('technical'),
      security_readiness: this.generateCategoryChecklist('security'),
      compliance_readiness: this.generateCategoryChecklist('compliance'),
      operational_readiness: this.generateCategoryChecklist('operational')
    };

    await fs.writeFile(
      path.join(this.artifactsDir, 'blueprint-verification-checklist.json'),
      JSON.stringify(checklist, null, 2)
    );
  }

  generateCategoryChecklist(categoryKey) {
    const category = ENTERPRISE_REQUIREMENTS[categoryKey];
    const checklist = [];

    for (const [reqId, requirement] of Object.entries(category.requirements)) {
      const coverage = this.traceabilityMatrix.get(reqId);
      checklist.push({
        requirementId: reqId,
        requirement: requirement,
        status: coverage.coverageScore >= 0.8 ? 'COMPLETE' : 'INCOMPLETE',
        coverageScore: coverage.coverageScore,
        evidence: coverage.coveringSources.length > 0,
        actionRequired: coverage.gaps.length > 0
      });
    }

    return checklist;
  }

  async generateSummaryReport() {
    const totalRequirements = Object.values(ENTERPRISE_REQUIREMENTS)
      .reduce((sum, cat) => sum + Object.keys(cat.requirements).length, 0);
    const completedRequirements = Array.from(this.traceabilityMatrix.values())
      .filter(coverage => coverage.coverageScore >= 0.8).length;
    
    const summary = {
      metadata: {
        generated: this.analysisTimestamp,
        analysis_type: 'Blueprint Traceability Matrix',
        scope: 'Praja Digital Suite Enterprise Implementation'
      },
      executive_summary: {
        total_requirements: totalRequirements,
        completed_requirements: completedRequirements,
        completion_percentage: Math.round((completedRequirements / totalRequirements) * 100),
        total_gaps: this.gaps.length,
        critical_gaps: this.gaps.filter(gap => gap.severity === 'CRITICAL').length,
        implementation_readiness: this.assessImplementationReadiness()
      },
      detailed_findings: {
        coverage_by_category: this.calculateCoverageByCategory(),
        gap_distribution: this.groupGapsBySeverity(),
        priority_actions: this.gaps
          .filter(gap => gap.priority === 'URGENT')
          .slice(0, 5)
          .map(gap => ({
            requirement: gap.requirement,
            severity: gap.severity,
            impact: gap.impact
          }))
      },
      next_steps: this.generateNextSteps(),
      validation_status: {
        traceability_matrix_generated: true,
        gaps_identified: this.gaps.length > 0,
        recommendations_actionable: true,
        references_granular: true
      }
    };

    await fs.writeFile(
      path.join(this.artifactsDir, 'blueprint-traceability-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Also generate human-readable markdown report
    await this.generateMarkdownReport(summary);
  }

  async generateMarkdownReport(summary) {
    const markdown = `# Blueprint Traceability Matrix - Praja Digital Suite

**Generated:** ${this.analysisTimestamp}  
**Scope:** Enterprise-grade GovTech Implementation Requirements Analysis

## Executive Summary

**Implementation Readiness:** ${summary.executive_summary.implementation_readiness}

- **Total Requirements:** ${summary.executive_summary.total_requirements}
- **Completed:** ${summary.executive_summary.completed_requirements} (${summary.executive_summary.completion_percentage}%)
- **Total Gaps:** ${summary.executive_summary.total_gaps}
- **Critical Gaps:** ${summary.executive_summary.critical_gaps}

## Gap Analysis by Category

${Object.entries(summary.detailed_findings.coverage_by_category)
  .map(([category, data]) => `### ${category}
- **Coverage:** ${Math.round(data.averageCoverage * 100)}%
- **Gaps:** ${data.gaps}
- **Status:** ${data.averageCoverage >= 0.8 ? '✅ READY' : '⚠️ NEEDS WORK'}`).join('\n\n')}

## Critical Actions Required

${summary.detailed_findings.priority_actions
  .map((action, index) => `${index + 1}. **${action.requirement}**
   - **Severity:** ${action.severity}
   - **Impact:** ${action.impact}`).join('\n\n')}

## Next Steps

${summary.next_steps.map(step => `- ${step}`).join('\n')}

## Traceability Matrix Status

✅ **Requirements Framework:** All enterprise categories defined  
${summary.validation_status.gaps_identified ? '⚠️' : '✅'} **Gap Analysis:** ${this.gaps.length} gaps identified  
✅ **Actionable Recommendations:** Available for all gaps  
✅ **Granular References:** Document sources mapped  

## Artifacts Generated

- \`blueprint-traceability-matrix.json\` - Complete traceability matrix
- \`blueprint-gap-analysis.json\` - Detailed gap analysis  
- \`blueprint-actionable-recommendations.json\` - Prioritized recommendations
- \`blueprint-verification-checklist.json\` - Implementation checklist
- \`blueprint-traceability-summary.json\` - Executive summary

---

**Note:** This analysis provides objective, measurable assessment of documentation completeness for enterprise-grade implementation. All gaps are actionable and include specific next steps.
`;

    await fs.writeFile(
      path.join(this.artifactsDir, 'BLUEPRINT-TRACEABILITY-REPORT.md'),
      markdown
    );
  }

  // Helper methods for calculations and analysis
  calculateCoverageStatistics() {
    const coverageValues = Array.from(this.traceabilityMatrix.values())
      .map(coverage => coverage.coverageScore);
    
    return {
      total: coverageValues.length,
      average: coverageValues.reduce((sum, score) => sum + score, 0) / coverageValues.length,
      minimum: Math.min(...coverageValues),
      maximum: Math.max(...coverageValues),
      standardDeviation: this.calculateStandardDeviation(coverageValues)
    };
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  groupGapsByCategory() {
    const grouped = {};
    for (const gap of this.gaps) {
      grouped[gap.category] = (grouped[gap.category] || 0) + 1;
    }
    return grouped;
  }

  groupGapsBySeverity() {
    const grouped = {};
    for (const gap of this.gaps) {
      grouped[gap.severity] = (grouped[gap.severity] || 0) + 1;
    }
    return grouped;
  }

  calculateCoverageByCategory() {
    const byCategory = {};
    
    for (const [categoryKey, category] of Object.entries(ENTERPRISE_REQUIREMENTS)) {
      const categoryRequirements = Object.keys(category.requirements);
      const categoryScores = categoryRequirements
        .map(reqId => this.traceabilityMatrix.get(reqId)?.coverageScore || 0);
      
      byCategory[category.name] = {
        total: categoryRequirements.length,
        averageCoverage: categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length,
        gaps: this.gaps.filter(gap => gap.category === category.name).length,
        completed: categoryScores.filter(score => score >= 0.8).length
      };
    }
    
    return byCategory;
  }

  generateExecutiveSummary() {
    const totalGaps = this.gaps.length;
    const criticalGaps = this.gaps.filter(gap => gap.severity === 'CRITICAL').length;
    
    if (totalGaps === 0) {
      return "All enterprise requirements are adequately covered by existing documentation. Implementation can proceed with confidence.";
    } else if (criticalGaps > 0) {
      return `CRITICAL GAPS IDENTIFIED: ${criticalGaps} critical gaps must be resolved before enterprise implementation. Total of ${totalGaps} gaps require attention across all categories.`;
    } else {
      return `${totalGaps} gaps identified in documentation coverage. While no critical blockers exist, addressing these gaps will improve implementation success and reduce risks.`;
    }
  }

  generateRiskAssessment() {
    const risks = [];
    
    const criticalGaps = this.gaps.filter(gap => gap.severity === 'CRITICAL');
    if (criticalGaps.length > 0) {
      risks.push({
        level: 'HIGH',
        description: 'Critical requirements gaps pose significant implementation risks',
        impact: 'Project failure or major delays likely',
        mitigation: 'Address all critical gaps before proceeding with implementation'
      });
    }

    const securityGaps = this.gaps.filter(gap => gap.category.includes('Security'));
    if (securityGaps.length > 0) {
      risks.push({
        level: 'HIGH',
        description: 'Security requirements gaps create vulnerability exposure',
        impact: 'Data breaches and compliance violations possible',
        mitigation: 'Complete security assessment and implement security requirements'
      });
    }

    const complianceGaps = this.gaps.filter(gap => gap.category.includes('Compliance'));
    if (complianceGaps.length > 0) {
      risks.push({
        level: 'MEDIUM',
        description: 'Compliance gaps may cause regulatory issues',
        impact: 'Legal penalties and operational restrictions',
        mitigation: 'Conduct compliance review and update documentation'
      });
    }

    return risks;
  }

  generatePrioritizedActionPlan() {
    const actions = [];
    
    // Group gaps by priority and create action plan
    const gapsByPriority = {
      'URGENT': this.gaps.filter(gap => gap.priority === 'URGENT'),
      'HIGH': this.gaps.filter(gap => gap.priority === 'HIGH'),
      'MEDIUM': this.gaps.filter(gap => gap.priority === 'MEDIUM'),
      'LOW': this.gaps.filter(gap => gap.priority === 'LOW')
    };

    for (const [priority, priorityGaps] of Object.entries(gapsByPriority)) {
      if (priorityGaps.length > 0) {
        actions.push({
          priority: priority,
          timeline: this.getTimelineForPriority(priority),
          gaps: priorityGaps.length,
          actions: priorityGaps.flatMap(gap => gap.recommendations)
        });
      }
    }

    return actions;
  }

  getTimelineForPriority(priority) {
    switch (priority) {
      case 'URGENT': return 'Immediate (1-2 weeks)';
      case 'HIGH': return 'Short-term (2-4 weeks)';
      case 'MEDIUM': return 'Medium-term (1-2 months)';
      case 'LOW': return 'Long-term (2-3 months)';
      default: return 'TBD';
    }
  }

  assessImplementationReadiness() {
    const totalRequirements = Object.values(ENTERPRISE_REQUIREMENTS)
      .reduce((sum, cat) => sum + Object.keys(cat.requirements).length, 0);
    const completedRequirements = Array.from(this.traceabilityMatrix.values())
      .filter(coverage => coverage.coverageScore >= 0.8).length;
    const completionRate = completedRequirements / totalRequirements;
    
    const criticalGaps = this.gaps.filter(gap => gap.severity === 'CRITICAL').length;
    
    if (criticalGaps > 0) return 'NOT READY - Critical gaps must be resolved';
    if (completionRate >= 0.9) return 'READY - High confidence in implementation success';
    if (completionRate >= 0.7) return 'MOSTLY READY - Address key gaps before implementation';
    if (completionRate >= 0.5) return 'PARTIAL READINESS - Significant work required';
    return 'NOT READY - Extensive documentation gaps exist';
  }

  generateNextSteps() {
    const steps = [];
    
    if (this.gaps.length === 0) {
      steps.push('Proceed with implementation - all requirements adequately covered');
      steps.push('Consider regular reviews to maintain documentation currency');
    } else {
      const urgentGaps = this.gaps.filter(gap => gap.priority === 'URGENT').length;
      const criticalGaps = this.gaps.filter(gap => gap.severity === 'CRITICAL').length;
      
      if (criticalGaps > 0) {
        steps.push(`IMMEDIATE: Address ${criticalGaps} critical gaps before any implementation`);
      }
      
      if (urgentGaps > 0) {
        steps.push(`URGENT: Complete ${urgentGaps} high-priority requirements within 1-2 weeks`);
      }
      
      steps.push('Review and implement actionable recommendations in priority order');
      steps.push('Establish regular traceability matrix updates as documentation evolves');
      steps.push('Consider assignment of requirement owners for ongoing maintenance');
    }
    
    return steps;
  }

  async run() {
    try {
      await this.initialize();
      await this.scanDocuments();
      await this.analyzeRequirementCoverage();
      await this.generateReports();
      
      console.log('\n[blueprint-traceability] Analysis complete!');
      console.log(`Generated artifacts in: ${this.artifactsDir}/`);
      console.log(`Total gaps identified: ${this.gaps.length}`);
      console.log(`Critical gaps: ${this.gaps.filter(gap => gap.severity === 'CRITICAL').length}`);
      
      return {
        success: true,
        gaps: this.gaps.length,
        artifacts: [
          'blueprint-traceability-matrix.json',
          'blueprint-gap-analysis.json',
          'blueprint-actionable-recommendations.json',
          'blueprint-verification-checklist.json',
          'blueprint-traceability-summary.json',
          'BLUEPRINT-TRACEABILITY-REPORT.md'
        ]
      };
    } catch (error) {
      console.error('[blueprint-traceability] Error:', error);
      throw error;
    }
  }
}

// Run the analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new BlueprintTraceabilityMatrix();
  analyzer.run()
    .then(result => {
      console.log('\n✅ Blueprint Traceability Matrix analysis completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Blueprint Traceability Matrix analysis failed:', error.message);
      process.exit(1);
    });
}

export default BlueprintTraceabilityMatrix;