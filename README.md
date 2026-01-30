# Investor & Company Research Application

A web-based research platform that aggregates data about investors and companies using free APIs and manual data entry. This application provides comprehensive profiles, investment relationships, and market data to support pre-meeting research.

## Features

- **Hybrid Data Collection**: Combines free APIs, web scraping, and manual entry
- **Public Company Data**: Automatically enriched from SEC EDGAR, Yahoo Finance, OpenCorporates, and Wikidata
- **Investor Portfolio Scraping**: Extracts portfolio data from investor websites
- **Investment Tracking**: Records and visualizes investment relationships
- **Network Visualization**: Discovers connections between investors and companies
- **Zero API Costs**: Uses only free data sources

## Technology Stack

### Backend
- NestJS - Enterprise TypeScript framework
- PostgreSQL - Relational database
- Prisma - Type-safe ORM
- Redis - Caching layer
- Bull - Background job processing

### Frontend
- React + TypeScript
- Vite - Fast build tooling
- TanStack Query - Server state management
- Tailwind CSS - Utility-first styling
- React Router - Client-side routing

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd investorTrendSearcher
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

### 4. Setup Database

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

### 5. Start Development Servers

```bash
# From root directory
pnpm dev

# Or individually:
cd apps/backend && pnpm start:dev  # Backend on http://localhost:3000
cd apps/frontend && pnpm dev       # Frontend on http://localhost:5173
```

## Development Commands

```bash
# Development
pnpm dev                    # Run all services
pnpm build                  # Build all packages
pnpm test                   # Run all tests
pnpm lint                   # Lint all packages

# Database
cd apps/backend
npx prisma studio           # Open Prisma Studio
npx prisma migrate dev      # Create new migration
npx prisma db seed          # Seed test data

# Docker
docker-compose up -d        # Start infrastructure
docker-compose down         # Stop infrastructure
docker-compose logs -f      # View logs
```

## Project Structure

```
investorTrendSearcher/
├── apps/
│   ├── backend/           # NestJS API
│   └── frontend/          # React application
├── packages/
│   └── shared-types/      # Shared TypeScript types
├── docker-compose.yml
├── .env.example
└── README.md
```

## Free API Sources

- **SEC EDGAR**: Financial filings, insider trading
- **Yahoo Finance**: Stock prices, market data
- **OpenCorporates**: Company registry data
- **Wikidata**: Company background information
- **NewsAPI**: Recent news and funding announcements
- **Web Scraping**: Investor portfolio data from public websites

## License

MIT
