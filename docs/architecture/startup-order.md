# Startup Order

## Overview

Order is derived from the dependency graph (DAG topological sort).

## Rules

A service may start after all of its direct dependencies are healthy.

## Sections

- Global prerequisites
- Service groups (parallelizable)  
- Post-boot validations

## Operational Notes

- Health-check endpoints
- Retry/backoff settings
- Failure isolation guidelines
