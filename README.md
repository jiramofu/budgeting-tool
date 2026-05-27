# Budgeting Tool

A modern personal finance budgeting application combining the best practices from market-leading solutions like Monarch Money, YNAB, and Quicken Simplifi. Features real-time budget tracking, transaction management, AI-powered categorization, and advanced analytics.

## Features

### Core Features
- **User Authentication** - Secure signup, login, and session management
- **Budget Management** - Create and manage budgets with flexible categorization
- **Transaction Tracking** - Add, categorize, and manage transactions
- **Real-time Dashboard** - High-level overview of budget health and spending
- **Analytics & Reports** - Spending trends, category breakdowns, and insights
- **CSV Import** - Import transactions from bank exports
- **Pull-to-Refresh** - Keep data synchronized with pull-to-refresh on all screens

### Advanced Features
- **AI-Powered Categorization** - Automatic category suggestions based on transaction descriptions
- **Financial Wellness Metrics** - Net worth tracking, debt payoff projections, savings rate analysis
- **Spending Anomaly Detection** - Identify unusual spending patterns
- **Bill Tracking** - Track upcoming bills and recurring payments
- **Investment Portfolio** - Track stocks, bonds, crypto, and other investments
- **Budget Rules & Alerts** - Set custom alerts when budgets are exceeded
- **Multi-Device Sync** - Seamless experience across web and mobile

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend (Web)** | React 18, TypeScript, Tailwind CSS | Latest |
| **Frontend (Mobile)** | React Native, TypeScript | 0.72+ |
| **Backend** | Node.js, Express, TypeScript | 18+ LTS |
| **Database** | PostgreSQL | 13+ |
| **Authentication** | JWT + bcrypt | - |
| **Charts** | Recharts (web), react-native-svg-charts (mobile) | Latest |
| **API Client** | Axios | Latest |
| **Testing** | Jest, Vitest | Latest |
| **Containerization** | Docker | Latest |

## Quick Start

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 13+
- npm or yarn
- Docker (optional, for containerized setup)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budgeting-tool
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   
   # Mobile
   cd ../mobile && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in backend directory
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your configuration
   ```

4. **Start the database** (if not using Docker)
   ```bash
   # Create PostgreSQL database
   psql -U postgres -c "CREATE DATABASE budgeting_tool"
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Backend (runs on http://localhost:3000)
   cd backend && npm run dev
   
   # Terminal 2: Frontend (runs on http://localhost:5173)
   cd frontend && npm run dev
   
   # Terminal 3: Mobile (if using Expo)
   cd mobile && npm run start
   ```

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/budgeting_tool
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budgeting_tool
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRY=7d
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-session-secret
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Budgeting Tool
```

### Mobile (.env)

```env
API_URL=http://localhost:3000
APP_ENV=development
```

## API Endpoints

### Authentication
- POST /auth/signup
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh-token
- GET /auth/profile

### Budgets
- GET /budgets/:year/:month
- POST /budgets
- PUT /budgets/:id
- DELETE /budgets/:id

### Transactions
- GET /transactions
- POST /transactions
- PUT /transactions/:id
- DELETE /transactions/:id
- POST /transactions/import

### Analytics
- GET /analytics
- GET /analytics/trends
- GET /analytics/spending-by-category

### Settings
- GET /settings
- PUT /settings

## Database Schema

The database automatically initializes on server startup. Key tables:

- **users** - User accounts and authentication
- **budgets** - Monthly budgets with targets
- **categories** - Expense categories
- **transactions** - Income and expense transactions
- **user_settings** - User preferences
- **investments** - Portfolio tracking
- **subscriptions** - Recurring payments
- **budget_rules** - Custom alerts
- **financial_snapshots** - Net worth history

## Development Guide

### Running Tests

```bash
cd backend && npm run test
cd frontend && npm run test
```

### Building for Production

```bash
cd backend && npm run build
cd frontend && npm run build
cd mobile && npm run build:ios
```

### Code Formatting

```bash
npm run format
npm run lint
npm run lint:fix
```

## Deployment

### Using Docker Compose

```bash
docker-compose up --build
```

Access at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

### Production Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set secure JWT secret
- [ ] Configure database backups
- [ ] Set up error tracking (Sentry)
- [ ] Enable logging and monitoring
- [ ] Configure CORS for production domains
- [ ] Enable rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Configure database pooling
- [ ] Enable query caching

## Performance Optimization

### Backend
- Database connection pooling
- Query optimization with indexes
- API response caching
- Compression middleware (gzip)
- Request rate limiting

### Frontend
- Code splitting and lazy loading
- Image optimization
- CSS minification
- Service worker for offline support

### Mobile
- Image caching with AsyncStorage
- Lazy loading screens
- Optimized re-renders
- Network request debouncing

## Troubleshooting

**Database connection failed**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env

**Port already in use**
- Kill the process: `lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9`

**CORS errors**
- Update FRONTEND_URL in backend .env

**Mobile can't connect to backend**
- Check API_URL in mobile .env
- Use ngrok for local device testing

## Security

- Passwords hashed with bcrypt (10+ rounds)
- JWT tokens with short expiry
- HTTPS enforced in production
- Parameterized SQL queries
- CORS configured for specific origins
- Rate limiting on auth endpoints
- 2FA support

## License

MIT License - see LICENSE file for details.

## Roadmap

- ✅ Core budgeting (Phases 1-3)
- ✅ Web frontend (Phases 4-7)
- ✅ Mobile app (Phase 8)
- 🔄 Plaid integration
- 🔄 Bill tracking
- 🔄 Household sharing

---

**Version**: 1.0.0
**Last Updated**: May 27, 2026
