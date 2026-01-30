# Quick Start Guide

Get the Investor Research Application running in 5 minutes!

## Prerequisites
- Node.js >= 18
- pnpm >= 8
- Docker Desktop

## Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# 3. Setup database
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# 4. Start development servers (from root)
cd ../..
pnpm dev
```

## Verify Everything Works

### Backend Health Check
```bash
curl http://localhost:3000/api
```

Expected: `{"status":"ok","message":"Investor Research API is running"}`

### Test All Integrations
```bash
curl "http://localhost:3000/api/test/all?ticker=AAPL&company=Apple%20Inc"
```

Expected: JSON with data from all 5 integrations

### View API Documentation
Open in browser: http://localhost:3000/api/docs

### View Frontend
Open in browser: http://localhost:5173

## Test Individual Integrations

```bash
# SEC EDGAR (company filings)
curl "http://localhost:3000/api/test/sec-edgar?ticker=AAPL"

# Yahoo Finance (stock data)
curl "http://localhost:3000/api/test/yahoo-finance?ticker=AAPL"

# OpenCorporates (company registry)
curl "http://localhost:3000/api/test/opencorporates?name=Apple"

# Wikidata (company profile)
curl "http://localhost:3000/api/test/wikidata?name=Apple%20Inc"

# NewsAPI (recent news)
curl "http://localhost:3000/api/test/newsapi?company=Apple"

# Portfolio Scraping
curl -X POST "http://localhost:3000/api/test/scraping" \
  -H "Content-Type: application/json" \
  -d '{"investorName":"Sequoia Capital"}'
```

## What's Next?

- **Phase 3**: Data aggregation and manual entry
- **Phase 4**: Backend API endpoints (CRUD)
- **Phase 5**: Frontend features and forms
- **Phase 6**: Visualizations and network graphs
- **Phase 7**: Polish and deploy

## Useful Commands

```bash
# View database
cd apps/backend && npx prisma studio

# Check Redis cache
docker exec -it investor_research_redis redis-cli
> KEYS *

# View Docker logs
docker-compose logs -f

# Check queue status
curl http://localhost:3000/api/test/queue-stats
```

## Need Help?

- See **SETUP.md** for detailed setup instructions
- See **PHASE2_COMPLETE.md** for integration testing
- See **STATUS.md** for project roadmap
- Check **README.md** for overview

## Current Status

✅ Phase 1: Foundation (Complete)
✅ Phase 2: Integrations (Complete)
🚧 Phase 3: Data Aggregation (Next)

Zero API costs, all integrations working!
