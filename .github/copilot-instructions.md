# merajutasa.id

merajutasa.id appears to be an Indonesian website project. Currently, this is a minimal repository containing only basic documentation. This repository is likely intended to become a web application or static website.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Current Repository State

This repository is currently minimal and contains:
- README.md with basic project title
- .github/ directory with configuration files
- No build tools, dependencies, or application code yet

## Working Effectively

### Initial Setup and Validation
- Clone the repository: `git clone https://github.com/aphroditekenny/merajutasa.id.git`
- Navigate to repository: `cd merajutasa.id`
- Verify git status: `git status` -- completes in <1 second
- List repository contents: `ls -la` -- completes in <1 second
- Search for project files: `find . -name "*.md" -o -name "*.json" -o -name "*.js" -o -name "*.ts" -o -name "*.html" -o -name "*.css"` -- completes in <1 second

### Environment Requirements
The development environment has these tools available:
- Node.js v20.19.4 (confirmed working)
- npm v10.8.2 (confirmed working) 
- Python 3.12.3 (confirmed working)
- Git (confirmed working)

### If Developing a Web Application
If this becomes a Node.js/web project:
- Initialize project: `npm init -y` -- completes in <5 seconds
- Install dependencies: `npm install` -- time varies by dependencies and system performance, typically 1-10 minutes for modern projects. NEVER CANCEL. Set timeout to 15+ minutes if needed.
- Start development server: `npm run dev` or `npm start` (after scripts are defined)
- Build production: `npm run build` -- time varies by project size, typically 10-300 seconds (max 5 minutes). NEVER CANCEL. Set timeout to 10+ minutes to allow for rare edge cases or CI/CD delays.

### If Developing a Static Website
If this becomes a static site project:
- Common generators: Jekyll, Hugo, Next.js, or vanilla HTML/CSS/JS
- Test static files: Use local web server like `python3 -m http.server 8000`
- Deploy: May use GitHub Pages or similar hosting

## Development Workflow

### Making Changes
- Always create feature branches: `git checkout -b feature/your-feature-name`
- Make incremental commits with clear messages
- Test changes locally before committing
- Use descriptive commit messages following conventional commits format

### Common File Operations
- View file contents: Use editor tools rather than `cat` for better formatting
- Search repository: `find . -name "pattern" -not -path "./.git/*"`
- Check file changes: `git diff` or `git diff --name-only`

## Validation

### Current State Validation
- Repository structure is correct: Verify README.md exists and .github/ directory is present
- Git status is clean: `git status` should show clean working tree
- No build errors: Currently no build process to test

### Future Validation (When Project Develops)
- ALWAYS test any new functionality manually after making code changes
- If adding web functionality: Test in browser by navigating to localhost
- If adding CLI tools: Run help commands and basic operations
- If adding tests: Run test suite with `npm test` -- time varies, typically 5-300 seconds. NEVER CANCEL.
- Always run linting tools if configured: `npm run lint` -- typically 5-60 seconds

## Timing Expectations

### Fast Operations (<1 second)
- `git status`, `ls -la`, `find` operations, basic file viewing

### Medium Operations (1-30 seconds) 
- `npm init`, basic `npm install` with few dependencies

### Slow Operations (30+ seconds)
- Large `npm install` operations: See timing estimate in "Install dependencies" above (typically 30-120 seconds). NEVER CANCEL.
- Build processes: 10-300 seconds depending on complexity. NEVER CANCEL. Set timeout to 10+ minutes.
- Test suites: 5-300 seconds depending on test coverage. NEVER CANCEL. Set timeout to 10+ minutes.

### CRITICAL TIMEOUT GUIDELINES
- ALWAYS set timeouts of 10+ minutes for build commands
- ALWAYS set timeouts of 10+ minutes for test commands  
- NEVER CANCEL long-running build or test operations
- If operations seem hung, wait at least 10 minutes before investigating

## Project Structure Expectations

### Current Structure
```
merajutasa.id/
├── .git/
├── .github/
│   └── copilot-instructions.md
└── README.md
```

### Likely Future Structure (Web Project)
```
merajutasa.id/
├── .git/
├── .github/
├── src/
├── public/
├── package.json
├── package-lock.json
├── README.md
└── [build output directories]
```

## Common Commands Reference

### Repository Management
- `git status` -- check working tree status
- `git log --oneline -10` -- view recent commits
- `git branch -a` -- list all branches
- `git diff` -- view uncommitted changes

### File Operations
- `find . -name "*.ext" -not -path "./.git/*"` -- search for files by extension
- `grep -r "search_term" --exclude-dir=.git .` -- search file contents
- `ls -la` -- list all files with details

### Development Server (Future)
- `npm run dev` -- start development server (when configured)
- `npm run build` -- build for production (when configured) 
- `npm run test` -- run test suite (when configured)

## Important Notes

### Repository Context
- This is an Indonesian project based on the name "merajutasa.id"
- The .id suffix suggests connection to Indonesia
- Project is in very early stages with minimal content
- Future development direction not yet determined

### Development Guidelines  
- Follow Indonesian language conventions if applicable to content
- Consider responsive design for mobile users common in Indonesia
- Keep accessibility in mind for diverse user base
- Use semantic versioning for releases when project matures

### Limitations
- No existing CI/CD pipeline to validate against
- No existing test suite to verify changes
- No linting configuration to follow yet
- Project structure may evolve significantly as development progresses

Always verify these instructions remain accurate as the project develops and update them when the repository structure or workflow changes.