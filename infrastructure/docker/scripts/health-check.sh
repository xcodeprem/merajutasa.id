#!/bin/bash
# Health check script for MerajutASA.id Docker containers
# Comprehensive health validation with detailed diagnostics

set -euo pipefail

# Configuration
TIMEOUT=${TIMEOUT:-30}
ENVIRONMENT=${ENVIRONMENT:-"development"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Container health check
check_container_health() {
    local container_name=$1
    local health_url=$2
    local expected_status=${3:-"200"}
    
    log_info "Checking container: $container_name"
    
    # Check if container is running
    if ! docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        log_error "Container $container_name is not running"
        return 1
    fi
    
    # Check container health status
    local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "unknown")
    
    case "$health_status" in
        "healthy")
            log_success "Container $container_name is healthy"
            ;;
        "unhealthy")
            log_error "Container $container_name is unhealthy"
            docker logs --tail 20 "$container_name"
            return 1
            ;;
        "starting")
            log_warning "Container $container_name is still starting"
            ;;
        *)
            log_warning "Container $container_name health status unknown"
            ;;
    esac
    
    # HTTP health check if URL provided
    if [ -n "$health_url" ]; then
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" 2>/dev/null || echo "000")
        
        if [ "$response_code" = "$expected_status" ]; then
            log_success "HTTP health check passed for $container_name ($response_code)"
        else
            log_error "HTTP health check failed for $container_name (got $response_code, expected $expected_status)"
            return 1
        fi
    fi
    
    return 0
}

# Service-specific health checks
check_signer_service() {
    log_info "=== Signer Service Health Check ==="
    
    if check_container_health "merajutasa-signer-${ENVIRONMENT}" "http://localhost:4601/health"; then
        # Additional signer-specific checks
        local pubkey_response=$(curl -s "http://localhost:4601/pubkey" 2>/dev/null || echo "")
        if [ -n "$pubkey_response" ]; then
            log_success "Signer public key endpoint accessible"
        else
            log_warning "Signer public key endpoint not responding"
        fi
        return 0
    fi
    return 1
}

check_chain_service() {
    log_info "=== Chain Service Health Check ==="
    
    if check_container_health "merajutasa-chain-${ENVIRONMENT}" "http://localhost:4602/health"; then
        # Check chain data directory
        local chain_files=$(docker exec "merajutasa-chain-${ENVIRONMENT}" ls -la /app/artifacts 2>/dev/null || echo "")
        if [ -n "$chain_files" ]; then
            log_success "Chain data directory accessible"
        else
            log_warning "Chain data directory not accessible"
        fi
        return 0
    fi
    return 1
}

check_collector_service() {
    log_info "=== Collector Service Health Check ==="
    
    if check_container_health "merajutasa-collector-${ENVIRONMENT}" "http://localhost:4603/health"; then
        # Test event ingestion endpoint
        local test_event='{"event_name":"health_check","occurred_at":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","meta":{"test":true}}'
        local ingest_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$test_event" "http://localhost:4603/ingest" 2>/dev/null || echo "")
        if [ -n "$ingest_response" ]; then
            log_success "Collector ingestion endpoint responding"
        else
            log_warning "Collector ingestion endpoint not responding"
        fi
        return 0
    fi
    return 1
}

check_monitoring_service() {
    log_info "=== Monitoring Service Health Check ==="
    
    if check_container_health "merajutasa-monitoring-${ENVIRONMENT}" "http://localhost:4604/metrics"; then
        # Check metrics format
        local metrics_response=$(curl -s "http://localhost:4604/metrics" 2>/dev/null || echo "")
        if echo "$metrics_response" | grep -q "merajutasa_"; then
            log_success "Monitoring metrics are being collected"
        else
            log_warning "Monitoring metrics format unexpected"
        fi
        return 0
    fi
    return 1
}

check_backup_service() {
    log_info "=== Backup Service Health Check ==="
    
    if check_container_health "merajutasa-backup-${ENVIRONMENT}" ""; then
        # Check backup directory
        local backup_files=$(docker exec "merajutasa-backup-${ENVIRONMENT}" ls -la /app/backups 2>/dev/null || echo "")
        if [ -n "$backup_files" ]; then
            log_success "Backup directory accessible"
        else
            log_warning "Backup directory not accessible"
        fi
        return 0
    fi
    return 1
}

# Network connectivity checks
check_network_connectivity() {
    log_info "=== Network Connectivity Check ==="
    
    local services=(
        "merajutasa-signer-${ENVIRONMENT}:4601"
        "merajutasa-chain-${ENVIRONMENT}:4602"
        "merajutasa-collector-${ENVIRONMENT}:4603"
        "merajutasa-monitoring-${ENVIRONMENT}:4604"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r container_name port <<< "$service"
        
        if docker exec "$container_name" nc -z localhost "$port" 2>/dev/null; then
            log_success "Port $port accessible on $container_name"
        else
            log_error "Port $port not accessible on $container_name"
            return 1
        fi
    done
    
    return 0
}

# Resource usage checks
check_resource_usage() {
    log_info "=== Resource Usage Check ==="
    
    # Get container stats
    local container_stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}")
    echo "$container_stats"
    
    # Check for high resource usage
    local high_cpu_containers=$(docker stats --no-stream --format "{{.Container}} {{.CPUPerc}}" | awk '$2 > 80.0 {print $1}')
    if [ -n "$high_cpu_containers" ]; then
        log_warning "High CPU usage detected in containers: $high_cpu_containers"
    else
        log_success "CPU usage within normal limits"
    fi
    
    return 0
}

# Generate health report
generate_health_report() {
    local report_file="../../artifacts/health-check-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "environment": "${ENVIRONMENT}",
  "overall_status": "${overall_status}",
  "services": {
    "signer": "${signer_status}",
    "chain": "${chain_status}",
    "collector": "${collector_status}",
    "monitoring": "${monitoring_status}",
    "backup": "${backup_status}"
  },
  "network_status": "${network_status}",
  "resource_check": "completed"
}
EOF
    
    log_info "Health report generated: $report_file"
}

# Main health check function
main() {
    log_info "Starting comprehensive health check for MerajutASA.id"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
    
    # Initialize status variables
    local signer_status="unknown"
    local chain_status="unknown"
    local collector_status="unknown"
    local monitoring_status="unknown"
    local backup_status="unknown"
    local network_status="unknown"
    local overall_status="healthy"
    
    # Run individual service checks
    if check_signer_service; then
        signer_status="healthy"
    else
        signer_status="unhealthy"
        overall_status="unhealthy"
    fi
    
    if check_chain_service; then
        chain_status="healthy"
    else
        chain_status="unhealthy"
        overall_status="unhealthy"
    fi
    
    if check_collector_service; then
        collector_status="healthy"
    else
        collector_status="unhealthy"
        overall_status="unhealthy"
    fi
    
    if check_monitoring_service; then
        monitoring_status="healthy"
    else
        monitoring_status="unhealthy"
        overall_status="degraded"
    fi
    
    if check_backup_service; then
        backup_status="healthy"
    else
        backup_status="unhealthy"
        overall_status="degraded"
    fi
    
    # Run network connectivity check
    if check_network_connectivity; then
        network_status="healthy"
    else
        network_status="unhealthy"
        overall_status="unhealthy"
    fi
    
    # Run resource usage check
    check_resource_usage
    
    # Generate report
    generate_health_report
    
    # Summary
    echo
    log_info "=== Health Check Summary ==="
    echo "Overall Status: $overall_status"
    echo "Signer: $signer_status"
    echo "Chain: $chain_status"
    echo "Collector: $collector_status"
    echo "Monitoring: $monitoring_status"
    echo "Backup: $backup_status"
    echo "Network: $network_status"
    
    if [ "$overall_status" = "healthy" ]; then
        log_success "All systems operational"
        exit 0
    elif [ "$overall_status" = "degraded" ]; then
        log_warning "Some non-critical services have issues"
        exit 1
    else
        log_error "Critical system issues detected"
        exit 2
    fi
}

# Run main function
main "$@"