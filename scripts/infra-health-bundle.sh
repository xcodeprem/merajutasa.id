#!/usr/bin/env bash
set -euo pipefail

echo "🏥 Infrastructure Health Bundle: Deterministic End-to-end Runs"
echo "=============================================================="
echo ""

# Track step success
STEP_1_SUCCESS=false
STEP_2_SUCCESS=false  
STEP_3_SUCCESS=false
STEP_4_SUCCESS=false
STEP_5_SUCCESS=false
STEP_6_SUCCESS=false

echo "[1/6] Unified health (full)"
if npm run health:check; then
    STEP_1_SUCCESS=true
    echo "✅ Step 1 completed successfully"
else
    echo "❌ Step 1 failed"
    exit 1
fi

echo ""
echo "[2/6] Core health"  
if npm run health:core; then
    STEP_2_SUCCESS=true
    echo "✅ Step 2 completed successfully"
else
    echo "❌ Step 2 failed"
    exit 1
fi

echo ""
echo "[3/6] Infra group health"
if npm run health:infra; then
    STEP_3_SUCCESS=true
    echo "✅ Step 3 completed successfully"
else
    echo "❌ Step 3 failed"
    exit 1
fi

echo ""
echo "[4/6] Week6 health"
if npm run health:week6; then
    STEP_4_SUCCESS=true
    echo "✅ Step 4 completed successfully"
else
    echo "❌ Step 4 failed"
    exit 1
fi

echo ""
echo "[5/6] Infra category (dependencies)" 
if npm run infra:health:dependencies; then
    STEP_5_SUCCESS=true
    echo "✅ Step 5 completed successfully"
else
    echo "❌ Step 5 failed"
    exit 1
fi

echo ""
echo "[6/6] Infra category (observability)"
if npm run infra:health:observability; then
    STEP_6_SUCCESS=true
    echo "✅ Step 6 completed successfully"
else
    echo "❌ Step 6 failed"
    exit 1
fi

echo ""
echo "=============================================================="
echo "📋 Bundle Execution Summary:"
echo "  [1/6] Unified health (full): $([ "$STEP_1_SUCCESS" = true ] && echo "✅" || echo "❌")"
echo "  [2/6] Core health: $([ "$STEP_2_SUCCESS" = true ] && echo "✅" || echo "❌")"
echo "  [3/6] Infra group health: $([ "$STEP_3_SUCCESS" = true ] && echo "✅" || echo "❌")"
echo "  [4/6] Week6 health: $([ "$STEP_4_SUCCESS" = true ] && echo "✅" || echo "❌")"
echo "  [5/6] Infra category (dependencies): $([ "$STEP_5_SUCCESS" = true ] && echo "✅" || echo "❌")"
echo "  [6/6] Infra category (observability): $([ "$STEP_6_SUCCESS" = true ] && echo "✅" || echo "❌")"

if [ "$STEP_1_SUCCESS" = true ] && [ "$STEP_2_SUCCESS" = true ] && [ "$STEP_3_SUCCESS" = true ] && [ "$STEP_4_SUCCESS" = true ] && [ "$STEP_5_SUCCESS" = true ] && [ "$STEP_6_SUCCESS" = true ]; then
    echo ""
    echo "🎉 Infrastructure health bundle completed successfully!"
    echo ""
    echo "📊 Generated artifacts:"
    echo "  - artifacts/integrated-health-check-report.json"
    echo "  - artifacts/infra-health-*-details.json"
    echo "  - artifacts/infra-health-*-summary.json"
    echo "  - artifacts/infra-health-*-matrix.json"
    echo "  - artifacts/compliance/assessments/*.json"
else
    echo ""
    echo "❌ Some steps failed. Check the output above for details."
    exit 1
fi