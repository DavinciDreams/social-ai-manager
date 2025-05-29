@echo off
REM Windows batch script to start development containers

echo 🔧 Starting Social Media Manager in development mode...

REM Stop existing containers
docker-compose -f docker-compose.dev.yml down

REM Build and start development services
docker-compose -f docker-compose.dev.yml up --build -d

echo ✅ Development services started!
echo 📱 Application: http://localhost:3000 (with hot reload)
echo 🗄️  Prisma Studio: http://localhost:5555
echo 📊 Health Check: http://localhost:3000/api/health

REM Show logs
echo 📝 Showing logs (Ctrl+C to exit)...
docker-compose -f docker-compose.dev.yml logs -f
