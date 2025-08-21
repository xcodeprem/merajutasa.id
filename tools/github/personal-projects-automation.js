#!/usr/bin/env node
/**
 * Personal Projects Automation - Core Logic
 * Automated PR management for Andhika-Rey's personal GitHub projects
 * Supports: Feature Release (#12), Team Retrospective (#11), Iterative Development (#13)
 */

import { Octokit } from '@octokit/rest';
import { graphql as baseGraphql } from '@octokit/graphql';
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
  },
  'custom-fields': {
    id: 10,
    title: 'Custom Fields Projects',
    url: 'https://github.com/users/Andhika-Rey/projects/10',
    fields: {
      'Status': { type: 'single_select', required: true },
      'Priority': { type: 'single_select', required: true },
      'Size': { type: 'single_select', required: true },
      'Category': { type: 'single_select', required: false },
      'Notes': { type: 'text', required: false },
      'Estimate': { type: 'number', required: false },
      'Progress': { type: 'number', required: false },
      'Start Date': { type: 'date', required: false },
      'Due Date': { type: 'date', required: false },
      'Iteration': { type: 'single_select', required: false }
    },
    labels: {
      priority: ['priority:p0', 'priority:p1', 'priority:p2', 'priority:p3'],
      size: ['size:xs', 'size:s', 'size:m', 'size:l', 'size:xl'],
      category: ['category:feature', 'category:bugfix', 'category:enhancement', 'category:documentation'],
      iteration: ['iteration:backlog', 'iteration:current', 'iteration:next', 'iteration:future']
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

// Category mapping for retrospective and custom fields projects
const CATEGORY_MAPPING = {
  'category:what-went-well': 'What Went Well',
  'category:what-to-improve': 'What to Improve', 
  'category:action-items': 'Action Items',
  'went-well': 'What Went Well',
  'improve': 'What to Improve',
  'action': 'Action Items',
  // Custom fields project categories
  'category:feature': 'Feature',
  'category:bugfix': 'Bugfix',
  'category:enhancement': 'Enhancement',
  'category:documentation': 'Documentation',
  'feature': 'Feature',
  'bugfix': 'Bugfix',
  'bug': 'Bugfix',
  'enhancement': 'Enhancement',
  'docs': 'Documentation',
  'documentation': 'Documentation'
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
 * Initialize GraphQL client
 */
export function createGraphQL(token) {
  if (!token) {
    throw new Error('GitHub token is required');
  }
  return baseGraphql.defaults({ headers: { authorization: `token ${token}` } });
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
    if (dueMatch && projectConfig.fields['Due Date']) {
      fields['Due Date'] = dueMatch[1];
    }
  }
  
  // Extract progress percentage (progress:75 = 75%)
  for (const label of labels) {
    const progressMatch = label.match(/^progress:(\d+)$/);
    if (progressMatch && projectConfig.fields.Progress) {
      fields.Progress = parseInt(progressMatch[1], 10);
      break;
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
  const graphql = createGraphQL(token);
  const projectConfig = getProjectConfig(projectKey);
  const results = [];
  
  console.log(`[${projectKey}] Starting automation for ${projectConfig.title}`);
  console.log(`[${projectKey}] Dry run: ${dryRun}`);
  
  // Get repository info
  const owner = process.env.GITHUB_REPOSITORY_OWNER || 'Andhika-Rey';
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'merajutasa.id';
  
  try {
    // Helper: get PR or null (soft-skip if not a PR or not found)
    async function getPullIfExists(number) {
      try {
        const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number: number });
        return data;
      } catch (e) {
        if (e.status === 404) {
          // Check if it's an issue (not a PR) or simply not found
          try {
            const { data: issue } = await octokit.rest.issues.get({ owner, repo, issue_number: number });
            if (!issue.pull_request) {
              console.warn(`[${projectKey}] Number ${number} is an Issue, not a PR. Skipping.`);
              return null;
            }
          } catch {
            console.warn(`[${projectKey}] Number ${number} not found. Skipping.`);
            return null;
          }
          console.warn(`[${projectKey}] Pull request #${number} not found. Skipping.`);
          return null;
        }
        throw e;
      }
    }

    // Fetch project and its fields (GraphQL)
    async function fetchUserProject(ownerLogin, projectNumber) {
      const data = await graphql(
        `query($owner:String!, $number:Int!) {
          user(login: $owner) {
            projectV2(number: $number) {
              id
              title
              url
              fields(first: 100) {
                nodes {
                  __typename
                  id
                  name
                  dataType
                  ... on ProjectV2SingleSelectField { options { id name } }
                }
              }
            }
          }
        }`,
        { owner: ownerLogin, number: projectNumber }
      );
      const proj = data?.user?.projectV2;
      if (!proj?.id) throw new Error(`Project V2 not found for ${ownerLogin} #${projectNumber}`);
      return proj;
    }

    // Find field by name (case-insensitive)
    function findFieldByName(project, name) {
      const nodes = project?.fields?.nodes || [];
      return nodes.find(f => (f.name || '').toLowerCase() === name.toLowerCase());
    }

    // Get PR node id via GraphQL
    async function getPullRequestNodeId(ownerLogin, repoName, number) {
      const data = await graphql(
        `query($owner:String!, $repo:String!, $number:Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) { id number }
          }
        }`,
        { owner: ownerLogin, repo: repoName, number }
      );
      return data?.repository?.pullRequest?.id || null;
    }

    // Ensure PR is in project, return itemId
    async function ensureProjectItemForPR(ownerLogin, projectNumber, projectId, prNodeId) {
      // Try to add; if fails because exists, fall back to lookup
      try {
        const add = await graphql(
          `mutation($projectId:ID!, $contentId:ID!) {
            addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
              item { id }
            }
          }`,
          { projectId, contentId: prNodeId }
        );
        const itemId = add?.addProjectV2ItemById?.item?.id;
        if (itemId) return itemId;
      } catch (e) {
        const msg = (e?.message || '').toLowerCase();
        if (!msg.includes('already') && !msg.includes('exists')) throw e;
        // continue to lookup
      }
      // Lookup items to find existing item id
      const data = await graphql(
        `query($owner:String!, $number:Int!) {
          user(login: $owner) {
            projectV2(number: $number) {
              items(first: 100) {
                nodes {
                  id
                  content { __typename ... on PullRequest { id number } }
                }
              }
            }
          }
        }`,
        { owner: ownerLogin, number: projectNumber }
      );
      const nodes = data?.user?.projectV2?.items?.nodes || [];
      const found = nodes.find(n => n?.content?.__typename === 'PullRequest' && n?.content?.id === prNodeId);
      return found?.id || null;
    }

    // Update field helper
    async function updateFieldValue(projectId, itemId, field, value) {
      const typename = field.__typename;
      const dataType = (field.dataType || '').toUpperCase();
      const input = { projectId, itemId, fieldId: field.id, value: {} };
      if (dataType === 'SINGLE_SELECT' || typename === 'ProjectV2SingleSelectField') {
        const opts = (field.options || []).map(o => ({ id: o.id, name: o.name }));
        const match = opts.find(o => (o.name || '').toLowerCase() === String(value).toLowerCase());
        if (!match) {
          throw new Error(`Option not found for field ${field.name}: ${value}`);
        }
        input.value = { singleSelectOptionId: match.id };
      } else if (dataType === 'NUMBER') {
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(num)) throw new Error(`Invalid number for field ${field.name}: ${value}`);
        input.value = { number: num };
      } else if (dataType === 'TEXT') {
        input.value = { text: String(value) };
      } else if (dataType === 'DATE') {
        // Expect YYYY-MM-DD
        input.value = { date: String(value) };
      } else {
        // Unsupported
        return { skipped: true, reason: `Unsupported dataType ${dataType} for ${field.name}` };
      }
      const res = await graphql(
        `mutation($projectId:ID!, $itemId:ID!, $fieldId:ID!, $value:ProjectV2FieldValue!) {
          updateProjectV2ItemFieldValue(input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: $value }) {
            projectV2Item { id }
          }
        }`,
        input
      );
      return { ok: !!res?.updateProjectV2ItemFieldValue?.projectV2Item?.id };
    }

    // Get PRs to process
    let prs = [];
    if (prNumber) {
      const pr = await getPullIfExists(prNumber);
      if (pr) prs = [pr];
    } else {
      const { data: openPrs } = await octokit.rest.pulls.list({ 
        owner, 
        repo, 
        state: 'open',
        per_page: 10
      });
      prs = openPrs;
    }

    if (!prs || prs.length === 0) {
      console.log(`[${projectKey}] No PRs to process.`);
      // Save empty report and return a success summary (no failures)
      await saveAutomationReport(projectKey, []);
      return {
        project: projectKey,
        config: projectConfig,
        results: [],
        summary: { total: 0, successful: 0, failed: 0 }
      };
    }
    
    // Resolve project via GraphQL once
    let projectV2 = null;
    try {
      projectV2 = await fetchUserProject(owner, projectConfig.id);
    } catch (e) {
      console.warn(`[${projectKey}] Project access error: ${e.message}`);
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
        
        // Add to Project V2 and update fields via GraphQL
        if (!dryRun && projectV2?.id) {
          try {
            const prNodeId = await getPullRequestNodeId(owner, repo, pr.number);
            if (!prNodeId) throw new Error('PR node id not found');
            const itemId = await ensureProjectItemForPR(owner, projectConfig.id, projectV2.id, prNodeId);
            if (!itemId) throw new Error('Failed to add/find project item for PR');
            result.actions.push(`Added to project: ${projectV2.title}`);

            // Update mapped fields
            const updatedFields = [];
            for (const [name, val] of Object.entries(fieldMappings)) {
              const field = findFieldByName(projectV2, name);
              if (!field) { result.actions.push(`Field missing: ${name} (skipped)`); continue; }
              try {
                const upd = await updateFieldValue(projectV2.id, itemId, field, val);
                if (upd?.ok) updatedFields.push(name);
              } catch (fe) {
                result.actions.push(`Field update failed ${name}: ${fe.message}`);
              }
            }
            if (updatedFields.length) {
              result.actions.push(`Updated fields: ${updatedFields.join(', ')}`);
            }
          } catch (pe) {
            result.errors.push(`Project sync: ${pe.message}`);
          }
        } else if (!dryRun) {
          result.actions.push('Project sync skipped (no access to Project V2)');
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
      // Exit code 1 only when we processed at least one PR and there were failures
      if (result.summary.total > 0 && result.summary.failed > 0) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Automation failed:', error);
      process.exit(1);
    });
}