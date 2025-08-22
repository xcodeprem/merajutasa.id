# Failure Impact Matrix

*Generated: 2025-08-22T11:02:01.070Z*

## Overview

This document provides a comprehensive failure impact analysis derived from the component dependency matrix. It identifies critical paths, SLA-affecting dependencies, and blast radius for each component to support incident response and capacity planning.

## Critical Path Analysis

### Critical Components (3 total)

**Database Service** (db)
- **Impact Level**: critical
- **Path Score**: 16
- **Dependents**: 2
- **Dependencies**: 0

**Authentication Service** (auth)
- **Impact Level**: critical
- **Path Score**: 14
- **Dependents**: 1
- **Dependencies**: 1

**API Gateway** (gateway)
- **Impact Level**: critical
- **Path Score**: 12
- **Dependents**: 0
- **Dependencies**: 2

## SLA-Affecting Dependencies

### High-Priority Components (3 total)

#### Database Service (db)
- **Impact Level**: critical
- **Blast Radius**: 3 components
- **Affected Components**: auth, catalog, gateway
- **Reason**: Critical component failure causes system outage

#### Authentication Service (auth)
- **Impact Level**: critical
- **Blast Radius**: 1 components
- **Affected Components**: gateway
- **Reason**: Critical component failure causes system outage

#### API Gateway (gateway)
- **Impact Level**: critical
- **Blast Radius**: 0 components
- **Affected Components**: None
- **Reason**: Critical component failure causes system outage; Gateway component - single point of failure

## Component Failure Impact Matrix

| Component | Type | Failure Impact | Criticality | Direct Impact | Cascading Impact | Total Impacted | SLA Affecting |
|-----------|------|----------------|-------------|---------------|------------------|----------------|---------------|
| API Gateway | service | critical | critical | 0 | 0 | 0 | 🚨 |
| Authentication Service | service | critical | critical | 1 | 0 | 1 | 🚨 |
| Database Service | service | critical | critical | 2 | 1 | 3 | 🚨 |
| Catalog Service | service | medium | medium | 1 | 0 | 1 | ✅ |
| Search Service | service | medium | medium | 1 | 1 | 2 | ✅ |

## Blast Radius Analysis

### Components by Impact Scope

#### High Blast Radius (5+ components)
- None

#### Medium Blast Radius (2-4 components)
- **Search Service** (search): 2 components
- **Database Service** (db): 3 components

#### Low Blast Radius (0-1 components)
- **API Gateway** (gateway): 0 components
- **Authentication Service** (auth): 1 components
- **Catalog Service** (catalog): 1 components

## Recovery Prioritization

### Tier 1 - Critical (Immediate Response Required)
- **Database Service** (db) - Affects 3 components
- **Authentication Service** (auth) - Affects 1 components
- **API Gateway** (gateway) - Affects 0 components

### Tier 2 - High Impact (Response within 1 hour)
- None

### Tier 3 - Medium Impact (Response within 4 hours)
- **Search Service** (search) - Affects 2 components
- **Catalog Service** (catalog) - Affects 1 components

### Tier 4 - Low Impact (Response within 24 hours)
- None

## Incident Response Guidelines

### Critical Component Failure
1. **Immediate Actions** (0-5 minutes)
   - Activate incident response team
   - Assess scope using blast radius data
   - Begin failover procedures for affected SLA components

2. **Short-term Response** (5-30 minutes)
   - Isolate failed component
   - Activate backup systems for critical dependencies
   - Notify stakeholders based on SLA impact

3. **Recovery Actions** (30+ minutes)
   - Execute recovery procedures based on criticality tier
   - Monitor cascading effects on dependent components
   - Validate system integrity after recovery

### Capacity Planning Considerations

- **Critical Path Redundancy**: Ensure 3 critical components have failover
- **Load Balancing**: Distribute load across non-SLA-affecting components where possible
- **Monitoring**: Implement enhanced monitoring for components with blast radius > 3

## Data Sources

- **Dependency Matrix**: `docs/architecture/dependencies.json`
- **Component Inventory**: `docs/architecture/component-inventory.json`
- **Generated**: 2025-08-22T11:02:01.070Z
- **Generator**: `failure-impact-matrix-generator.js`

---

*This document is automatically generated from the dependency matrix to ensure consistency. Do not edit manually.*
