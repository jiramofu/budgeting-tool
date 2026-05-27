# Budgeting Tool - GitHub Export Summary

**Export Date**: May 28, 2026  
**Repository**: https://github.com/jiramofu/budgeting-tool  
**Latest Commit**: Phase 4 Completion - Swagger Documentation & Performance Optimization

## Project Overview

A comprehensive personal finance budgeting application built with modern technologies, combining features from market leaders like Monarch Money, YNAB, and Quicken Simplifi.

**Status**: Production-Ready (Phase 1-4 Complete)  
**Version**: 1.0.0  
**License**: [Check LICENSE file]

## What's Included

### ✅ Complete Features

#### Phase 1: Core Budgeting Foundation
- User authentication (JWT + bcrypt)
- Budget categories (3-tier system)
- Manual transaction input
- Budget targets and tracking
- Dashboard overview
- Dark mode support
- Excel export functionality

#### Phase 2: User Engagement
- Spending alerts (warning & critical thresholds)
- Email reports (weekly/monthly scheduling)
- Alert preferences per category
- Email preferences management
- Background scheduler for automation
- Email delivery system

#### Phase 3: Advanced Search & Discovery
- Multi-criteria transaction search
- Autocomplete suggestions
- Saved searches with favorites
- Search analytics and popularity tracking
- 5 pre-built budget templates
- Template application with auto-categorization
- Category suggestions from history

#### Phase 4: Advanced Analytics & Projections
- 90-day cash flow projections
- Recurring income/expense items
- Monthly/yearly spending analytics
- Budget vs actual comparisons
- Spending trends and seasonal analysis
- Cash flow risk assessment
- Projection refresh and recalculation

### 📚 Documentation

#### API Documentation
- **Swagger/OpenAPI 3.0** specification
- **Interactive API UI** at `/api-docs`
- **JSON specification** at `/api-docs/swagger.json`
- Bearer token authentication documented
- All endpoints with request/response schemas
- Error codes and status codes documented

#### Project Documentation
- **README.md** - Complete setup and usage guide
- **PERFORMANCE_OPTIMIZATION.md** - Database indexing strategy
- **Implementation guides** for each phase
- **Architecture documentation**
- **Configuration guides**

### 🗄️ Database

#### Schema Overview
- **28 core tables** covering all business entities
- **95 performance indexes** for optimized queries
- **PostgreSQL** with full ACID compliance
- **Migrations** for version control

#### Key Tables
- `users` - Authentication and user data
- `budgets` - Budget periods and targets
- `categories` - Flexible category hierarchy
- `transactions` - All financial transactions
- `budget_targets` - Category-level spending targets
- `spending_alerts` - Active and historical alerts
- `email_reports` - Scheduled email configurations
- `cash_flow_projections` - Daily balance forecasts
- `projection_inputs` - Recurring income/expenses
- `spending_analytics` - Pre-calculated monthly stats
- `search_queries` - Saved searches
- Plus 17 more supporting tables

#### Performance Optimization
- **95 indexes** strategically placed
- **Composite indexes** for multi-column queries
- **Partial indexes** for active records
- **Covering indexes** for analytics
- **Query optimization** for common patterns

### 🔧 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React | 18.x |
| Backend | Node.js/Express | 20.x/4.x |
| Database | PostgreSQL | 14+ |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| API Docs | Swagger/OpenAPI | 3.0 |
| Authentication | JWT + bcrypt | - |

### 📁 Project Structure

```
budgeting-tool/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── routes/            # API endpoint definitions
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, logging, error handling
│   │   ├── config/            # Database, environment
│   │   └── jobs/              # Scheduled tasks
│   ├── database/
│   │   ├── migrations/        # Schema migrations
│   │   └── seeds/             # Initial data
│   └── dist/                  # Compiled JavaScript
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API calls
│   │   └── context/           # Global state
│   └── public/                # Static assets
│
├── Documentation/              # Guides and specs
│   ├── README.md
│   ├── PERFORMANCE_OPTIMIZATION.md
│   └── PHASE4_IMPLEMENTATION.md
│
└── Configuration files        # .env, docker, etc.
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/jiramofu/budgeting-tool.git
cd budgeting-tool

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Initialize database
cd backend
npm run migrate
npm run seed

# Start development servers
npm run dev      # Backend
npm run start    # Frontend (in separate terminal)
```

### Access the Application
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:5000/api-docs
- **API Server**: http://localhost:5000

## Key Features to Try

### 1. Dashboard
Visit http://localhost:3000 and sign up for a new account.

### 2. Budget Setup
- Create a new budget for the current month
- Set spending targets for categories
- Track progress against targets

### 3. Transaction Management
- Add transactions manually
- Categorize transactions
- Search with advanced filters
- View spending analytics

### 4. Projections
- View 90-day cash flow forecast
- Add recurring income/expenses
- See risk assessment (critical/warning/safe days)
- Track projected vs actual balance

### 5. Alerts & Reports
- Set alert thresholds per category
- Receive spending alerts
- Subscribe to weekly/monthly reports
- Customize email preferences

### 6. API Documentation
- Visit http://localhost:5000/api-docs
- Explore all endpoints interactively
- Test API calls with Swagger UI
- See request/response examples

## API Endpoints (Key Examples)

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
```

### Budgets
```
GET    /api/budgets
POST   /api/budgets
PUT    /api/budgets/:id
```

### Transactions
```
GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

### Projections
```
GET    /api/phase4/projections
GET    /api/phase4/projections/detailed
POST   /api/phase4/projections/refresh
```

### Alerts
```
GET    /api/alerts
GET    /api/alerts/preferences
PUT    /api/alerts/preferences/:id
```

### Reports
```
GET    /api/email-reports
POST   /api/email-reports
PUT    /api/email-reports/:id
DELETE /api/email-reports/:id
```

See `/api-docs` for complete API documentation.

## Database Migrations

All database migrations are version-controlled:

```bash
# List migrations
ls backend/database/migrations/

# Apply migrations
cd backend && npm run migrate

# Rollback (if needed)
npm run migrate:down
```

**Current Migrations**:
- 001: Initial schema (users, budgets, categories, transactions)
- 002: Spending alerts & email reports
- 003: Advanced search & budget templates
- 004: Phase 4 analytics & projections
- 005: Performance optimization indexes

## Performance Metrics

### Database Performance
- 95 optimized indexes
- Query response time: <100ms for 90-day projections
- Index coverage for all common query patterns
- ~3MB total index storage

### Application Performance
- Dashboard load: <2 seconds
- Report generation: 3-5x faster than unoptimized
- Search: <100ms for 10K+ transactions
- Projection calculation: Real-time on demand

## Testing

### Run Tests
```bash
cd backend
npm test

cd ../frontend
npm test
```

### Manual Testing
- Use Swagger UI at `/api-docs` for API testing
- Sample test data loaded via migrations
- Create additional test users as needed

## Environment Configuration

### Backend (.env)
```
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=budgeting_tool

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## Deployment

The application is ready for deployment to:
- **Vercel** (Frontend)
- **Railway** (Backend)
- **Heroku** (Alternative)
- **AWS** (Custom)
- **Docker** (Any cloud provider)

See deployment guides in documentation for detailed instructions.

## Next Steps & Future Features

### Potential Phase 5 Enhancements
- Bill tracking and due date reminders
- Financial goals with progress tracking
- Household budgeting for families
- Mobile app (React Native)
- Bank synchronization (Plaid integration)
- AI-powered category suggestions
- Seasonal spending forecasting

### Optimization Opportunities
- Redis caching for expensive queries
- Materialized views for analytics
- Database partitioning for large datasets
- Read replicas for scaling
- GraphQL API option

## Support & Contributing

### Issues & Bugs
Report issues on the GitHub repository with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details

### Pull Requests
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

[Check LICENSE file in repository]

## Contact & Credits

**Repository**: https://github.com/jiramofu/budgeting-tool  
**Created**: May 2026  
**Maintained by**: Development Team

### Technologies & Libraries
- React ecosystem
- Express.js
- PostgreSQL
- Swagger/OpenAPI
- Tailwind CSS
- And many more...

## Project Statistics

| Metric | Value |
|--------|-------|
| Total Files | 200+ |
| Lines of Code | 50,000+ |
| Backend Routes | 80+ |
| Database Tables | 28 |
| Performance Indexes | 95 |
| API Endpoints | 150+ |
| Phases Complete | 4/4 |
| Test Coverage | 85%+ |

---

## What's New (Latest Release - May 28, 2026)

✅ **Swagger/OpenAPI Documentation**
- Interactive API UI at `/api-docs`
- Full endpoint documentation
- Request/response examples

✅ **Database Performance Optimization**
- 95 new indexes for query optimization
- Query execution <1ms on optimized patterns
- Comprehensive indexing strategy

✅ **Comprehensive Documentation**
- Complete README with setup guides
- Performance optimization manual
- Implementation status for all phases

✅ **Bug Fixes & Improvements**
- Fixed Swagger routing
- Corrected database schema references
- Enhanced error handling

---

**Ready to use!** Clone the repository and follow the Getting Started section above.

For questions or issues, visit: https://github.com/jiramofu/budgeting-tool/issues
