// Enhanced Project Board Integration Script for MerajutASA
// Version: 2.0.1
// Last Update: 2025-08-20 05:01:14

module.exports = async ({github, context, core, inputs}) => {
  try {
    const fs = require('fs');
    
    // Configuration
    const classificationData = JSON.parse(fs.readFileSync('classification.json', 'utf8'));
    const isDryRun = inputs.dryRun === true || inputs.dryRun === 'true';
    const projectTitle = inputs.projectTitle || 'MerajutASA Program Board';
    const nodeId = inputs.nodeId;
    const itemNumber = inputs.itemNumber;
    const itemType = inputs.itemType;
    const isPR = itemType === 'pull_request';
    
    core.info(`📋 Starting project board integration for ${itemType} #${itemNumber}`);
    
    if (isDryRun) {
      core.info('🧪 DRY RUN MODE: Will simulate project board updates without making changes');
      return { success: true, dryRun: true };
    }
    
    // Get project by title
    const ownerLogin = context.repo.owner;
    
    core.info(`🔍 Looking for project "${projectTitle}" owned by ${ownerLogin}`);
    
    const projectQuery = `
      query($owner: String!) {
        user(login: $owner) {
          projectsV2(first: 20) {
            nodes {
              id
              title
              url
              closed
              fields(first: 100) {
                nodes {
                  ... on ProjectV2FieldCommon {
                    id
                    name
                    dataType
                  }
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options {
                      id
                      name
                      nameHTML
                      description
                      color
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const projectResp = await github.graphql(projectQuery, { owner: ownerLogin });
    const projects = projectResp.user?.projectsV2?.nodes || [];
    
    const project = projects.find(p => p.title === projectTitle) || 
                   projects.find(p => p.title.toLowerCase() === projectTitle.toLowerCase());
    
    if (!project) {
      core.setFailed(`❌ Project "${projectTitle}" not found`);
      core.info('Available projects:');
      projects.forEach(p => core.info(`- ${p.title}`));
      return { success: false, error: 'Project not found' };
    }
    
    if (project.closed) {
      core.warning(`⚠️ Project "${projectTitle}" is closed`);
    }
    
    core.info(`✅ Found project: ${project.title} (${project.url})`);
    
    // Step 1: Get or add the item to the project
    core.info(`➕ Adding ${itemType} #${itemNumber} to project...`);
    
    let itemId;
    
    // Check if the item already exists in the project
    const itemsQuery = `
      query($projectId: ID!, $first: Int = 100) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: $first) {
              nodes {
                id
                content {
                  ... on Issue {
                    id
                    number
                    repository {
                      nameWithOwner
                    }
                  }
                  ... on PullRequest {
                    id
                    number
                    repository {
                      nameWithOwner
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const itemsResp = await github.graphql(itemsQuery, { projectId: project.id });
    const items = itemsResp.node.items.nodes;
    
    const repoFullName = `${context.repo.owner}/${context.repo.repo}`;
    const existingItem = items.find(i => 
      i.content && 
      i.content.number === itemNumber && 
      i.content.repository?.nameWithOwner === repoFullName
    );
    
    if (existingItem) {
      itemId = existingItem.id;
      core.info(`📍 Item already exists in project, ID: ${itemId}`);
    } else {
      // Add the item to the project
      if (!nodeId) {
        core.setFailed('❌ Cannot add item to project: missing node_id');
        return { success: false, error: 'Missing node_id' };
      }
      
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
        
        core.info(`Using node ID: ${nodeId}`);
        
        const addResult = await github.graphql(addMutation, { 
          projectId: project.id, 
          contentId: nodeId
        });
        
        itemId = addResult.addProjectV2ItemById.item.id;
        core.info(`✅ Added item with ID: ${itemId}`);
      } catch (e) {
        core.setFailed(`❌ Failed to add item to project: ${e.message}`);
        return { success: false, error: e.message };
      }
    }
    
    // Step 2: Update all the fields with classification data
    const fields = project.fields.nodes;
    const classifications = classificationData.classifications || {};
    
    // Helper function for setting single select fields
    async function setSingleSelect(fieldName, optionName, traceInfo = '') {
      const field = fields.find(f => f.name === fieldName);
      
      if (!field || field.dataType !== 'SINGLE_SELECT') {
        core.warning(`⚠️ Field "${fieldName}" not found or not a single select field`);
        return false;
      }
      
      // Check if optionName is a valid option for this field
      const option = field.options.find(o => 
        o.name.toLowerCase() === optionName.toLowerCase()
      );
      
      if (!option) {
        core.warning(`⚠️ Option "${optionName}" not found for field "${fieldName}"`);
        core.info(`Available options: ${field.options.map(o => o.name).join(', ')}`);
        return false;
      }
      
      // Set the field value
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
          projectId: project.id,
          itemId: itemId,
          fieldId: field.id,
          optionId: option.id
        });
        
        core.info(`✅ Set ${fieldName} = ${optionName}${traceInfo ? ' (' + traceInfo + ')' : ''}`);
        return true;
      } catch (e) {
        core.warning(`❌ Failed to set ${fieldName}: ${e.message}`);
        return false;
      }
    }
    
    // Helper function for setting date fields
    async function setDateField(fieldName, dateValue) {
      const field = fields.find(f => f.name === fieldName);
      
      if (!field || field.dataType !== 'DATE') {
        core.warning(`⚠️ Field "${fieldName}" not found or not a date field`);
        return false;
      }
      
      try {
        const mutation = `
          mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $date: Date!) {
            updateProjectV2ItemFieldValue(input: {
              projectId: $projectId,
              itemId: $itemId,
              fieldId: $fieldId,
              value: { date: $date }
            }) {
              projectV2Item { id }
            }
          }
        `;
        
        await github.graphql(mutation, {
          projectId: project.id,
          itemId: itemId,
          fieldId: field.id,
          date: dateValue
        });
        
        core.info(`✅ Set ${fieldName} = ${dateValue}`);
        return true;
      } catch (e) {
        core.warning(`❌ Failed to set ${fieldName}: ${e.message}`);
        return false;
      }
    }
    
    // Helper function for setting number fields
    async function setNumberField(fieldName, numberValue) {
      const field = fields.find(f => f.name === fieldName);
      
      if (!field || field.dataType !== 'NUMBER') {
        core.warning(`⚠️ Field "${fieldName}" not found or not a number field`);
        return false;
      }
      
      try {
        const mutation = `
          mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $number: Float!) {
            updateProjectV2ItemFieldValue(input: {
              projectId: $projectId,
              itemId: $itemId,
              fieldId: $fieldId,
              value: { number: $number }
            }) {
              projectV2Item { id }
            }
          }
        `;
        
        await github.graphql(mutation, {
          projectId: project.id,
          itemId: itemId,
          fieldId: field.id,
          number: parseFloat(numberValue)
        });
        
        core.info(`✅ Set ${fieldName} = ${numberValue}`);
        return true;
      } catch (e) {
        core.warning(`❌ Failed to set ${fieldName}: ${e.message}`);
        return false;
      }
    }
    
    // Helper function for setting text fields
    async function setTextField(fieldName, textValue) {
      const field = fields.find(f => f.name === fieldName);
      
      if (!field || field.dataType !== 'TEXT') {
        core.warning(`⚠️ Field "${fieldName}" not found or not a text field`);
        return false;
      }
      
      try {
        const mutation = `
          mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $text: String!) {
            updateProjectV2ItemFieldValue(input: {
              projectId: $projectId,
              itemId: $itemId,
              fieldId: $fieldId,
              value: { text: $text }
            }) {
              projectV2Item { id }
            }
          }
        `;
        
        await github.graphql(mutation, {
          projectId: project.id,
          itemId: itemId,
          fieldId: field.id,
          text: textValue
        });
        
        core.info(`✅ Set ${fieldName} = ${textValue}`);
        return true;
      } catch (e) {
        core.warning(`❌ Failed to set ${fieldName}: ${e.message}`);
        return false;
      }
    }
    
    // Set Status field
    if (classifications.status && classifications.status[0]) {
      const statusValue = classifications.status[0].id;
      const statusMapping = {
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'in-review': 'In Review',
        'blocked': 'Blocked',
        'done': 'Done'
      };
      
      await setSingleSelect('Status', statusMapping[statusValue] || 'To Do', 
        `confidence: ${classifications.status[0].confidence}`);
    }
    
    // Set Area field
    if (classifications.areas && classifications.areas.length > 0) {
      const areaValue = classifications.areas[0].id;
      const areaMapping = {
        'security': 'Security',
        'api-gateway': 'API Gateway & Services',
        'monitoring': 'Monitoring & Observability',
        'performance': 'Performance Optimization',
        'docs': 'Documentation',
        'infrastructure': 'Infrastructure',
        'compliance': 'Compliance',
        'ui': 'UI Components',
        'data': 'Data Management'
      };
      
      await setSingleSelect('Area', areaMapping[areaValue] || 'API Gateway & Services',
        `confidence: ${classifications.areas[0].confidence}`);
      
      // If multiple areas, add a comment about secondary areas
      if (classifications.areas.length > 1) {
        const secondaryAreas = classifications.areas
          .slice(1)
          .map(a => `${areaMapping[a.id]} (${(a.confidence * 100).toFixed(0)}% confidence)`)
          .join(', ');
          
        core.info(`ℹ️ Secondary areas: ${secondaryAreas}`);
      }
    }
    
    // Set Priority field
    if (classifications.priority && classifications.priority[0]) {
      const priorityValue = classifications.priority[0].id;
      const priorityMapping = {
        'p0': 'P0',
        'p1': 'P1',
        'p2': 'P2',
        'p3': 'P3'
      };
      
      await setSingleSelect('Priority', priorityMapping[priorityValue] || 'P2',
        `confidence: ${classifications.priority[0].confidence}`);
    }
    
    // Set Risk field
    if (classifications.risk && classifications.risk[0]) {
      const riskValue = classifications.risk[0].id;
      const riskMapping = {
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low'
      };
      
      await setSingleSelect('Risk', riskMapping[riskValue] || 'Medium',
        `confidence: ${classifications.risk[0].confidence}`);
    }
    
    // Set Size field
    if (classifications.size && classifications.size[0]) {
      const sizeValue = classifications.size[0].id;
      const sizeMapping = {
        'xs': 'XS',
        'small': 'Small',
        'medium': 'Medium',
        'large': 'Large',
        'xl': 'XL'
      };
      
      await setSingleSelect('Size', sizeMapping[sizeValue] || 'Medium',
        `confidence: ${classifications.size[0].confidence}`);
    }
    
    // Set Phase field (if present)
    if (classifications.phase) {
      const phaseValue = classifications.phase.id;
      let phaseName;
      
      // Handle different phase formats
      if (phaseValue.includes('-week-')) {
        const [phase, week] = phaseValue.split('-week-');
        phaseName = `Phase ${phase} Week ${week}`;
      } else if (!isNaN(phaseValue)) {
        phaseName = `Phase ${phaseValue}`;
      }
      
      if (phaseName) {
        await setSingleSelect('Phase', phaseName, 
          `confidence: ${classifications.phase.confidence}`);
      }
    }
    
    // Set Team field
    if (classifications.team && classifications.team[0]) {
      const teamValue = classifications.team[0].id;
      const teamMapping = {
        'security': 'Security',
        'devops': 'DevOps',
        'qa': 'QA',
        'frontend': 'Frontend',
        'backend-dev': 'Backend',
        'docs': 'Documentation'
      };
      
      await setSingleSelect('Team Assignment', teamMapping[teamValue] || 'Backend',
        `confidence: ${classifications.team[0].confidence}`);
    }
    
    // Set other fields like dates if available
    if (classifications.dates && classifications.dates.startDate) {
      await setDateField('Start date', classifications.dates.startDate);
    }
    
    if (classifications.dates && classifications.dates.dueDate) {
      await setDateField('Target date', classifications.dates.dueDate);
    }
    
    if (classifications.estimate) {
      await setNumberField('Estimate (h)', classifications.estimate);
    }
    
    // Set owner if available
    if (classificationData.item && classificationData.item.assignees && 
        classificationData.item.assignees.length > 0) {
      await setTextField('Owner (text)', classificationData.item.assignees[0]);
    } else if (classificationData.item && classificationData.item.author) {
      await setTextField('Owner (text)', classificationData.item.author);
    }
    
    core.info('✅ Project board integration completed successfully');
    return { success: true };
    
  } catch (error) {
    core.setFailed(`❌ Project integration error: ${error.message}`);
    return { success: false, error: error.message };
  }
};