# ADR-0005: Component Dependency Mapping

## Context

We have 35+ components with unclear dependencies and startup order.

## Decision

- Define "dependency" as a runtime/blocking requirement between deployable components.
- Source of truth: config/component-registry.json
- Outputs:
  - build/deps/graph.json (machine-readable)
  - docs/architecture/dependency-graph.mmd (Mermaid diagram source)
- CI policy: no new circular dependencies (maxCycles: 0).
- Do not commit generated images (PNG/SVG); publish via CI artifacts.

## Consequences

- Reviewers can reason about impact and startup sequence.
- CI prevents dependency regressions.

## Acceptance Criteria

- The repository contains the files mentioned above.
- A CI job fails when cycles are introduced.

## References

- Parent: Issue 7