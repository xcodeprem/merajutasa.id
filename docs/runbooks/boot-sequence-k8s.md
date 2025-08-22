# Boot Sequence Runbook: Kubernetes (Cluster mode)

## Overview

This runbook provides step-by-step instructions for deploying and managing the MerajutASA.id platform on Kubernetes clusters. It covers deployment verification, pod health monitoring, and comprehensive troubleshooting procedures for cluster-based deployments.

## Prerequisites

Before starting the Kubernetes deployment, ensure you have:

- [ ] Kubernetes cluster running (minikube, kind, EKS, GKE, AKS, or on-premises)
- [ ] kubectl >= 1.20 configured and connected to your cluster
- [ ] Sufficient cluster resources (minimum 8 CPU cores, 16GB RAM across nodes)
- [ ] Container images built and accessible (Docker registry or local)
- [ ] Repository cloned and dependencies installed (`npm ci`)
- [ ] Appropriate RBAC permissions for deployments

### Quick Prerequisites Check

```bash
# Check kubectl version and cluster connection
kubectl version --short                    # Should show both client and server versions
kubectl cluster-info                       # Should show cluster API server

# Check cluster resources
kubectl top nodes                          # Should show available CPU/memory
kubectl get nodes -o wide                  # Should show Ready nodes

# Check namespace permissions
kubectl auth can-i create deployments     # Should return "yes"
kubectl auth can-i create services        # Should return "yes"

# Verify npm dependencies are installed
npm list --depth=0 | head -5

# Check if container images are available (adjust registry as needed)
kubectl get pods --all-namespaces | head -5  # Basic cluster health check
```

## Boot Sequence

### Step 1: Deploy to Kubernetes Cluster

Deploy all services to the Kubernetes cluster using the comprehensive deployment manifests.

```bash
# Deploy all Kubernetes resources
npm run k8s:deploy
```

**Expected output:**
```
configmap/merajutasa-config created
deployment.apps/merajutasa-signer created
deployment.apps/merajutasa-chain created
deployment.apps/merajutasa-collector created
deployment.apps/merajutasa-observability created
deployment.apps/merajutasa-api-gateway created
deployment.apps/merajutasa-ha-orchestrator created
deployment.apps/merajutasa-compliance-orchestrator created
service/merajutasa-signer created
service/merajutasa-chain created
service/merajutasa-collector created
service/merajutasa-observability created
service/merajutasa-api-gateway created
service/merajutasa-ha-orchestrator created
service/merajutasa-compliance-orchestrator created
```

### Step 2: Verify Deployment Status

Check the status of all deployed resources and monitor pod startup progress.

```bash
# Check deployment and pod status
npm run k8s:status
```

**Expected healthy output:**
```
NAME                                                    READY   STATUS    RESTARTS   AGE
pod/merajutasa-signer-[hash]-[hash]                    1/1     Running   0          2m
pod/merajutasa-signer-[hash]-[hash]                    1/1     Running   0          2m
pod/merajutasa-signer-[hash]-[hash]                    1/1     Running   0          2m
pod/merajutasa-chain-[hash]-[hash]                     1/1     Running   0          2m
pod/merajutasa-chain-[hash]-[hash]                     1/1     Running   0          2m
pod/merajutasa-collector-[hash]-[hash]                 1/1     Running   0          2m
[... additional pods ...]

NAME                                        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/merajutasa-signer                  ClusterIP   10.96.X.X       <none>        4601/TCP   2m
service/merajutasa-chain                   ClusterIP   10.96.X.X       <none>        4602/TCP   2m
service/merajutasa-collector               ClusterIP   10.96.X.X       <none>        4603/TCP   2m
[... additional services ...]

NAME                                              READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/merajutasa-signer                3/3     3            3           2m
deployment.apps/merajutasa-chain                 2/2     2            2           2m
deployment.apps/merajutasa-collector             5/5     5            5           2m
[... additional deployments ...]
```

### Step 3: Monitor Pod Startup and Health

Watch pods as they initialize and pass health checks.

```bash
# Watch pod startup in real-time
kubectl get pods -l app.kubernetes.io/part-of=merajutasa -w

# Check detailed pod status (run this after pods are starting)
npm run k8s:describe
```

### Step 4: Verify Application Logs

Check application logs to ensure services are starting without errors.

```bash
# View logs from all application pods
npm run k8s:logs
```

**Expected healthy log patterns:**
```
merajutasa-signer-xxx: [signer] listening on 0.0.0.0:4601
merajutasa-signer-xxx: [signer] health check endpoint ready
merajutasa-chain-xxx: [chain] listening on 0.0.0.0:4602
merajutasa-chain-xxx: [chain] data directory initialized
merajutasa-collector-xxx: [collector] listening on 0.0.0.0:4603
merajutasa-collector-xxx: [collector] event schema loaded
```

## Cluster Dependency Graph

The services deploy with the following dependency and scaling characteristics:

```
Configuration Layer:
├── ConfigMap (merajutasa-config) - Application configuration
└── Services - Service discovery and load balancing

Core Services (Tier 1):
├── Signer Service (3 replicas)
│   ├── Port: 4601
│   ├── Health: /health endpoint
│   └── Resources: 256Mi-512Mi RAM, 250m-500m CPU
├── Chain Service (2 replicas)
│   ├── Port: 4602
│   ├── Health: /health endpoint
│   └── Resources: 512Mi-1Gi RAM, 500m-1000m CPU
└── Collector Service (5 replicas)
    ├── Port: 4603
    ├── Health: /health endpoint
    └── Resources: 256Mi-512Mi RAM, 250m-500m CPU

Infrastructure Services (Tier 2):
├── Observability Stack (2 replicas)
│   ├── Ports: 8080-8085 (tracing, metrics, logs, etc.)
│   ├── Health: /health endpoints
│   └── Resources: 512Mi-1Gi RAM, 500m-1000m CPU
├── API Gateway (3 replicas)
│   ├── Port: 8086
│   ├── Health: /health endpoint
│   └── Resources: 256Mi-512Mi RAM, 250m-500m CPU
├── HA Orchestrator (3 replicas)
│   ├── Port: 8090
│   ├── Health: /health endpoint
│   └── Resources: 512Mi-1Gi RAM, 500m-1000m CPU
└── Compliance Orchestrator (2 replicas)
    ├── Ports: 9000-9001
    ├── Health: /health endpoints
    └── Resources: 256Mi-512Mi RAM, 250m-500m CPU
```

## Health Verification Checklist

### Core Services Health

- [ ] **Signer Service** (3 replicas, Port 4601)
  - [ ] All pods in `Running` state with `1/1 Ready`
  - [ ] Startup probe passed (10s delay, 30 attempts max)
  - [ ] Liveness probe healthy (30s delay, 10s intervals)
  - [ ] Readiness probe healthy (5s delay, 5s intervals)
  - [ ] Service endpoint accessible via ClusterIP
  - [ ] Logs show: `[signer] listening on 0.0.0.0:4601`

- [ ] **Chain Service** (2 replicas, Port 4602)
  - [ ] All pods in `Running` state with `1/1 Ready`
  - [ ] Persistent volume mounts healthy
  - [ ] Data directory initialized
  - [ ] Service endpoint accessible via ClusterIP
  - [ ] Logs show: `[chain] listening on 0.0.0.0:4602`

- [ ] **Collector Service** (5 replicas, Port 4603)
  - [ ] All pods in `Running` state with `1/1 Ready`
  - [ ] Event schema validation active
  - [ ] Service endpoint accessible via ClusterIP
  - [ ] Logs show: `[collector] listening on 0.0.0.0:4603`

### Infrastructure Services Health

- [ ] **Observability Stack** (2 replicas, Ports 8080-8085)
  - [ ] All components ready: tracing, metrics, logs, anomaly detection, dashboards
  - [ ] Health endpoints returning 200 OK
  - [ ] Service mesh integration active

- [ ] **API Gateway** (3 replicas, Port 8086)
  - [ ] Load balancing across backend services
  - [ ] Rate limiting and security policies active
  - [ ] Service discovery functioning

- [ ] **High Availability Orchestrator** (3 replicas, Port 8090)
  - [ ] Multi-region coordination active
  - [ ] Auto-scaling policies loaded
  - [ ] Disaster recovery monitoring enabled

- [ ] **Compliance Orchestrator** (2 replicas, Ports 9000-9001)
  - [ ] Audit systems active
  - [ ] Privacy rights management enabled
  - [ ] Security scanning operational

### Critical Health Probes Configuration

The following health probes are configured across all services:

#### Startup Probes
- **Purpose**: Ensure containers start successfully before other probes begin
- **Timing**: 10s initial delay, 10s intervals, 30 failure threshold (5 minutes max)
- **Endpoint**: `GET /health` on service port

#### Liveness Probes  
- **Purpose**: Detect and restart unhealthy containers
- **Timing**: 30s initial delay, 10s intervals, 3 failure threshold
- **Endpoint**: `GET /health` on service port
- **Action**: Container restart on failure

#### Readiness Probes
- **Purpose**: Control traffic routing to healthy pods
- **Timing**: 5s initial delay, 5s intervals, 3 failure threshold  
- **Endpoint**: `GET /health` on service port
- **Action**: Remove from service endpoints on failure

## Service Management Commands

### Deployment Management

```bash
# Deploy all resources
npm run k8s:deploy

# Delete all resources (use with caution)
npm run k8s:delete

# Get deployment status
npm run k8s:status

# View application logs
npm run k8s:logs

# Get detailed resource information
npm run k8s:describe
```

### Advanced kubectl Commands

```bash
# Watch pod status in real-time
kubectl get pods -l app.kubernetes.io/part-of=merajutasa -w

# Get pod status with node information
kubectl get pods -l app.kubernetes.io/part-of=merajutasa -o wide

# Check resource usage
kubectl top pods -l app.kubernetes.io/part-of=merajutasa

# View events for troubleshooting
kubectl get events --sort-by=.metadata.creationTimestamp

# Access pod shell for debugging
kubectl exec -it <pod-name> -- /bin/bash

# Port forward to access services locally
kubectl port-forward service/merajutasa-signer 4601:4601

# Scale deployments manually
kubectl scale deployment merajutasa-signer --replicas=5
```

## Success Criteria

### Deployment Success Indicators

- [ ] ✅ `npm run k8s:deploy` completes without errors
- [ ] ✅ All 7 deployments show `READY` status
- [ ] ✅ All pods reach `Running` state within 5 minutes
- [ ] ✅ All services have active endpoints
- [ ] ✅ Health probes pass for all services
- [ ] ✅ No error messages in application logs
- [ ] ✅ Resource requests and limits respected
- [ ] ✅ Network policies allow required communication

### Performance Benchmarks

- [ ] **Pod Startup Time**: < 60 seconds per service
- [ ] **Resource Usage**: Within defined limits
- [ ] **Health Check Response**: < 200ms average
- [ ] **Inter-Service Communication**: < 50ms latency

## Troubleshooting

### Common Issues and Solutions

#### 1. Pods Stuck in Pending State

**Symptoms:**
- Pods show `Pending` status
- `kubectl describe pod` shows scheduling failures

**Diagnostic Commands:**
```bash
kubectl describe pods -l app.kubernetes.io/part-of=merajutasa
kubectl get nodes -o wide
kubectl top nodes
```

**Solutions:**
- **Insufficient Resources**: Scale up cluster or reduce resource requests
- **Node Selector Issues**: Check node labels and selectors
- **Volume Mounting Problems**: Verify persistent volume availability
- **Image Pull Issues**: Check registry access and credentials

#### 2. Pods Crashing (CrashLoopBackOff)

**Symptoms:**
- Pods show `CrashLoopBackOff` status
- High restart count

**Diagnostic Commands:**
```bash
kubectl logs <pod-name> --previous
kubectl describe pod <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>
```

**Solutions:**
- **Configuration Issues**: Check ConfigMap values and environment variables
- **Health Check Failures**: Verify health endpoints are accessible
- **Resource Limits**: Increase memory/CPU limits if needed
- **Application Dependencies**: Check service dependencies and network connectivity

#### 3. Services Not Accessible

**Symptoms:**
- Service endpoints not reachable
- Connection timeouts

**Diagnostic Commands:**
```bash
kubectl get services -l app.kubernetes.io/part-of=merajutasa
kubectl get endpoints -l app.kubernetes.io/part-of=merajutasa
kubectl describe service <service-name>
```

**Solutions:**
- **Pod Readiness**: Ensure pods pass readiness probes
- **Network Policies**: Verify network policies allow traffic
- **Service Selectors**: Check service selector labels match pod labels
- **Cluster DNS**: Test DNS resolution within cluster

#### 4. Health Probe Failures

**Symptoms:**
- Pods not becoming ready
- Frequent restarts due to liveness failures

**Diagnostic Commands:**
```bash
kubectl describe pod <pod-name> | grep -A 10 "Conditions:"
kubectl logs <pod-name> | grep health
```

**Solutions:**
- **Probe Configuration**: Adjust timing and thresholds
- **Application Startup Time**: Increase initial delay for startup probes
- **Health Endpoint Issues**: Verify health endpoint implementation
- **Resource Constraints**: Check if resource limits affect performance

#### 5. Image Pull Errors

**Symptoms:**
- `ImagePullBackOff` or `ErrImagePull` status
- Cannot pull container images

**Diagnostic Commands:**
```bash
kubectl describe pod <pod-name> | grep -A 5 "Events:"
```

**Solutions:**
- **Registry Access**: Verify registry credentials and network access
- **Image Tags**: Ensure image tags exist and are correctly specified
- **Pull Policy**: Check imagePullPolicy settings
- **Private Registry**: Configure image pull secrets if needed

### Emergency Procedures

#### Rolling Back Deployment

```bash
# Check rollout history
kubectl rollout history deployment/merajutasa-signer

# Rollback to previous version
kubectl rollout undo deployment/merajutasa-signer

# Rollback to specific revision
kubectl rollout undo deployment/merajutasa-signer --to-revision=2
```

#### Force Pod Recreation

```bash
# Delete specific pod (will be recreated)
kubectl delete pod <pod-name>

# Restart deployment (rolling restart)
kubectl rollout restart deployment/merajutasa-signer
```

#### Emergency Scale Down

```bash
# Scale down problematic service
kubectl scale deployment merajutasa-collector --replicas=1

# Scale down all services
kubectl scale deployment -l app.kubernetes.io/part-of=merajutasa --replicas=1
```

## Performance Monitoring

### Resource Utilization

```bash
# Monitor cluster resource usage
kubectl top nodes
kubectl top pods -l app.kubernetes.io/part-of=merajutasa

# Check resource quotas (if configured)
kubectl describe quota

# Monitor persistent volume usage
kubectl get pv,pvc
```

### Application Metrics

```bash
# Access Prometheus metrics (if available)
kubectl port-forward service/merajutasa-observability 8081:8081
# Then access http://localhost:8081/metrics

# Monitor service endpoints
kubectl get endpoints -l app.kubernetes.io/part-of=merajutasa -w
```

## Security Considerations

### RBAC and Permissions

- All services run with dedicated ServiceAccounts
- Non-root containers with security contexts
- Read-only root filesystems where possible
- Minimal capability sets (drop ALL capabilities)

### Network Security

- Services use ClusterIP for internal communication
- Network policies can be applied for traffic restriction
- TLS encryption between services (when configured)

### Container Security

- Non-root user execution (UID 1001)
- Security context constraints applied
- Volume mounts limited to necessary paths
- Privilege escalation disabled

## Maintenance

### Regular Health Checks

```bash
# Daily health verification
npm run k8s:status
kubectl get events --since=24h --sort-by=.metadata.creationTimestamp

# Weekly resource review
kubectl top nodes
kubectl top pods -l app.kubernetes.io/part-of=merajutasa
```

### Updates and Patches

```bash
# Update deployment with new image
kubectl set image deployment/merajutasa-signer signer=merajutasa/signer:v2.0

# Monitor rolling update
kubectl rollout status deployment/merajutasa-signer
```

### Backup Considerations

- ConfigMap backup: `kubectl get configmap merajutasa-config -o yaml > config-backup.yaml`
- Persistent volume snapshots (cluster-dependent)
- Application data backups through service APIs

## Integration with CI/CD

### Automated Deployment Pipeline

```bash
# Typical CI/CD integration commands
npm run governance:verify          # Verify governance policies
npm run test:infrastructure        # Run infrastructure tests
npm run k8s:deploy                 # Deploy to cluster
npm run k8s:status                 # Verify deployment
```

### Monitoring Integration

- Integrate with observability stack (Week 3)
- Connect to HA orchestrator (Week 5)
- Enable compliance monitoring (Week 6)

## Next Steps

After successful Kubernetes deployment:

1. **Observability**: Configure advanced monitoring and alerting (Week 3)
2. **Performance**: Implement caching and optimization (Week 2)
3. **High Availability**: Enable multi-region deployment (Week 5)
4. **Security**: Complete security hardening and compliance (Week 6)
5. **API Gateway**: Configure advanced routing and policies (Week 4)

## Related Documentation

- [Boot Sequence - Docker](boot-sequence-docker.md): Alternative containerized deployment
- [Boot Sequence - Local](boot-sequence-local.md): Development environment setup
- [Phase 2 Week 1 Delivery](../phase-2/PHASE-2-WEEK-1-DELIVERY-DOCUMENTATION.md): Kubernetes implementation details
- [Team Setup Guide](../team-guides/TEAM-SETUP-GUIDE-PHASE-2-WEEK-1.md): Kubernetes operations reference

---

**Document Version**: 1.0  
**Last Updated**: $(date)  
**Compatibility**: Kubernetes 1.20+, MerajutASA.id Platform v1.x