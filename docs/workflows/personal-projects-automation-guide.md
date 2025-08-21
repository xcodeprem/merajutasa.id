# Personal Projects Automation Guide

## 🎯 Overview

This automation system provides seamless integration between GitHub Pull Requests and Andhika-Rey's personal GitHub Projects boards. It automatically manages three key project boards with intelligent labeling, field mapping, and cross-project orchestration.

## 🚀 Supported Projects

### 1. Feature Release Project (#12)

- **URL**: <https://github.com/users/Andhika-Rey/projects/12>
- **Purpose**: Track feature development lifecycle
- **Fields**: Status, Sub-Issues Progress, Priority, Size, Estimate, Iteration, Start Date, End Date
- **Workflow**: `.github/workflows/feature-release-automation.yml`

### 2. Team Retrospective Project (#11)  

- **URL**: <https://github.com/users/Andhika-Rey/projects/11>
- **Purpose**: Capture team insights and improvement opportunities
- **Fields**: Status, Sub-Issues Progress, Category, Notes
- **Workflow**: `.github/workflows/team-retrospective-automation.yml`

### 3. Iterative Development Project (#13)

- **URL**: <https://github.com/users/Andhika-Rey/projects/13>
- **Purpose**: Sprint-based development tracking
- **Fields**: Status, Sub-Issues Progress, Priority, Size, Estimate, Iteration
- **Workflow**: `.github/workflows/iterative-development-automation.yml`

## 🎮 How to Use

### Automatic Triggers

The automation runs automatically on:

- **Pull Request Events**: opened, synchronize, labeled, unlabeled, ready_for_review, reopened, closed, edited
- **Comment Triggers**: Add comments with specific keywords to manually trigger automation

### Manual Triggers via Comments

Add these comments to any PR to trigger specific project automation:

```bash
# Single project triggers
+project feature      # Triggers Feature Release automation
+project retro        # Triggers Team Retrospective automation  
+project iterative    # Triggers Iterative Development automation

# Multi-project trigger
+project all          # Triggers all three project automations
```

### Workflow Dispatch

Use GitHub's workflow dispatch to manually run automation:

1. Go to **Actions** → **Personal Projects Master Automation**
2. Click **Run workflow**
3. Select target project(s)
4. Optionally specify PR number
5. Enable dry-run mode for testing

## 🏷️ Smart Labeling System

### Priority Labels

```yaml
# Applied automatically based on PR characteristics
priority:p0  # P0 - URGENT (7 days)
priority:p1  # P1 - HIGH (30 days) 
priority:p2  # P2 - MEDIUM (90 days) - Default
priority:p3  # P3 - PLANNED (6 months)
```

### Size Labels

```yaml  
# Applied based on PR complexity analysis
size:xs  # XS - Minor fixes
size:s   # S - Small features
size:m   # M - Medium features - Default
size:l   # L - Large features
size:xl  # XL - Epic changes
```

### Status Labels

```yaml
# Applied automatically based on PR state
status:to-do         # Draft PRs
status:in-review     # Ready for review PRs
status:done          # Merged/closed PRs
```

### Category Labels (Retrospective)

```yaml
category:what-went-well      # Positive outcomes
category:what-to-improve     # Areas for growth
category:action-items        # Specific next steps
```

### Iteration Labels

```yaml
# Feature Release & Iterative Development
iteration:current    # Current sprint/iteration
iteration:next       # Next sprint/iteration
iteration:backlog    # Future sprints

# Iterative Development specific
iteration:sprint-1   # Sprint 1
iteration:sprint-2   # Sprint 2  
iteration:sprint-3   # Sprint 3
```

## 🔧 Field Mapping Logic

### Status Field

- **Draft PRs** → "To Do"
- **Open PRs** → "In Review"
- **Merged PRs** → "Done"
- **Closed PRs** → "Done"

### Priority Field

Maps from priority labels: `priority:p0` → "P0", etc.

### Size Field  

Maps from size labels: `size:m` → "M", etc.

### Category Field (Retrospective)

Maps from category labels: `category:what-went-well` → "What Went Well", etc.

### Estimate Field

Extract from labels: `est:h:8` → 8 hours

### Date Fields

- **Start Date**: From `start:2024-01-15` labels
- **End Date**: From `due:2024-01-30` labels
- **Milestone Dates**: Automatically extracted from PR milestones

### Sub-Issues Progress

Calculated from checkbox completion in PR body:

- Counts `- [x]` vs `- [ ]` patterns
- Returns percentage completion

### Notes Field (Retrospective)

Auto-generated contextual notes:

- Changes summary (+additions/-deletions)
- Reviewer assignments
- Milestone context

## 🎛️ Configuration

### Environment Variables

```yaml
# Required
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}           # Standard GitHub token
GH_PROJECT_TOKEN: ${{ secrets.GH_PROJECT_TOKEN }}   # Personal access token with project permissions

# Optional  
GITHUB_REPOSITORY: ${{ github.repository }}         # Auto-set by GitHub Actions
GITHUB_REPOSITORY_OWNER: ${{ github.repository_owner }} # Auto-set by GitHub Actions
```

### Required Secrets

Set up a **Personal Access Token** with these scopes:

- `repo` - Full repository access
- `project` - Project access  
- `workflow` - Workflow access
- `user` - User access

Add as repository secret: `GH_PROJECT_TOKEN`

## 🚀 Advanced Features

### Cross-Project Orchestration

The master automation workflow can process multiple projects simultaneously:

```yaml
# In personal-projects-master-automation.yml
strategy:
  matrix:
    project: ['feature-release', 'team-retrospective', 'iterative-development']
  fail-fast: false  # Continue processing other projects if one fails
```

### Intelligent Defaults

- **Priority**: Defaults to P2 (Medium) if not specified
- **Size**: Defaults to M (Medium) for projects that support sizing
- **Category**: Defaults to "What Went Well" for retrospective
- **Status**: Automatically determined from PR state

### Dry Run Mode

Test automation without making changes:

```bash
# Via workflow dispatch
dry_run: true

# Via CLI
node tools/github/personal-projects-automation.js feature-release --dry-run
```

### Comprehensive Reporting

Each automation run generates detailed reports:

- `artifacts/personal-project-automation-{project}.json`
- Summary statistics
- Applied changes log
- Error tracking

## 📊 Integration with Existing Systems

### MerajutASA Platform Integration

- Inherits labeling patterns from existing `enhanced-project-workflows-guide.md`
- Integrates with existing project automation in `tools/github/`
- Reuses field mapping logic from `project-spotcheck.js`
- Follows established patterns from `auto-add-project-yaml-guide.md`

### NPM Scripts Integration

```bash
# Individual project automation
npm run project:feature-release
npm run project:team-retrospective  
npm run project:iterative-development

# Run all project automations
npm run project:automation:all
```

### Workflow Cross-References

- Triggers existing `project-spotcheck.yml` after updates
- Integrates with `project-sync.yml` workflows
- Follows patterns from existing project automation

## 🎯 Success Metrics

When properly configured, you should see:

- ✅ **100% PR Coverage**: All PRs automatically added to appropriate projects
- ✅ **Accurate Field Mapping**: Labels automatically map to project fields
- ✅ **Real-time Updates**: Status changes reflect PR lifecycle
- ✅ **Cross-Project Visibility**: PRs appear in multiple relevant project views
- ✅ **Audit Trail**: Comprehensive logging of all automation actions

## 🔍 Troubleshooting

### Common Issues

**Authentication Errors**

```bash
# Ensure GH_PROJECT_TOKEN has correct permissions
# Token needs: repo, project, workflow, user scopes
```

**Project Not Found**  

```bash
# Verify project IDs in personal-projects-automation.js
# Ensure projects exist at specified URLs
```

**Field Mapping Issues**

```bash
# Check project field names match expectations
# Use dry-run mode to test mappings
```

### Debug Commands

```bash
# Test automation with dry run
node tools/github/personal-projects-automation.js feature-release --dry-run

# Check existing project structure  
npm run project:spotcheck

# Validate scripts
npm run scripts:validate
```

### Log Analysis

Check workflow run logs for:

- Authentication status
- Project discovery results  
- Field mapping decisions
- API response codes

## 🚀 Future Enhancements

### Phase 2 Improvements

- **GraphQL Integration**: Direct project field updates via GitHub's Projects v2 API
- **Webhook Support**: Real-time project synchronization
- **Advanced Analytics**: Project health metrics and insights
- **Custom Field Types**: Support for additional project field types

### Integration Roadmap

- **Issue Automation**: Extend beyond PRs to include issue management
- **Milestone Sync**: Bi-directional milestone synchronization
- **Team Assignments**: Automatic team member assignment based on project context
- **Dependency Tracking**: Cross-project dependency visualization

---

*This automation system is optimized for personal GitHub accounts and integrates seamlessly with the merajutasa.id governance platform.*
