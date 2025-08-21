# Fairness & Hysteresis Index

## Overview

This directory contains the official fairness and hysteresis documentation for the MerajutASA.id equity monitoring system. The system implements a non-ranking fairness approach using hysteresis methods to prevent churn and ensure stable equity measurements.

<div data-disclaimer-block="equity">
<p data-disclaimer-id="D1">Equity Index & daftar under‑served bukan ranking kualitas—hanya sinyal pemerataan.</p>
<p data-disclaimer-id="D2">Tidak ada data pribadi anak dikumpulkan / ditampilkan.</p>
</div>

## Official Configuration

### Primary Configuration File

- **[hysteresis-config-v1.yml](hysteresis-config-v1.yml)** - Official parameter configuration
  - Version: 1.0.0
  - DEC Reference: DEC-20250812-02
  - Contains all threshold parameters, state definitions, and enforcement policies
  - **Hash-locked**: Changes require new DEC and governance approval

### Key Parameters Summary

From `hysteresis-config-v1.yml`:

- **T_enter_major**: 0.50 (severe immediate trigger)
- **T_enter_standard**: 0.60 (borderline trigger, requires 2 consecutive)
- **T_exit**: 0.65 (exit threshold)
- **cooldown_snapshots_after_exit**: 1 snapshot cooldown period
- **stalled_window_snapshots**: 5 snapshots for stall detection

## Governance & Decision References

### Core DEC Documents

- **[DEC-20250812-02](../governance/dec/DEC-20250812-02-hysteresis-adoption.md)** - Adoption of Under‑Served Hysteresis Option F (Hybrid) Parameters
  - Status: `adopted`
  - Establishes the current hysteresis methodology and thresholds
  - Baseline fairness decision for all subsequent parameter changes

- **[DEC-20250815-02](../governance/dec/DEC-20250815-02-hysteresis-config-update.md)** - Hysteresis Config Hash Adoption
  - Status: `draft`
  - Adopts updated config content and seals hash in integrity manifest
  - Ensures parameter changes are governance-tracked

## Methodology & Implementation

### Core Documentation

- **[hysteresis-public-methodology-fragment-v1.md](hysteresis-public-methodology-fragment-v1.md)** - Public methodology specification
  - Entry/exit logic and state transitions
  - Audit & verification requirements
  - Append-only governance model

- **[hysteresis-state-machine-transitions.md](hysteresis-state-machine-transitions.md)** - Concrete state machine specification
  - Complete state definitions: NONE, CANDIDATE, ACTIVE, STALLED, CLEARED
  - Transition rules with bound parameters
  - Instrumentation mapping for events

### Equity Calculations

- **[equity-snapshot-pseudocode.md](equity-snapshot-pseudocode.md)** - Equity index computation algorithm
  - Gini coefficient calculation
  - 1 - Gini equity index formula
  - Anomaly detection parameters

- **[equity-page.md](equity-page.md)** - Public equity page content
- **[equity-under-served-section.md](equity-under-served-section.md)** - Under-served status explanation

## How to Validate

### Automated Testing

The fairness system includes comprehensive validation through:

1. **Unit Tests**

   ```bash
   # Run fairness engine unit tests (UT1-UT10)
   node tools/tests/fairness-engine-unit-tests.js
   ```

   - Tests severe/consecutive entry logic
   - Validates boundary conditions and cooldown behavior
   - Checks stall detection and state transitions

2. **Governance Verification**

   ```bash
   # Run complete governance verification
   npm run governance:verify
   ```

   - Includes fairness unit tests as part of governance pipeline
   - Validates parameter integrity against configuration
   - Checks spec-hash consistency

3. **Parameter Integrity Check**

   ```bash
   # Verify configuration matches runtime constants
   npm run param:integrity
   ```

   - Compares `hysteresis-config-v1.yml` against code constants
   - Detects parameter drift and configuration mismatches

4. **Fairness Simulation**

   ```bash
   # Run fairness scenarios simulation
   node tools/fairness-sim.js
   ```

   - Executes multiple fairness scenarios
   - Generates `artifacts/fairness-sim-report.json`
   - Tests edge cases and boundary conditions

### Test Reports Location

Test artifacts are generated in `artifacts/` directory:

- `artifacts/fairness-sim-report.json` - Simulation results
- `artifacts/param-integrity-matrix.json` - Parameter verification
- `artifacts/governance-verify-summary.json` - Overall governance status

### Continuous Integration

The fairness system is protected by CI checks that:

- Prevent parameter changes without governance approval (DEC requirement)
- Validate configuration file hash integrity
- Run all fairness unit tests on every commit
- Enforce hysteresis.params.lock policy

## Bias Mitigation & Transparency

### Parameter Transparency

All threshold parameters are:

- **Publicly documented** in this repository
- **Hash-locked** to prevent unauthorized changes
- **Governance-controlled** through DEC process
- **Audit-trailable** with integrity manifest references

### Bias Prevention Measures

1. **Non-ranking approach**: No league tables or quality rankings
2. **Hysteresis stability**: Prevents rapid state changes and churn
3. **Cooldown periods**: Reduces noise and false positives
4. **Anomaly detection**: Flags unusual changes for review
5. **Stall detection**: Identifies units stuck in borderline states

### Formula Transparency

- **Entry reasons**: Clearly defined as "severe" or "consecutive"
- **State transitions**: Fully documented with exact thresholds
- **Equity calculation**: Open pseudocode with Gini coefficient formula
- **Event instrumentation**: All state changes generate audit events

## References

### External Documentation

- [GP1–GP10 Principles Index](../principles/GP1-GP10-index.md) - Governance principles
- [Methodology Snippet H0](../transparency/methodology-snippet-h0.md) - Public summary
- [Trust Hysteresis](../trust/trust-hysteresis.md) - Trust verification methods

### Implementation Files

- `tools/fairness/hysteresis-engine.js` - Core engine implementation
- `tools/fairness/engine-core.js` - Decision logic core
- `tools/fairness-sim.js` - Simulation framework

---

**Maintenance Notice**: This index is maintained as part of the governance documentation. Changes to fairness parameters require DEC approval and update to this index accordingly.

**Last Updated**: Generated for issue #136 - Fairness & Hysteresis Index documentation
