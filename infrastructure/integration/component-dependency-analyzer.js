/**
 * Component Dependency Analyzer
 * Lead Infrastructure Architect: Component dependency mapping and documentation
 *
 * Analyzes dependencies between 35+ infrastructure components and generates
 * comprehensive startup order documentation and dependency visualization
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

/**
 * Component Dependency Analyzer
 * Provides detailed analysis of component dependencies and startup orchestration
 */
export class ComponentDependencyAnalyzer extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      analyzerName: 'merajutasa-dependency-analyzer',
      enableCriticalPathAnalysis: true,
      enableCircularDependencyDetection: true,
      enableStartupOptimization: true,
      generateVisualization: true,
      ...config,
    };

    this.components = new Map();
    this.dependencyMatrix = new Map();
    this.circularDependencies = [];
    this.criticalPaths = [];
    this.startupPhases = new Map();
    this.optimizationRecommendations = [];

    this.analysisMetrics = {
      totalComponents: 0,
      totalDependencies: 0,
      circularDependencyCount: 0,
      criticalPathCount: 0,
      maxDependencyDepth: 0,
      averageDependencyCount: 0,
      lastAnalysis: null,
    };

    this.analyzerState = {
      initialized: false,
      analysisComplete: false,
      lastRun: null,
      errorHistory: [],
    };
  }

  /**
   * Initialize the dependency analyzer
   */
  async initialize() {
    console.log('🔍 Initializing Component Dependency Analyzer...');

    try {
      // Load component information
      await this.loadComponentRegistry();

      // Build comprehensive dependency matrix
      await this.buildDependencyMatrix();

      // Detect circular dependencies
      if (this.config.enableCircularDependencyDetection) {
        await this.detectCircularDependencies();
      }

      // Analyze critical paths
      if (this.config.enableCriticalPathAnalysis) {
        await this.analyzeCriticalPaths();
      }

      // Generate startup phases
      await this.generateStartupPhases();

      // Generate optimization recommendations
      if (this.config.enableStartupOptimization) {
        await this.generateOptimizationRecommendations();
      }

      this.analyzerState.initialized = true;
      this.analyzerState.analysisComplete = true;
      this.analyzerState.lastRun = new Date();
      this.analysisMetrics.lastAnalysis = new Date();

      console.log('✅ Component Dependency Analysis completed');
      console.log(`📊 Analyzed ${this.components.size} components`);
      console.log(`🔗 Mapped ${this.analysisMetrics.totalDependencies} dependencies`);
      console.log(`📋 Generated ${this.startupPhases.size} startup phases`);

      this.emit('analysis-completed', {
        components: this.components.size,
        dependencies: this.analysisMetrics.totalDependencies,
        phases: this.startupPhases.size,
        timestamp: new Date(),
      });

      return {
        success: true,
        components: this.components.size,
        dependencies: this.analysisMetrics.totalDependencies,
        circularDependencies: this.circularDependencies.length,
        criticalPaths: this.criticalPaths.length,
        startupPhases: this.startupPhases.size,
      };
    } catch (error) {
      console.error('❌ Failed to initialize Component Dependency Analyzer:', error.message);
      this.analyzerState.errorHistory.push({
        phase: 'initialization',
        error: error.message,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Load component registry from infrastructure
   */
  async loadComponentRegistry() {
    console.log('📚 Loading component registry...');

    const infrastructurePath = path.join(process.cwd(), 'infrastructure');
    const componentTypes = [
      'api-gateway', 'auth', 'backup', 'cicd', 'compliance',
      'docker', 'high-availability', 'kubernetes', 'monitoring',
      'observability', 'performance', 'reverse-proxy', 'security', 'terraform',
    ];

    for (const componentType of componentTypes) {
      try {
        const componentPath = path.join(infrastructurePath, componentType);
        await this.loadComponentsFromDirectory(componentType, componentPath);
      } catch (error) {
        console.warn(`⚠️ Could not load components from ${componentType}: ${error.message}`);
      }
    }

    // Add integration component
    const integrationPath = path.join(infrastructurePath, 'integration');
    await this.loadComponentsFromDirectory('integration', integrationPath);

    this.analysisMetrics.totalComponents = this.components.size;
    console.log(`✅ Loaded ${this.components.size} components from registry`);
  }

  /**
   * Load components from a specific directory
   */
  async loadComponentsFromDirectory(componentType, dirPath) {
    try {
      const files = await fs.readdir(dirPath, { recursive: true });

      for (const file of files) {
        if (file.endsWith('.js')) {
          const componentName = path.basename(file, '.js');
          const componentId = `${componentType}/${componentName}`;

          const component = {
            id: componentId,
            name: componentName,
            type: componentType,
            path: path.join(dirPath, file),
            dependencies: [],
            dependents: [],
            phase: 0,
            criticality: 'medium',
            startupPriority: 0,
            loadedAt: new Date(),
          };

          // Analyze component file for dependencies
          await this.analyzeComponentDependencies(component);

          this.components.set(componentId, component);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Analyze component dependencies from source code
   */
  async analyzeComponentDependencies(component) {
    try {
      const content = await fs.readFile(component.path, 'utf8');

      // Look for import statements that reference other infrastructure components
      const importRegex = /import.*from\s+['"`]\.\.?\/.*?['"`]/g;
      const imports = content.match(importRegex) || [];

      for (const importStatement of imports) {
        const pathMatch = importStatement.match(/['"`](\.\.?\/.*?)['"`]/);
        if (pathMatch) {
          const importPath = pathMatch[1];
          // Resolve relative paths to component types
          const dependencyType = this.resolveDependencyType(importPath, component.type);
          if (dependencyType) {
            component.dependencies.push(dependencyType);
          }
        }
      }

      // Remove duplicates
      component.dependencies = [...new Set(component.dependencies)];

    } catch (error) {
      console.warn(`⚠️ Could not analyze dependencies for ${component.id}: ${error.message}`);
    }
  }

  /**
   * Resolve dependency type from import path
   */
  resolveDependencyType(importPath, currentType) {
    // Map import paths to component types
    const pathTypeMapping = {
      '../security/': 'security',
      '../auth/': 'auth',
      '../monitoring/': 'monitoring',
      '../observability/': 'observability',
      '../performance/': 'performance',
      '../api-gateway/': 'api-gateway',
      '../high-availability/': 'high-availability',
      '../compliance/': 'compliance',
      '../cicd/': 'cicd',
      '../backup/': 'backup',
      '../reverse-proxy/': 'reverse-proxy',
      '../docker/': 'docker',
      '../kubernetes/': 'kubernetes',
      '../terraform/': 'terraform',
    };

    for (const [pathPattern, componentType] of Object.entries(pathTypeMapping)) {
      if (importPath.includes(pathPattern)) {
        return componentType;
      }
    }

    return null;
  }

  /**
   * Build comprehensive dependency matrix
   */
  async buildDependencyMatrix() {
    console.log('🔗 Building dependency matrix...');

    // Enhanced dependency rules based on infrastructure architecture
    const dependencyRules = {
      'security': [],
      'auth': ['security'],
      'backup': ['security'],
      'monitoring': ['security'],
      'observability': ['monitoring', 'security'],
      'performance': ['monitoring', 'observability'],
      'api-gateway': ['auth', 'security', 'monitoring', 'performance'],
      'high-availability': ['monitoring', 'observability', 'performance'],
      'compliance': ['security', 'auth', 'monitoring', 'observability'],
      'cicd': ['security', 'auth', 'monitoring', 'docker'],
      'reverse-proxy': ['security', 'monitoring'],
      'docker': ['security'],
      'kubernetes': ['docker', 'security', 'monitoring'],
      'terraform': ['security'],
      'integration': ['security', 'monitoring', 'observability'],
    };

    let totalDependencies = 0;

    // Build matrix based on rules and discovered dependencies
    for (const [componentId, component] of this.components) {
      const componentType = component.type;
      const ruleDependencies = dependencyRules[componentType] || [];

      // Combine rule-based and discovered dependencies
      const allDependencies = [...new Set([...ruleDependencies, ...component.dependencies])];

      for (const depType of allDependencies) {
        // Find all components of the dependency type
        const dependencyComponents = Array.from(this.components.values())
          .filter(c => c.type === depType && c.id !== componentId);

        for (const depComponent of dependencyComponents) {
          // Add dependency relationship
          if (!this.dependencyMatrix.has(componentId)) {
            this.dependencyMatrix.set(componentId, new Set());
          }
          this.dependencyMatrix.get(componentId).add(depComponent.id);

          // Add reverse dependency (dependent relationship)
          depComponent.dependents.push(componentId);
          totalDependencies++;
        }
      }
    }

    this.analysisMetrics.totalDependencies = totalDependencies;
    this.analysisMetrics.averageDependencyCount = totalDependencies / this.components.size;

    console.log(`✅ Built dependency matrix with ${totalDependencies} relationships`);
  }

  /**
   * Detect circular dependencies
   */
  async detectCircularDependencies() {
    console.log('🔄 Detecting circular dependencies...');

    const visited = new Set();
    const visiting = new Set();

    const detectCycle = (componentId, path = []) => {
      if (visiting.has(componentId)) {
        // Found a cycle
        const cycleStart = path.indexOf(componentId);
        const cycle = path.slice(cycleStart).concat([componentId]);
        this.circularDependencies.push({
          cycle,
          length: cycle.length - 1,
          severity: this.calculateCycleSeverity(cycle),
          detectedAt: new Date(),
        });
        return;
      }

      if (visited.has(componentId)) {
        return;
      }

      visiting.add(componentId);
      path.push(componentId);

      const dependencies = this.dependencyMatrix.get(componentId) || new Set();
      for (const depId of dependencies) {
        detectCycle(depId, [...path]);
      }

      visiting.delete(componentId);
      visited.add(componentId);
      path.pop();
    };

    // Check each component for cycles
    for (const componentId of this.components.keys()) {
      if (!visited.has(componentId)) {
        detectCycle(componentId);
      }
    }

    this.analysisMetrics.circularDependencyCount = this.circularDependencies.length;

    if (this.circularDependencies.length > 0) {
      console.warn(`⚠️ Detected ${this.circularDependencies.length} circular dependencies`);
      this.circularDependencies.forEach((cycle, index) => {
        console.warn(`   Cycle ${index + 1}: ${cycle.cycle.join(' → ')}`);
      });
    } else {
      console.log('✅ No circular dependencies detected');
    }
  }

  /**
   * Calculate cycle severity
   */
  calculateCycleSeverity(cycle) {
    // Determine severity based on cycle length and component criticality
    if (cycle.length <= 3) {return 'low';}
    if (cycle.length <= 5) {return 'medium';}
    return 'high';
  }

  /**
   * Analyze critical paths in the dependency graph
   */
  async analyzeCriticalPaths() {
    console.log('🎯 Analyzing critical paths...');

    // Identify components with high impact (many dependents)
    for (const [componentId, component] of this.components) {
      const dependentCount = component.dependents.length;
      const dependencies = this.dependencyMatrix.get(componentId)?.size || 0;

      // Calculate criticality score
      const criticalityScore = (dependentCount * 2) + dependencies;

      if (criticalityScore >= 5) {
        const criticalPath = {
          component: componentId,
          type: component.type,
          dependents: component.dependents,
          dependencies: Array.from(this.dependencyMatrix.get(componentId) || []),
          criticalityScore,
          impact: dependentCount > 5 ? 'high' : dependentCount > 2 ? 'medium' : 'low',
          reason: `${dependentCount} components depend on this service`,
          analysisDate: new Date(),
        };

        this.criticalPaths.push(criticalPath);
        component.criticality = criticalPath.impact;
      }
    }

    // Sort by criticality score
    this.criticalPaths.sort((a, b) => b.criticalityScore - a.criticalityScore);

    this.analysisMetrics.criticalPathCount = this.criticalPaths.length;
    console.log(`✅ Identified ${this.criticalPaths.length} critical paths`);
  }

  /**
   * Generate startup phases
   */
  async generateStartupPhases() {
    console.log('📋 Generating startup phases...');

    // Calculate startup phase for each component based on dependency depth
    const componentPhases = new Map();
    const calculating = new Set(); // To detect circular dependencies during calculation

    const calculatePhase = (componentId, depth = 0) => {
      // Prevent infinite recursion
      if (depth > 20) {
        console.warn(`⚠️ Max depth reached for ${componentId}, assigning to phase 10`);
        return 10;
      }

      if (componentPhases.has(componentId)) {
        return componentPhases.get(componentId);
      }

      // Detect circular dependency during calculation
      if (calculating.has(componentId)) {
        console.warn(`⚠️ Circular dependency detected for ${componentId}, breaking cycle`);
        componentPhases.set(componentId, depth + 1);
        return depth + 1;
      }

      calculating.add(componentId);

      const dependencies = this.dependencyMatrix.get(componentId) || new Set();
      if (dependencies.size === 0) {
        componentPhases.set(componentId, 1);
        calculating.delete(componentId);
        return 1;
      }

      let maxDepPhase = 0;
      for (const depId of dependencies) {
        if (this.components.has(depId)) {
          maxDepPhase = Math.max(maxDepPhase, calculatePhase(depId, depth + 1));
        }
      }

      const phase = Math.min(maxDepPhase + 1, 10); // Cap at phase 10
      componentPhases.set(componentId, phase);
      calculating.delete(componentId);
      return phase;
    };

    // Calculate phases for all components
    for (const componentId of this.components.keys()) {
      if (!componentPhases.has(componentId)) {
        const phase = calculatePhase(componentId);
        this.components.get(componentId).phase = phase;

        if (!this.startupPhases.has(phase)) {
          this.startupPhases.set(phase, []);
        }
        this.startupPhases.get(phase).push(componentId);
      }
    }

    // Calculate max depth
    this.analysisMetrics.maxDependencyDepth = componentPhases.size > 0 ? Math.max(...componentPhases.values()) : 1;

    console.log(`✅ Generated ${this.startupPhases.size} startup phases`);
    console.log(`📊 Maximum dependency depth: ${this.analysisMetrics.maxDependencyDepth}`);

    // Log circular dependency impact
    if (this.circularDependencies.length > 0) {
      console.warn(`⚠️ ${this.circularDependencies.length} circular dependencies may affect startup order`);
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations() {
    console.log('💡 Generating optimization recommendations...');

    // Analyze for optimization opportunities

    // 1. Components with too many dependencies
    for (const [componentId, component] of this.components) {
      const dependencies = this.dependencyMatrix.get(componentId)?.size || 0;
      if (dependencies > 5) {
        this.optimizationRecommendations.push({
          type: 'high-dependency-count',
          priority: 'medium',
          component: componentId,
          issue: `Component has ${dependencies} dependencies`,
          recommendation: 'Consider breaking down into smaller, more focused components',
          impact: 'Improved maintainability and reduced coupling',
        });
      }
    }

    // 2. Components with too many dependents
    for (const [componentId, component] of this.components) {
      const dependentCount = component.dependents.length;
      if (dependentCount > 8) {
        this.optimizationRecommendations.push({
          type: 'high-dependent-count',
          priority: 'high',
          component: componentId,
          issue: `Component has ${dependentCount} dependents`,
          recommendation: 'Consider implementing facade or adapter patterns to reduce direct dependencies',
          impact: 'Reduced risk of cascading failures and improved system resilience',
        });
      }
    }

    // 3. Deep dependency chains
    for (const [componentId, component] of this.components) {
      if (component.phase > 4) {
        this.optimizationRecommendations.push({
          type: 'deep-dependency-chain',
          priority: 'medium',
          component: componentId,
          issue: `Component is in phase ${component.phase}, indicating deep dependency chain`,
          recommendation: 'Consider flattening dependency hierarchy or introducing parallel startup',
          impact: 'Faster startup times and reduced complexity',
        });
      }
    }

    // 4. Circular dependency recommendations
    if (this.circularDependencies.length > 0) {
      for (const cycle of this.circularDependencies) {
        this.optimizationRecommendations.push({
          type: 'circular-dependency',
          priority: 'critical',
          component: cycle.cycle.join(' → '),
          issue: 'Circular dependency detected',
          recommendation: 'Break circular dependency by introducing dependency injection or event-driven communication',
          impact: 'Eliminates circular dependencies and improves system architecture',
        });
      }
    }

    console.log(`✅ Generated ${this.optimizationRecommendations.length} optimization recommendations`);
  }

  /**
   * Generate comprehensive dependency documentation
   */
  async generateDependencyDocumentation() {
    const documentation = {
      metadata: {
        title: 'Infrastructure Component Dependency Analysis',
        generatedAt: new Date(),
        version: '1.0.0',
        architect: 'Lead Infrastructure Architect',
        analyzer: this.config.analyzerName,
      },

      executive_summary: {
        total_components: this.analysisMetrics.totalComponents,
        total_dependencies: this.analysisMetrics.totalDependencies,
        startup_phases: this.startupPhases.size,
        critical_paths: this.analysisMetrics.criticalPathCount,
        circular_dependencies: this.analysisMetrics.circularDependencyCount,
        max_dependency_depth: this.analysisMetrics.maxDependencyDepth,
        health_score: this.calculateSystemHealthScore(),
      },

      startup_orchestration: {
        phases: Array.from(this.startupPhases.entries()).map(([phase, componentIds]) => ({
          phase,
          description: this.getPhaseDescription(phase),
          components: componentIds.map(id => {
            const component = this.components.get(id);
            return {
              id,
              name: component?.name,
              type: component?.type,
              criticality: component?.criticality,
              dependencies: Array.from(this.dependencyMatrix.get(id) || []),
            };
          }),
          parallel_startup: componentIds.length > 1,
          estimated_startup_time: this.estimatePhaseStartupTime(phase),
        })),

        recommended_startup_order: this.generateRecommendedStartupOrder(),

        startup_script_template: this.generateStartupScriptTemplate(),
      },

      dependency_analysis: {
        dependency_matrix: this.exportDependencyMatrix(),
        critical_paths: this.criticalPaths,
        circular_dependencies: this.circularDependencies,
        component_details: Array.from(this.components.values()).map(component => ({
          id: component.id,
          name: component.name,
          type: component.type,
          phase: component.phase,
          criticality: component.criticality,
          dependencies: Array.from(this.dependencyMatrix.get(component.id) || []),
          dependents: component.dependents,
          dependency_count: this.dependencyMatrix.get(component.id)?.size || 0,
          dependent_count: component.dependents.length,
        })),
      },

      optimization_recommendations: {
        recommendations: this.optimizationRecommendations,
        priority_actions: this.optimizationRecommendations
          .filter(r => r.priority === 'critical' || r.priority === 'high')
          .slice(0, 5),
        system_improvements: this.generateSystemImprovements(),
      },

      visualization_data: this.config.generateVisualization ? this.generateVisualizationData() : null,
    };

    return documentation;
  }

  /**
   * Calculate system health score based on dependency analysis
   */
  calculateSystemHealthScore() {
    let score = 100;

    // Deduct for circular dependencies
    score -= this.circularDependencies.length * 15;

    // Deduct for high-risk components
    const highRiskComponents = this.criticalPaths.filter(p => p.impact === 'high').length;
    score -= highRiskComponents * 10;

    // Deduct for deep dependency chains
    if (this.analysisMetrics.maxDependencyDepth > 5) {
      score -= (this.analysisMetrics.maxDependencyDepth - 5) * 5;
    }

    // Deduct for high average dependency count
    if (this.analysisMetrics.averageDependencyCount > 3) {
      score -= (this.analysisMetrics.averageDependencyCount - 3) * 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get description for startup phase
   */
  getPhaseDescription(phase) {
    const descriptions = {
      1: 'Foundation Layer - Core security, authentication, and basic monitoring components',
      2: 'Infrastructure Layer - Container orchestration, backup systems, and basic services',
      3: 'Observability Layer - Advanced monitoring, metrics collection, and logging systems',
      4: 'Service Layer - API Gateway, performance optimization, and proxy services',
      5: 'Orchestration Layer - High availability, CI/CD, and compliance management',
      6: 'Integration Layer - Cross-component coordination and advanced analytics',
    };

    return descriptions[phase] || `Phase ${phase} - Advanced integration and specialized components`;
  }

  /**
   * Estimate startup time for a phase
   */
  estimatePhaseStartupTime(phase) {
    const baseTime = 30; // 30 seconds base
    const phaseMultiplier = phase * 10; // Additional 10 seconds per phase
    const componentCount = this.startupPhases.get(phase)?.length || 0;
    const componentTime = componentCount * 5; // 5 seconds per component

    return `${baseTime + phaseMultiplier + componentTime}s`;
  }

  /**
   * Generate recommended startup order
   */
  generateRecommendedStartupOrder() {
    const order = [];

    for (const [phase, componentIds] of this.startupPhases) {
      // Sort components within phase by criticality and dependency count
      const sortedComponents = componentIds.sort((a, b) => {
        const compA = this.components.get(a);
        const compB = this.components.get(b);

        // Prioritize by criticality, then by dependency count
        const criticalityOrder = { high: 3, medium: 2, low: 1 };
        const scoreA = criticalityOrder[compA.criticality] + compA.dependents.length;
        const scoreB = criticalityOrder[compB.criticality] + compB.dependents.length;

        return scoreB - scoreA;
      });

      order.push({
        phase,
        order: sortedComponents,
        parallel: sortedComponents.length > 1 && phase > 1,
      });
    }

    return order;
  }

  /**
   * Generate startup script template
   */
  generateStartupScriptTemplate() {
    return {
      bash_script: this.generateBashStartupScript(),
      npm_scripts: this.generateNPMStartupScripts(),
      docker_compose: this.generateDockerComposeStartup(),
      kubernetes: this.generateKubernetesStartup(),
    };
  }

  /**
   * Generate bash startup script
   */
  generateBashStartupScript() {
    let script = '#!/bin/bash\n\n';
    script += '# Infrastructure Component Startup Script\n';
    script += '# Generated by Lead Infrastructure Architect\n\n';
    script += 'echo "🚀 Starting MerajutASA.id Infrastructure..."\n\n';

    for (const [phase, componentIds] of this.startupPhases) {
      script += `# Phase ${phase}: ${this.getPhaseDescription(phase)}\n`;
      script += `echo "📋 Phase ${phase}: Starting ${componentIds.length} components..."\n\n`;

      for (const componentId of componentIds) {
        const component = this.components.get(componentId);
        script += `echo "  Starting ${component.type}/${component.name}..."\n`;
        script += `npm run ${component.type}:start || echo "Warning: ${component.type} startup failed"\n`;
      }

      script += `echo "✅ Phase ${phase} completed"\n`;
      script += 'sleep 10\n\n';
    }

    script += 'echo "🎉 Infrastructure startup completed"\n';
    return script;
  }

  /**
   * Generate NPM startup scripts
   */
  generateNPMStartupScripts() {
    const scripts = {};

    for (const [phase, componentIds] of this.startupPhases) {
      const phaseComponents = componentIds.map(id => {
        const component = this.components.get(id);
        return `npm run ${component.type}:start`;
      }).join(' && ');

      scripts[`infrastructure:phase-${phase}`] = phaseComponents;
    }

    scripts['infrastructure:start-all'] = Array.from(this.startupPhases.keys())
      .map(phase => `npm run infrastructure:phase-${phase}`)
      .join(' && ');

    return scripts;
  }

  /**
   * Generate Docker Compose startup order
   */
  generateDockerComposeStartup() {
    return {
      version: '3.8',
      services: Array.from(this.components.values()).reduce((services, component) => {
        services[component.name] = {
          depends_on: Array.from(this.dependencyMatrix.get(component.id) || [])
            .map(depId => this.components.get(depId)?.name)
            .filter(Boolean),
        };
        return services;
      }, {}),
    };
  }

  /**
   * Generate Kubernetes startup order
   */
  generateKubernetesStartup() {
    return {
      phases: Array.from(this.startupPhases.entries()).map(([phase, componentIds]) => ({
        phase,
        deployments: componentIds.map(id => {
          const component = this.components.get(id);
          return `kubectl apply -f k8s/${component.type}/${component.name}.yaml`;
        }),
      })),
    };
  }

  /**
   * Export dependency matrix
   */
  exportDependencyMatrix() {
    const matrix = {};
    for (const [componentId, dependencies] of this.dependencyMatrix) {
      matrix[componentId] = Array.from(dependencies);
    }
    return matrix;
  }

  /**
   * Generate system improvements
   */
  generateSystemImprovements() {
    return [
      {
        category: 'Architecture',
        improvement: 'Implement dependency injection container',
        benefit: 'Reduce tight coupling between components',
        effort: 'Medium',
      },
      {
        category: 'Performance',
        improvement: 'Parallel component initialization',
        benefit: 'Faster system startup times',
        effort: 'Low',
      },
      {
        category: 'Resilience',
        improvement: 'Circuit breaker pattern for critical dependencies',
        benefit: 'Improved fault tolerance',
        effort: 'Medium',
      },
      {
        category: 'Monitoring',
        improvement: 'Dependency health monitoring dashboard',
        benefit: 'Better visibility into component relationships',
        effort: 'Medium',
      },
    ];
  }

  /**
   * Generate visualization data
   */
  generateVisualizationData() {
    return {
      nodes: Array.from(this.components.values()).map(component => ({
        id: component.id,
        label: component.name,
        type: component.type,
        phase: component.phase,
        criticality: component.criticality,
        size: component.dependents.length + 10,
        color: this.getNodeColor(component.type),
      })),
      edges: Array.from(this.dependencyMatrix.entries()).flatMap(([fromId, dependencies]) =>
        Array.from(dependencies).map(toId => ({
          from: fromId,
          to: toId,
          type: 'dependency',
          weight: 1,
        })),
      ),
      clusters: Array.from(this.startupPhases.entries()).map(([phase, componentIds]) => ({
        phase,
        components: componentIds,
        description: this.getPhaseDescription(phase),
      })),
    };
  }

  /**
   * Get node color for visualization
   */
  getNodeColor(componentType) {
    const colors = {
      'security': '#ff6b6b',
      'auth': '#4ecdc4',
      'monitoring': '#45b7d1',
      'observability': '#96ceb4',
      'performance': '#ffeaa7',
      'api-gateway': '#dda0dd',
      'high-availability': '#98d8c8',
      'compliance': '#f7dc6f',
      'cicd': '#bb8fce',
      'backup': '#85c1e9',
      'reverse-proxy': '#f8c471',
      'docker': '#82e0aa',
      'kubernetes': '#aed6f1',
      'terraform': '#f9e79f',
      'integration': '#e8daef',
    };

    return colors[componentType] || '#bdc3c7';
  }

  /**
   * Health check for the analyzer
   */
  async healthCheck() {
    return {
      service: 'Component Dependency Analyzer',
      status: this.analyzerState.analysisComplete ? 'healthy' : 'analyzing',
      analysis: {
        components: this.analysisMetrics.totalComponents,
        dependencies: this.analysisMetrics.totalDependencies,
        circularDependencies: this.analysisMetrics.circularDependencyCount,
        criticalPaths: this.analysisMetrics.criticalPathCount,
        healthScore: this.calculateSystemHealthScore(),
      },
      timestamp: new Date(),
    };
  }
}

// Factory functions
let defaultDependencyAnalyzer = null;

export function createComponentDependencyAnalyzer(config = {}) {
  return new ComponentDependencyAnalyzer(config);
}

export function getComponentDependencyAnalyzer(config = {}) {
  if (!defaultDependencyAnalyzer) {
    defaultDependencyAnalyzer = new ComponentDependencyAnalyzer(config);
  }
  return defaultDependencyAnalyzer;
}

export default ComponentDependencyAnalyzer;
