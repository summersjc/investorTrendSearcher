# Restart Guide - After Reboot

This guide helps you restart the Investor Research Application after rebooting your machine.

## Quick Start (TL;DR)

```bash
cd ~/GitHub/investorTrendSearcher

# 1. Start Podman machine
podman machine start

# 2. Start containers
export DOCKER_HOST='unix:///var/folders/_0/ydzmxykj6y33k08bgc4m2mn80000gp/T/podman/podman-machine-default-api.sock'
podman-compose -f docker-compose.yml up -d

# 3. Start backend (in background or separate terminal)
pnpm --filter backend start:dev

# 4. Start frontend (in background or separate terminal)
pnpm --filter frontend dev
```

Then open http://localhost:5173 in your browser!

## Detailed Step-by-Step Instructions

### Step 1: Navigate to Project Directory

```bash
cd ~/GitHub/investorTrendSearcher
```

### Step 2: Start Podman Machine

```bash
# Check if Podman machine is running
podman machine list

# If not running, start it
podman machine start

# Wait ~10 seconds for it to fully start
sleep 10
```

**Expected output:**
```
Starting machine "podman-machine-default"
Machine "podman-machine-default" started successfully
```

### Step 3: Set Podman Environment Variable

```bash
# This is required for podman-compose to work
export DOCKER_HOST='unix:///var/folders/_0/ydzmxykj6y33k08bgc4m2mn80000gp/T/podman/podman-machine-default-api.sock'

# Verify it's set
echo $DOCKER_HOST
```

**Pro Tip:** Add this to your `~/.zshrc` or `~/.bashrc` to persist across sessions:
```bash
echo "export DOCKER_HOST='unix:///var/folders/_0/ydzmxykj6y33k08bgc4m2mn80000gp/T/podman/podman-machine-default-api.sock'" >> ~/.zshrc
```

### Step 4: Start PostgreSQL and Redis Containers

```bash
# Start the containers
podman-compose -f docker-compose.yml up -d

# Verify they're running
podman-compose -f docker-compose.yml ps

# Expected: Both postgres and redis should show "Up" and "(healthy)"
```

**Troubleshooting:**
- If containers don't start, try: `podman-compose -f docker-compose.yml restart`
- If port conflicts, check: `lsof -i :5432` and `lsof -i :6379`

### Step 5: Start Backend Server

**Option A: In a separate terminal**
```bash
cd ~/GitHub/investorTrendSearcher
pnpm --filter backend start:dev
```

**Option B: In background (Claude Code style)**
```bash
pnpm --filter backend start:dev &
```

**Wait ~10 seconds**, then verify:
```bash
curl http://localhost:3000/api
# Expected: {"status":"ok","message":"Investor Research API is running"}
```

### Step 6: Start Frontend Server

**Option A: In a separate terminal**
```bash
cd ~/GitHub/investorTrendSearcher
pnpm --filter frontend dev
```

**Option B: In background**
```bash
pnpm --filter frontend dev &
```

**Verify:**
```bash
curl -I http://localhost:5173
# Expected: HTTP/1.1 200 OK
```

### Step 7: Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api/docs
- **Prisma Studio:** `cd apps/backend && npx prisma studio` (http://localhost:5555)

## Service Status Check

```bash
# Check Podman machine
podman machine list

# Check containers
podman-compose ps

# Check backend (if port 3000 is responding)
curl http://localhost:3000/api

# Check frontend (if port 5173 is responding)
curl -I http://localhost:5173

# Check PostgreSQL is accessible
psql postgresql://postgres:postgres@localhost:5432/investor_research -c "SELECT 1;"

# Check Redis is accessible
redis-cli ping
# or via container:
podman exec investor_research_redis redis-cli ping
```

## Common Issues & Solutions

### Issue: Podman machine won't start

```bash
# Stop any existing instance
podman machine stop

# Remove and recreate
podman machine rm
podman machine init
podman machine start
```

### Issue: Port conflicts (5432, 6379, 3000, or 5173)

```bash
# Find what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Kill the process if needed
kill -9 <PID>

# Or stop local services
brew services stop postgresql@14  # If you have local postgres
```

### Issue: Backend fails with "DATABASE_URL not found"

```bash
# Make sure .env symlink exists in apps/backend
ls -la apps/backend/.env

# If not, recreate it
ln -sf ../../.env apps/backend/.env
```

### Issue: Containers stopped unexpectedly

```bash
# Check logs
podman-compose logs postgres
podman-compose logs redis

# Restart containers
podman-compose restart
```

### Issue: Need to reset database

```bash
cd apps/backend

# Reset and reseed
npx prisma migrate reset

# Or just reseed
npx prisma db seed
```

## Stopping Everything

When you're done working:

```bash
# Stop frontend and backend
# (Press Ctrl+C in their terminal windows, or kill their processes)

# Stop containers
podman-compose -f docker-compose.yml down

# Stop Podman machine (optional - saves resources)
podman machine stop
```

## One-Line Restart Script

Create a file `start.sh` in the project root:

```bash
#!/bin/bash
cd ~/GitHub/investorTrendSearcher
podman machine start && \
export DOCKER_HOST='unix:///var/folders/_0/ydzmxykj6y33k08bgc4m2mn80000gp/T/podman/podman-machine-default-api.sock' && \
podman-compose up -d && \
sleep 5 && \
echo "Starting backend..." && \
pnpm --filter backend start:dev &
BACKEND_PID=$!
sleep 10 && \
echo "Starting frontend..." && \
pnpm --filter frontend dev &
FRONTEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "🚀 Application is starting..."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000/api"
```

Make it executable:
```bash
chmod +x start.sh
./start.sh
```

## Environment Variables Reference

Key environment variables (in `.env` file at project root):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/investor_research"
REDIS_HOST="localhost"
REDIS_PORT=6379
NODE_ENV="development"
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

## Development Workflow

**Daily workflow:**
1. Open terminal
2. `cd ~/GitHub/investorTrendSearcher`
3. Run `./start.sh` (if you created it) or follow Quick Start steps
4. Open http://localhost:5173 in browser
5. Make changes to code (hot reload is enabled)
6. Test changes
7. Commit when ready: `git add . && git commit -m "Your message" && git push`

## Useful Commands Reference

```bash
# View logs
cd apps/backend && npm run start:dev  # See backend logs live
cd apps/frontend && npm run dev        # See frontend logs live

# Database management
cd apps/backend
npx prisma studio          # GUI for database
npx prisma migrate dev     # Create new migration
npx prisma db seed         # Reseed data

# Check service health
curl http://localhost:3000/api/health
curl http://localhost:5173

# View container stats
podman stats

# Git workflow
git status
git add .
git commit -m "message"
git push origin master
```

## GitHub Repository

- **GitHub:** https://github.com/summersjc/investorTrendSearcher
- **Local:** ~/GitHub/investorTrendSearcher

## Getting Help

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review `CLAUDE.md` for architecture details
3. Check `TEST_GUIDE.md` for testing procedures
4. Review `QUICK_START.md` for setup details

## Notes

- The Podman machine needs to be running for containers to work
- The `DOCKER_HOST` environment variable is crucial for podman-compose
- Backend needs the symlinked `.env` file in `apps/backend/`
- Frontend proxies API requests to backend via Vite config
- Database persists in Docker volumes (survives restarts)
- Redis cache will be empty after restart (gets repopulated automatically)

Last updated: 2026-01-30
