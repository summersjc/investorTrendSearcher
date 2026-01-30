# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all workspace packages
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd apps/backend && pnpm exec prisma generate

# Build the application
RUN cd apps/backend && pnpm run build

# Stage 2: Production
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run database migrations and start the app
CMD cd apps/backend && pnpm exec prisma migrate deploy && node dist/main.js
