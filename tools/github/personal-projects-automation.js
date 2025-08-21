#!/usr/bin/env node
/**
 * Personal Projects Automation - Core Logic
 * Automated PR management for Andhika-Rey's personal GitHub projects
 * Supports: Feature Release (#12), Team Retrospective (#11), Iterative Development (#13)
 */

import { Octokit } from '@octokit/rest';
import { promises as fs } from 'fs';

// Project Configuration
export const PROJECTS_CONFIG = {
  'feature-release': {
    id: 12,
    title: 'Feature Release',
    url: 'https://github.com/users/Andhika-Rey/projects/12',
    fields: {
      'Status': { type: 'single_select', required: true },
      'Sub-Issues Progress': { type: 'number', required: false },
      'Priority': { type: 'single_select', required: true },
      'Size': { type: 'single_select', required: true },
      'Estimate': { type: 'number', required: false },
      'Iteration': { type: 'single_select', required: false },
      'Start Date': { type: 'date', required: false },
      'End Date': { type: 'date', required: false }
    },
    labels: {
      priority: ['priority:p0', 'priority:p1', 'priority:p2', 'priority:p3'],
      size: ['size:xs', 'size:s', 'size:m', 'size:l', 'size:xl'],
      iteration: ['iteration:current', 'iteration:next', 'iteration:backlog']
    }
  },
  'team-retrospective': {
    id: 11,
    title: 'Team Retrospective',
    url: 'https://github.com/users/Andhika-Rey/projects/11',
    fields: {
      'Status': { type: 'single_select', required: true },
      'Sub-Issues Progress': { type: 'number', required: false },
      'Category': { type: 'single_select', required: true },
      'Notes': { type: 'text', required: false }
    },
    labels: {
      category: ['category:what-went-well', 'category:what-to-improve', 'category:action-items']
    }
  },
  'iterative-development': {
    id: 13,
    title: 'Iterative Development',
    url: 'https://github.com/users/Andhika-Rey/projects/13',
    fields: {
      'Status': { type: 'single_select', required: true },
      'Sub-Issues Progress': { type: 'number', required: false },
      'Priority': { type: 'single_select', required: true },
      'Size': { type: 'single_select', required: true },
      'Estimate': { type: 'number', required: false },
      'Iteration': { type: 'single_select', required: false }
    },
    labels: {
      priority: ['priority:p0', 'priority:p1', 'priority:p2', 'priority:p3'],
      size: ['size:xs', 'size:s', 'size:m', 'size:l', 'size:xl'],
      iteration: ['iteration:sprint-1', 'iteration:sprint-2', 'iteration:sprint-3']
    }
  }
};

// Status mapping for all projects
const STATUS_MAPPING = {
  draft: 'To Do',
  open: 'In Review',
  ready_for_review: 'In Review',
  merged: 'Done',
  closed: 'Done'
};

// Priority mapping
const PRIORITY_MAPPING = {
  'priority:p0': 'P0',
  'p0': 'P0',
  'urgent': 'P0',
  'critical': 'P0',
  'priority:p1': 'P1', 
  'p1': 'P1',
  'high': 'P1',
  'high-priority': 'P1',
  'priority:p2': 'P2',
  'p2': 'P2',
  'medium': 'P2',
  'medium-priority': 'P2',
  'priority:p3': 'P3',
  'p3': 'P3',
  'low': 'P3',
  'low-priority': 'P3',
  'planned': 'P3'
};

// Size mapping
const SIZE_MAPPING = {
  'size:xs': 'XS',
  'size:s': 'S',
  'size:m': 'M',
  'size:l': 'L',
  'size:xl': 'XL',
  'xs': 'XS',
  's': 'S',
  'm': 'M',
  'l': 'L',
  'xl': 'XL'
};

// Category mapping for retrospective
const CATEGORY_MAPPING = {
  'category:what-went-well': 'What Went Well',
  'category:what-to-improve': 'What to Improve', 
  'category:action-items': 'Action Items',
  'went-well': 'What Went Well',
  'improve': 'What to Improve',
  'action': 'Action Items'
};

/**
 * Initialize Octokit client
 */
export function createClient(token) {
  if (!token) {
    throw new Error('GitHub token is required');
  }
  return new Octokit({ auth: token });
}

/**
 * Get project configuration by key
 */
export function getProjectConfig(projectKey) {
  const config = PROJECTS_CONFIG[projectKey];
  if (!config) {
    throw new Error(`Unknown project: ${projectKey}. Available: ${Object.keys(PROJECTS_CONFIG).join(', ')}`);
  }
  return config;
}

/**
 * Extract labels from PR/issue
 */
export function extractLabels(item) {
  return (item.labels || []).map(label => 
    typeof label === 'string' ? label : label.name
  ).filter(Boolean);
}

/**
 * Determine PR status based on state and draft status
 */
export function determinePRStatus(pr) {
  if (pr.draft) return 'To Do';
  if (pr.state === 'open') return 'In Review';
  if (pr.merged) return 'Done';
  if (pr.state === 'closed') return 'Done';
  return 'To Do';
}

/**
 * Map labels to field values
 */
export function mapLabelsToFields(labels, projectConfig) {
  const fields = {};
  
  // Status mapping
  const status = determinePRStatus({ 
    draft: labels.includes('draft'),
    state: labels.includes('merged') ? 'closed' : 'open',
    merged: labels.includes('merged')
  });
  fields.Status = status;
  
  // Priority mapping
  for (const label of labels) {
    const priority = PRIORITY_MAPPING[label.toLowerCase()];
    if (priority && projectConfig.fields.Priority) {
      fields.Priority = priority;
      break;
    }
  }
  
  // Size mapping  
  for (const label of labels) {
    const size = SIZE_MAPPING[label.toLowerCase()];
    if (size && projectConfig.fields.Size) {
      fields.Size = size;
      break;
    }
  }
  
  // Category mapping (for retrospective)
  for (const label of labels) {
    const category = CATEGORY_MAPPING[label.toLowerCase()];
    if (category && projectConfig.fields.Category) {
      fields.Category = category;
      break;
    }
  }
  
  // Iteration mapping
  for (const label of labels) {
    if (label.startsWith('iteration:') && projectConfig.fields.Iteration) {
      fields.Iteration = label.replace('iteration:', '').replace('-', ' ').toUpperCase();
      break;
    }
  }
  
  // Extract estimates (est:h:8 = 8 hours)
  for (const label of labels) {
    const estMatch = label.match(/^est:h:(\d+)$/);
    if (estMatch && projectConfig.fields.Estimate) {
      fields.Estimate = parseInt(estMatch[1], 10);
      break;
    }
  }
  
  // Extract dates (start:2024-01-15, due:2024-01-30)
  for (const label of labels) {
    const startMatch = label.match(/^start:(\d{4}-\d{2}-\d{2})$/);
    const dueMatch = label.match(/^due:(\d{4}-\d{2}-\d{2})$/);
    
    if (startMatch && projectConfig.fields['Start Date']) {
      fields['Start Date'] = startMatch[1];
    }
    if (dueMatch && projectConfig.fields['End Date']) {
      fields['End Date'] = dueMatch[1];
    }
  }
  
  return fields;
}

/**
 * Generate suggested labels for PR based on project type and characteristics
 */
export function generateSuggestedLabels(pr, projectKey) {
  const labels = new Set();
  const projectConfig = getProjectConfig(projectKey);
  
  // Add project-specific label
  labels.add(`project:${projectKey}`);
  
  // Add status label
  const status = determinePRStatus(pr);
  labels.add(`status:${status.toLowerCase().replace(' ', '-')}`);
  
  // Add default priority if none exists
  const existingLabels = extractLabels(pr);
  const hasPriority = existingLabels.some(label => 
    Object.keys(PRIORITY_MAPPING).includes(label.toLowerCase())
  );
  if (!hasPriority) {
    labels.add('priority:p2'); // Default to medium priority
  }
  
  // Add default size if none exists and project supports it
  if (projectConfig.fields.Size) {
    const hasSize = existingLabels.some(label => 
      Object.keys(SIZE_MAPPING).includes(label.toLowerCase())
    );
    if (!hasSize) {
      labels.add('size:m'); // Default to medium size
    }
  }
  
  // Add category for retrospective if none exists
  if (projectKey === 'team-retrospective') {
    const hasCategory = existingLabels.some(label => 
      Object.keys(CATEGORY_MAPPING).includes(label.toLowerCase())
    );
    if (!hasCategory) {
      labels.add('category:what-went-well'); // Default category
    }
  }
  
  return Array.from(labels);
}

/**
 * Calculate sub-issues progress (mock implementation)
 */
export function calculateSubIssuesProgress(pr) {
  // Simple heuristic: count checkboxes in PR body
  const body = pr.body || '';
  const checkboxes = body.match(/- \[[x ]\]/g) || [];
  if (checkboxes.length === 0) return 0;
  
  const checked = body.match(/- \[x\]/g) || [];
  return Math.round((checked.length / checkboxes.length) * 100);
}

/**
 * Determine appropriate notes for retrospective
 */
export function generateRetroNotes(pr) {
  const notes = [];
  
  // Add PR size context
  if (pr.additions && pr.deletions) {
    notes.push(`Changes: +${pr.additions} -${pr.deletions} lines`);
  }
  
  // Add review context
  if (pr.requested_reviewers && pr.requested_reviewers.length > 0) {
    notes.push(`Reviewers: ${pr.requested_reviewers.map(r => r.login).join(', ')}`);
  }
  
  // Add milestone context
  if (pr.milestone) {
    notes.push(`Milestone: ${pr.milestone.title}`);
  }
  
  return notes.join(' | ');
}

/**
 * Save automation report
 */
export async function saveAutomationReport(projectKey, results) {
  await fs.mkdir('artifacts', { recursive: true });
  
  const report = {
    project: projectKey,
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
  
  const filename = `artifacts/personal-project-automation-${projectKey}.json`;
  await fs.writeFile(filename, JSON.stringify(report, null, 2));
  
  console.log(`[${projectKey}] Automation report saved: ${filename}`);
  return report;
}

/**
 * Main automation logic
 */
export async function automateProjectIntegration(token, projectKey, prNumber = null, dryRun = false) {
  const octokit = createClient(token);
  const projectConfig = getProjectConfig(projectKey);
  const results = [];
  
  console.log(`[${projectKey}] Starting automation for ${projectConfig.title}`);
  console.log(`[${projectKey}] Dry run: ${dryRun}`);
  
  // Get repository info
  const owner = process.env.GITHUB_REPOSITORY_OWNER || 'Andhika-Rey';
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'merajutasa.id';
  
  try {
    // Get PRs to process
    let prs = [];
    if (prNumber) {
      const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber });
      prs = [pr];
    } else {
      const { data: openPrs } = await octokit.rest.pulls.list({ 
        owner, 
        repo, 
        state: 'open',
        per_page: 10
      });
      prs = openPrs;
    }
    
    for (const pr of prs) {
      const result = {
        pr_number: pr.number,
        pr_title: pr.title,
        success: false,
        actions: [],
        errors: []
      };
      
      try {
        // Extract current labels
        const currentLabels = extractLabels(pr);
        result.current_labels = currentLabels;
        
        // Generate suggested labels
        const suggestedLabels = generateSuggestedLabels(pr, projectKey);
        const newLabels = suggestedLabels.filter(label => !currentLabels.includes(label));
        result.suggested_labels = suggestedLabels;
        result.new_labels = newLabels;
        
        // Apply labels if not dry run
        if (!dryRun && newLabels.length > 0) {
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr.number,
            labels: newLabels
          });
          result.actions.push(`Applied labels: ${newLabels.join(', ')}`);
        }
        
        // Map labels to project fields
        const allLabels = [...currentLabels, ...newLabels];
        const fieldMappings = mapLabelsToFields(allLabels, projectConfig);
        
        // Add calculated fields
        fieldMappings['Sub-Issues Progress'] = calculateSubIssuesProgress(pr);
        
        if (projectKey === 'team-retrospective') {
          fieldMappings.Notes = generateRetroNotes(pr);
        }
        
        result.field_mappings = fieldMappings;
        
        // Here we would add to project and update fields via GraphQL
        // For now, we'll simulate this
        if (!dryRun) {
          result.actions.push('Added to project (simulated)');
          result.actions.push(`Updated fields: ${Object.keys(fieldMappings).join(', ')}`);
        }
        
        result.success = true;
        console.log(`[${projectKey}] ✅ Processed PR #${pr.number}: ${pr.title}`);
        
      } catch (error) {
        result.errors.push(error.message);
        console.error(`[${projectKey}] ❌ Error processing PR #${pr.number}:`, error.message);
      }
      
      results.push(result);
    }
    
  } catch (error) {
    console.error(`[${projectKey}] Fatal error:`, error);
    results.push({
      pr_number: null,
      success: false,
      errors: [error.message]
    });
  }
  
  // Save report
  await saveAutomationReport(projectKey, results);
  
  return {
    project: projectKey,
    config: projectConfig,
    results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectKey = process.argv[2];
  const prNumber = process.argv[3] ? parseInt(process.argv[3], 10) : null;
  const dryRun = process.argv.includes('--dry-run');
  
  if (!projectKey || !Object.keys(PROJECTS_CONFIG).includes(projectKey)) {
    console.error('Usage: node personal-projects-automation.js <project-key> [pr-number] [--dry-run]');
    console.error('Available projects:', Object.keys(PROJECTS_CONFIG).join(', '));
    process.exit(1);
  }
  
  const token = process.env.GH_PROJECT_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Missing GH_PROJECT_TOKEN or GITHUB_TOKEN');
    process.exit(1);
  }
  
  automateProjectIntegration(token, projectKey, prNumber, dryRun)
    .then(result => {
      console.log('\n🎯 Automation Summary:');
      console.log(`Project: ${result.config.title}`);
      console.log(`Total PRs: ${result.summary.total}`);
      console.log(`Successful: ${result.summary.successful}`);
      console.log(`Failed: ${result.summary.failed}`);
      
      if (result.summary.failed > 0) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Automation failed:', error);
      process.exit(1);
    });
}