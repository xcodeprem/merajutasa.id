// Project integration script

module.exports = async ({github, context, core, inputs}) => {
    try {
        const fs = require('fs');
        const isDryRun = inputs.isDryRun === true || inputs.isDryRun === 'true';
        const projectTitle = inputs.projectTitle || 'MerajutASA Program Board';
        const nodeIdFallback = inputs.nodeIdFallback;
        const itemNumber = inputs.itemNumber;
        const itemType = inputs.itemType || 'issue';
        const isPR = itemType === 'pull_request';
        
        // Load classification data
        let classification;
        try {
          classification = JSON.parse(fs.readFileSync('classification.json', 'utf8'));
          core.info('✅ Loaded classification data');
        } catch (e) {
          core.setFailed(`Failed to load classification data: ${e.message}`);
          return;
        }
        
        // Extract key information
        const metadata = classification.metadata || {};
        const item = classification.item || {};
        const classifications = classification.classifications || {};
        const labels = classification.labels?.final || [];
        
        // Get node_id from classification data or fallback
        let contentId = item.node_id || nodeIdFallback;
        
        // If still no node_id, fetch it directly
        if (!contentId) {
          const owner = context.repo.owner;
          const repo = context.repo.repo;
          
          try {
            core.info(`🔄 No node_id found in data, fetching directly for ${isPR ? 'PR' : 'Issue'} #${itemNumber}...`);
            
            if (isPR) {
              const pr = await github.rest.pulls.get({owner, repo, pull_number: itemNumber});
              contentId = pr.data.node_id;
            } else {
              const issue = await github.rest.issues.get({owner, repo, issue_number: itemNumber});
              contentId = issue.data.node_id;
            }
            
            if (contentId) {
              core.info(`✅ Successfully retrieved node_id: ${contentId}`);
            }
          } catch (e) {
            core.setFailed(`Failed to fetch node_id: ${e.message}`);
            return;
          }
        }
        
        if (!contentId) {
          core.setFailed('Missing node_id. Cannot add to project.');
          return;
        }
        
        // Project configuration
        const ownerLogin = context.repo.owner;
        
        core.info(`🎯 Processing ${isPR ? 'PR' : 'Issue'} #${itemNumber} for project "${projectTitle}"`);
        core.info(`Using node ID: ${contentId}`);
        
        if (isDryRun) {
          core.info('🧪 DRY RUN MODE: Will simulate but not make actual changes');
        }
        
        // Project lookup
        let project;
        try {
          if (isDryRun) {
            core.info('🧪 DRY RUN: Would look up project');
            project = { id: 'dry-run-project-id', title: projectTitle, url: 'https://github.com/users/Andhika-Rey/projects/1' };
          } else {
            const projectQuery = `
              query($owner: String!) {
                repositoryOwner(login: $owner) {
                  id
                  login
                  ... on User {
                    projectsV2(first: 20) {
                      nodes {
                        id title url public
                        fields(first: 50) {
                          nodes {
                            __typename
                            ... on ProjectV2FieldCommon { id name dataType }
                            ... on ProjectV2SingleSelectField { 
                              id name dataType 
                              options { id name color description } 
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            `;
            const resp = await github.graphql(projectQuery, { owner: ownerLogin });
            const nodes = resp.repositoryOwner?.projectsV2?.nodes || [];
            
            project = nodes.find(p => p.title === projectTitle)
                  || nodes.find(p => p.title.toLowerCase() === projectTitle.toLowerCase())
                  || nodes.find(p => p.title === 'MerajutASA Program Board');
                  
            if (!project) {
              core.warning(`❌ Project "${projectTitle}" not found in ${ownerLogin}'s account`);
              core.info('💡 Available projects:');
              for (const p of nodes) {
                core.info(`- ${p.title}`);
              }
              return;
            }
          }
        } catch (error) {
          core.warning(`❌ Project lookup failed: ${error.message}`);
          return;
        }
        
        core.info(`✅ Using project: ${project.title} (${project.url || 'N/A'})`);
        
        const projectId = project.id;
        const fields = isDryRun ? [] : (project.fields?.nodes || []);
        
        // Helper functions for field operations
        function getField(name) { 
          return fields.find(f => f.name === name); 
        }
        
        async function setSingleSelect(fieldName, optionName) {
          const field = getField(fieldName);
          if (!field || field.dataType !== 'SINGLE_SELECT') {
            core.info(`⚠️ Field "${fieldName}" not found or not a single select field`);
            return false;
          }
          
          const option = (field.options || []).find(o => 
            o.name.toLowerCase() === optionName.toLowerCase()
          );
          
          if (!option) {
            core.info(`⚠️ Option "${optionName}" not found for field "${fieldName}"`);
            core.info(`Available options: ${(field.options || []).map(o => o.name).join(', ')}`);
            return false;
          }
          
          if (isDryRun) { 
            core.info(`🧪 DRY RUN: Would set ${fieldName} = ${optionName}`);
            return true; 
          }
          
          try {
            const mutation = `
              mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
                updateProjectV2ItemFieldValue(input: {
                  projectId: $projectId,
                  itemId: $itemId,
                  fieldId: $fieldId,
                  value: { singleSelectOptionId: $optionId }
                }) {
                  projectV2Item { id }
                }
              }
            `;
            await github.graphql(mutation, { 
              projectId, 
              itemId, 
              fieldId: field.id, 
              optionId: option.id 
            });
            core.info(`✅ Set ${fieldName} = ${optionName}`);
            return true;
          } catch (e) {
            core.warning(`Failed to set ${fieldName}: ${e.message}`);
            return false;
          }
        }
        
        async function setDate(fieldName, value) {
          const field = getField(fieldName);
          if (!field || field.dataType !== 'DATE') {
            core.info(`⚠️ Field "${fieldName}" not found or not a date field`);
            return false;
          }
          
          if (isDryRun) { 
            core.info(`🧪 DRY RUN: Would set ${fieldName} = ${value}`);
            return true;
          }
          
          try {
            const mutation = `
              mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $v: Date!) {
                updateProjectV2ItemFieldValue(input: {
                  projectId: $projectId,
                  itemId: $itemId,
                  fieldId: $fieldId,
                  value: { date: $v }
                }) {
                  projectV2Item { id }
                }
              }
            `;
            await github.graphql(mutation, { 
              projectId, 
              itemId, 
              fieldId: field.id, 
              v: value 
            });
            core.info(`✅ Set ${fieldName} = ${value}`);
            return true;
          } catch (e) {
            core.warning(`Failed to set ${fieldName}: ${e.message}`);
            return false;
          }
        }
        
        async function setNumber(fieldName, value) {
          const field = getField(fieldName);
          if (!field || field.dataType !== 'NUMBER') {
            core.info(`⚠️ Field "${fieldName}" not found or not a number field`);
            return false;
          }
          
          if (isDryRun) { 
            core.info(`🧪 DRY RUN: Would set ${fieldName} = ${value}`);
            return true;
          }
          
          try {
            const mutation = `
              mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $v: Float!) {
                updateProjectV2ItemFieldValue(input: {
                  projectId: $projectId,
                  itemId: $itemId,
                  fieldId: $fieldId, 
                  value: { number: $v }
                }) {
                  projectV2Item { id }
                }
              }
            `;
            await github.graphql(mutation, { 
              projectId, 
              itemId, 
              fieldId: field.id, 
              v: value 
            });
            core.info(`✅ Set ${fieldName} = ${value}`);
            return true;
          } catch (e) {
            core.warning(`Failed to set ${fieldName}: ${e.message}`);
            return false;
          }
        }
        
        async function setText(fieldName, value, options = {}) {
          const { overwrite = true } = options;
          
          if (!value || !String(value).trim()) {
            if (!overwrite) {
              core.info(`Skipping empty text value for ${fieldName} (overwrite=false)`);
              return false;
            }
          }
          
          const field = getField(fieldName);
          if (!field || field.dataType !== 'TEXT') {
            core.info(`⚠️ Field "${fieldName}" not found or not a text field`);
            return false;
          }
          
          if (isDryRun) { 
            core.info(`🧪 DRY RUN: Would set ${fieldName} = ${value}`);
            return true;
          }
          
          try {
            const mutation = `
              mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $v: String!) {
                updateProjectV2ItemFieldValue(input: {
                  projectId: $projectId,
                  itemId: $itemId,
                  fieldId: $fieldId,
                  value: { text: $v }
                }) {
                  projectV2Item { id }
                }
              }
            `;
            await github.graphql(mutation, { 
              projectId, 
              itemId, 
              fieldId: field.id, 
              v: value 
            });
            core.info(`✅ Set ${fieldName} = ${value}`);
            return true;
          } catch (e) {
            core.warning(`Failed to set ${fieldName}: ${e.message}`);
            return false;
          }
        }
        
        // Ensure item exists in project or add it
        let itemId;
        if (isDryRun) {
          core.info('🧪 DRY RUN: Would check if item exists in project');
          itemId = 'dry-run-item-id';
        } else {
          // First, check if item already exists
          const itemQuery = `
            query($projectId: ID!, $first: Int = 100) {
              node(id: $projectId) {
                ... on ProjectV2 {
                  items(first: $first) {
                    nodes {
                      id
                      content {
                        ... on Issue { id number repository { nameWithOwner } }
                        ... on PullRequest { id number repository { nameWithOwner } }
                      }
                    }
                  }
                }
              }
            }
          `;
          
          const itemsResp = await github.graphql(itemQuery, { projectId });
          const items = itemsResp.node.items.nodes;
          
          const repoFullName = `${context.repo.owner}/${context.repo.repo}`;
          const existingItem = items.find(i => 
            i.content && 
            i.content.number === itemNumber && 
            i.content.repository?.nameWithOwner === repoFullName
          );
          
          if (existingItem) {
            itemId = existingItem.id;
            core.info(`🔄 Item already exists in project, ID: ${itemId}`);
          } else {
            // Add item to project
            core.info(`➕ Adding ${isPR ? 'PR' : 'Issue'} #${itemNumber} to project`);
            
            try {
              const addMutation = `
                mutation($projectId: ID!, $contentId: ID!) { 
                  addProjectV2ItemById(input: {
                    projectId: $projectId, 
                    contentId: $contentId
                  }) { 
                    item { id } 
                  } 
                }
              `;
              
              core.info(`Using contentId: ${contentId}`);
              
              const addResult = await github.graphql(addMutation, { 
                projectId, 
                contentId 
              });
              
              itemId = addResult.addProjectV2ItemById.item.id;
              core.info(`✅ Added item with ID: ${itemId}`);
            } catch (e) {
              core.setFailed(`Failed to add item to project: ${e.message}`);
              return;
            }
          }
        }
        
        // Apply field mappings based on classification results
        const results = [];
        
        // Map classifications to project fields
        if (classifications.area?.value) {
          const areaKey = classifications.area.value;
          const areaMapping = { 
            'security-layer': 'Security Layer', 
            'monitoring-observability': 'Monitoring & Observability', 
            'performance-optimization': 'Performance Optimization', 
            'container-orchestration': 'Container Orchestration',
            'cicd-pipeline': 'CI/CD Pipeline',
            'data-management': 'Data Management',
            'api-gateway-services': 'API Gateway & Services',
            'docs': 'Documentation',
            'ui-components': 'UI Components'
          };
          const mappedArea = areaMapping[areaKey] || areaKey.replace(/-/g, ' ');
          results.push(await setSingleSelect('Area', mappedArea));
        }
        
        if (classifications.risk?.value) {
          const riskMapping = {
            'low': 'Low', 
            'medium': 'Medium', 
            'high': 'High'
          };
          results.push(await setSingleSelect('Risk', riskMapping[classifications.risk.value] || 'Medium'));
        }
        
        if (classifications.status?.value) {
          const statusMapping = {
            'todo': 'To Do',
            'in-progress': 'In Progress',
            'in-review': 'In Review',
            'blocked': 'Blocked',
            'done': 'Done'
          };
          results.push(await setSingleSelect('Status', statusMapping[classifications.status.value] || 'To Do'));
        }
        
        if (classifications.team?.value) {
          const teamValue = classifications.team.value.replace(/-/g, ' ');
          results.push(await setSingleSelect('Team Assignment', teamValue));
        }
        
        if (classifications.size?.value) {
          const sizeMapping = {
            'xs': 'XS',
            'small': '< 10KB',
            'medium': '10-25KB',
            'large': '25-50KB',
            'very-large': '50-100KB',
            'enterprise': '100KB+',
            'system': 'Enterprise Scale'
          };
          results.push(await setSingleSelect('Implementation Size', sizeMapping[classifications.size.value] || classifications.size.value));
        }
        
        if (classifications.health?.value) {
          const healthMapping = {
            '100': '100/100',
            '90-99': '90-99/100',
            '75-89': '75-89/100',
            '50-74': '50-74/100',
            '25-49': '25-49/100',
            '0-24': '0-24/100'
          };
          results.push(await setSingleSelect('Health Score', healthMapping[classifications.health.value] || classifications.health.value));
        }
        
        if (classifications.iteration?.value) {
          const iterValue = classifications.iteration.value.replace(/-/g, ' ');
          results.push(await setSingleSelect('Iteration', iterValue));
        }
        
        // Process labels for additional fields
        const labelSet = new Set(labels || []);
        
        // Phase from labels
        const phaseLabel = Array.from(labelSet).find(l => l.toLowerCase().startsWith('phase:'));
        if (phaseLabel) {
          const raw = phaseLabel.slice('phase:'.length).toLowerCase();
          const phaseMapping = {
            '1': 'Phase 1',
            '2-week-1': 'Phase 2 W1',
            '2-week-2': 'Phase 2 W2',
            '2-week-3': 'Phase 2 W3',
            '2-week-4': 'Phase 2 W4',
            '2-week-5': 'Phase 2 W5',
            '2-week-6': 'Phase 2 W6',
            '2-week-7': 'Phase 2 W7',
            '2-week-8': 'Phase 2 W8',
            '3-q1': 'Phase 3 Q1',
            '3-q2': 'Phase 3 Q2',
            '3-q3': 'Phase 3 Q3',
            '3-q4': 'Phase 3 Q4'
          };
          const target = phaseMapping[raw];
          if (target) results.push(await setSingleSelect('Phase', target));
        }
        
        // Dates from labels
        const startDateLabel = Array.from(labelSet).find(l => l.startsWith('start:'));
        if (startDateLabel) {
          const dateStr = startDateLabel.slice('start:'.length);
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            results.push(await setDate('Start date', dateStr));
          }
        }
        
        const dueDateLabel = Array.from(labelSet).find(l => l.startsWith('due:'));
        if (dueDateLabel) {
          const dateStr = dueDateLabel.slice('due:'.length);
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            results.push(await setDate('Target date', dateStr));
          }
        }
        
        // Estimate from labels
        const estimateLabel = Array.from(labelSet).find(l => l.startsWith('est:h:'));
        if (estimateLabel) {
          const hours = parseFloat(estimateLabel.slice('est:h:'.length));
          if (!isNaN(hours) && hours > 0) {
            results.push(await setNumber('Estimate (h)', hours));
          }
        }
        
        // Owner from original classification data
        if (item.assignees && item.assignees.length > 0) {
          results.push(await setText('Owner (text)', item.assignees[0]));
        } else if (item.author) {
          results.push(await setText('Owner (text)', item.author, { overwrite: false }));
        }
        
        // Links from body
        const urlMatch = (item.body || '').match(/https?:\/\/\S+/);
        if (urlMatch) {
          results.push(await setText('Links', urlMatch[0], { overwrite: false }));
        }
        
        // Milestone
        if (item.milestone?.title) {
          results.push(await setText('Milestone', item.milestone.title));
        }
        
        // Write integration summary
        const summary = {
          metadata: metadata,
          project: {
            title: project.title,
            url: project.url || '',
            owner: ownerLogin
          },
          item: {
            type: itemType,
            number: itemNumber,
            title: item.title,
            added_to_project: !isDryRun,
            classification_confidence: classifications.area?.confidence || 'N/A',
            area: classifications.area?.value || 'N/A'
          },
          fields_updated: results.filter(Boolean).length,
          dry_run: isDryRun,
          timestamp: new Date().toISOString()
        };
        
        core.info('📊 Project integration complete');
        if (isDryRun) {
          core.info('🧪 This was a dry run - no actual changes were made');
        } else {
          core.info(`✅ Successfully added to project and updated ${results.filter(Boolean).length} fields`);
        }
        
        // Write summary for artifact
        try {
          fs.writeFileSync('project-integration-summary.json', JSON.stringify(summary, null, 2));
        } catch (e) {
          core.warning(`Failed to write summary: ${e.message}`);
        }
    } catch (error) {
        core.setFailed(`Project integration error: ${error.message}`);
    }
};