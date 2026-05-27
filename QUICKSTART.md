# Quick Start Guide

Fast reference for common development tasks and commands.

## Setup (First Time)

```bash
# Clone and setup
git clone <repository>
cd budgeting-tool

# Install all dependencies
npm install --workspaces

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp mobile/.env.example mobile/.env

# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE budgeting_tool;"
```

## Running Locally

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
```

### Without Docker

```bash
# Terminal 1: Backend (port 3000)
cd backend
npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev

# Terminal 3: Mobile (if using Expo)
cd mobile
npm start
```

## Common Tasks

### Backend Development

```bash
# Format code
npm run format

# Lint and fix
npm run lint:fix

# Run tests
npm test

# Run with watch
npm run dev

# Build for production
npm run build

# Create database backup
pg_dump $DATABASE_URL > backup.sql
```

### Frontend Development

```bash
# Format code
npm run format

# Lint and fix
npm run lint:fix

# Run tests
npm test

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Database

```bash
# Connect to database
psql $DATABASE_URL

# Useful PostgreSQL commands
\dt              # List tables
\d table_name    # Describe table
SELECT COUNT(*) FROM users;  # Count rows

# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20260527.sql

# Vacuum and analyze
VACUUM ANALYZE;
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat(scope): description"

# Push to your fork
git push origin feature/my-feature

# Create pull request on GitHub
# Wait for review and CI checks

# Once approved, merge
git checkout main
git pull origin main
git merge feature/my-feature
git push origin main
```

## API Testing

### Using curl

```bash
# Create budget
curl -X POST http://localhost:3000/budgets \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"month": 5, "year": 2026, "total_budgeted": 5000}'

# Get transactions
curl http://localhost:3000/transactions \
  -H "Authorization: Bearer $JWT_TOKEN"

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### Using Postman

1. Import collection from `/docs/postman-collection.json`
2. Set environment variables (BASE_URL, JWT_TOKEN)
3. Run requests from collection

## Debugging

### Backend

```bash
# Run with debug logging
DEBUG=budgeting-tool:* npm run dev

# Debug specific service
DEBUG=budgeting-tool:services npm run dev

# Use VS Code debugger
# Add breakpoints and press F5
```

### Frontend

```bash
# Open browser dev tools
F12 or Cmd+Option+I (Mac)

# React Developer Tools
# Chrome/Firefox extension for React debugging

# View network requests
# Network tab in browser dev tools
```

### Mobile

```bash
# View device logs
npm run logs -- --android
npm run logs -- --ios

# Open simulator/emulator
npx react-native run-android
npx react-native run-ios
```

## Deployment

### Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

### Deploy Backend to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway deploy
```

### Deploy with Docker

```bash
# Build images
docker build -t budgeting-backend ./backend
docker build -t budgeting-frontend ./frontend

# Run containers
docker run -p 5000:5000 budgeting-backend
docker run -p 3000:3000 budgeting-frontend
```

## Monitoring

### Check Service Health

```bash
# Backend health check
curl http://localhost:3000/health

# Frontend health check
curl http://localhost:5173

# Database health check
psql $DATABASE_URL -c "SELECT 1"
```

### View Logs

```bash
# Docker logs
docker-compose logs -f [service_name]

# Application logs
tail -f logs/app.log

# Database logs
tail -f /var/log/postgresql/postgresql.log
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Connection Error

```bash
# Check database is running
psql -U postgres -c "SELECT 1"

# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Cannot Connect to API from Mobile

```bash
# Use ngrok for local tunneling
npm install -g ngrok
ngrok http 3000

# Update API_URL in mobile .env
API_URL=https://your-ngrok-url.ngrok.io
```

### Node Modules Issues

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
npm install
```

## Performance Profiling

### Backend

```typescript
// Add to service
console.time('operation-name');
// ... code to profile ...
console.timeEnd('operation-name');
```

### Frontend

```typescript
// React DevTools Profiler
// Open React DevTools → Profiler tab
// Record performance
```

### Database

```sql
-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = 1;

-- Find missing indexes
SELECT * FROM pg_stat_user_tables WHERE n_tup_ins > 0;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes;
```

## Environment Variables

### Required Backend

```
DATABASE_URL
JWT_SECRET
FRONTEND_URL
```

### Required Frontend

```
VITE_API_URL
```

### Required Mobile

```
API_URL
```

## Code Quality

```bash
# Format all code
npm run format

# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Run all tests
npm test

# Test with coverage
npm run test:coverage
```

## Documentation

### Generate API Docs

```bash
# If using Swagger/OpenAPI
npm run docs:generate

# Serve docs locally
npm run docs:serve
```

### Update README

```bash
# Check links
npm run docs:check-links

# Generate table of contents
npm run docs:generate-toc
```

## Release

```bash
# Bump version
npm version patch
npm version minor
npm version major

# Build for release
npm run build

# Create release tag
git tag v1.0.0
git push origin v1.0.0
```

## Getting Help

- Check [README.md](./README.md) for setup
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for design
- Review [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment

---

**Need help?** Open an issue or check the documentation.
