# Team Setup Guide - Phase 2 Week 4: API Gateway & Management

## Overview 🎯

This guide provides step-by-step instructions for team members to set up and work with the Phase 2 Week 4 API Gateway & Management implementation. The setup process takes approximately **30-45 minutes** and covers all necessary tools, dependencies, and configuration required for development, testing, and deployment.

## Prerequisites 📋

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher  
- **Git**: Latest version for repository management
- **Code Editor**: VS Code, WebStorm, or equivalent with JavaScript/Node.js support

### Optional Tools (Recommended)
- **Docker Desktop**: For containerized testing and deployment
- **Postman/Insomnia**: For API testing and exploration
- **kubectl**: For Kubernetes cluster management (if using K8s)
- **curl**: For command-line API testing

### Development Environment
- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 5GB free space for dependencies and artifacts
- **Network**: Stable internet connection for dependency installation

## Quick Start (5 Minutes) 🚀

### 1. Clone Repository
```bash
git clone https://github.com/codingxdev0/merajutasa.id.git
cd merajutasa.id
```

### 2. Install Dependencies
```bash
# Install all dependencies (including new API Gateway packages)
npm install

# Verify installation
npm run week4:status
```

### 3. Validate Setup
```bash
# Run comprehensive status check
npm run week4:status

# Expected output: 95/100 score with all components operational
```

### 4. Quick Demo
```bash
# Run interactive demonstration
npm run week4:demo

# Expected: 10-step demo completing successfully in ~6 seconds
```

## Detailed Setup Instructions 📖

### Step 1: Environment Preparation

#### Install Node.js and npm
```bash
# Check current versions
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 8.0.0

# Update if necessary (example for Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version && npm --version
```

#### Configure Git (if not already done)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"
```

### Step 2: Repository Setup

#### Clone and Navigate
```bash
# Clone the repository
git clone https://github.com/codingxdev0/merajutasa.id.git
cd merajutasa.id

# Verify you're in the correct branch
git branch
git status
```

#### Install Dependencies
```bash
# Install all project dependencies
npm install

# This includes new API Gateway dependencies:
# - express: ^4.18.2
# - http-proxy-middleware: ^2.0.6
# - express-rate-limit: ^7.1.5
# - compression: ^1.7.4
# - cors: ^2.8.5
# - helmet: ^7.1.0
# - uuid: ^9.0.1
```

### Step 3: Validate Installation

#### Run Status Check
```bash
npm run week4:status
```

**Expected Output**:
```
📊 PHASE 2 WEEK 4 STATUS SUMMARY
================================
Overall Score: 95/100
Status: 🟢 EXCELLENT - Production Ready
Checks Passed: 36/38

📋 COMPONENT BREAKDOWN
======================
API Gateway Core: 5/5 (100%)
Service Mesh Integration: 5/5 (100%)
CI/CD Pipeline Management: 5/5 (100%)
OpenAPI Documentation System: 5/5 (100%)
API Gateway Orchestrator: 5/5 (100%)
Integration & Testing: 3/5 (60%)
Documentation: 3/3 (100%)
Performance & Capabilities: 5/5 (100%)
```

#### Run Interactive Demo
```bash
npm run week4:demo
```

**Expected Output**:
```
🚀 Phase 2 Week 4: API Gateway & Management Demo
================================================

📋 Step 1/10: Initialize API Gateway Orchestrator
✅ Completed in 6ms

📋 Step 2/10: Register Core Services  
✅ Completed in 1ms

[... continues for all 10 steps ...]

🎯 RESULT: Phase 2 Week 4 implementation is PRODUCTION READY! 🚀
```

### Step 4: Development Environment Configuration

#### VS Code Setup (Recommended)
```bash
# Install VS Code extensions (optional but recommended)
code --install-extension ms-vscode.vscode-node-debugger
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
```

#### Environment Variables (Optional)
```bash
# Create .env file for local development (optional)
cat > .env << EOL
NODE_ENV=development
API_GATEWAY_PORT=8080
ENABLE_DEBUG_LOGS=true
EOL
```

## Team-Specific Setup Instructions 👥

### Frontend Developers

#### Primary Focus: API Integration
```bash
# Test API Gateway endpoints
npm run api-gateway:start &
sleep 2

# Test service discovery
curl http://localhost:8080/services

# Test health endpoints
curl http://localhost:8080/health

# View API documentation
npm run docs:generate
open docs/api/index.html  # Opens interactive Swagger UI
```

#### Key Files to Understand:
- `infrastructure/api-gateway/api-gateway-core.js` - Main gateway routing
- `infrastructure/api-gateway/openapi-documentation.js` - API documentation system
- `docs/api/` - Generated API documentation

#### Daily Commands:
```bash
npm run api-gateway:status    # Check gateway health
npm run docs:generate         # Regenerate API docs
npm run week4:status         # Validate system status
```

### Backend Developers

#### Primary Focus: Service Integration & API Design
```bash
# Test service mesh integration
npm run service-mesh:health

# Monitor service topology
npm run service-mesh:topology

# Test circuit breaker functionality
npm run week4:demo  # Watch circuit breaker simulation in step 6
```

#### Key Files to Understand:
- `infrastructure/api-gateway/service-mesh.js` - Service discovery and load balancing
- `infrastructure/api-gateway/api-gateway-orchestrator.js` - System coordination
- `infrastructure/cicd/pipeline-manager.js` - Deployment automation

#### Daily Commands:
```bash
npm run service-mesh:health   # Check service mesh status
npm run api-gateway:metrics   # View performance metrics  
npm run cicd:status          # Check CI/CD system
```

### DevOps Engineers

#### Primary Focus: Deployment & Infrastructure
```bash
# Test CI/CD pipeline execution
npm run cicd:deploy

# Monitor system metrics
npm run api-gateway:metrics

# Test deployment strategies
npm run week4:demo  # Watch CI/CD simulation in step 8
```

#### Key Files to Understand:
- `infrastructure/cicd/pipeline-manager.js` - CI/CD automation
- `infrastructure/api-gateway/api-gateway-orchestrator.js` - System orchestration
- `package.json` - npm scripts for automation

#### Daily Commands:
```bash
npm run cicd:deploy          # Execute deployment pipeline
npm run api-gateway:start    # Start API Gateway system
npm run week4:status        # Comprehensive system check
```

### QA Engineers

#### Primary Focus: Testing & Validation
```bash
# Run comprehensive status validation
npm run week4:status

# Execute interactive demonstration
npm run week4:demo

# Test individual components
npm run api-gateway:health
npm run service-mesh:health
npm run cicd:status
```

#### Key Testing Areas:
- **API Gateway**: Request routing, rate limiting, error handling
- **Service Mesh**: Load balancing, circuit breaker, health checks
- **CI/CD**: Pipeline execution, deployment strategies, rollback
- **Documentation**: API documentation accuracy and completeness

#### Daily Commands:
```bash
npm run week4:status         # Full system validation
npm run week4:demo          # End-to-end functionality test
npm run test:infrastructure  # Integration tests
```

## Common Development Tasks 🛠️

### Starting the API Gateway System
```bash
# Start all components
npm run api-gateway:start

# Verify system status
npm run api-gateway:status

# View real-time metrics
npm run api-gateway:metrics
```

### Testing API Endpoints
```bash
# Start gateway (if not running)
npm run api-gateway:start &

# Test health endpoint
curl http://localhost:8080/health

# Test metrics endpoint
curl http://localhost:8080/metrics

# Test service discovery
curl http://localhost:8080/services

# Test API documentation
curl http://localhost:8080/docs
```

### Running Tests and Validation
```bash
# Comprehensive status check
npm run week4:status

# Interactive demonstration
npm run week4:demo

# Infrastructure integration tests
npm run test:infrastructure

# Existing governance tests
npm run test:governance
```

### Documentation Generation
```bash
# Generate API documentation
npm run docs:generate

# View documentation summary
npm run docs:summary

# Open interactive documentation
open docs/api/index.html  # macOS
start docs/api/index.html # Windows
xdg-open docs/api/index.html # Linux
```

## Troubleshooting Guide 🔧

### Common Issues and Solutions

#### 1. Dependency Installation Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 2. Port Conflicts
```bash
# Check if port 8080 is in use
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Use alternative port
export API_GATEWAY_PORT=8081
npm run api-gateway:start
```

#### 3. Module Import Errors
```bash
# Verify Node.js version
node --version  # Must be >= 18.0.0

# Check for missing dependencies
npm audit
npm install
```

#### 4. Status Check Failures
```bash
# Run detailed diagnostics
npm run week4:status

# Check specific components
npm run api-gateway:status
npm run service-mesh:health
npm run cicd:status
```

### Performance Issues

#### High Memory Usage
```bash
# Monitor memory usage
npm run api-gateway:metrics

# Restart components if needed
npm run api-gateway:stop
npm run api-gateway:start
```

#### Slow Response Times
```bash
# Check system load
npm run week4:status

# Review metrics
npm run api-gateway:metrics

# Restart if necessary
npm run api-gateway:restart
```

## Team Collaboration Guidelines 📝

### Development Workflow
1. **Always run status check** before starting work: `npm run week4:status`
2. **Validate changes** with demo: `npm run week4:demo`
3. **Update documentation** when modifying APIs
4. **Test integrations** before committing changes

### Code Review Checklist
- [ ] API Gateway components properly imported
- [ ] Service mesh integration tested
- [ ] CI/CD pipeline configurations validated
- [ ] Documentation updated for API changes
- [ ] Status checks passing (95+ score)

### Daily Standup Items
- **What worked**: Share successful API Gateway operations
- **What didn't work**: Report any system issues or failures
- **What's next**: Plan integration and testing activities
- **Blockers**: Identify any setup or configuration issues

## Advanced Configuration ⚙️

### Custom API Gateway Configuration
```javascript
// Example: Custom gateway configuration
const gateway = getAPIGateway({
  port: 8080,
  cors: {
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000 // Increase limit for development
  }
});
```

### Service Mesh Customization
```javascript
// Example: Custom service mesh configuration
const serviceMesh = getServiceMesh({
  loadBalancing: 'weighted',
  circuitBreakerThreshold: 3, // Lower threshold for testing
  healthCheckInterval: 10000   // More frequent health checks
});
```

### CI/CD Pipeline Customization
```javascript
// Example: Custom CI/CD pipeline
const pipeline = {
  name: 'Custom Development Pipeline',
  stages: [
    { name: 'lint', type: 'test', testSuites: ['npm run lint'] },
    { name: 'unit-test', type: 'test', testSuites: ['npm run test:unit'] },
    { name: 'build', type: 'build', buildDocker: true },
    { name: 'deploy-dev', type: 'deploy', strategy: 'rolling' }
  ]
};
```

## Support and Resources 📚

### Documentation Links
- **Delivery Documentation**: `docs/phase-2/PHASE-2-WEEK-4-DELIVERY-DOCUMENTATION.md`
- **Quick Reference**: `docs/quick-reference/QUICK-REFERENCE-PHASE-2-WEEK-4.md`
- **API Documentation**: Generated in `docs/api/` after running `npm run docs:generate`

### Key Commands Reference
```bash
# System Management
npm run week4:status          # Comprehensive status check
npm run week4:demo           # Interactive demonstration
npm run api-gateway:start    # Start API Gateway system
npm run api-gateway:status   # Check system status

# Component Testing
npm run service-mesh:health  # Service mesh health check
npm run cicd:status         # CI/CD system status
npm run docs:generate       # Generate documentation

# Development
npm run test:infrastructure  # Integration tests
npm run api-gateway:metrics  # Performance metrics
```

### Getting Help
1. **Run diagnostics**: `npm run week4:status` for detailed system analysis
2. **Check logs**: Component logs provide detailed error information
3. **Review documentation**: Comprehensive guides in `docs/` directory
4. **Test components**: Use `npm run week4:demo` to verify functionality

---

**Setup Complete!** 🎉

You're now ready to work with the Phase 2 Week 4 API Gateway & Management system. Start with `npm run week4:status` to verify everything is working correctly, then explore the interactive demo with `npm run week4:demo`.

*Last updated: August 18, 2025 - Phase 2 Week 4 Implementation*