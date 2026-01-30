# Setup Guide

This guide will help you set up and run the Investor & Company Research Application locally.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (Install: `npm install -g pnpm`)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))

## Phase 1 Completion Status ✅

The following Phase 1 tasks have been completed:

1. ✅ Monorepo structure initialized with pnpm workspaces
2. ✅ NestJS backend with basic module structure
3. ✅ Vite + React frontend with routing
4. ✅ Docker Compose configured for PostgreSQL and Redis
5. ✅ Prisma schema with complete database models
6. ✅ Environment variables configured
7. ✅ TypeScript config for shared types
8. ✅ Basic frontend pages and components

## Setup Instructions

### Step 1: Install Dependencies

```bash
# Install all dependencies for root, backend, frontend, and shared packages
pnpm install
```

This will install dependencies for all workspaces in the monorepo.

### Step 2: Start Infrastructure Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

Verify services are running:

```bash
docker ps
```

You should see two containers:
- `investor_research_db` (PostgreSQL)
- `investor_research_redis` (Redis)

### Step 3: Setup Database

Navigate to the backend directory and run database migrations:

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with sample data
npx prisma db seed
```

You should see output confirming:
- 3 investors created (Sequoia Capital, Andreessen Horowitz, Benchmark)
- 3 companies created (Airbnb, Stripe, Notion)
- 4 investments created

### Step 4: Verify Database

Open Prisma Studio to view the seeded data:

```bash
npx prisma studio
```

This will open a browser window at http://localhost:5555 where you can browse your database.

### Step 5: Start Development Servers

From the root directory, start both backend and frontend:

```bash
cd ../..  # Return to root if still in apps/backend
pnpm dev
```

Or start them individually:

```bash
# Terminal 1 - Backend
cd apps/backend
pnpm start:dev

# Terminal 2 - Frontend
cd apps/frontend
pnpm dev
```

### Step 6: Verify Everything Works

1. **Backend API**: http://localhost:3000
   - Health check: http://localhost:3000/api
   - API docs: http://localhost:3000/api/docs

2. **Frontend**: http://localhost:5173
   - Should display the homepage
   - Navigate to Search page

3. **Database**: Check Prisma Studio at http://localhost:5555

4. **Redis**: Test connection:
   ```bash
   docker exec -it investor_research_redis redis-cli
   > ping
   # Should respond with PONG
   > exit
   ```

## Free API Keys (Optional for Phase 1)

For Phase 2 (Data Integration), you'll need these free API keys:

1. **NewsAPI** (Free - 100 requests/day)
   - Sign up: https://newsapi.org/register
   - Add to `.env`: `NEWS_API_KEY=your_key_here`

2. **OpenCorporates** (Optional - increases rate limit)
   - Sign up: https://opencorporates.com/api_accounts/new
   - Add to `.env`: `OPENCORPORATES_API_KEY=your_key_here`

3. **SEC EDGAR** (No key needed)
   - Update `.env` with your email: `SEC_EDGAR_USER_AGENT="YourName your@email.com"`

## Project Structure

```
investorTrendSearcher/
├── apps/
│   ├── backend/              # NestJS API (Port 3000)
│   │   ├── prisma/           # Database schema and migrations
│   │   └── src/              # Source code
│   │       ├── database/     # Prisma service
│   │       ├── cache/        # Redis service
│   │       └── main.ts       # Application entry point
│   │
│   └── frontend/             # React app (Port 5173)
│       └── src/
│           ├── components/   # React components
│           ├── pages/        # Page components
│           └── services/     # API client
│
├── packages/
│   └── shared-types/         # Shared TypeScript types
│
├── docker-compose.yml        # PostgreSQL + Redis
├── .env                      # Environment variables
└── pnpm-workspace.yaml       # Workspace configuration
```

## Useful Commands

### Development
```bash
pnpm dev                      # Start all services
pnpm build                    # Build all packages
pnpm lint                     # Lint all packages
```

### Database
```bash
cd apps/backend
npx prisma studio             # Open database GUI
npx prisma migrate dev        # Create new migration
npx prisma db seed            # Seed database
npx prisma generate           # Regenerate Prisma client
```

### Docker
```bash
docker-compose up -d          # Start services
docker-compose down           # Stop services
docker-compose logs -f        # View logs
docker-compose ps             # Check status
```

### Testing
```bash
pnpm test                     # Run all tests (when implemented)
pnpm test:unit                # Unit tests
pnpm test:e2e                 # E2E tests
```

## Troubleshooting

### Port Already in Use

If ports 3000, 5173, 5432, or 6379 are already in use:

1. Change ports in `.env`:
   ```
   BACKEND_PORT=3001
   FRONTEND_PORT=5174
   ```

2. Update `docker-compose.yml` for database/Redis ports

### Database Connection Issues

1. Check Docker containers are running:
   ```bash
   docker ps
   ```

2. Restart containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. Verify DATABASE_URL in `.env` matches Docker configuration

### Prisma Client Issues

If you see "Prisma Client not found":

```bash
cd apps/backend
npx prisma generate
```

### Redis Connection Issues

Check Redis is accessible:

```bash
docker exec -it investor_research_redis redis-cli ping
```

## Next Steps (Phase 2)

Once Phase 1 is working, the next phase will implement:

1. SEC EDGAR integration (company filings, insider trading)
2. Yahoo Finance integration (stock prices, market data)
3. OpenCorporates integration (company registry)
4. Wikidata integration (entity data)
5. NewsAPI integration (recent news)
6. Web scraping infrastructure (investor portfolios)
7. Background job queue (Bull)
8. Data caching strategy

## Getting Help

If you encounter issues:

1. Check this setup guide
2. Review logs:
   - Backend: Check terminal output
   - Frontend: Check browser console
   - Docker: `docker-compose logs -f`
3. Verify all prerequisites are installed
4. Ensure Docker Desktop is running

## Development Workflow

1. Start Docker services: `docker-compose up -d`
2. Start dev servers: `pnpm dev`
3. Make changes to code (hot reload enabled)
4. View changes in browser (http://localhost:5173)
5. Test API endpoints (http://localhost:3000/api/docs)
6. Check database (Prisma Studio: http://localhost:5555)

When done:
```bash
docker-compose down  # Stop Docker services
```
