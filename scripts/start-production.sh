#!/bin/bash

# Build and start production containers
echo "🚀 Starting Social Media Manager in production mode..."

# Stop existing containers
docker-compose down

# Build and start services
docker-compose up --build -d

echo "✅ Services started!"
echo "📱 Application: http://localhost:3000"
echo "🗄️  Prisma Studio: http://localhost:5555"
echo "📊 Health Check: http://localhost:3000/api/health"

# Show logs
echo "📝 Showing logs (Ctrl+C to exit)..."
docker-compose logs -f
