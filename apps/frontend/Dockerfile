# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy workspace packages
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
RUN cd apps/frontend && pnpm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS production

# Copy built files from builder
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
