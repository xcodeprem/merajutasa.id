---
id: DEC-YYYYMMDD-XX
title: Decision title
date: 2025-01-01T00:00:00Z
class: CIC-C
status: draft
supersedes: []
depends_on: []
scope:
  - One-line objective of the change.
non_removal_assertion: "Tidak menghapus keputusan sebelumnya kecuali dinyatakan eksplisit."
---

Summary

One-line decision summary.

Context

- Problem: Describe the problem and constraints.
- Evidence: Link to artifacts supporting the decision.

Options

1. Option A

- Pros: point 1
- Cons: point 1

1. Option B

- Pros: point 1
- Cons: point 1

Decision

- Chosen: option-a
- Rationale: Why this option.
- Principles alignment: [GP1, GP2]

Policy changes

- ID: policy-id-or-path — What changes (link to policy file if applicable).

Implementation

- Owner: team-or-person
- Milestones:
  - [ ] M1
  - [ ] M2

Audit

- Trace artifact: path/to/file
- Checksum: sha256:...
- Review window: 30 days

Integrity

- integrity_manifest_pointer: "docs/integrity/spec-hash-manifest-v1.json#files[path=<path>]"
- append_only_notice: "File immutable; perubahan memerlukan DEC penerus."

Notes

- N/A
