# Auto-add Project YAML - IT Leader Guide

## 🎯 Overview

The `auto-add-project.yaml` workflow is specifically designed for **personal GitHub accounts** (not enterprise) to help IT Leaders effectively track all Issues, PRs, and team progress in GitHub Projects.

This script was inspired by enterprise practices from Netflix, Google, Microsoft, Amazon, and Gojek, and optimized for merajutasa.id's needs.

## 🚀 Quick Setup

### Prerequisites

1. **GH_PROJECT_TOKEN** secret configured with the following scopes:
   - `repo` - Full repository access
   - `project` - Project access
   - `workflow` - Workflow access
   - `user` - User access
   - `copilot` - Copilot access (if using Copilot)

2. **GitHub Project V2** set up using the Setup Project V2 workflow

### First-Time Setup

```bash
# 1. Run these workflows in order:
#    a. Seed Labels (Project v2)
#    b. Setup Project V2
#    c. Auto-add Project is now ready!
```

## 🎛️ Features

### Automatic Triggers

The workflow automatically runs when:

- ✅ Issues are opened, labeled, reopened, edited, or closed
- ✅ Pull Requests are opened, labeled, reopened, edited, closed, or synchronized
- ✅ Comments containing "+project" are added to issues/PRs
- ✅ PRs become ready for review

### Manual Triggers

IT Leaders can manually trigger the workflow with options:

- **Issue/PR Number**: Specify a specific item to process
- **Project Owner**: Override the default project owner
- **Project Title**: Target a specific project
- **Dry Run Mode**: Test without making changes

### Intelligent Field Mapping

The workflow automatically maps labels to project fields:

#### Priority

- `P0`, `urgent`, `critical` → **P0**
- `P1`, `high-priority`, `high` → **P1**
- `P2`, `medium`, `medium-priority` → **P2**
- `P3`, `planned`, `low`, `low-priority` → **P3**

#### Area

- `area:security` → **Security**
- `area:compliance` → **Compliance**
- `area:observability` → **Observability**
- `area:performance` → **Performance**
- `area:high-availability` → **High Availability**
- `area:api-gateway` → **API Gateway**
- And many more...

#### Phase

- `phase:1` → **Phase 1**
- `phase:2-week-1` → **Phase 2 W1**
- `phase:2-week-2` → **Phase 2 W2**
- Up to `phase:3-q4` → **Phase 3 Q4**

#### Status (Smart Auto-Detection)

- **Opening Issues**: Automatically set to "To Do"
- **Opening Draft PRs**: Automatically set to "To Do"
- **Opening Ready PRs**: Automatically set to "In Review"
- **Ready for Review**: Automatically set to "In Review"
- **Closing/Merging**: Automatically set to "Done"
- Manual labels: `status:todo`, `status:in-progress`, `status:in-review`, `status:blocked`, `status:done`

#### Date Handling

- `start:YYYY-MM-DD` → Sets **Start date**
- `due:YYYY-MM-DD` → Sets **Target date**
- Milestone due dates → Automatically sets **Target date**

#### Estimation

- `est:h:8` → Sets **Estimate** to 8 hours
- `est:h:16` → Sets **Estimate** to 16 hours

## 🎮 How to Use

### For Daily Operations

1. **Create Issues/PRs normally** - they'll be automatically added to your project
2. **Add labels** for priority, area, phase, etc. - fields will auto-update
3. **Use "+project" comments** to manually trigger addition to project
4. **Set milestones** - due dates will be automatically mapped

### For Manual Control

1. Go to **Actions** → **Auto-add to Project (Personal Account)**
2. Click **Run workflow**
3. Configure options:
   - Leave **Issue/PR number** empty to process recent items
   - Set **Dry run mode** to `true` to test without changes
   - Override **Project owner** or **Project title** if needed

### For Troubleshooting

1. **Enable detailed logging** by default (built-in)
2. **Check workflow run logs** for comprehensive information
3. **Use dry run mode** to test changes before applying
4. **Review the IT Leader Summary** at the end of each run

## 📊 IT Leader Dashboard Features

### Comprehensive Logging

Every workflow run provides:

- 📧 **Event details** (what triggered the workflow)
- 🎯 **Item details** (issue/PR being processed)
- 🔧 **Field updates** (what changes were made)
- 📊 **Summary report** (overview for management)

### Progress Tracking

- **Real-time status updates** as items move through workflow
- **Automatic owner assignment** from assignees or authors
- **Link extraction** from issue/PR descriptions
- **Milestone tracking** integration

### Team Visibility

- **All team activities** are automatically tracked
- **Cross-repository support** (works across all repos)
- **Historical data** through workflow run history
- **Artifact generation** for reporting

## 🔧 Advanced Configuration

### Environment Variables

```yaml
env:
  DEFAULT_PROJECT_TITLE: "MerajutASA Program Board"
  ENABLE_DETAILED_LOGGING: true
  AUTO_CREATE_PROJECT: true  # Guides to run Setup Project V2 first
```

### Repository Variables (Optional)

- `PROJECT_OWNER`: Override default project owner
- `PROJECT_TITLE`: Override default project title

### Workflow Customization

The workflow is designed to be enterprise-ready and requires minimal customization. For advanced needs:

1. **Field mappings** can be enhanced in the script
2. **Label patterns** can be extended
3. **Custom fields** can be added to mapping logic

## 🎯 Best Practices for IT Leaders

### 1. Label Strategy

Implement a consistent labeling strategy:

```bash
# Priority (required)
P0, P1, P2, P3

# Area (recommended)
area:security, area:performance, area:docs

# Phase (for roadmap tracking)
phase:2-week-1, phase:2-week-2

# Status (optional - auto-detected)
status:in-progress, status:blocked
```

### 2. Milestone Usage

- Set milestone due dates for automatic target date mapping
- Use consistent milestone naming conventions
- Link milestones across repositories for unified tracking

### 3. Team Training

- Train team members on label usage
- Encourage use of "+project" comments when needed
- Set up notifications for project updates

### 4. Monitoring

- Review workflow run logs regularly
- Monitor project board for completeness
- Use artifacts for management reporting

## 🚨 Troubleshooting

### Common Issues

1. **"GH_PROJECT_TOKEN secret is required"**
   - Solution: Add the token in Repository Settings → Secrets

2. **"Project not found"**
   - Solution: Run "Setup Project V2" workflow first
   - Or check project title spelling

3. **"Field not found or not single-select"**
   - Solution: Ensure project has all required fields
   - Re-run "Setup Project V2" workflow

### Getting Help

1. **Check workflow logs** for detailed error information
2. **Use dry run mode** to test configurations
3. **Review existing project structure** matches field expectations
4. **Verify token permissions** include all required scopes

## 🎉 Success Metrics

When properly configured, you should see:

- ✅ **100% of Issues/PRs** automatically added to project
- ✅ **Accurate field mapping** from labels to project fields
- ✅ **Real-time status updates** as work progresses
- ✅ **Comprehensive audit trail** through workflow logs
- ✅ **Team productivity insights** through project analytics

This workflow will serve merajutasa.id effectively until the platform reaches success across business, government, society, media, academic, and community perspectives.
