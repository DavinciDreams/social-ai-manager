# 🚀 AI-Powered Social Media Manager

A comprehensive, AI-driven social media management platform built with Next.js 15, TypeScript, and modern web technologies. Manage multiple social media accounts, generate AI-powered content, schedule posts, and analyze performance—all from one unified dashboard.

![Social Media Manager](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

## ✨ Features

### 🤖 AI-Powered Content Generation
- **Smart Content Creation**: Generate engaging posts using OpenAI GPT models
- **Platform Optimization**: Content tailored for each social media platform
- **Sentiment Analysis**: Automated content sentiment analysis and optimization
- **Hashtag Suggestions**: AI-powered hashtag recommendations

### 📱 Multi-Platform Management
- **Unified Dashboard**: Manage all your social media accounts from one place
- **Supported Platforms**: Twitter/X, Facebook, Instagram, LinkedIn, YouTube
- **OAuth Integration**: Secure authentication with social media platforms
- **Cross-posting**: Publish to multiple platforms simultaneously

### 📅 Advanced Scheduling
- **Smart Scheduling**: AI-suggested optimal posting times
- **Bulk Operations**: Schedule multiple posts across platforms
- **Content Calendar**: Visual calendar for content planning
- **Time Zone Support**: Global scheduling with timezone awareness

### 📊 Analytics & Insights
- **Performance Tracking**: Detailed analytics for all your posts
- **Engagement Metrics**: Track likes, shares, comments, and reach
- **A/B Testing**: Compare post performance with built-in A/B testing
- **Custom Reports**: Generate detailed performance reports

### 👥 Team Collaboration
- **Multi-user Support**: Team-based content management
- **Role-based Access**: Granular permissions for team members
- **Approval Workflows**: Content review and approval processes
- **Activity Logs**: Track team activities and changes

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching

### Backend
- **Next.js API Routes** with Node.js
- **PostgreSQL** database
- **Prisma ORM** for database management
- **Redis** for caching and sessions
- **NextAuth.js** for authentication

### AI & Integrations
- **OpenAI GPT** for content generation
- **Hugging Face** transformers for sentiment analysis
- **Social Media APIs** (Twitter, Facebook, LinkedIn, etc.)
- **AWS S3** for media storage

### DevOps
- **Docker** containerization
- **Docker Compose** for development
- **Prisma migrations** for database versioning
- **Health checks** and monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Docker (optional but recommended)
- Social media platform API keys

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd social-ai-manager
   ```

2. **Setup environment variables**:
   ```bash
   cp .env.docker .env
   # Edit .env with your API keys and database credentials
   ```

3. **Start with Docker**:
   ```bash
   # Development (with hot reload)
   npm run docker:dev
   
   # Production
   npm run docker:prod
   ```

4. **Run database migrations**:
   ```bash
   npm run docker:migrate
   ```

5. **Access the application**:
   - Application: http://localhost:3000
   - Prisma Studio: http://localhost:5555
   - Health Check: http://localhost:3000/api/health

### Option 2: Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd social-ai-manager
   npm install
   ```

2. **Setup PostgreSQL database**:
   ```bash
   # Create database
   createdb social_ai_manager
   
   # Setup environment variables
   cp .env.example .env
   # Edit DATABASE_URL and other variables
   ```

3. **Initialize database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 📋 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/social_ai_manager?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# AI Services
OPENAI_API_KEY="your-openai-api-key"

# Social Media APIs
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
```

### Optional Variables

```env
# Redis (for production)
REDIS_URL="redis://localhost:6379"

# File Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="your-s3-bucket"
AWS_REGION="us-east-1"

# Application Settings
NODE_ENV="development"
PORT=3000
```

## 📖 API Documentation

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/posts` | GET, POST | Manage social media posts |
| `/api/posts/[id]` | GET, PUT, DELETE | Individual post operations |
| `/api/posts/schedule` | POST | Schedule posts |
| `/api/ai/generate-content` | POST | Generate AI content |
| `/api/analytics` | GET | Fetch analytics data |
| `/api/social-accounts` | GET, POST | Manage connected accounts |
| `/api/ab-tests` | GET, POST | A/B testing functionality |
| `/api/health` | GET | Health check endpoint |

### Authentication

The application uses NextAuth.js with support for:
- OAuth with social media platforms
- JWT tokens for API authentication
- Role-based access control

## 🐳 Docker Commands

```bash
# Development
npm run docker:dev          # Start development environment
npm run docker:stop-dev     # Stop development environment
npm run docker:logs-dev     # View development logs

# Production
npm run docker:prod         # Start production environment
npm run docker:stop         # Stop production environment
npm run docker:logs         # View production logs

# Database
npm run docker:migrate      # Run database migrations
npm run docker:studio       # Open Prisma Studio

# Maintenance
npm run docker:clean        # Clean Docker resources
npm run docker:build        # Build Docker image
```

## 🗄️ Database Schema

The application uses Prisma ORM with the following main models:

- **User**: User accounts and authentication
- **SocialAccount**: Connected social media accounts
- **Post**: Social media posts and content
- **ContentLibrary**: Reusable content templates
- **ABTest**: A/B testing experiments
- **Analytics**: Performance metrics and insights
- **Team**: Team collaboration features

## 🔧 Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── auth/              # Authentication pages
├── components/            # React components
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── prisma/                # Database schema and migrations
```

### Available Scripts

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build production version
npm run start              # Start production server
npm run lint               # Run ESLint

# Database
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema to database
npm run db:migrate         # Run migrations

# Testing
npm run test               # Run tests
npm run test:watch         # Run tests in watch mode
```

## 🚀 Deployment

### Production Deployment with Docker

1. **Prepare production environment**:
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export NEXTAUTH_URL=https://your-domain.com
   ```

2. **Deploy with Docker Compose**:
   ```bash
   docker-compose up --build -d
   docker-compose exec app npx prisma migrate deploy
   ```

3. **Set up reverse proxy** (nginx, Traefik, etc.)
4. **Configure SSL certificates**
5. **Set up monitoring and logging**

### Vercel Deployment

1. **Connect to Vercel**:
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Configure environment variables** in Vercel dashboard
3. **Set up database** (use Vercel Postgres or external provider)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [Docker Guide](DOCKER.md) for detailed setup instructions
- **Issues**: Report bugs and request features in the [Issues](https://github.com/your-repo/issues) section
- **Discussions**: Join our [Discussions](https://github.com/your-repo/discussions) for community support

## 🏗️ Roadmap

- [ ] Advanced AI content personalization
- [ ] Video content support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Webhook integrations
- [ ] Custom branding options
- [ ] Enterprise SSO support

---

**Built with ❤️ using Next.js 15, TypeScript, and modern web technologies.**
