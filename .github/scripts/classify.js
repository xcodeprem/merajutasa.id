// Classification script for issues and PRs
// This script performs intelligent classification based on content analysis

module.exports = async ({github, context, core, inputs}) => {
    try {
        const isPR = inputs.isPR === true || inputs.isPR === "true";
        const number = inputs.number;
        const owner = context.repo.owner;
        const repo = context.repo.repo;
        const dryRun = inputs.dryRun === true || inputs.dryRun === "true";
        const areaOverride = inputs.areaOverride || null;
        const itemDetails = typeof inputs.itemDetails === 'string' 
            ? JSON.parse(inputs.itemDetails) 
            : inputs.itemDetails;
        
        // Prevent relabel loops when the actor is the bot itself
        if ((context.eventName === 'issues' && ['labeled','unlabeled'].includes(context.payload.action)) ||
            (context.eventName === 'pull_request' && ['labeled','unlabeled'].includes(context.payload.action))) {
          if (context.actor === 'github-actions[bot]') {
            core.info('Skip to prevent relabel loop (actor is github-actions[bot]).');
            return JSON.stringify({ skipped: true, reason: 'bot_actor' });
          }
        }
        
        const item = itemDetails.item;
        const files = itemDetails.files;
        
        // Extract all the details we need
        const title = item.title || '';
        const body = item.body || '';
        const labels = item.labels || [];
        const nodeId = item.nodeId || inputs.nodeId;
        const milestoneTitle = item.milestoneTitle || '';
        const assignees = item.assignees || [];
        const author = item.author;
        const commentsData = item.commentsData || [];
        
        if (!nodeId) {
          core.warning('❌ Could not determine Node ID, project integration may fail');
        } else {
          core.info(`📌 Item GraphQL Node ID: ${nodeId}`);
        }
        
        const existing = new Set(labels);
            
        // Enhanced content analysis with multiple approaches
        const allContent = [
          title,
          body,
          ...commentsData.map(c => c.body)
        ].filter(Boolean).join('\n').toLowerCase();
        
        const filePaths = (files.list || []).map(f => (f.filename || '').toLowerCase());
        const additions = files.stats?.additions || 0;
        const deletions = files.stats?.deletions || 0;
        const changes = files.stats?.changes || 0;
        
        // Define word lists for better classification
        const securityTerms = ['security', 'auth', 'authentication', 'authorization', 'login', 'password', 'credential', 'oauth', 'jwt', 'token', 'encryption', 'decrypt', 'csrf', 'xss', 'injection', 'vulnerability', 'exploit', 'attack', 'firewall', 'ssl', 'tls', 'https', 'certificate'];
        
        const monitoringTerms = ['monitor', 'metrics', 'grafana', 'prometheus', 'logging', 'trace', 'observability', 'analytics', 'alert', 'dashboard', 'telemetry', 'apm', 'uptime', 'health check', 'sentry', 'datadog', 'newrelic', 'log4j', 'elasticsearch', 'kibana', 'splunk', 'nagios'];
        
        const performanceTerms = ['performance', 'optimize', 'optimization', 'speed', 'fast', 'slow', 'latency', 'throughput', 'bottleneck', 'cache', 'cdn', 'compression', 'gzip', 'minify', 'lazy load', 'preload', 'prefetch', 'benchmark', 'profile', 'memory leak', 'cpu usage', 'response time', 'p95', 'p99', 'ttfb'];
        
        const containerTerms = ['kubernetes', 'k8s', 'container', 'docker', 'pod', 'cluster', 'orchestration', 'helm', 'chart', 'manifest', 'deployment', 'statefulset', 'configmap', 'ingress', 'service mesh', 'istio', 'linkerd', 'kustomize', 'argo'];
        
        const cicdTerms = ['ci', 'cd', 'continuous integration', 'continuous delivery', 'pipeline', 'github actions', 'jenkins', 'travis', 'gitlab', 'build', 'deploy', 'release', 'workflow', 'automation', 'devops', 'gitops', 'artifact'];
        
        const dataTerms = ['database', 'db', 'sql', 'nosql', 'mongodb', 'postgres', 'mysql', 'redis', 'migration', 'schema', 'backup', 'restore', 'data model', 'orm', 'query', 'index', 'shard', 'replica', 'etl', 's3', 'storage', 'blob'];
        
        const apiTerms = ['api', 'rest', 'graphql', 'endpoint', 'gateway', 'service', 'microservice', 'route', 'path', 'http', 'request', 'response', 'status code', 'header', 'parameter', 'swagger', 'openapi', 'grpc', 'websocket', 'webhook'];
        
        const docsTerms = ['documentation', 'doc', 'readme', 'wiki', 'guide', 'tutorial', 'manual', 'instruction', 'how-to', 'example', 'reference', 'api doc', 'swagger', 'javadoc', 'jsdoc', 'comment'];
        
        const uiTerms = ['ui', 'ux', 'user interface', 'design', 'layout', 'css', 'html', 'front-end', 'frontend', 'react', 'vue', 'angular', 'component', 'accessibility', 'responsive', 'mobile', 'desktop'];
        
        // Helper functions for NLP-like classification
        function countTerms(text, termList) {
          if (!text) return 0;
          let count = 0;
          for (const term of termList) {
            const regex = new RegExp('\\b' + term + '\\b', 'gi');
            const matches = text.match(regex);
            count += matches ? matches.length : 0;
          }
          return count;
        }
        
        function confidenceScore(count, threshold = 2) {
          if (count === 0) return 0;
          if (count === 1) return 0.5;
          if (count <= threshold) return 0.75;
          return 0.9 + Math.min(0.09, (count - threshold) * 0.01);
        }
        
        // Enhanced heuristic classifiers
        const hasAny = (s, arr) => arr.some(k => s.includes(k));
        const pathHasAny = (arr) => filePaths.some(p => arr.some(k => p.includes(k)));
        
        // Advanced area classification with confidence scores
        let areaScores = {
          'security-layer': confidenceScore(
            countTerms(allContent, securityTerms) + 
            (pathHasAny(['auth', 'security', 'oauth', 'jwt', 'encryption', 'passport', 'login']) ? 3 : 0)
          ),
          'monitoring-observability': confidenceScore(
            countTerms(allContent, monitoringTerms) + 
            (pathHasAny(['monitor', 'metrics', 'grafana', 'prometheus', 'logging', 'trace']) ? 3 : 0)
          ),
          'performance-optimization': confidenceScore(
            countTerms(allContent, performanceTerms) + 
            (pathHasAny(['cache', 'optimization', 'perf', 'cdn', 'compression']) ? 3 : 0)
          ),
          'container-orchestration': confidenceScore(
            countTerms(allContent, containerTerms) + 
            (pathHasAny(['k8s', 'kubernetes', 'helm', 'manifests', 'charts', 'docker']) ? 3 : 0)
          ),
          'cicd-pipeline': confidenceScore(
            countTerms(allContent, cicdTerms) + 
            (pathHasAny(['.github/workflows', 'deploy', 'pipeline', 'ci', 'cd', '.gitlab-ci', 'jenkins']) ? 3 : 0)
          ),
          'data-management': confidenceScore(
            countTerms(allContent, dataTerms) + 
            (pathHasAny(['backup', 'migrations', 'db/', 'database', 'storage', 's3', 'mongo', 'sql']) ? 3 : 0)
          ),
          'api-gateway-services': confidenceScore(
            countTerms(allContent, apiTerms) + 
            (pathHasAny(['api/', 'gateway', 'ingress', 'service', 'routes', 'controller']) ? 3 : 0)
          ),
          'docs': confidenceScore(
            countTerms(allContent, docsTerms) + 
            (pathHasAny(['docs/', 'documentation', 'wiki', 'readme', '.md']) ? 3 : 0)
          ),
          'ui-components': confidenceScore(
            countTerms(allContent, uiTerms) + 
            (pathHasAny(['ui/', 'components', 'css', 'html', 'jsx', 'tsx', 'vue', 'react']) ? 3 : 0)
          )
        };
        
        // Find the area with highest score
        let bestArea = null;
        let bestScore = 0.3; // Minimum threshold to assign area
        
        for (const [area, score] of Object.entries(areaScores)) {
          if (score > bestScore) {
            bestArea = area;
            bestScore = score;
          }
        }
        
        // Special handling for very short issues/PRs
        const minimalContent = title.length + (body?.length || 0) < 20;
        if (minimalContent) {
          core.info('⚠️ Minimal content detected, using enhanced classification');
          
          // For test issues/PRs, assume it's for testing and QA
          if (title.toLowerCase().includes('test') && (!body || body.length < 20)) {
            bestArea = 'monitoring-observability'; // QA related
            bestScore = 0.6;
            core.info('✅ Test-related issue/PR detected, classified as monitoring-observability');
          }
          
          // Use file patterns as stronger signal for minimal PRs
          if (isPR && (files.list || []).length > 0) {
            // Re-evaluate based more heavily on files than content
            const fileTypes = files.list.reduce((types, file) => {
              const ext = file.filename.split('.').pop().toLowerCase();
              types[ext] = (types[ext] || 0) + 1;
              return types;
            }, {});
            
            // Log file type distribution
            core.info(`📂 File types: ${JSON.stringify(fileTypes)}`);
            
            if (fileTypes.md || fileTypes.txt || fileTypes.rst) {
              bestArea = 'docs';
              bestScore = Math.max(bestScore, 0.7);
            } else if (fileTypes.js || fileTypes.ts || fileTypes.jsx || fileTypes.tsx || fileTypes.vue) {
              bestArea = fileTypes.vue || fileTypes.jsx || fileTypes.tsx ? 'ui-components' : 'api-gateway-services';
              bestScore = Math.max(bestScore, 0.6);
            } else if (fileTypes.yml || fileTypes.yaml) {
              bestArea = 'cicd-pipeline';
              bestScore = Math.max(bestScore, 0.7);
            } else if (fileTypes.sql || fileTypes.py || fileTypes.rb) {
              bestArea = 'data-management';
              bestScore = Math.max(bestScore, 0.6);
            } else if (fileTypes.java || fileTypes.go || fileTypes.cs) {
              bestArea = 'api-gateway-services';
              bestScore = Math.max(bestScore, 0.5);
            }
          }
          
          // Look at other signals
          if (assignees.length > 0) {
            // Assignee-based hints (sample logic - would need real team data)
            const securityTeam = ['securitydev1', 'securitydev2'];
            const devopsTeam = ['devops1', 'devops2', 'ops3'];
            const dataTeam = ['dataengineer1', 'dataengineer2'];
            
            if (assignees.some(a => securityTeam.includes(a))) {
              bestArea = 'security-layer';
              bestScore = Math.max(bestScore, 0.7);
            } else if (assignees.some(a => devopsTeam.includes(a))) {
              bestArea = 'cicd-pipeline';
              bestScore = Math.max(bestScore, 0.7);
            } else if (assignees.some(a => dataTeam.includes(a))) {
              bestArea = 'data-management';
              bestScore = Math.max(bestScore, 0.7);
            }
          }
        }
        
        // Apply manual override if provided
        if (areaOverride) {
          const validAreas = [
            'security-layer', 'monitoring-observability', 'performance-optimization',
            'container-orchestration', 'cicd-pipeline', 'data-management', 
            'api-gateway-services', 'docs', 'ui-components'
          ];
          
          if (validAreas.includes(areaOverride)) {
            bestArea = areaOverride;
            bestScore = 1.0;
            core.info(`🔧 Manual area override applied: ${areaOverride}`);
          } else {
            core.warning(`⚠️ Invalid area override: ${areaOverride}`);
          }
        }
        
        const area = bestArea ? `area:${bestArea}` : null;
        
        // Log area classification results
        core.info('📊 Area classification scores:');
        for (const [area, score] of Object.entries(areaScores)) {
          if (score > 0) {
            core.info(`  - ${area}: ${score.toFixed(2)}`);
          }
        }
        core.info(`📍 Selected area: ${bestArea || 'None'} (score: ${bestScore.toFixed(2)})`);
        
        // Risk classification with more signals
        let riskFactors = {
          high: 0,
          medium: 0,
          low: 0
        };
        
        // Content-based risk factors
        if (hasAny(allContent, ['breaking change', 'critical', 'urgent', 'emergency', 'hot fix', 'hotfix'])) {
          riskFactors.high += 3;
        }
        
        if (hasAny(allContent, ['security', 'vulnerability', 'exploit', 'hack', 'breach', 'unsafe'])) {
          riskFactors.high += 2;
        }
        
        if (hasAny(allContent, ['refactor', 'migration', 'upgrade', 'update dependencies', 'technical debt'])) {
          riskFactors.medium += 2;
        }
        
        if (hasAny(allContent, ['fix', 'bug', 'error', 'crash', 'exception', 'issue'])) {
          riskFactors.medium += 1;
        }
        
        if (hasAny(allContent, ['improve', 'enhance', 'minor', 'small change', 'typo'])) {
          riskFactors.low += 2;
        }
        
        if (hasAny(allContent, ['documentation', 'docs', 'comment', 'readme'])) {
          riskFactors.low += 3;
        }
        
        // Size-based risk factors
        if (isPR) {
          const totalChanges = additions + deletions;
          if (totalChanges > 500) {
            riskFactors.high += Math.min(3, Math.floor(totalChanges / 500));
          } else if (totalChanges > 200) {
            riskFactors.medium += 2;
          } else if (totalChanges > 50) {
            riskFactors.medium += 1;
          } else {
            riskFactors.low += 1;
          }
          
          // Files affected
          if ((files.list || []).length > 20) {
            riskFactors.high += 2;
          } else if ((files.list || []).length > 10) {
            riskFactors.medium += 2;
          } else if ((files.list || []).length > 5) {
            riskFactors.medium += 1;
          } else {
            riskFactors.low += 1;
          }
        }
        
        // Special handling for test issues
        if (minimalContent && title.toLowerCase().includes('test')) {
          // Test issues are generally low risk
          riskFactors.low += 3;
        }
        
        // Determine risk level
        let risk = 'risk:low';
        if (riskFactors.high > riskFactors.medium && riskFactors.high > riskFactors.low) {
          risk = 'risk:high';
        } else if (riskFactors.medium > riskFactors.low) {
          risk = 'risk:medium';
        }
        
        core.info(`🚨 Risk classification: ${risk} (high: ${riskFactors.high}, medium: ${riskFactors.medium}, low: ${riskFactors.low})`);

        // Implement the rest of your logic here...
        // Status classification, team assignment, size determination, etc.
        // Basically, move the rest of your large script into this file

        // Status label with smarter defaults
        let status = null;
        if (isPR) {
          if (item.merged) {
            status = 'status:done';
          } else if (item.state === 'closed') {
            status = 'status:done';
          } else if (context.payload.action === 'ready_for_review' || !item.isDraft) {
            status = 'status:in-review';
          } else {
            status = 'status:in-progress';
          }
          
          // Check for draft or WIP title
          if (title.toLowerCase().startsWith('wip') || title.toLowerCase().startsWith('[wip]')) {
            status = 'status:in-progress';
          }
        } else {
          if (item.state === 'closed') {
            status = 'status:done';
          } else if (hasAny(allContent, ['wip', 'work in progress', 'working on', 'started', 'beginning'])) {
            status = 'status:in-progress';
          } else if (assignees.length > 0) {
            status = 'status:in-progress'; // If someone is assigned, likely in progress
          } else if (item.comments > 0) {
            // If there are comments, check for indicators
            if (commentsData.some(c => hasAny((c.body || '').toLowerCase(), ['blocked', 'blocking', 'blocker', 'can\'t continue']))) {
              status = 'status:blocked';
            } else if (commentsData.some(c => hasAny((c.body || '').toLowerCase(), ['in progress', 'working on', 'started']))) {
              status = 'status:in-progress';
            }
          } else {
            status = 'status:todo';
          }
          
          // For minimal test issues, default to todo
          if (minimalContent && title.toLowerCase().includes('test')) {
            status = 'status:todo';
          }
        }
        
        // Team assignment based on area, author, and other signals
        let team = null;
        if (bestArea === 'security-layer') {
          team = 'team:security';
        } else if (bestArea === 'cicd-pipeline' || bestArea === 'container-orchestration') {
          team = 'team:devops';
        } else if (bestArea === 'monitoring-observability') {
          team = 'team:qa';
        } else if (bestArea === 'ui-components') {
          team = 'team:frontend';
        } else if (bestArea === 'docs') {
          team = 'team:docs';
        } else {
          team = 'team:backend-dev'; // Default
        }
        
        // Implementation size based on various factors
        let size = null;
        if (isPR) {
          const total = additions + deletions;
          if (total <= 10) {
            size = 'size:xs';
          } else if (total <= 100) {
            size = 'size:small';
          } else if (total <= 250) {
            size = 'size:medium';
          } else if (total <= 500) {
            size = 'size:large';
          } else if (total <= 1000) {
            size = 'size:very-large';
          } else if (total <= 2000) {
            size = 'size:enterprise';
          } else {
            size = 'size:system';
          }
        } else {
          // For issues, try to estimate size based on content
          const contentSize = (title?.length || 0) + (body?.length || 0);
          const hasSubtasks = (body || '').includes('- [ ]');
          const hasManyLinks = ((body || '').match(/https?:\/\/\S+/g) || []).length > 3;
          
          if (contentSize < 50 && !hasSubtasks && !hasManyLinks) {
            size = 'size:small';
          } else if (contentSize < 500 || (hasSubtasks && (body.match(/- \[ \]/g) || []).length <= 5)) {
            size = 'size:medium';
          } else if (contentSize < 1000 || (hasSubtasks && (body.match(/- \[ \]/g) || []).length <= 10)) {
            size = 'size:large';
          } else {
            size = 'size:very-large';
          }
          
          // For minimal test issues, use small
          if (minimalContent && title.toLowerCase().includes('test')) {
            size = 'size:small';
          }
        }
        
        // Health score with smarter calculation
        let health = 'health:50-74'; // Default mid-range
        
        if (isPR) {
          let healthScore = 50; // Start at middle
          
          // Code quality signals
          const hasTests = pathHasAny(['test', 'spec', '__tests__']);
          const hasDocs = pathHasAny(['docs/', 'readme', '.md']);
          const hasComments = item.comments > 0;
          const docToCodeRatio = (files.list || []).reduce((ratio, file) => {
            if (file.filename.match(/\.(md|txt|rst)$/)) {
              return ratio + 1;
            }
            return ratio;
          }, 0) / Math.max(1, (files.list || []).length);
          
          // Add points for positive signals
          if (hasTests) healthScore += 20;
          if (hasDocs) healthScore += 15;
          if (hasComments) healthScore += 5;
          if (docToCodeRatio > 0.1) healthScore += 10;
          
          // Subtract for negative signals
          const largeChange = changes > 500;
          if (largeChange) healthScore -= 15;
          if ((files.list || []).length > 20) healthScore -= 10;
          if (!body || body.length < 30) healthScore -= 10;
          
          // Cap the score
          healthScore = Math.max(10, Math.min(100, healthScore));
          
          // Map to health labels
          if (healthScore >= 90) {
            health = 'health:90-99';
          } else if (healthScore >= 75) {
            health = 'health:75-89';
          } else if (healthScore >= 50) {
            health = 'health:50-74';
          } else if (healthScore >= 25) {
            health = 'health:25-49';
          } else {
            health = 'health:0-24';
          }
        } else {
          // For issues, base health on completeness
          let issueHealthScore = 50; // Start at middle
          
          if (body && body.length > 100) issueHealthScore += 10;
          if (body && body.includes('## Steps to reproduce')) issueHealthScore += 15;
          if (body && body.includes('## Expected behavior')) issueHealthScore += 10;
          if (body && (body.includes('```') || body.includes('~~~'))) issueHealthScore += 5; // Code blocks
          if (assignees.length > 0) issueHealthScore += 5;
          if (item.comments > 1) issueHealthScore += 5;
          if (labels.length > 0) issueHealthScore += 5;
          
          // Subtract points for minimal issues
          if (!body || body.length < 20) issueHealthScore -= 15;
          if (title.length < 10) issueHealthScore -= 10;
          
          // For minimal test issues, use medium health
          if (minimalContent && title.toLowerCase().includes('test')) {
            issueHealthScore = 60; // Middle range for test issues
          }
          
          // Cap and map to labels
          issueHealthScore = Math.max(10, Math.min(100, issueHealthScore));
          
          if (issueHealthScore >= 90) {
            health = 'health:90-99';
          } else if (issueHealthScore >= 75) {
            health = 'health:75-89';
          } else if (issueHealthScore >= 50) {
            health = 'health:50-74';
          } else if (issueHealthScore >= 25) {
            health = 'health:25-49';
          } else {
            health = 'health:0-24';
          }
        }
        
        // Iteration from milestone or content
        let iteration = null;
        const iterMatch = (milestoneTitle || allContent).match(/sprint[-\s]?(\d+)/i);
        if (iterMatch) {
          iteration = `iteration:sprint-${iterMatch[1]}`;
        } else if (hasAny(allContent, ['maintenance', 'maintain', 'upkeep', 'fix', 'bugfix'])) {
          iteration = 'iteration:maintenance';
        } else if (hasAny(allContent, ['research', 'spike', 'investigate', 'explore', 'poc', 'prototype'])) {
          iteration = 'iteration:research';
        }
        
        // Build label sets (single-choice categories)
        const singleChoiceSets = {
          risk: ['risk:low','risk:medium','risk:high'],
          status: ['status:todo','status:in-progress','status:in-review','status:blocked','status:done'],
          size: ['size:xs','size:small','size:medium','size:large','size:very-large','size:enterprise','size:system'],
          health: ['health:100','health:90-99','health:75-89','health:50-74','health:25-49','health:0-24'],
          iteration: ['iteration:sprint-1','iteration:sprint-2','iteration:sprint-3','iteration:sprint-4',
                     'iteration:sprint-5','iteration:sprint-6','iteration:epic','iteration:maintenance',
                     'iteration:research']
        };
        
        const toAdd = new Set();
        const toRemove = new Set();
        
        function setSingleChoice(target) {
          if (!target) return;
          for (const [_, set] of Object.entries(singleChoiceSets)) {
            if (set.includes(target)) {
              set.forEach(l => { if (existing.has(l) && l !== target) toRemove.add(l); });
            }
          }
          if (!existing.has(target)) toAdd.add(target);
        }
        
        // Apply choices
        setSingleChoice(risk);
        setSingleChoice(status);
        setSingleChoice(size);
        setSingleChoice(health);
        setSingleChoice(iteration);
        if (area && !existing.has(area)) toAdd.add(area);
        if (team && !existing.has(team)) toAdd.add(team);
        
        const addList = Array.from(toAdd);
        const removeList = Array.from(toRemove);
        
        // Record classifications for next step
        const classifications = {
          area: area ? { 
            value: area.split(':')[1], 
            confidence: bestScore.toFixed(2),
            source: 'advanced_heuristic' 
          } : null,
          risk: risk ? { 
            value: risk.split(':')[1], 
            factors: riskFactors,
            source: 'advanced_heuristic' 
          } : null,
          status: status ? { 
            value: status.split(':')[1], 
            source: 'context_aware' 
          } : null,
          team: team ? { 
            value: team.split(':')[1], 
            source: 'area_based' 
          } : null,
          size: size ? { 
            value: size.split(':')[1], 
            source: isPR ? 'code_stats' : 'content_estimate' 
          } : null,
          health: health ? { 
            value: health.split(':')[1], 
            source: isPR ? 'code_quality' : 'issue_completeness' 
          } : null,
          iteration: iteration ? { 
            value: iteration.split(':')[1], 
            source: 'content_match' 
          } : null
        };
        
        // Dry-run log
        if (dryRun) {
          core.info('🧪 DRY RUN: Label changes preview');
          core.info(`Would add: ${addList.join(', ') || 'None'}`);
          core.info(`Would remove: ${removeList.join(', ') || 'None'}`);
          return JSON.stringify({
            dryRun: true,
            item: {
              type: isPR ? 'pull_request' : 'issue',
              number: number,
              title: title,
              url: item.url,
              node_id: nodeId,
              author: author,
              created_at: item.createdAt,
              updated_at: item.updatedAt,
              assignees: assignees,
              comments: item.comments
            },
            labels: {
              existing: Array.from(existing),
              toAdd: addList,
              toRemove: removeList
            },
            classifications: classifications,
            stats: { additions, deletions, changes }
          });
        }
        
        // Apply removals first
        for (const l of removeList) {
          try {
            await github.rest.issues.removeLabel({ 
              owner, repo, issue_number: number, name: l 
            });
            core.info(`Removed label: ${l}`);
          } catch (e) {
            if (e.status !== 404) core.warning(`Failed to remove label ${l}: ${e.message}`);
          }
        }
        
        // Apply additions
        if (addList.length) {
          try {
            await github.rest.issues.addLabels({ 
              owner, repo, issue_number: number, labels: addList 
            });
            core.info(`Added labels: ${addList.join(', ')}`);
          } catch (e) {
            core.warning(`Failed to add labels: ${e.message}`);
          }
        } else {
          core.info('No labels to add');
        }
        
        // Return final state for artifact
        const finalLabels = [...labels.filter(l => !removeList.includes(l)), ...addList];
        
        return JSON.stringify({
          item: {
            type: isPR ? 'pull_request' : 'issue',
            number: number,
            title: title,
            body: body,
            url: item.url,
            state: item.state,
            isPR: isPR,
            isDraft: item.isDraft,
            merged: item.merged,
            node_id: nodeId,
            author: author,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            assignees: assignees,
            comments: item.comments
          },
          labels: {
            final: finalLabels,
            added: addList,
            removed: removeList
          },
          classifications: classifications,
          stats: { additions, deletions, changes },
          files: files.list.map(f => ({ 
            filename: f.filename, 
            additions: f.additions, 
            deletions: f.deletions 
          }))
        });
        
    } catch (error) {
        core.setFailed(`Classification error: ${error.message}`);
        return JSON.stringify({ error: error.message });
    }
};