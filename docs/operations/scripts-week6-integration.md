# Week6 Integration + Scripts Validation (Ops)

This document describes the operational bundle for running Week6 integration operations followed by comprehensive scripts validation.

## Overview

The Week6 validation bundle provides a single command to execute the complete Week6 integration pipeline followed by scripts analysis and validation. This ensures all components are working properly and scripts are validated for governance compliance.

## Execution Order

The bundle runs the following steps in sequence:

1. **`npm run week6:integration-flow`** - Complete Week6 integration flow
   - Runs dependency checks, component status verification, and smoke tests
   - Validates import resolution and component contracts

2. **`npm run week6:integration-test`** - Week6 integration testing
   - Executes compliance audit, security scan, and privacy rights management tests
   - Validates end-to-end integration across compliance components

3. **`npm run week6:validate`** - Week6 validation pipeline
   - Runs complete Week6 test suite and compliance orchestrator
   - Validates component functionality and orchestration

4. **`npm run scripts:analyze`** - Scripts inventory analysis
   - Creates comprehensive inventory of all npm scripts
   - Analyzes script dependencies, risks, and cross-platform compatibility

5. **`npm run scripts:validate`** - Scripts validation harness
   - Validates safe scripts for execution
   - Generates validation reports for governance pipeline

## Usage

### Single Command Execution

Run the complete bundle with a single command:

```bash
bash scripts/week6-validation-bundle.sh
```

### Individual Steps

You can also run individual steps for debugging or partial execution:

```bash
npm run week6:integration-flow
npm run week6:integration-test  
npm run week6:validate
npm run scripts:analyze
npm run scripts:validate
```

## Output Artifacts

The bundle generates several important artifacts:

- **`artifacts/scripts/inventory.json`** - Complete scripts inventory with analysis
- **`artifacts/scripts/validation.json`** - Detailed validation results for each script
- **`artifacts/scripts/validation-summary.json`** - Summary of validation statistics
- **`artifacts/week6-component-*.json`** - Week6 component test reports
- **`artifacts/audit/*.ndjson`** - Audit system logs and events
- **`artifacts/security/scans/*.json`** - Security scan results
- **`artifacts/compliance/assessments/*.json`** - Compliance assessment reports

## Success Criteria

The bundle succeeds when all 5 steps complete successfully. The Week6 integration steps (1-3) must exit with code 0, while the scripts validation step (5) may report warnings if unrelated scripts have issues, but will still be considered successful as long as the validation reports are generated.

Any critical step failure will halt the bundle execution immediately, but the scripts validation step is handled gracefully to account for expected script validation warnings.

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure no other services are running on Week6 component ports (9000-9004)
2. **Missing dependencies**: Run `npm ci` to ensure all dependencies are installed
3. **Timeout issues**: Week6 integration tests may take several minutes to complete
4. **Script validation warnings**: The `scripts:validate` step may report warnings about unrelated scripts - this is expected and doesn't indicate Week6 component failure

### Debug Mode

For detailed debugging, run individual steps and check the generated artifacts:

```bash
# Check Week6 component health
npm run week6:components-status

# View scripts validation details  
cat artifacts/scripts/validation-summary.json

# Check specific component logs
ls -la artifacts/audit/
ls -la artifacts/security/scans/
```

## Integration with CI/CD

This bundle is designed to be used in continuous integration pipelines to validate both Week6 components and script inventory as part of governance verification.

Example CI usage:

```yaml
- name: Week6 Integration & Scripts Validation
  run: bash scripts/week6-validation-bundle.sh
  timeout-minutes: 15
```
