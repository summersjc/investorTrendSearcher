#!/bin/bash

echo "🚀 Starting Investor Research Application..."
echo ""

# Navigate to project directory
cd ~/GitHub/investorTrendSearcher

# Step 1: Start Podman machine
echo "1️⃣  Starting Podman machine..."
podman machine start
sleep 5

# Step 2: Set environment variable
export DOCKER_HOST='unix:///var/folders/_0/ydzmxykj6y33k08bgc4m2mn80000gp/T/podman/podman-machine-default-api.sock'

# Step 3: Start containers
echo "2️⃣  Starting PostgreSQL and Redis containers..."
podman-compose -f docker-compose.yml up -d
sleep 5

# Step 4: Check container status
echo "3️⃣  Checking container status..."
podman-compose ps

# Step 5: Start backend
echo "4️⃣  Starting backend server (this may take 10-15 seconds)..."
pnpm --filter backend start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 15

# Step 6: Start frontend
echo "5️⃣  Starting frontend server..."
pnpm --filter frontend dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 5

# Test if services are running
echo ""
echo "6️⃣  Testing services..."

if curl -s http://localhost:3000/api > /dev/null; then
    echo "   ✅ Backend is running (http://localhost:3000/api)"
else
    echo "   ⚠️  Backend may still be starting... check /tmp/backend.log"
fi

if curl -s -I http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running (http://localhost:5173)"
else
    echo "   ⚠️  Frontend may still be starting... check /tmp/frontend.log"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Application started!"
echo ""
echo "📱 Frontend:     http://localhost:5173"
echo "🔧 Backend API:  http://localhost:3000/api"
echo "📚 Swagger:      http://localhost:3000/api/docs"
echo ""
echo "Process IDs:"
echo "  Backend:  $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
