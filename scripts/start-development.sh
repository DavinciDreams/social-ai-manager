#!/bin/bash

# Build and start development containers with hot reload
echo "🔧 Starting Social Media Manager in development mode..."

# Stop existing containers
docker-compose -f docker-compose.dev.yml down

# Build and start development services
docker-compose -f docker-compose.dev.yml up --build -d

echo "✅ Development services started!"
echo "📱 Application: http://localhost:3000 (with hot reload)"
echo "🗄️  Prisma Studio: http://localhost:5555"
echo "📊 Health Check: http://localhost:3000/api/health"

# Show logs
echo "📝 Showing logs (Ctrl+C to exit)..."
docker-compose -f docker-compose.dev.yml logs -f
