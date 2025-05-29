#!/bin/bash

# Database migration script for Docker environment
echo "🗄️  Running database migrations..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose exec postgres pg_isready -U postgres -d social_ai_manager; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "✅ Database is ready!"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
echo "📦 Generating Prisma client..."
docker-compose exec app npx prisma generate

# Seed database (if seed script exists)
if docker-compose exec app test -f prisma/seed.ts; then
  echo "🌱 Seeding database..."
  docker-compose exec app npx prisma db seed
fi

echo "✅ Database setup complete!"
