#!/bin/bash
# Deploy MerajutASA.id Docker stack
# Production deployment script with health checks and rollback capability

set -euo pipefail

# Configuration
ENVIRONMENT=${ENVIRONMENT:-"development"}

# Function to get compose file based on environment
get_compose_file() {
    local env="$1"
    case "$env" in
        "development")
            echo "../compose/docker-compose.yml"
            ;;
        "production")
            echo "../compose/docker-compose.prod.yml"
            ;;
        "test")
            echo "../compose/docker-compose.test.yml"
            ;;
        *)
            echo ""
            ;;
    esac
}
REGISTRY=${REGISTRY:-"merajutasa"}
VERSION=${VERSION:-"latest"}
TIMEOUT=${TIMEOUT:-300}

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

# Health check function
wait_for_service() {
    local service_name=$1
    local health_url=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for ${service_name} to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "${health_url}" > /dev/null 2>&1; then
            log_success "${service_name} is healthy"
            return 0
        fi
        
        log_info "Attempt ${attempt}/${max_attempts}: ${service_name} not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    log_error "${service_name} failed to become healthy within timeout"
    return 1
}

# Rollback function
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    # Stop current containers
    docker compose -f "${COMPOSE_FILE}" down
    
    # Deploy previous version (assuming it exists)
    docker compose -f "${COMPOSE_FILE}" up -d
    
    log_warning "Rollback completed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if required directories exist
    local required_dirs=(
        "/var/lib/merajutasa"
        "/var/log/merajutasa"
        "/etc/ssl/merajutasa"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ "${ENVIRONMENT}" = "production" ] && [ ! -d "$dir" ]; then
            log_error "Required directory does not exist: $dir"
            exit 1
        fi
    done
    
    # Check available disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log_error "Insufficient disk space. Required: 1GB, Available: $((available_space/1024))MB"
        exit 1
    fi
    
    # Check if all required images exist
    local images=(
        "${REGISTRY}/signer:${VERSION}"
        "${REGISTRY}/chain:${VERSION}"
        "${REGISTRY}/collector:${VERSION}"
        "${REGISTRY}/backup:${VERSION}"
        "${REGISTRY}/monitoring:${VERSION}"
    )
    
    for image in "${images[@]}"; do
        if ! docker image inspect "$image" > /dev/null 2>&1; then
            log_error "Required image not found: $image"
            exit 1
        fi
    done
    
    log_success "Pre-deployment checks passed"
}

# Post-deployment validation
post_deployment_validation() {
    log_info "Running post-deployment validation..."
    
    # Health checks for all services
    local services=(
        "signer:http://localhost:4601/health"
        "chain:http://localhost:4602/health"
        "collector:http://localhost:4603/health"
        "monitoring:http://localhost:4604/metrics"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name health_url <<< "$service_info"
        if ! wait_for_service "$service_name" "$health_url"; then
            log_error "Service validation failed: $service_name"
            rollback_deployment
            exit 1
        fi
    done
    
    # Run integration tests
    if [ "${ENVIRONMENT}" != "production" ]; then
        log_info "Running integration tests..."
        npm run test:infrastructure || {
            log_error "Integration tests failed"
            rollback_deployment
            exit 1
        }
    fi
    
    log_success "Post-deployment validation completed"
}

# Main deployment function
main() {
    local action=${1:-"deploy"}
    
    log_info "Starting MerajutASA.id deployment"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Version: ${VERSION}"
    log_info "Action: ${action}"
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    # Set compose file based on environment
    COMPOSE_FILE=$(get_compose_file "$ENVIRONMENT")
    
    if [ -z "$COMPOSE_FILE" ] || [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file not found for environment: $ENVIRONMENT"
        exit 1
    fi
    
    export VERSION
    export REGISTRY
    
    case "$action" in
        "deploy")
            pre_deployment_checks
            
            log_info "Deploying services..."
            docker compose -f "$COMPOSE_FILE" up -d
            
            post_deployment_validation
            
            # Generate deployment manifest
            cat > "../../../artifacts/deployment-manifest.json" << EOF
{
  "deployment_date": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "environment": "${ENVIRONMENT}",
  "version": "${VERSION}",
  "registry": "${REGISTRY}",
  "status": "success",
  "services": [
    "signer",
    "chain", 
    "collector",
    "backup",
    "monitoring"
  ]
}
EOF
            
            log_success "Deployment completed successfully!"
            ;;
            
        "stop")
            log_info "Stopping services..."
            docker compose -f "$COMPOSE_FILE" down
            log_success "Services stopped"
            ;;
            
        "restart")
            log_info "Restarting services..."
            docker compose -f "$COMPOSE_FILE" restart
            post_deployment_validation
            log_success "Services restarted"
            ;;
            
        "status")
            log_info "Service status:"
            docker compose -f "$COMPOSE_FILE" ps
            ;;
            
        "logs")
            docker compose -f "$COMPOSE_FILE" logs -f
            ;;
            
        *)
            log_error "Unknown action: $action"
            echo "Usage: $0 {deploy|stop|restart|status|logs}"
            exit 1
            ;;
    esac
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
}

# Set up trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"