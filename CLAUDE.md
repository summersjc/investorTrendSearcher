# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo-based investor research platform that aggregates data about investors and companies using free APIs and manual data entry. It combines NestJS backend, React frontend, and shared TypeScript types.

**Core Concept**: The application tracks investors (VC firms, angels, etc.), companies (public/private), and the investment relationships between them. Data is enriched from multiple free sources: SEC EDGAR, Yahoo Finance, OpenCorporates, Wikidata, NewsAPI, and web scraping.

## Development Commands

### Initial Setup
```bash
# Install all dependencies (monorepo)
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Setup database
cd apps/backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### Development
```bash
# Start both backend and frontend (from root)
pnpm dev

# Start individually
cd apps/backend && pnpm start:dev  # Backend on :3000
cd apps/frontend && pnpm dev       # Frontend on :5173

# Build all packages
pnpm build

# Lint all packages
pnpm lint
```

### Database Operations
```bash
cd apps/backend

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio (visual database browser)
npx prisma studio

# Seed test data
npx prisma db seed
```

### Testing
```bash
# Run all tests (from root)
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

### Production
```bash
# Build for production
pnpm build

# Use production Docker setup
docker-compose -f docker-compose.prod.yml up -d
```

## Architecture Overview

### Monorepo Structure
- **apps/backend**: NestJS API server with Prisma ORM
- **apps/frontend**: React + Vite application with TanStack Query
- **packages/shared-types**: Shared TypeScript types/interfaces

### Backend Architecture (NestJS)

**Module Organization**:
- **modules/**: Domain modules (investor, company, investment, search, connections, aggregation, import-export)
- **integrations/**: External data source integrations (sec-edgar, yahoo-finance, opencorporates, wikidata, newsapi, scrapers)
- **database/**: Prisma client and database service
- **cache/**: Redis caching layer
- **queue/**: Bull queue for background jobs
- **common/**: Shared filters and interceptors

**Key Patterns**:
1. Each module follows NestJS structure: `module.ts`, `controller.ts`, `service.ts`, `dto/`
2. DTOs use class-validator decorators for validation
3. Prisma is injected via `PrismaService` from `database/` module
4. Redis caching is applied via `CacheModule` where needed
5. Background jobs (web scraping, data enrichment) use Bull queues

**Integration Layer**:
- All integrations extend `BaseIntegration` class (in `integrations/base/`)
- Each integration handles its own rate limiting and error handling
- Raw API responses are cached in Redis
- Integration results are stored in `rawData` JSON field in database

### Frontend Architecture (React + Vite)

**Key Directories**:
- **components/**: Reusable UI components (layout, common, visualizations)
- **pages/**: Route-level page components
- **hooks/**: Custom React hooks for data fetching (useInvestors, useCompanies, useInvestments, useSearch)
- **lib/**: Utility functions and API client setup

**Data Flow**:
1. TanStack Query hooks in `hooks/` directory manage all server state
2. API calls go through axios client configured in `lib/api.ts`
3. Components consume hooks and handle loading/error states
4. Visualizations use D3.js (network graphs) and Recharts (charts)

### Database Schema (Prisma)

**Core Entities**:
- **Investor**: VC firms, angels, PE firms with portfolio tracking
- **Company**: Public/private companies with enriched data
- **Investment**: Junction table tracking investor-company relationships
- **FundingRound**: Funding events linked to companies and investors
- **PortfolioCompany**: Simplified portfolio tracking

**Relationships**:
- **InvestorConnection**: Tracks co-investment relationships between investors
- **CompanyConnection**: Tracks relationships between companies (competitor, partner, etc.)

**Metadata Pattern**: All main entities have:
- `dataSource`: Enum tracking where data originated (MANUAL, SEC_EDGAR, etc.)
- `rawData`: JSON field storing raw API responses
- `lastFetched`: Timestamp of last external data refresh

**Key Indexes**: Most queries filter by name, slug, type, stage, or status. These fields are indexed.

## Development Patterns

### Adding New Integration

1. Create integration in `apps/backend/src/integrations/<name>/`
2. Extend `BaseIntegration` class
3. Implement rate limiting and caching
4. Add integration to `app.module.ts` providers
5. Create test endpoint in `modules/test/` for manual verification
6. Add DataSource enum value to Prisma schema if needed

### Adding New Entity

1. Add model to `apps/backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_entity`
3. Create NestJS module in `apps/backend/src/modules/<entity>/`
4. Add service, controller, and DTOs
5. Register module in `app.module.ts`
6. Create frontend hook in `apps/frontend/src/hooks/use<Entity>.ts`
7. Add types to `packages/shared-types/` if shared between frontend/backend

### API Endpoints Convention

All API routes are prefixed with `/api`:
- `/api/investors` - Investor CRUD
- `/api/companies` - Company CRUD
- `/api/investments` - Investment CRUD
- `/api/search` - Unified search
- `/api/connections` - Network/connection discovery
- `/api/test` - Integration testing endpoints
- `/api/docs` - Swagger documentation

### Environment Variables

**Backend** (apps/backend/.env):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis connection
- `NEWS_API_KEY`: NewsAPI key (optional, free tier)
- `NODE_ENV`: development/production

**Frontend** proxies backend API in dev via Vite config.

## Key Technical Decisions

1. **Zero-cost data sources**: All integrations use free APIs or web scraping
2. **Hybrid data model**: Combines automated enrichment with manual data entry
3. **Caching strategy**: Redis caches API responses with TTL to respect rate limits
4. **Background processing**: Web scraping runs in Bull queues to avoid blocking requests
5. **Type safety**: Shared types package ensures frontend/backend consistency
6. **Slug-based URLs**: All entities have unique slugs for clean URLs

## Testing Strategy

- **Unit tests**: Test individual services and utilities
- **Integration tests**: Test API endpoints with test database
- **E2E tests**: Test full user workflows in frontend
- Manual integration testing via `/api/test` endpoints (see TEST_GUIDE.md)

## Important Conventions

1. **Slugs**: Auto-generated from names (lowercase, hyphenated). Used in URLs.
2. **Enums**: Defined in Prisma schema, imported in NestJS/frontend as needed
3. **Date handling**: Prisma uses native DateTime, frontend uses date-fns
4. **Error handling**: Global exception filter in `common/filters/`
5. **Validation**: DTOs use class-validator decorators
6. **Swagger**: All endpoints documented via NestJS decorators (@ApiTags, @ApiOperation, etc.)

## Common Workflows

### Enriching a Public Company
1. User provides ticker symbol
2. Backend fetches data from SEC EDGAR (filings), Yahoo Finance (market data), Wikidata (background)
3. Data is aggregated in `modules/aggregation/aggregation.service.ts`
4. Company record is created/updated with `dataSource` set appropriately
5. Raw responses stored in `rawData` JSON field
6. Market data timeseries stored in separate `MarketData` table

### Scraping Investor Portfolio
1. User provides investor website URL
2. Scraping job created in database with PENDING status
3. Bull queue picks up job, runs Puppeteer scraper
4. Portfolio companies extracted and matched to existing companies
5. PortfolioCompany records created
6. Job status updated to COMPLETED or FAILED

### Network Visualization
1. Frontend requests investor by ID
2. Backend fetches investor with portfolio companies
3. Frontend requests connections via `/api/connections/investor/:id`
4. Backend queries `InvestorConnection` table for co-investors
5. D3.js force-directed graph renders connections
6. Nodes are draggable, edges show connection strength

## Package Manager

This project uses **pnpm** (not npm or yarn). Workspaces are defined in `pnpm-workspace.yaml`.
