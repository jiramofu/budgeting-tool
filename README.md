# Budgeting Tool - Advanced Personal Finance Platform

A modern, full-featured personal finance budgeting application combining the best practices from leading solutions like Monarch Money, YNAB, and Quicken Simplifi. Built with React, TypeScript, Node.js, and PostgreSQL.

## 🎯 Features

### Core Budgeting
- **Flexible Budget Categories** - Three-tier categorization system (fixed, recurring, flexible expenses)
- **Budget Targets & Tracking** - Set spending limits and track actual vs. budgeted spending
- **Transaction Management** - Add, edit, categorize, and filter transactions
- **Multi-view Dashboard** - High-level overview with customizable widgets

### Advanced Analytics (Phase 4)
- **90-Day Cash Flow Projection** - Forecast cash position with daily granularity
- **Risk Assessment** - Automatic categorization of days as critical, warning, or safe
- **Spending Analytics** - Monthly breakdowns, trend analysis, and budget compliance rates
- **Seasonal Insights** - Detect spending patterns across seasons and plan accordingly

### Data Import & Integration
- **CSV Import** - Import transactions from bank exports
- **Bank API Integration** - Connect to real bank accounts via Plaid
- **Auto-Categorization** - ML-powered category suggestions based on transaction descriptions
- **Duplicate Detection** - Prevent importing the same transaction twice

### Engagement Features
- **Spending Alerts** - Configurable per-category alerts at warning and critical thresholds
- **Email Reports** - Automated weekly/monthly email summaries with spending insights
- **Search & Discovery** - Advanced transaction search with saved search functionality
- **Budget Templates** - Pre-built category templates for different lifestyle types

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run build
PORT=5000 npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- API: http://localhost:5000/api
- API Docs: http://localhost:5000/api-docs/

## 📚 API Documentation

### Interactive Swagger UI
Navigate to: **http://localhost:5000/api-docs/**

### Key Phase 4 Endpoints

**Projections**:
```
GET    /api/phase4/projections           - 90-day summary
GET    /api/phase4/projections/detailed  - Day-by-day data
POST   /api/phase4/projections/recurring - Add recurring item
POST   /api/phase4/projections/refresh   - Recalculate
```

**Analytics**:
```
GET    /api/phase4/analytics/summary          - Monthly analytics
GET    /api/phase4/analytics/month/:year/:month - Month-specific
GET    /api/phase4/analytics/trends/seasonal - Seasonal patterns
POST   /api/phase4/analytics/refresh         - Refresh data
```

All endpoints require JWT authentication:
```bash
Authorization: Bearer <YOUR_TOKEN>
```

## 🗄️ Database Setup

```bash
# PostgreSQL connection
DATABASE_URL=postgresql://user:password@localhost:5432/budgeting_tool

# Create database
createdb budgeting_tool

# Run migrations
cd backend
npm run migrate
```

## 🔧 Configuration

See `.env.example` for all configuration options:
- Database connection
- JWT secret
- Email service (SMTP)
- Plaid API keys
- CORS settings

## 🧪 Test the API

```bash
# Sign up a user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get projections
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/phase4/projections
```

## 📊 Project Status

**Completed Phases**:
- ✅ Phase 1: Core Budgeting (Dark Mode & Export)
- ✅ Phase 2: Spending Alerts & Email Reports
- ✅ Phase 3: Advanced Search & Budget Templates  
- ✅ Phase 4: Advanced Analytics & 90-Day Projections
- ✅ Phase 5-7, 9-10: Additional Features & Polish

**Current Focus**: Documentation and API exploration

## 🤝 Development

### Environment Variables
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/budgeting_tool
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGIN=http://localhost:3000
```

### Available Scripts

**Backend**:
- `npm run build` - Compile TypeScript
- `npm run dev` - Start with auto-reload
- `npm start` - Start production build
- `npm test` - Run tests
- `npm run migrate` - Run database migrations

**Frontend**:
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 🔐 Security Notes

- JWT tokens expire after 7 days
- Passwords are hashed with bcrypt
- All API endpoints validated and sanitized
- CORS configured for authorized origins only
- Environment variables keep secrets secure

## 📈 Performance Highlights

- 90-day projections calculated on-demand
- Daily background jobs at 2:00 AM for analytics
- 28 database indexes for fast queries
- Frontend bundle optimized with code splitting

## 🚢 Production Deployment

1. Set production environment variables
2. Use a production database (RDS, Supabase, etc.)
3. Enable HTTPS/SSL
4. Configure email service for alerts
5. Set up database backups
6. Enable monitoring and error tracking

## 📞 Support & Issues

For bugs or feature requests, check the existing GitHub issues or create a new one with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/Node version

## 📄 License

MIT - Open source and free for personal or commercial use

---

**Last Updated**: May 28, 2026  
**Current Version**: 1.0.0  
**Status**: Production Ready ✅
