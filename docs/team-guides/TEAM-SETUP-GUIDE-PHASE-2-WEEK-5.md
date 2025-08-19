# Team Setup Guide - Phase 2 Week 5: High Availability & Infrastructure Resilience

## Overview 🎯

This guide provides step-by-step instructions for team members to set up and work with the Phase 2 Week 5 High Availability & Infrastructure Resilience implementation. The setup process takes approximately **30-45 minutes** and covers all necessary tools, dependencies, and configuration required for development, testing, and deployment of enterprise-grade HA systems.

## Prerequisites 📋

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher  
- **Git**: Latest version for repository management
- **Code Editor**: VS Code, WebStorm, or equivalent with JavaScript/Node.js support

### High Availability Specific Tools

- **Docker Desktop**: Required for containerized multi-region testing
- **kubectl**: Kubernetes CLI for auto-scaling and deployment operations
- **Cloud CLI**: AWS CLI, gcloud, or Azure CLI for multi-region operations
- **curl/httpie**: For health check and API testing

### Optional Tools (Recommended)

- **Postman/Insomnia**: For comprehensive API testing across regions
- **Grafana**: For advanced HA metrics visualization
- **Terraform**: For infrastructure as code management
- **Helm**: For Kubernetes deployment management

### Development Environment

- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **RAM**: Minimum 16GB (32GB recommended for multi-region testing)
- **Storage**: 10GB free space for HA components and artifacts
- **Network**: Stable internet connection with low latency for multi-region testing

## Quick Start (5 Minutes) 🚀

### 1. Clone Repository

```bash
git clone https://github.com/codingxdev0/merajutasa.id.git
cd merajutasa.id
```

### 2. Install Dependencies

```bash
# Install all dependencies (including new HA packages)
npm install

# Verify HA components are available
npm run week5:status
```

### 3. Validate Setup

```bash
# Run comprehensive HA status check
npm run week5:status

# Expected output: 77/100 score with HA components operational
# Multi-Region Deployment: 100/100 ✅
# Disaster Recovery: 100/100 ✅  
# Auto-Scaling: 100/100 ✅
# Fault Tolerance: 50/100 ⚠️
# Health Monitoring: 50/100 ⚠️
# HA Orchestrator: 60/100 ⚠️
```

### 4. Quick Validation Test

```bash
# Test HA component integration
npm run week5:test

# Run interactive demonstration
npm run week5:demo
```

## Detailed Setup Instructions 🛠️

### Step 1: Environment Configuration (10 minutes)

#### 1.1 Cloud Provider Setup

```bash
# AWS Configuration (if using AWS)
aws configure
# Enter your AWS Access Key ID, Secret, Region (us-east-1), and output format (json)

# Google Cloud Configuration (if using GCP)
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Azure Configuration (if using Azure)
az login
az account set --subscription YOUR_SUBSCRIPTION_ID
```

#### 1.2 Kubernetes Context Setup

```bash
# Verify kubectl is installed
kubectl version --client

# Set up local Kubernetes context (for testing)
# Using Docker Desktop Kubernetes or minikube
kubectl config current-context

# Test kubectl connectivity
kubectl get nodes
```

#### 1.3 Environment Variables

Create a `.env.local` file in the project root:

```bash
# High Availability Configuration
HA_ORCHESTRATOR_PORT=8090
HA_ORCHESTRATOR_NAME=merajutasa-ha-orchestrator

# Multi-Region Configuration  
PRIMARY_REGION=us-east-1
SECONDARY_REGIONS=us-west-2,eu-west-1,ap-southeast-1
DEPLOYMENT_STRATEGY=blue-green

# Disaster Recovery Configuration
DR_BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
DR_RETENTION_DAYS=30
DR_CROSS_REGION_REPLICATION=true

# Auto-Scaling Configuration
AUTO_SCALING_MIN_INSTANCES=2
AUTO_SCALING_MAX_INSTANCES=20
AUTO_SCALING_TARGET_CPU=70
AUTO_SCALING_TARGET_MEMORY=80

# Health Monitoring Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
ALERT_COOLDOWN_PERIOD=300000

# Fault Tolerance Configuration
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=30000
CIRCUIT_BREAKER_RESET_TIMEOUT=60000
```

### Step 2: High Availability Component Verification (15 minutes)

#### 2.1 Multi-Region Deployment Setup

```bash
# Test multi-region deployment system
npm run ha:multi-region-deploy

# Expected output: Deployment ID with status
# Example: "Deployment: mrd-1234567890-blue-green-v1.0.0"

# Check deployment status
npm run ha:orchestrator-status | jq '.components.multiRegionDeployment'
```

#### 2.2 Disaster Recovery System Test

```bash
# Create test backup
npm run ha:disaster-recovery-backup

# Expected output: Backup ID
# Example: "Backup: dr-backup-1234567890-full"

# Verify backup integrity
npm run ha:orchestrator-status | jq '.components.disasterRecovery'
```

#### 2.3 Auto-Scaling Configuration

```bash
# Check auto-scaling status
npm run ha:auto-scaling-status

# Expected output: JSON with scaling configuration
# {
#   "service": "auto-scaling",
#   "status": "healthy",
#   "services": 0,
#   "healthyServices": 0,
#   "totalInstances": 0,
#   "predictiveScalingEnabled": true
# }
```

#### 2.4 Fault Tolerance Validation

```bash
# Check fault tolerance system
npm run ha:fault-tolerance-status

# Expected output: Circuit breaker status
# {
#   "service": "fault-tolerance", 
#   "status": "unknown",
#   "circuitBreakers": 0,
#   "openCircuitBreakers": 0
# }
```

#### 2.5 Health Monitoring Setup

```bash
# Verify health monitoring system
npm run ha:health-monitoring-status

# Expected output: Health check status
# {
#   "service": "health-monitoring",
#   "status": "unknown", 
#   "monitoredServices": 0,
#   "healthyServices": 0
# }
```

### Step 3: HA Orchestrator Initialization (10 minutes)

#### 3.1 Start HA Orchestrator

```bash
# Initialize centralized HA orchestration
npm run ha:orchestrator-start

# Expected output: "HA Orchestrator started"
# The orchestrator coordinates all HA components
```

#### 3.2 System Health Validation

```bash
# Get comprehensive system health status
npm run ha:system-health

# Expected output: Detailed health report
# {
#   "overallHealth": "unhealthy",
#   "healthyComponents": 3,
#   "totalComponents": 5, 
#   "healthPercentage": 60
# }
```

#### 3.3 Start All HA Components

```bash
# Start all HA components simultaneously
npm run ha:start-all

# This runs orchestrator, health monitoring, and auto-scaling
# Expected: All components initialize and report status
```

## Role-Specific Setup Instructions 👥

### Frontend Developers 🎨

**Focus**: Health dashboard integration and user experience during HA events

```bash
# Verify HA status endpoints for dashboard integration
curl http://localhost:8090/health
curl http://localhost:8090/metrics

# Test HA orchestrator API endpoints
npm run ha:orchestrator-status | jq '.system_health'

# Monitor real-time HA events for UI updates
npm run week5:demo
```

**Key Files to Monitor**:

- `infrastructure/high-availability/ha-orchestrator.js` - API endpoints
- Health check responses for dashboard integration
- Event streams for real-time status updates

### Backend Developers ⚙️

**Focus**: HA component integration and service resilience

```bash
# Test fault tolerance integration
npm run ha:fault-tolerance-status

# Verify auto-scaling triggers
npm run ha:auto-scaling-status

# Test disaster recovery procedures
npm run ha:disaster-recovery-backup

# Monitor HA orchestrator coordination
npm run ha:orchestrator-status
```

**Key Integration Points**:

- Circuit breaker integration in service calls
- Health check implementation for custom services
- Auto-scaling metrics and triggers
- Backup and recovery procedures

### DevOps Engineers 🚀

**Focus**: Infrastructure deployment and multi-region operations

```bash
# Configure multi-region deployment
npm run ha:multi-region-deploy

# Set up disaster recovery automation
npm run ha:disaster-recovery-backup

# Configure auto-scaling policies
npm run ha:auto-scaling-status

# Monitor infrastructure health
npm run ha:system-health
```

**Infrastructure Configuration**:

- Kubernetes cluster setup for auto-scaling
- Multi-region cloud provider configuration
- DNS and load balancer setup for failover
- Monitoring and alerting infrastructure

### QA Engineers 🧪

**Focus**: HA system testing and validation

```bash
# Run comprehensive HA test suite
npm run week5:test

# Execute interactive HA demonstration
npm run week5:demo

# Validate system status
npm run week5:status

# Test emergency response procedures
npm run ha:emergency-response-test
```

**Testing Scenarios**:

- Multi-region deployment validation
- Disaster recovery testing procedures  
- Auto-scaling behavior verification
- Fault tolerance and circuit breaker testing

## Advanced Configuration 🔧

### Multi-Region Cloud Configuration

#### AWS Multi-Region Setup

```bash
# Configure multiple AWS regions
aws configure set region us-east-1
aws configure set profile.west region us-west-2  
aws configure set profile.eu region eu-west-1
aws configure set profile.asia region ap-southeast-1

# Test cross-region connectivity
aws sts get-caller-identity --profile default
aws sts get-caller-identity --profile west
```

#### GCP Multi-Region Setup

```bash
# Set up multiple GCP regions
gcloud config configurations create us-east
gcloud config configurations create us-west
gcloud config configurations create eu-west
gcloud config configurations create asia-southeast

# Activate and configure each region
gcloud config configurations activate us-east
gcloud config set compute/region us-east1
```

### Kubernetes Integration

#### HPA (Horizontal Pod Autoscaler) Setup

```yaml
# Save as k8s-hpa-config.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: merajutasa-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: merajutasa-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Apply the configuration:

```bash
kubectl apply -f k8s-hpa-config.yaml
kubectl get hpa merajutasa-hpa
```

### Monitoring Integration

#### Prometheus Metrics Configuration

```yaml
# Save as prometheus-ha-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'merajutasa-ha-orchestrator'
    static_configs:
      - targets: ['localhost:8090']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'merajutasa-health-monitoring'
    static_configs:
      - targets: ['localhost:8091'] 
    metrics_path: '/health'
    scrape_interval: 30s
```

## Troubleshooting Guide 🔍

### Common Issues and Solutions

#### Issue 1: HA Orchestrator Won't Start

```bash
# Check port availability
lsof -i :8090

# Verify Node.js version
node --version  # Should be 18.0.0 or higher

# Check for conflicting processes
ps aux | grep "ha-orchestrator"

# Solution: Kill conflicting processes and restart
pkill -f "ha-orchestrator"
npm run ha:orchestrator-start
```

#### Issue 2: Multi-Region Deployment Fails

```bash
# Verify cloud provider credentials
aws sts get-caller-identity  # For AWS
gcloud auth list            # For GCP
az account show             # For Azure

# Check network connectivity
ping us-east-1.amazonaws.com
ping us-west-2.amazonaws.com

# Solution: Reconfigure credentials and test connectivity
aws configure
npm run ha:multi-region-deploy
```

#### Issue 3: Auto-Scaling Not Responding

```bash
# Check Kubernetes connection
kubectl cluster-info
kubectl get nodes

# Verify HPA configuration
kubectl get hpa
kubectl describe hpa merajutasa-hpa

# Solution: Restart Kubernetes connection and HPA
kubectl delete hpa merajutasa-hpa
kubectl apply -f k8s-hpa-config.yaml
```

#### Issue 4: Health Monitoring Shows Unknown Status

```bash
# Check health monitoring service
npm run ha:health-monitoring-status

# Verify health check endpoints
curl http://localhost:8091/health
curl http://localhost:8091/metrics

# Solution: Restart health monitoring service
# Kill existing processes and restart
npm run ha:start-all
```

### Performance Tuning

#### Optimizing HA Orchestrator Performance

```javascript
// Adjust configuration in .env.local
HA_COORDINATION_INTERVAL=15000    // Reduce from 30000 for faster response
HA_HEALTH_CHECK_INTERVAL=30000    // Increase from 60000 for more frequent checks
HA_METRICS_RETENTION=86400000     // 24 hours in milliseconds
HA_ALERT_COOLDOWN=180000          // Reduce cooldown for faster alerts
```

#### Auto-Scaling Sensitivity Tuning

```bash
# Increase sensitivity for faster scaling
AUTO_SCALING_TARGET_CPU=60        # Reduce from 70
AUTO_SCALING_TARGET_MEMORY=70     # Reduce from 80
AUTO_SCALING_SCALE_UP_THRESHOLD=2 # Number of periods before scaling up
AUTO_SCALING_SCALE_DOWN_THRESHOLD=5 # Number of periods before scaling down
```

## Security Configuration 🔒

### Secure Communication Setup

#### TLS Configuration for HA Components

```bash
# Generate self-signed certificates for testing
openssl req -x509 -newkey rsa:4096 -keyout ha-key.pem -out ha-cert.pem -days 365 -nodes

# Configure TLS in .env.local
HA_TLS_ENABLED=true
HA_TLS_CERT_PATH=./certs/ha-cert.pem
HA_TLS_KEY_PATH=./certs/ha-key.pem
```

#### RBAC Configuration

```yaml
# Save as rbac-ha-config.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: merajutasa-ha-operator
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: ["autoscaling"]
  resources: ["horizontalpodautoscalers"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: merajutasa-ha-operator-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: merajutasa-ha-operator
subjects:
- kind: ServiceAccount
  name: merajutasa-ha-operator
  namespace: default
```

Apply RBAC configuration:

```bash
kubectl apply -f rbac-ha-config.yaml
```

## Testing and Validation 🧪

### Comprehensive Testing Procedures

#### 1. Component Integration Testing

```bash
# Test all HA components individually
npm run week5:test

# Expected output: All components pass integration tests
# ✅ Multi-Region Deployment: Integration test passed
# ✅ Disaster Recovery: Integration test passed  
# ✅ Auto-Scaling: Integration test passed
# ⚠️ Fault Tolerance: Limited functionality
# ⚠️ Health Monitoring: Limited functionality
# ⚠️ HA Orchestrator: Coordination active
```

#### 2. End-to-End Workflow Testing

```bash
# Run comprehensive demonstration
npm run week5:demo

# This tests:
# - Multi-region deployment workflow
# - Disaster recovery procedures
# - Auto-scaling behavior
# - Fault tolerance mechanisms
# - Health monitoring alerts
# - HA orchestrator coordination
```

#### 3. Performance Validation

```bash
# Test HA component performance
time npm run ha:orchestrator-status
time npm run ha:system-health
time npm run ha:multi-region-deploy

# Benchmark auto-scaling response time
time npm run ha:auto-scaling-status
```

#### 4. Disaster Recovery Testing

```bash
# Test disaster recovery procedures
npm run ha:disaster-recovery-backup

# Simulate failover scenario
npm run ha:emergency-response-test

# Validate backup integrity
npm run ha:orchestrator-status | jq '.components.disasterRecovery.backupAge'
```

## Production Deployment Checklist ✅

### Pre-Production Validation

- [ ] All HA components show healthy status
- [ ] Multi-region connectivity verified
- [ ] Kubernetes cluster configured with HPA
- [ ] Cloud provider credentials configured
- [ ] TLS certificates installed and verified
- [ ] RBAC policies applied and tested
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested

### Production Configuration

- [ ] Environment variables configured for production
- [ ] Resource limits and requests set appropriately
- [ ] Auto-scaling policies tuned for production load
- [ ] Disaster recovery schedules configured
- [ ] Health check intervals optimized
- [ ] Security configurations applied
- [ ] Network policies and firewall rules configured
- [ ] Documentation and runbooks updated

### Post-Deployment Validation

- [ ] All HA components operational
- [ ] Multi-region deployment successful
- [ ] Auto-scaling responding to load changes
- [ ] Health monitoring alerting correctly
- [ ] Disaster recovery backups completing
- [ ] HA orchestrator coordinating effectively
- [ ] Performance metrics within acceptable ranges
- [ ] Security scans passing

## Support and Resources 📚

### Documentation References

- [Phase 2 Week 5 Delivery Documentation](../phase-2/PHASE-2-WEEK-5-DELIVERY-DOCUMENTATION.md)
- [Quick Reference Guide](../quick-reference/QUICK-REFERENCE-PHASE-2-WEEK-5.md)
- [HA Architecture Overview](../strategic-analysis/PHASE-2-WEEK-5-STRATEGIC-ANALYSIS.md)

### External Resources

- [Kubernetes Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [AWS Multi-Region Architecture](https://aws.amazon.com/solutions/implementations/multi-region-application-architecture/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Disaster Recovery Best Practices](https://cloud.google.com/architecture/disaster-recovery)

### Team Communication

- **Slack Channel**: #merajutasa-ha-infrastructure
- **Email**: <devops@merajutasa.id>
- **Emergency Contact**: +62-xxx-xxx-xxxx (24/7 DevOps on-call)

## Success Metrics 📊

### Setup Success Indicators

- [ ] `npm run week5:status` returns 77/100 or higher
- [ ] All team members can run HA components locally
- [ ] Multi-region deployment test completes successfully
- [ ] HA orchestrator starts without errors
- [ ] Health monitoring shows service status
- [ ] Auto-scaling metrics are being collected

### Operational Success Indicators

- [ ] 99.95% uptime achieved in staging environment
- [ ] Sub-5 minute disaster recovery testing
- [ ] Auto-scaling responds within 60 seconds
- [ ] Zero cascade failures during fault injection
- [ ] All alerts are being delivered correctly
- [ ] Executive dashboard shows real-time status

Ready to build enterprise-grade high availability infrastructure with MerajutASA.id! 🚀
