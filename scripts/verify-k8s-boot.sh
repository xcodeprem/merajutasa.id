#!/bin/bash

# Kubernetes Boot Sequence Verification Script
# This script implements the procedures documented in docs/runbooks/boot-sequence-k8s.md
# Usage: ./scripts/verify-k8s-boot.sh [cluster-context]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ARTIFACTS_DIR="${REPO_ROOT}/artifacts/k8s-boot-verification"
LOG_FILE="${ARTIFACTS_DIR}/verification-$(date +%Y%m%d-%H%M%S).log"
TIMEOUT_DEPLOY=300  # 5 minutes for deployment
TIMEOUT_READY=600   # 10 minutes for pods to become ready
LABEL_SELECTOR="app.kubernetes.io/part-of=merajutasa"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${1}" | tee -a "${LOG_FILE}"
}

log_info() {
    log "${BLUE}[INFO]${NC} ${1}"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} ${1}"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} ${1}"
}

log_error() {
    log "${RED}[ERROR]${NC} ${1}"
}

# Utility functions
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        return 1
    fi
    
    # Check kubectl version
    local kubectl_version
    kubectl_version=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3 | cut -d'v' -f2)
    log_info "kubectl version: ${kubectl_version}"
    
    # Check cluster connectivity
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        log_info "Please ensure kubectl is configured correctly"
        return 1
    fi
    
    # Check cluster info
    log_info "Cluster info:"
    kubectl cluster-info | tee -a "${LOG_FILE}"
    
    # Check node status
    log_info "Node status:"
    kubectl get nodes -o wide | tee -a "${LOG_FILE}"
    
    # Check available resources
    if command -v kubectl top &> /dev/null; then
        log_info "Node resource usage:"
        kubectl top nodes 2>/dev/null | tee -a "${LOG_FILE}" || log_warning "Metrics server not available"
    fi
    
    # Check RBAC permissions
    log_info "Checking RBAC permissions..."
    if kubectl auth can-i create deployments &>/dev/null; then
        log_success "Deployment permissions: OK"
    else
        log_error "Insufficient permissions to create deployments"
        return 1
    fi
    
    if kubectl auth can-i create services &>/dev/null; then
        log_success "Service permissions: OK"
    else
        log_error "Insufficient permissions to create services"
        return 1
    fi
    
    return 0
}

run_k8s_deploy() {
    log_info "Deploying to Kubernetes cluster..."
    
    cd "${REPO_ROOT}"
    
    if timeout "${TIMEOUT_DEPLOY}" npm run k8s:deploy 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "Deployment command completed successfully"
        return 0
    else
        log_error "Deployment command failed or timed out"
        return 1
    fi
}

wait_for_rollout() {
    log_info "Waiting for deployments to roll out..."
    
    local deployments
    deployments=$(kubectl get deployments -l "${LABEL_SELECTOR}" -o name 2>/dev/null || echo "")
    
    if [[ -z "${deployments}" ]]; then
        log_error "No deployments found with label ${LABEL_SELECTOR}"
        return 1
    fi
    
    local failed=0
    while IFS= read -r deployment; do
        log_info "Waiting for ${deployment} to roll out..."
        if timeout "${TIMEOUT_READY}" kubectl rollout status "${deployment}"; then
            log_success "${deployment} rolled out successfully"
        else
            log_error "${deployment} failed to roll out within timeout"
            failed=1
        fi
    done <<< "${deployments}"
    
    return $failed
}

verify_pod_status() {
    log_info "Verifying pod status..."
    
    # Get pod status
    local pod_status_output
    pod_status_output=$(kubectl get pods -l "${LABEL_SELECTOR}" -o wide 2>/dev/null || echo "")
    
    if [[ -z "${pod_status_output}" ]]; then
        log_error "No pods found with label ${LABEL_SELECTOR}"
        return 1
    fi
    
    echo "${pod_status_output}" | tee -a "${LOG_FILE}"
    
    # Check if all pods are running
    local running_pods ready_pods total_pods
    running_pods=$(echo "${pod_status_output}" | grep -c "Running" || echo "0")
    ready_pods=$(echo "${pod_status_output}" | awk 'NR>1 && $2 ~ /^[0-9]+\/[0-9]+$/ && $2 !~ /0\// {split($2,a,"/"); if(a[1]==a[2]) count++} END {print count+0}')
    total_pods=$(echo "${pod_status_output}" | grep -c "^pod/" || echo "0")
    
    log_info "Pod status: ${running_pods}/${total_pods} running, ${ready_pods}/${total_pods} ready"
    
    if [[ "${running_pods}" -eq "${total_pods}" && "${ready_pods}" -eq "${total_pods}" ]]; then
        log_success "All pods are running and ready"
        return 0
    else
        log_error "Not all pods are running and ready"
        return 1
    fi
}

verify_service_status() {
    log_info "Verifying service status..."
    
    # Get service status
    local service_output
    service_output=$(kubectl get services -l "${LABEL_SELECTOR}" 2>/dev/null || echo "")
    
    if [[ -z "${service_output}" ]]; then
        log_error "No services found with label ${LABEL_SELECTOR}"
        return 1
    fi
    
    echo "${service_output}" | tee -a "${LOG_FILE}"
    
    # Check endpoints
    log_info "Checking service endpoints..."
    kubectl get endpoints -l "${LABEL_SELECTOR}" | tee -a "${LOG_FILE}"
    
    return 0
}

verify_deployment_status() {
    log_info "Verifying deployment status..."
    
    # Run the npm script for status
    cd "${REPO_ROOT}"
    npm run k8s:status 2>&1 | tee -a "${LOG_FILE}"
    
    return 0
}

collect_logs() {
    log_info "Collecting application logs..."
    
    cd "${REPO_ROOT}"
    
    # Collect logs using npm script
    log_info "Running npm run k8s:logs..."
    npm run k8s:logs 2>&1 | tee -a "${LOG_FILE}"
    
    # Also collect individual pod logs for detailed analysis
    log_info "Collecting individual pod logs..."
    local pods
    pods=$(kubectl get pods -l "${LABEL_SELECTOR}" -o name 2>/dev/null || echo "")
    
    while IFS= read -r pod; do
        if [[ -n "${pod}" ]]; then
            local pod_name
            pod_name=$(echo "${pod}" | cut -d'/' -f2)
            log_info "Collecting logs for ${pod_name}..."
            kubectl logs "${pod}" --tail=50 >> "${LOG_FILE}" 2>&1 || log_warning "Failed to collect logs for ${pod_name}"
        fi
    done <<< "${pods}"
    
    return 0
}

analyze_health_probes() {
    log_info "Analyzing health probe status..."
    
    local pods
    pods=$(kubectl get pods -l "${LABEL_SELECTOR}" -o name 2>/dev/null || echo "")
    
    local healthy_probes=0
    local total_probes=0
    
    while IFS= read -r pod; do
        if [[ -n "${pod}" ]]; then
            local pod_name
            pod_name=$(echo "${pod}" | cut -d'/' -f2)
            
            # Get pod conditions
            local conditions
            conditions=$(kubectl get "${pod}" -o jsonpath='{.status.conditions[*].type}' 2>/dev/null || echo "")
            
            if [[ "${conditions}" == *"Ready"* && "${conditions}" == *"ContainersReady"* ]]; then
                healthy_probes=$((healthy_probes + 1))
                log_success "Health probes for ${pod_name}: HEALTHY"
            else
                log_error "Health probes for ${pod_name}: FAILED"
                # Get detailed condition info
                kubectl describe "${pod}" | grep -A 10 "Conditions:" | tee -a "${LOG_FILE}"
            fi
            total_probes=$((total_probes + 1))
        fi
    done <<< "${pods}"
    
    log_info "Health probe summary: ${healthy_probes}/${total_probes} pods healthy"
    
    if [[ "${healthy_probes}" -eq "${total_probes}" ]]; then
        return 0
    else
        return 1
    fi
}

generate_summary() {
    log_info "Generating verification summary..."
    
    local summary_file="${ARTIFACTS_DIR}/verification-summary.json"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Collect metrics
    local deployments pods services
    deployments=$(kubectl get deployments -l "${LABEL_SELECTOR}" --no-headers 2>/dev/null | wc -l || echo "0")
    pods=$(kubectl get pods -l "${LABEL_SELECTOR}" --no-headers 2>/dev/null | wc -l || echo "0")
    services=$(kubectl get services -l "${LABEL_SELECTOR}" --no-headers 2>/dev/null | wc -l || echo "0")
    
    local ready_pods
    ready_pods=$(kubectl get pods -l "${LABEL_SELECTOR}" --no-headers 2>/dev/null | awk '$2 ~ /^[0-9]+\/[0-9]+$/ && $2 !~ /0\// {split($2,a,"/"); if(a[1]==a[2]) count++} END {print count+0}' || echo "0")
    
    cat > "${summary_file}" << EOF
{
  "verification_timestamp": "${timestamp}",
  "cluster_info": {
    "context": "$(kubectl config current-context 2>/dev/null || echo 'unknown')",
    "server": "$(kubectl cluster-info 2>/dev/null | grep 'Kubernetes control plane' | awk '{print $NF}' || echo 'unknown')"
  },
  "deployment_status": {
    "total_deployments": ${deployments},
    "total_pods": ${pods},
    "ready_pods": ${ready_pods},
    "total_services": ${services}
  },
  "verification_results": {
    "prerequisites_check": "$(check_prerequisites &>/dev/null && echo 'PASS' || echo 'FAIL')",
    "deployment_success": "$(run_k8s_deploy &>/dev/null && echo 'PASS' || echo 'FAIL')",
    "pod_status": "$(verify_pod_status &>/dev/null && echo 'PASS' || echo 'FAIL')",
    "health_probes": "$(analyze_health_probes &>/dev/null && echo 'PASS' || echo 'FAIL')"
  },
  "artifacts": {
    "log_file": "${LOG_FILE}",
    "summary_file": "${summary_file}"
  }
}
EOF
    
    log_success "Verification summary written to: ${summary_file}"
}

main() {
    # Create artifacts directory
    mkdir -p "${ARTIFACTS_DIR}"
    
    log_info "Starting Kubernetes Boot Sequence Verification"
    log_info "Timestamp: $(date)"
    log_info "Log file: ${LOG_FILE}"
    
    # Set kubectl context if provided
    if [[ $# -gt 0 ]]; then
        log_info "Switching to kubectl context: $1"
        kubectl config use-context "$1" || {
            log_error "Failed to switch to context $1"
            exit 1
        }
    fi
    
    local exit_code=0
    
    # Run verification steps
    check_prerequisites || exit_code=1
    
    if [[ $exit_code -eq 0 ]]; then
        run_k8s_deploy || exit_code=1
    fi
    
    if [[ $exit_code -eq 0 ]]; then
        wait_for_rollout || exit_code=1
    fi
    
    # Always run status verification even if deployment failed
    verify_deployment_status
    verify_pod_status || exit_code=1
    verify_service_status || exit_code=1
    analyze_health_probes || exit_code=1
    collect_logs
    
    # Generate summary
    generate_summary
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "Kubernetes Boot Sequence Verification: PASSED"
        log_success "All components are healthy and operational"
    else
        log_error "Kubernetes Boot Sequence Verification: FAILED"
        log_error "Some components failed verification checks"
        log_info "Check ${LOG_FILE} for detailed diagnostics"
    fi
    
    exit $exit_code
}

# Run main function with all arguments
main "$@"