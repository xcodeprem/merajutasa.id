# Contributing to MerajutASA.id

## CI/CD Pipeline Overview

### Node LTS Matrix Build

Our primary CI/CD pipeline runs on multiple Node.js LTS versions to ensure compatibility:

- **Node 18** (LTS Hydrogen)
- **Node 20** (LTS Iron) - Primary development version  
- **Node 22** (LTS Jod)

#### Pipeline Stages

1. **Matrix Build & Test** (15 min timeout)
   - Install dependencies with npm cache
   - Lint codebase (markdown, DEC files, disclaimers)
   - Type checking and schema validation
   - Unit and integration tests
   - UI build with coverage

2. **SBOM Generation** (10 min timeout)
   - Generate Software Bill of Materials (SPDX-JSON format)
   - Create Node.js runtime BOM
   - Upload artifacts for 90-day retention

3. **Security Scanning** (10 min timeout)
   - npm audit for high/critical vulnerabilities
   - Secret scanning with Gitleaks
   - Upload security artifacts

4. **Artifact Upload** (5 min timeout)
   - Comprehensive build artifacts
   - Test coverage reports
   - Build summaries

#### Required Status Checks

The following contexts must pass for PRs to be merged:

- `ci/build` - Node LTS Matrix Build
- `ci/lint` - Linting & Type Checking  
- `ci/test` - Test Suite
- `ci/security` - Security Scanning

#### Caching Strategy

Our multi-layer caching optimizes CI runtime to <10 minutes:

- **npm cache**: Built into `actions/setup-node`
- **Node modules**: Cross-run dependency caching
- **Build artifacts**: Compiled assets and generated files

#### Performance Targets

- **Total runtime**: <10 minutes with cache
- **Cold start**: <15 minutes without cache
- **Artifact retention**: 14-90 days based on type

### Development Workflow

1. **Fork and clone** the repository
2. **Create a feature branch** from `main`
3. **Make changes** following our coding standards
4. **Run tests locally**: `npm test`
5. **Submit a PR** - CI will automatically run
6. **Address feedback** and ensure all checks pass
7. **Merge** when approved and CI is green

### Local Development

```bash
# Install dependencies
npm ci

# Run all tests
npm test

# Test specific components
npm run test:governance
npm run test:services  
npm run test:infrastructure

# Validate workflow changes
npm run test:node-lts-workflow

# Build UI
npm run equity-ui-v2:build
```

### Governance & Compliance

This repository follows strict governance policies:

- All external GitHub Actions are pinned to commit SHA
- SBOM generation is mandatory for all builds
- Security scanning with zero tolerance for high/critical findings
- Comprehensive artifact collection for audit trails

For more details, see our [governance documentation](docs/governance/).

## Getting Help

- Check existing [issues](https://github.com/xcodeprem/merajutasa.id/issues)
- Review [documentation](docs/)
- Contact maintainers via GitHub discussions
