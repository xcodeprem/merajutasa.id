# Quick Reference: Phase 2 Week 1 Commands
*Essential commands for daily operations with containerized MerajutASA.id*

---

## 🚀 Essential Daily Commands

### Quick Status Check
```bash
npm run phase2:status          # Check Phase 2 implementation status
npm run docker:status          # Check container status
npm run docker:health-check    # Verify all services healthy
```

### Development Workflow
```bash
# Start your day
npm run docker:deploy-dev      # Start development stack
npm run docker:logs           # Check what's happening

# During development
npm run docker:restart        # Restart after code changes
npm run test:infrastructure   # Validate changes

# End of day
npm run docker:stop           # Stop all containers
```

### Team Onboarding
```bash
# First time setup
docker login                  # Login with merajutasa-[name]
npm ci                        # Install dependencies
npm run phase2:week1-demo     # See what's been built

# Daily verification
npm run docker:build-all      # Rebuild containers
npm run docker:deploy-dev     # Start development
npm run docker:health-check   # Confirm everything works
```

---

## 🎯 Service Endpoints

When containers are running:
- **Signer Service**: http://localhost:4601/health
- **Chain Service**: http://localhost:4602/health  
- **Collector Service**: http://localhost:4603/health
- **Monitoring**: http://localhost:3000/metrics

---

## 🔧 Quick Troubleshooting

**Containers won't start?**
```bash
docker system prune -f        # Clear cache
npm run docker:build-all      # Rebuild
npm run docker:deploy-dev     # Try again
```

**Service not responding?**
```bash
npm run docker:logs           # Check logs
docker ps                     # List running containers
npm run docker:restart        # Restart services
```

**Need help?**
```bash
npm run phase2:status         # Detailed status report
npm run phase2:week1-demo     # Interactive demo
```

---

## 📋 Docker Account Requirements

**All team members must have**:
- Docker Hub account: `merajutasa-[yourname]`
- Email: `[name]@merajutasa.id`
- Docker Desktop installed and running
- Successful `docker login`

**Setup verification**:
```bash
docker --version             # Should show 20.10+
docker login                 # Should succeed
docker run hello-world       # Should work
```

---

*Keep this reference handy for daily containerized development!*