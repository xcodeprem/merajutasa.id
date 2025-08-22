# Team Onboarding Guide: Phase 2 Week 1 Containerization

*Essential Setup Instructions for All Team Members*

---

## 🚀 Quick Start for Teams

**Objective**: Get every team member ready to work with MerajutASA.id's new containerized infrastructure in under 30 minutes.

### Prerequisites Checklist

- [ ] Computer with 8GB+ RAM and 50GB+ free disk space
- [ ] Stable internet connection (for Docker image downloads)
- [ ] Admin/sudo access on your development machine
- [ ] Access to MerajutASA.id GitHub repository

---

## 📝 Step-by-Step Setup Instructions

### STEP 1: Create Docker Account (5 minutes)

#### For All Team Members (MANDATORY)

1. **Visit Docker Hub**: Go to <https://hub.docker.com/signup>
2. **Registration Details**:
   - **Email**: Use your `[name]@merajutasa.id` email
   - **Username**: `merajutasa-[yourname]` (example: `merajutasa-ahmad`)
   - **Password**: Use strong password (save in company password manager)
3. **Verify Email**: Check your email and click verification link
4. **Join Organization** (if applicable): Wait for DevOps team to invite you to company organization

### STEP 2: Install Docker Desktop (10 minutes)

#### Windows Users

```powershell
# Download Docker Desktop for Windows
# Visit: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

# Run installer as Administrator
# Follow installation wizard
# Restart computer when prompted

# Verify installation
docker --version
docker-compose --version
```

#### macOS Users

```bash
# Download Docker Desktop for Mac
# Visit: https://desktop.docker.com/mac/main/amd64/Docker.dmg

# Install .dmg file
# Start Docker Desktop from Applications
# Follow setup wizard

# Verify installation
docker --version
docker-compose --version
```

#### Linux Users (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# IMPORTANT: Logout and login again for group changes to take effect

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker-compose --version
```

### STEP 3: Configure Docker (5 minutes)

#### Login to Docker Hub

```bash
# Login with your Docker Hub credentials
docker login

# Enter username: merajutasa-[yourname]
# Enter password: [your Docker Hub password]

# Verify login
docker info | grep Username
```

#### Test Docker Installation

```bash
# Run test container
docker run hello-world

# Should output: "Hello from Docker!"
# This confirms Docker is working correctly
```

### STEP 4: Install Kubernetes Tools (5 minutes)

#### Install kubectl (Kubernetes CLI)

**Windows (PowerShell as Administrator)**:

```powershell
# Download kubectl
curl.exe -LO "https://dl.k8s.io/release/v1.28.0/bin/windows/amd64/kubectl.exe"

# Move to a directory in PATH (example: C:\Windows\System32)
# Or add current directory to PATH

# Verify installation
kubectl version --client
```

**macOS**:

```bash
# Using Homebrew (recommended)
brew install kubectl

# Or direct download
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify installation
kubectl version --client
```

**Linux**:

```bash
# Download kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install kubectl
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installation
kubectl version --client
```

### STEP 5: Project Setup (5 minutes)

#### Clone and Setup Repository

```bash
# Navigate to your development directory
cd ~/Development  # or your preferred directory

# Clone repository (if not already done)
git clone https://github.com/xcodeprem/merajutasa.id.git
cd merajutasa.id

# Install Node.js dependencies
npm ci

# Verify Phase 2 implementation
npm run phase2:status

# Run quick demo
npm run phase2:week1-demo
```

---

## 🎯 Role-Specific Instructions

### For Frontend Developers

**Focus**: Understanding how UI services work in containers

```bash
# Build containers for services you'll work with
npm run docker:build-all

# Start development environment
npm run docker:deploy-dev

# Check which ports services are running on
npm run docker:status

# View logs for debugging
npm run docker:logs
```

**Key Ports to Know**:

- Signer Service: `localhost:4601`
- Chain Service: `localhost:4602`
- Collector Service: `localhost:4603`
- Monitoring: `localhost:3000`

### For Backend Developers

**Focus**: Service development in containerized environment

```bash
# Test individual services
docker build -f infrastructure/docker/services/Dockerfile.signer -t merajutasa-signer .
docker run -p 4601:4601 merajutasa-signer

# Development workflow
npm run docker:deploy-dev    # Start all services
# Make code changes
npm run docker:restart       # Restart services with changes
npm run docker:health-check  # Verify everything works
```

**Development Tips**:

- Use `docker logs [container_name]` for debugging
- Modify `docker-compose.yml` for development volumes
- Use `docker exec -it [container] bash` to inspect containers

### For DevOps Engineers

**Focus**: Infrastructure management and deployment

```bash
# Infrastructure validation
npm run test:infrastructure

# Kubernetes operations
npm run k8s:deploy          # Deploy to cluster
npm run k8s:status          # Check deployments
npm run k8s:describe        # Detailed status

# Terraform operations (when ready)
cd infrastructure/terraform
terraform init
terraform plan
# terraform apply (when approved)
```

**Responsibilities**:

- Configure AWS credentials for EKS
- Set up monitoring dashboards
- Manage container registries
- Monitor resource usage

### For QA Engineers

**Focus**: Testing in containerized environments

```bash
# Set up test environment
npm run docker:deploy-test

# Run infrastructure tests
npm run test:infrastructure

# Performance testing
npm run docker:health-check
# Load testing should target containerized endpoints

# Test data isolation
npm run docker:stop
npm run docker:deploy-test  # Fresh test environment
```

**Testing Strategy**:

- Test service isolation in containers
- Verify health checks work correctly
- Test container startup/shutdown procedures
- Validate data persistence

---

## 🔧 Common Commands Reference

### Docker Operations

```bash
# Container Management
npm run docker:build-all       # Build all containers
npm run docker:deploy-dev      # Start development stack
npm run docker:deploy-prod     # Start production stack
npm run docker:stop           # Stop all containers
npm run docker:restart        # Restart all containers
npm run docker:status         # Check container status
npm run docker:logs           # View container logs
npm run docker:health-check   # Verify health status

# Manual Docker Commands
docker ps                     # List running containers
docker ps -a                  # List all containers
docker images                 # List Docker images
docker logs [container_name]  # View specific container logs
docker exec -it [container] bash  # Access container shell
```

### Kubernetes Operations

```bash
# Deployment Management
npm run k8s:deploy            # Deploy to Kubernetes
npm run k8s:delete            # Remove deployments
npm run k8s:status            # Check deployment status
npm run k8s:logs              # View application logs
npm run k8s:describe          # Detailed deployment info

# Manual kubectl Commands
kubectl get pods              # List pods
kubectl get services          # List services
kubectl describe pod [name]   # Pod details
kubectl logs [pod_name]       # Pod logs
kubectl exec -it [pod] bash   # Access pod shell
```

### Phase 2 Management

```bash
# Status and Monitoring
npm run phase2:status         # Implementation status
npm run phase2:week1-demo     # Interactive demo
npm run test:infrastructure   # Run infrastructure tests
npm run phase1:status         # Phase 1 status (for reference)
```

---

## ⚠️ Troubleshooting

### Common Issues

#### "Docker command not found"

**Solution**:

```bash
# Verify Docker is installed
which docker

# If not found, reinstall Docker Desktop
# Make sure Docker Desktop is running

# Linux: Check if Docker service is running
sudo systemctl status docker
```

#### "Permission denied" on Linux

**Solution**:

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
# Or restart terminal session

# Verify group membership
groups | grep docker
```

#### "Port already in use"

**Solution**:

```bash
# Check what's using the port
netstat -tulpn | grep :4601

# Stop conflicting services
npm run docker:stop

# Or kill specific process
kill -9 [PID]
```

#### Container build failures

**Solution**:

```bash
# Clear Docker cache
docker system prune -f

# Rebuild with verbose output
docker build --no-cache -f infrastructure/docker/services/Dockerfile.signer -t merajutasa-signer .

# Check Docker logs
docker logs [container_name]
```

### Getting Help

1. **Check Documentation**: Review this guide and Phase 2 delivery documentation
2. **Run Diagnostics**: Use `npm run phase2:status` for detailed status
3. **Check Logs**: Use `npm run docker:logs` to see what's happening
4. **Ask Team**: Post in team Slack channel with error details
5. **Contact DevOps**: For infrastructure-specific issues

---

## 🎉 Verification Checklist

Before considering setup complete, verify:

- [ ] Docker Desktop is running and accessible
- [ ] `docker --version` shows version 20.10+
- [ ] `docker login` succeeds with your credentials
- [ ] `kubectl version --client` shows kubectl is installed
- [ ] `npm run phase2:status` shows infrastructure status
- [ ] `npm run docker:deploy-dev` starts containers successfully
- [ ] `npm run docker:health-check` passes all health checks
- [ ] You can access services at expected ports (4601, 4602, 4603)

**Setup Complete** ✅ - You're ready to work with MerajutASA.id's containerized infrastructure!

---

## 📞 Support Contacts

- **General Setup Issues**: Technical Lead
- **Docker Problems**: DevOps Team
- **Kubernetes Questions**: Platform Engineering
- **Development Workflow**: Senior Backend Developer
- **Testing Setup**: QA Lead

**Emergency Contact**: If services are down, contact DevOps team immediately via emergency channel.

---

*Last Updated: August 18, 2025*  
*Next Update: Phase 2 Week 2 completion*
