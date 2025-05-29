@echo off
REM Database migration script for Docker environment (Windows)

echo 🗄️  Running database migrations...

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
:waitloop
docker-compose exec postgres pg_isready -U postgres -d social_ai_manager >nul 2>&1
if %errorlevel% neq 0 (
    echo Database is unavailable - sleeping
    timeout /t 1 /nobreak >nul
    goto waitloop
)

echo ✅ Database is ready!

REM Run Prisma migrations
echo 🔄 Running Prisma migrations...
docker-compose exec app npx prisma migrate deploy

REM Generate Prisma client
echo 📦 Generating Prisma client...
docker-compose exec app npx prisma generate

echo ✅ Database setup complete!
