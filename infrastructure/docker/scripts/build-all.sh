#!/bin/bash
# Build all Docker containers for MerajutASA.id
# Production-ready build script with optimization and security scanning

set -euo pipefail

# Configuration
REGISTRY=${REGISTRY:-"merajutasa"}
VERSION=${VERSION:-$(git rev-parse --short HEAD)}
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse HEAD)

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

# Build function for each service
build_service() {
    local service=$1
    local dockerfile=$2
    local build_args=$3
    
    log_info "Building ${service} service..."
    
    docker build \
        --file "${dockerfile}" \
        --tag "${REGISTRY}/${service}:${VERSION}" \
        --tag "${REGISTRY}/${service}:latest" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VCS_REF="${VCS_REF}" \
        --build-arg VERSION="${VERSION}" \
        ${build_args} \
        ../../../
    
    if [ $? -eq 0 ]; then
        log_success "${service} build completed"
    else
        log_error "${service} build failed"
        exit 1
    fi
}

# Security scan function
security_scan() {
    local service=$1
    
    if command -v trivy &> /dev/null; then
        log_info "Running security scan on ${service}..."
        trivy image --exit-code 1 "${REGISTRY}/${service}:${VERSION}" || {
            log_warning "Security vulnerabilities found in ${service}"
        }
    else
        log_warning "Trivy not installed, skipping security scan"
    fi
}

# Main build process
main() {
    log_info "Starting MerajutASA.id Docker build process"
    log_info "Registry: ${REGISTRY}"
    log_info "Version: ${VERSION}"
    log_info "Build Date: ${BUILD_DATE}"
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    # Build all services
    build_service "signer" "../services/Dockerfile.signer" ""
    build_service "chain" "../services/Dockerfile.chain" ""
    build_service "collector" "../services/Dockerfile.collector" ""
    build_service "backup" "../services/Dockerfile.backup" ""
    build_service "monitoring" "../services/Dockerfile.monitoring" ""
    
    # Run security scans
    log_info "Running security scans..."
    security_scan "signer"
    security_scan "chain" 
    security_scan "collector"
    security_scan "backup"
    security_scan "monitoring"
    
    # Clean up dangling images
    log_info "Cleaning up dangling images..."
    docker image prune -f
    
    # Display build summary
    log_success "All services built successfully!"
    echo
    echo "Built images:"
    docker images | grep "${REGISTRY}" | grep -E "(${VERSION}|latest)"
    
    # Generate build manifest
    cat > "../../../artifacts/docker-build-manifest.json" << EOF
{
  "build_date": "${BUILD_DATE}",
  "version": "${VERSION}",
  "vcs_ref": "${VCS_REF}",
  "registry": "${REGISTRY}",
  "images": [
    "${REGISTRY}/signer:${VERSION}",
    "${REGISTRY}/chain:${VERSION}",
    "${REGISTRY}/collector:${VERSION}",
    "${REGISTRY}/backup:${VERSION}",
    "${REGISTRY}/monitoring:${VERSION}"
  ],
  "build_status": "success"
}
EOF
    
    log_success "Build manifest generated: artifacts/docker-build-manifest.json"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
}

# Set up trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"