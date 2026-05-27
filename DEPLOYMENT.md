# Deployment Guide

Complete guide for deploying the Budgeting Tool application to various cloud platforms and environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Vercel (Frontend)](#vercel-frontend)
4. [Railway (Backend)](#railway-backend)
5. [Database Hosting](#database-hosting)
6. [Production Checklist](#production-checklist)
7. [Monitoring & Logging](#monitoring--logging)
8. [Scaling](#scaling)

## Local Development

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 13+
- npm or yarn
- Git

### Setup Steps

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd budgeting-tool
   ```

2. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../mobile && npm install
   ```

3. **Create environment files**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp mobile/.env.example mobile/.env
   ```

4. **Create PostgreSQL database**
   ```bash
   psql -U postgres -c "CREATE DATABASE budgeting_tool;"
   ```

5. **Run development servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   
   # Terminal 3: Mobile (if using Expo)
   cd mobile && npm run start
   ```

## Docker Deployment

### Prerequisites

- Docker Desktop
- Docker Compose

### Development with Docker

```bash
# Build and run all services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Production Docker Build

1. **Build Docker images**
   ```bash
   docker build -t budgeting-tool-backend:latest ./backend
   docker build -t budgeting-tool-frontend:latest ./frontend
   ```

2. **Tag for registry**
   ```bash
   docker tag budgeting-tool-backend:latest myregistry/budgeting-tool-backend:1.0.0
   docker tag budgeting-tool-frontend:latest myregistry/budgeting-tool-frontend:1.0.0
   ```

3. **Push to registry**
   ```bash
   docker push myregistry/budgeting-tool-backend:1.0.0
   docker push myregistry/budgeting-tool-frontend:1.0.0
   ```

### Running Production Containers

```bash
# Backend
docker run -d \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL=postgresql://user:pass@db.example.com/budgeting \
  -e JWT_SECRET=your-secure-secret \
  -p 5000:5000 \
  --name budgeting-backend \
  myregistry/budgeting-tool-backend:1.0.0

# Frontend
docker run -d \
  -e VITE_API_URL=https://api.example.com \
  -p 3000:3000 \
  --name budgeting-frontend \
  myregistry/budgeting-tool-frontend:1.0.0
```

## Vercel (Frontend)

### Setup

1. **Connect GitHub repository**
   - Go to https://vercel.com/new
   - Select your GitHub repository
   - Choose "Other" as framework (since we use Vite)

2. **Configure build settings**
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Root Directory: `./`

3. **Set environment variables**
   - VITE_API_URL: `https://api.budgeting-tool.com`
   - VITE_APP_NAME: `Budgeting Tool`

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on git push

### Custom Domain

1. Add domain in Vercel dashboard
2. Update DNS records as instructed
3. Enable HTTPS/SSL (automatic)

### Performance Optimization

- Edge caching enabled by default
- Automatic image optimization
- Code splitting with Vite
- API routes for serverless functions (optional)

## Railway (Backend)

### Setup

1. **Connect GitHub repository**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Select your repository

2. **Add PostgreSQL**
   - Click "Add Service"
   - Select "PostgreSQL"
   - Railway will provision database automatically

3. **Configure backend service**
   - Set root directory: `backend`
   - Set start command: `npm run start`
   - Build command: `npm run build`

4. **Set environment variables**
   ```
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-secure-secret
   FRONTEND_URL=https://yourdomain.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Railway will build and deploy automatically

### Database Backups

Railway provides automatic daily backups. Access them in the database service settings.

### Custom Domain

1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

## Database Hosting

### Option 1: Railway (Recommended for Easy Setup)

- Automatic backups
- High availability
- Easy scaling
- Integrated monitoring

### Option 2: AWS RDS

1. Create RDS instance (PostgreSQL 13+)
2. Configure security groups
3. Update DATABASE_URL in backend
4. Run migrations

```bash
# Create initial schema
psql -h rds-endpoint.amazonaws.com -U postgres -d budgeting_tool < backend/database/schema.sql
```

### Option 3: DigitalOcean Managed Database

1. Create managed database cluster
2. Get connection string
3. Configure firewall rules
4. Update environment variables

### Backup Strategy

- **Daily**: Automated backups (7-30 day retention)
- **Weekly**: Export database to S3/cloud storage
- **Monthly**: Long-term archive backup

```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20260527.sql
```

## Production Checklist

### Security

- [ ] Enable HTTPS/SSL for all domains
- [ ] Set strong JWT_SECRET (32+ chars)
- [ ] Enable CORS for specific origins only
- [ ] Configure rate limiting (100 req/15 min)
- [ ] Enable CSRF protection
- [ ] Set secure HTTP headers
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits

### Performance

- [ ] Enable database query caching
- [ ] Configure connection pooling (20+ connections)
- [ ] Enable Redis caching for APIs
- [ ] Set up CDN for static assets
- [ ] Configure database indexes
- [ ] Enable query result caching

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Enable performance monitoring (DataDog)
- [ ] Configure log aggregation (ELK stack)
- [ ] Set up uptime monitoring
- [ ] Configure alert thresholds
- [ ] Create runbooks for common issues

### Operations

- [ ] Document deployment process
- [ ] Set up automated backups
- [ ] Configure database failover
- [ ] Create disaster recovery plan
- [ ] Document scaling procedures
- [ ] Set up incident response process

### Database

- [ ] Regular VACUUM and ANALYZE
- [ ] Monitor disk space usage
- [ ] Set up automated backups
- [ ] Test backup restoration
- [ ] Monitor query performance
- [ ] Archive old data

## Monitoring & Logging

### Application Monitoring

```bash
# Health check endpoint
curl https://api.example.com/health

# Metrics
curl https://api.example.com/metrics
```

### Log Aggregation

Setup ELK Stack or CloudWatch:

```bash
# View backend logs
docker-compose logs -f backend

# Tail logs in production
tail -f /var/log/budgeting-tool/app.log
```

### Error Tracking

Configure Sentry:

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## Scaling

### Horizontal Scaling

1. **Backend API**
   - Deploy multiple instances behind load balancer
   - Use sticky sessions for JWT authentication
   - Configure database connection pooling

2. **Frontend**
   - Already scalable on Vercel (serverless)
   - Use CDN for static assets

3. **Database**
   - Read replicas for analytics queries
   - Connection pooling (PgBouncer)
   - Caching layer (Redis)

### Vertical Scaling

- Increase server CPU/RAM
- Upgrade database instance size
- Increase connection limits

### Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month, year);
CREATE INDEX idx_categories_user ON categories(user_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = 1;
```

### Caching Strategy

- Cache budget calculations (5 min TTL)
- Cache analytics data (1 hour TTL)
- Cache category suggestions (24 hour TTL)
- Use Redis for session storage

```typescript
// Example caching
const cacheKey = `budgets:${userId}:${month}:${year}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const data = await calculateBudgets(userId, month, year);
await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);
return data;
```

## Troubleshooting Deployment

### Backend won't start

1. Check logs: `docker-compose logs backend`
2. Verify DATABASE_URL is correct
3. Ensure database is running
4. Check JWT_SECRET is set

### Frontend can't connect to API

1. Verify VITE_API_URL matches backend URL
2. Check CORS configuration in backend
3. Verify API is running and accessible
4. Check browser console for errors

### Database connection pool exhausted

1. Increase connection limit in connection pooling service
2. Identify long-running queries
3. Add database indexes
4. Monitor connection usage: `SELECT count(*) FROM pg_stat_activity;`

### High latency/slow queries

1. Check database query performance: `EXPLAIN ANALYZE`
2. Add missing indexes
3. Enable query result caching
4. Scale database vertically

---

**Version**: 1.0.0
**Last Updated**: May 27, 2026
