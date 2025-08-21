# Scripts Governance: Naming, Grouping, and Prefix Standards

## Overview

This document establishes naming standards and categorization for the 238+ npm scripts in package.json, based on the actual current usage patterns with 75+ distinct prefixes.

## Current Prefix Inventory

Based on analysis of package.json scripts (as of current state):

### High-Usage Prefixes (10+ scripts)

- **test:** (20 scripts) - Testing and validation
- **infra:** (18 scripts) - Infrastructure management  
- **ha:** (11 scripts) - High availability operations
- **week6:** (11 scripts) - Phase 6 integration testing

### Core Domain Prefixes (5-9 scripts)

- **docker:** (9 scripts) - Container management
- **project:** (8 scripts) - GitHub project automation
- **privacy:** (8 scripts) - Privacy and PII handling
- **compliance:** (7 scripts) - Compliance automation
- **performance:** (6 scripts) - Performance monitoring
- **lint:** (5 scripts) - Code and document linting
- **service:** (5 scripts) - Core services (signer, chain, collector)
- **fairness:** (5 scripts) - Fairness calculations
- **k8s:** (5 scripts) - Kubernetes operations
- **events:** (5 scripts) - Event processing
- **health:** (5 scripts) - Health checks

### Supporting Prefixes (2-4 scripts)

- **equity:** (4 scripts), **equity-ui-v2:** (4 scripts) - Equity tracking and UI
- **observability:** (4 scripts) - Observability stack
- **api-gateway:** (4 scripts) - API gateway management
- **security:** (4 scripts) - Security scanning
- **policy:** (4 scripts) - Policy management
- **scripts:** (4 scripts) - Script management tools
- **spec-hash:** (3 scripts) - Hash integrity verification
- **evidence:** (3 scripts) - Evidence validation
- **audit:** (3 scripts) - Audit trail management
- **week5:** (3 scripts), **phase2:** (3 scripts) - Phase/week tracking
- **gate:** (3 scripts) - Quality gates

### Specialized Prefixes (1-2 scripts)

**Single-purpose domains:**
- **governance:** (2) - Governance verification
- **param:** (2) - Parameter integrity
- **cache:** (2), **sla:** (2) - Performance utilities
- **dashboards:** (2) - Monitoring dashboards
- **service-mesh:** (2) - Service mesh operations
- **week2/3/4:** (2 each) - Legacy week tracking
- **phase1:** (2), **cicd:** (2) - Deployment phases
- **docs:** (2), **feedback:** (2) - Documentation and feedback
- **dec:** (2), **chain:** (2) - Decision records and blockchain
- **h1:** (2), **terms:** (2) - Heuristics and terms management

**Singleton scripts:**
- **format**, **tracing**, **metrics**, **alerting**, **logs**, **anomaly**
- **gap**, **phase**, **transparency**, **risk**, **agent**, **pr**
- **collector**, **governed**, **gen**, **snapshot**, **baseline**, **queries**
- **doc**, **schema**, **hero**, **h0**, **verify**, **monitor**
- **kpi**, **perf**, **a11y**, **changelog**, **pipeline**, **startup**

## Categorization by Function

### 1. Core Governance & Integrity
- **governance:**, **spec-hash:**, **param:**, **evidence:**, **dec:**
- **policy:**, **governed**, **verify**

### 2. Services & Infrastructure
- **service:**, **infra:**, **docker:**, **k8s:**, **cache:**, **api-gateway:**
- **service-mesh:**, **ha:**, **startup**

### 3. Testing & Validation
- **test:**, **lint:**, **gate:**, **audit:**, **health:**
- **week6:**, **week5:**, **week2-4:**, **baseline:**

### 4. Privacy & Compliance
- **privacy:**, **compliance:**, **security:**

### 5. Observability & Performance
- **observability:**, **performance:**, **metrics:**, **tracing:**
- **alerting:**, **logs:**, **anomaly:**, **dashboards:**
- **monitor:**, **sla:**, **perf:**

### 6. Fairness & Equity
- **fairness:**, **equity:**, **equity-ui-v2:**

### 7. Data & Events
- **events:**, **collector**, **feedback:**, **chain:**

### 8. Development & Automation
- **scripts:**, **project:**, **docs:**, **format**
- **gen:**, **snapshot:**, **pr:**, **changelog:**

### 9. Analysis & Reporting
- **gap**, **phase:**, **transparency:**, **risk:**, **agent:**
- **terms:**, **kpi:**, **h0**, **h1:**

### 10. Deployment & Operations
- **cicd:**, **phase1:**, **phase2:**, **pipeline:**

## Naming Standards

### Prefix Conventions

1. **Use established prefixes** from the inventory above for consistency
2. **Colon separation** for hierarchical organization (`prefix:action` or `prefix:sub:action`)
3. **Kebab-case** for multi-word actions (`health-check`, `auto-scaling-status`)
4. **Descriptive actions** that indicate the script's purpose

### Action Naming Patterns

**Common action suffixes:**
- `:start`, `:stop`, `:restart` - Service lifecycle
- `:status`, `:health`, `:check` - Status verification  
- `:test`, `:smoke`, `:validate` - Testing variations
- `:deploy`, `:build`, `:install` - Build/deployment
- `:create`, `:list`, `:cleanup` - CRUD operations
- `:monitor`, `:metrics`, `:report` - Monitoring/reporting

**Quality indicators:**
- `:smoke-test` - Quick validation
- `:integration-test` - Full integration
- `:health-check` - Health verification
- `:full-health` - Comprehensive health check

## Grouping Standards

### Runner Scripts (Aggregation)

Scripts that orchestrate multiple related operations:

```bash
# Observability stack
observability:start  # Starts metrics, tracing, dashboards
observability:health-check  # Validates all observability components

# Week6 integration
week6:validate  # Runs all week6 validation scripts
week6:demo      # Comprehensive week6 demonstration

# Infrastructure health
infra:health:all  # Aggregates all infra health checks
infra:start-all   # Starts all infrastructure services

# High availability
ha:start-all    # Starts all HA components
ha:system-health # Comprehensive HA health check
```

### Single-Purpose Scripts

Scripts that perform one specific operation:

```bash
# Core services
service:signer    # Ed25519 signing service
service:chain     # Hash chain service  
service:collector # Event collection service

# Integrity checks
spec-hash:verify  # Hash integrity verification
param:integrity   # Parameter validation
evidence:validate # Evidence bundle validation
```

## Execution Path Standards

### Service Scripts (Long-running)

- **Pattern**: `service:*`, `*:start`, `*:monitor`
- **Behavior**: Start background services, should not exit
- **Usage**: Manual execution or process management
- **Validation**: Excluded from automated testing

### Runner Scripts (Orchestration)

- **Pattern**: `*:all`, `*:start-all`, `*:health-check`
- **Behavior**: Execute multiple related scripts sequentially
- **Implementation**: Use `&&` for fail-fast or `concurrently` for parallel
- **Logic**: Should delegate to other scripts, not contain new logic

### Validation Scripts (Testing)

- **Pattern**: `test:*`, `lint:*`, `*:verify`, `*:validate`
- **Behavior**: Exit with status code indicating success/failure
- **Usage**: CI/CD pipelines and quality gates
- **Timeout**: Should complete within reasonable time (< 2 minutes default)

### Utility Scripts (Tools)

- **Pattern**: `*:list`, `*:status`, `*:cleanup`, `gen:*`
- **Behavior**: Perform specific utility functions
- **Output**: Clear, parseable output when appropriate
- **Safety**: Read-only operations preferred for frequent use

## Validation Guidelines

### Automated Validation Scope

**Safe for automation:**
- `test:*`, `lint:*`, `*:verify`, `*:validate`
- `*:status`, `*:list`, `*:check`  
- `gen:*`, `*:report`, `*:metrics`

**Skip automation:**
- `service:*`, `*:start`, `*:monitor` (long-running)
- `*:deploy`, `*:delete`, `*:cleanup` (potentially destructive)
- `*:interactive`, `*:demo` (require user interaction)

### Quality Gates

1. **Naming compliance** - Follow prefix conventions
2. **Cross-platform compatibility** - Avoid shell-specific commands
3. **Timeout limits** - Complete within reasonable time
4. **Exit codes** - Proper success/failure indication
5. **Documentation** - Clear description of purpose

## Governance Integration

### Script Management Tools

- `scripts:analyze` - Generate prefix inventory and analysis
- `scripts:validate` - Test safe scripts for functionality
- `scripts:organize` - Apply organizational standards
- `scripts:docs-metrics` - Generate documentation metrics

### Continuous Validation

- **PR validation** - Run `scripts:validate` on script changes
- **Inventory tracking** - Monitor prefix growth and usage
- **Standards compliance** - Enforce naming conventions
- **Performance monitoring** - Track execution times

### Change Control

**Adding new scripts:**
1. Follow established prefix patterns
2. Use appropriate action naming
3. Classify as service/runner/validation/utility
4. Update this document if introducing new patterns

**Modifying existing scripts:**
1. Maintain backward compatibility where possible
2. Update documentation if changing behavior
3. Re-validate after changes

**Removing scripts:**
1. Check for dependencies in other scripts
2. Update runner scripts that may reference them
3. Archive obsolete scripts rather than immediate deletion

## Future Cleanup Targets

Based on this governance analysis, future PR-3 cleanup should focus on:

1. **Consolidate singleton prefixes** - Merge single-use prefixes into broader categories
2. **Standardize week/phase naming** - Unified approach to temporal organization  
3. **Rationalize health checks** - Consistent health check patterns across domains
4. **Simplify test organization** - Clearer test categorization and execution paths
5. **Reduce prefix proliferation** - Target <50 prefixes through consolidation

---

*This document serves as the reference for script organization and validation during cleanup activities. Prefix counts and examples reflect the current state and should be updated as scripts are reorganized.*