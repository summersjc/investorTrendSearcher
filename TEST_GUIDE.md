# Manual Testing Guide

## Pre-Test Setup

### 1. Check Prerequisites
```bash
# Verify Docker is running
docker --version
docker-compose --version

# Check if ports are available
lsof -i :3000  # Backend port
lsof -i :5173  # Frontend port
lsof -i :5432  # PostgreSQL port
lsof -i :6379  # Redis port
```

### 2. Environment Setup
```bash
# Make sure .env exists
cat .env

# If not, copy from example
cp .env.example .env
```

## Phase 1: Infrastructure Test

### Start Development Environment
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Wait 10 seconds for databases to be ready
sleep 10

# Check containers are running
docker-compose ps

# Expected: postgres and redis containers showing "Up"
```

### Setup Database
```bash
cd apps/backend

# Generate Prisma client
pnpm exec prisma generate

# Run migrations
pnpm exec prisma migrate dev --name init

# Seed database (optional but recommended)
pnpm exec prisma db seed

# Verify database
pnpm exec prisma studio &
# This opens http://localhost:5555 - check tables exist
```

### Start Backend
```bash
cd apps/backend

# Install dependencies if needed
pnpm install

# Start backend
pnpm start:dev

# Expected: Server running on http://localhost:3000
# Expected: Swagger docs at http://localhost:3000/api/docs
```

### Start Frontend
```bash
# In new terminal
cd apps/frontend

# Install dependencies if needed
pnpm install

# Start frontend
pnpm dev

# Expected: App running on http://localhost:5173
```

## Phase 2: API Integration Tests

### Test Health Endpoints
```bash
# Backend health
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Version endpoint
curl http://localhost:3000/api/version
# Expected: Version info
```

### Test SEC EDGAR Integration
```bash
# Test Apple Inc data
curl "http://localhost:3000/api/test/sec-edgar?ticker=AAPL"
# Expected: Company filings data

# Test invalid ticker
curl "http://localhost:3000/api/test/sec-edgar?ticker=INVALID"
# Expected: Error or empty result
```

### Test Yahoo Finance Integration
```bash
# Test stock quote
curl "http://localhost:3000/api/test/yahoo-finance?ticker=AAPL"
# Expected: Current stock price, market cap, volume

# Test invalid ticker
curl "http://localhost:3000/api/test/yahoo-finance?ticker=ZZZZ"
# Expected: Error message
```

### Test OpenCorporates Integration
```bash
# Search for Apple
curl "http://localhost:3000/api/test/opencorporates?name=Apple"
# Expected: Company registry data

# Note: Free tier has 500 req/month limit
```

### Test Wikidata Integration
```bash
# Search for Sequoia Capital
curl "http://localhost:3000/api/test/wikidata?query=Sequoia%20Capital"
# Expected: Entity data with description
```

### Test NewsAPI Integration
```bash
# Search for funding news
curl "http://localhost:3000/api/test/newsapi?query=venture%20capital"
# Expected: Recent news articles

# Note: Requires NEWS_API_KEY in .env
```

### Test All Integrations
```bash
# Run all tests at once
curl http://localhost:3000/api/test/all
# Expected: Results from all 5 integrations
```

## Phase 3: CRUD Operations Tests

### Investor CRUD
```bash
# Create investor
curl -X POST http://localhost:3000/api/investors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Ventures",
    "type": "VC_FIRM",
    "description": "Test venture capital firm",
    "website": "https://test.vc"
  }'
# Expected: Created investor with ID

# List investors
curl http://localhost:3000/api/investors
# Expected: Array of investors

# Get specific investor (use ID from create)
curl http://localhost:3000/api/investors/{id}

# Search investors
curl "http://localhost:3000/api/investors?search=Test"
# Expected: Filtered results
```

### Company CRUD
```bash
# Create company
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Startup Inc",
    "type": "PRIVATE",
    "stage": "SERIES_A",
    "description": "Test startup company",
    "website": "https://teststartup.com",
    "industry": "Technology"
  }'
# Expected: Created company with ID

# List companies
curl http://localhost:3000/api/companies
# Expected: Array of companies

# Enrich public company (e.g., Apple)
curl -X POST "http://localhost:3000/api/companies/enrich?ticker=AAPL"
# Expected: Enriched data from multiple sources
```

### Investment CRUD
```bash
# Create investment (use investor and company IDs from above)
curl -X POST http://localhost:3000/api/investments \
  -H "Content-Type: application/json" \
  -d '{
    "investorId": "{investor-id}",
    "companyId": "{company-id}",
    "stage": "SERIES_A",
    "amount": 5000000,
    "investedAt": "2024-01-15",
    "status": "ACTIVE"
  }'
# Expected: Created investment

# List investments
curl http://localhost:3000/api/investments
# Expected: Array of investments

# Get investment statistics
curl http://localhost:3000/api/investments/statistics
# Expected: Stats by stage, status, etc.
```

## Phase 4: Search & Connections Tests

### Unified Search
```bash
# Search across investors and companies
curl "http://localhost:3000/api/search?q=test"
# Expected: Mixed results from both entities

# Search investors only
curl "http://localhost:3000/api/search/investors?q=venture"
# Expected: Only investor results

# Search companies only
curl "http://localhost:3000/api/search/companies?q=startup"
# Expected: Only company results
```

### Connection Discovery
```bash
# Discover investor connections
curl -X POST http://localhost:3000/api/connections/discover
# Expected: Number of connections created

# Get investor network
curl "http://localhost:3000/api/connections/investor/{investor-id}"
# Expected: Co-investors and shared companies

# Get potential co-investors
curl "http://localhost:3000/api/connections/investor/{investor-id}/potential"
# Expected: Suggested co-investors
```

## Phase 5: Frontend Tests

### Open in Browser
1. Navigate to http://localhost:5173
2. You should see the homepage

### Homepage Test
- [ ] Page loads without errors
- [ ] Navbar displays with logo and navigation links
- [ ] Hero section with search bar
- [ ] Features section displays
- [ ] Footer displays

### Search Test
1. Click "Search" in navbar or use search bar
2. Type "apple" in search box
3. Check:
   - [ ] Results appear in real-time
   - [ ] Type badges show (INVESTOR/COMPANY)
   - [ ] Click on result navigates to detail page

### Investor Detail Page Test
1. Navigate to an investor from search results
2. Check:
   - [ ] Profile information displays
   - [ ] Portfolio statistics cards show (if data exists)
   - [ ] Portfolio companies list displays
   - [ ] Navigation works

### Error Handling Test
1. Navigate to invalid URL: http://localhost:5173/investors/nonexistent
2. Check:
   - [ ] Error message displays
   - [ ] App doesn't crash
   - [ ] Can navigate back

### Loading States Test
1. Refresh a detail page
2. Check:
   - [ ] Loading skeleton appears
   - [ ] Transitions smoothly to content

## Phase 6: Visualizations Tests

### Network Visualization
1. Navigate to http://localhost:5173/network
2. Check:
   - [ ] Page loads
   - [ ] Investor dropdown populated
   - [ ] Select an investor
   - [ ] Network graph renders
   - [ ] Can drag nodes
   - [ ] Statistics cards display
   - [ ] Co-investors list shows

### Charts (if data exists)
1. Navigate to a public company detail page
2. Check:
   - [ ] Market data chart displays
   - [ ] Hover shows tooltips
   - [ ] Chart is responsive

## Phase 7: Production Build Tests

### Build Frontend
```bash
cd apps/frontend
pnpm build

# Check build output
ls -lh dist/
ls -lh dist/assets/

# Expected: Multiple chunk files (react-vendor, chart-vendor, etc.)
```

### Build Backend
```bash
cd apps/backend
pnpm build

# Check build output
ls -lh dist/

# Expected: Compiled JavaScript files
```

### Test Production Docker
```bash
# From project root
cp .env.production.example .env.production

# Edit .env.production with real values
nano .env.production

# Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check containers
docker-compose -f docker-compose.prod.yml ps

# Test health
curl http://localhost:3000/api/health
curl http://localhost/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Common Issues & Solutions

### "Port already in use"
```bash
# Find process using port
lsof -i :3000
lsof -i :5173

# Kill process
kill -9 <PID>
```

### "Database connection failed"
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify DATABASE_URL in .env
```

### "Redis connection failed"
```bash
# Restart Redis
docker-compose restart redis

# Check Redis is running
docker-compose exec redis redis-cli ping
# Expected: PONG
```

### "Prisma Client not generated"
```bash
cd apps/backend
pnpm exec prisma generate
```

### "Dependencies not installed"
```bash
# Root
pnpm install

# Backend only
cd apps/backend && pnpm install

# Frontend only
cd apps/frontend && pnpm install
```

## Test Checklist

### Backend
- [ ] Docker containers start successfully
- [ ] Database migrations run
- [ ] Backend starts on port 3000
- [ ] Swagger docs accessible at /api/docs
- [ ] Health endpoint returns OK
- [ ] Can create investor via API
- [ ] Can create company via API
- [ ] Can create investment via API
- [ ] Search returns results
- [ ] API integrations work (at least 1)

### Frontend
- [ ] Frontend starts on port 5173
- [ ] Homepage renders
- [ ] Navigation works
- [ ] Search functionality works
- [ ] Can view investor detail page
- [ ] Can view company detail page
- [ ] Network visualization renders
- [ ] Error boundary catches errors
- [ ] Loading skeletons display

### Production
- [ ] Frontend builds successfully
- [ ] Backend builds successfully
- [ ] Docker production images build
- [ ] Production containers start
- [ ] Health checks pass
- [ ] Can access app via Nginx

## Performance Tests

### API Response Times
```bash
# Test response time
time curl http://localhost:3000/api/health

# Load test (requires Apache Bench)
ab -n 100 -c 10 http://localhost:3000/api/health
```

### Frontend Bundle Size
```bash
cd apps/frontend
pnpm build
du -sh dist/
du -sh dist/assets/*.js

# Expected: Main bundle < 300KB, vendors split properly
```

### Cache Performance
```bash
# First request (miss)
time curl http://localhost:3000/api/companies

# Second request (hit)
time curl http://localhost:3000/api/companies

# Should be faster on second request
```

## Success Criteria

✅ All 7 phases working
✅ Can create and retrieve data via API
✅ Frontend loads and navigates properly
✅ Visualizations render correctly
✅ Error handling works
✅ Production build succeeds
✅ Docker deployment works

