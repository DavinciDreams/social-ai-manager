# 🐳 Docker Setup for Social Media Manager

This directory contains Docker configuration files to run the Social Media Manager application in containerized environments.

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+ 
- Git (for cloning the repository)

## 🚀 Quick Start

### Production Environment

1. **Clone and setup**:
   ```bash
   git clone <your-repo-url>
   cd social-ai-manager
   cp .env.docker .env
   ```

2. **Edit environment variables**:
   ```bash
   # Edit .env file with your actual API keys and secrets
   nano .env
   ```

3. **Start services**:
   ```bash
   # Linux/Mac
   ./scripts/start-production.sh
   
   # Windows
   scripts\start-production.bat
   
   # Or using npm
   npm run docker:prod
   ```

4. **Run database migrations**:
   ```bash
   # Linux/Mac
   ./scripts/migrate-db.sh
   
   # Windows
   scripts\migrate-db.bat
   
   # Or using npm
   npm run docker:migrate
   ```

### Development Environment

1. **Start development services with hot reload**:
   ```bash
   # Linux/Mac
   ./scripts/start-development.sh
   
   # Windows
   scripts\start-development.bat
   
   # Or using npm
   npm run docker:dev
   ```

## 🔧 Services Overview

### Production (`docker-compose.yml`)

| Service | Port | Description |
|---------|------|-------------|
| **app** | 3000 | Next.js application (production build) |
| **postgres** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis cache and session store |
| **prisma-studio** | 5555 | Database management UI (dev profile) |

### Development (`docker-compose.dev.yml`)

| Service | Port | Description |
|---------|------|-------------|
| **app-dev** | 3000 | Next.js application (with hot reload) |
| **postgres** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis cache and session store |
| **prisma-studio** | 5555 | Database management UI |

## 🌐 Access Points

- **Application**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **Health Check**: http://localhost:3000/api/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📝 Available Commands

### NPM Scripts

```bash
# Build and run production containers
npm run docker:prod

# Build and run development containers (with hot reload)
npm run docker:dev

# Stop all containers
npm run docker:stop
npm run docker:stop-dev

# View logs
npm run docker:logs
npm run docker:logs-dev

# Run database migrations
npm run docker:migrate

# Open Prisma Studio
npm run docker:studio

# Clean up Docker resources
npm run docker:clean

# Build Docker image only
npm run docker:build
```

### Direct Docker Commands

```bash
# Production
docker-compose up --build -d          # Start all services
docker-compose down                    # Stop all services
docker-compose logs -f                 # View logs
docker-compose exec app bash          # Access app container

# Development
docker-compose -f docker-compose.dev.yml up --build -d
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f

# Individual services
docker-compose up postgres redis -d    # Start only database services
docker-compose exec postgres psql -U postgres -d social_ai_manager
```

## 🗄️ Database Management

### Initial Setup

```bash
# Push schema to database
docker-compose exec app npx prisma db push

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
docker-compose exec app npx prisma generate

# Seed database (if seed script exists)
docker-compose exec app npx prisma db seed
```

### Backup and Restore

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres social_ai_manager > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres social_ai_manager < backup.sql
```

## 🔒 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@postgres:5432/social_ai_manager?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# AI
OPENAI_API_KEY="your-openai-key-here"

# Social Media APIs
TWITTER_CLIENT_ID="your-twitter-id"
TWITTER_CLIENT_SECRET="your-twitter-secret"
# ... other platform credentials
```

### Development vs Production

- **Development**: Uses volume mounts for hot reload
- **Production**: Uses optimized builds with standalone output

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5432
   
   # Stop conflicting services
   sudo systemctl stop postgresql  # If local PostgreSQL is running
   ```

2. **Database connection issues**:
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready -U postgres
   
   # View database logs
   docker-compose logs postgres
   
   # Reset database
   docker-compose down -v
   docker-compose up postgres -d
   ```

3. **Build issues**:
   ```bash
   # Clean build cache
   docker builder prune
   
   # Rebuild without cache
   docker-compose build --no-cache
   
   # Clean everything
   npm run docker:clean
   ```

4. **Permission issues** (Linux/Mac):
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   
   # Make scripts executable
   chmod +x scripts/*.sh
   ```

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check database connection
docker-compose exec postgres pg_isready -U postgres -d social_ai_manager

# Check Redis connection
docker-compose exec redis redis-cli ping
```

## 📦 Production Deployment

### Environment Preparation

1. **Server requirements**:
   - Docker & Docker Compose
   - 2GB+ RAM
   - 10GB+ storage
   - SSL certificate (for HTTPS)

2. **Environment variables**:
   ```bash
   # Update production URLs
   NEXTAUTH_URL="https://your-domain.com"
   
   # Use strong secrets
   NEXTAUTH_SECRET="$(openssl rand -base64 32)"
   JWT_SECRET="$(openssl rand -base64 32)"
   
   # Configure real database credentials
   DATABASE_URL="postgresql://user:pass@db:5432/dbname"
   ```

3. **Deploy**:
   ```bash
   # Pull latest code
   git pull origin main
   
   # Start services
   docker-compose up --build -d
   
   # Run migrations
   docker-compose exec app npx prisma migrate deploy
   ```

### Monitoring

```bash
# View resource usage
docker stats

# View service status
docker-compose ps

# View logs
docker-compose logs -f --tail=100
```

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# Run any new migrations
docker-compose exec app npx prisma migrate deploy
```

### Backup Strategy

```bash
# Daily database backup
docker-compose exec postgres pg_dump -U postgres social_ai_manager | gzip > "backup-$(date +%Y%m%d).sql.gz"

# Weekly full backup including volumes
docker run --rm -v social-ai-manager_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz /data
```

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `cat .env`
3. Check service health: `curl http://localhost:3000/api/health`
4. Review this documentation
5. Open an issue in the repository

---

Happy containerizing! 🐳✨
