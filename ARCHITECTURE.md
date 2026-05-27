# Architecture Guide

Overview of the Budgeting Tool system architecture, design decisions, and component interactions.

## System Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (React 18)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────────┐
│         Vercel CDN / Frontend            │
│  - Vite bundled React application      │
│  - Static asset serving                 │
│  - Automatic scaling                    │
└────────┬────────────────────────────────┘
         │ API calls
         ▼
┌─────────────────────────────────────────┐
│      Express API Server (Docker)        │
│  - Authentication middleware             │
│  - REST endpoints                       │
│  - Business logic services              │
│  - Database queries                     │
└────────┬────────────────────────────────┘
         │ SQL
         ▼
┌─────────────────────────────────────────┐
│    PostgreSQL Database (Docker)          │
│  - User data                            │
│  - Budgets & transactions               │
│  - Financial snapshots                  │
│  - Audit logs                           │
└─────────────────────────────────────────┘

┌─────────────────┐
│  Mobile Device  │
│ (React Native)  │
└────────┬────────┘
         │ HTTPS
         ▼
   (Same API Server)
```

## Backend Architecture

### Layered Architecture

```
┌─────────────────────────────────┐
│    Routes & Controllers         │
│  (Express request handlers)     │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│      Services Layer             │
│  (Business logic & rules)       │
│  - BudgetService                │
│  - TransactionService           │
│  - FinancialWellnessService    │
│  - NotificationService          │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Data Access Layer             │
│  (Database queries)             │
│  - Direct SQL queries           │
│  - Connection pooling           │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│    PostgreSQL Database          │
└─────────────────────────────────┘
```

### Service Architecture

Key services and their responsibilities:

#### Authentication Service
- User signup/login validation
- JWT token generation
- Password hashing with bcrypt
- Session management

#### Budget Service
- Create/update monthly budgets
- Calculate budget health scores
- Determine budget status (on-track, warning, over-budget)
- Manage budget targets by category

#### Transaction Service
- CRUD operations for transactions
- CSV import and parsing
- Transaction categorization
- Duplicate detection
- Transaction search and filtering

#### Financial Wellness Service
- Calculate net worth
- Track spending trends
- Generate financial snapshots
- Compute debt payoff timelines
- Calculate savings rates

#### Anomaly Detection Service
- Identify unusual spending patterns
- Compare against historical trends
- Generate alerts for suspicious activity
- Machine learning-based detection

#### Projection Service
- Calculate cash flow projections
- Forecast future account balance
- Project budget deficits
- Estimate savings growth

#### Notification Service
- Email notifications
- Push notifications
- Budget alerts
- Transaction confirmations

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider
│   ├── LoginPage
│   ├── SignupPage
│   └── ResetPasswordPage
│
├── DashboardPage
│   ├── BudgetHealthCard
│   ├── SpendingSummary
│   ├── QuickStats
│   └── RecentTransactions
│
├── BudgetPage
│   ├── BudgetForm
│   ├── CategoryList
│   ├── BudgetCard
│   └── TargetSetter
│
├── TransactionPage
│   ├── TransactionList
│   ├── TransactionForm
│   ├── ImportCSV
│   └── CategorySelector
│
├── AnalyticsPage
│   ├── SpendingChart
│   ├── CategoryBreakdown
│   ├── TrendAnalysis
│   └── ProjectionChart
│
└── SettingsPage
    ├── ProfileSettings
    ├── PreferenceSettings
    └── SecuritySettings
```

### State Management

```
Global State (Context API)
├── AuthContext
│   ├── user
│   ├── isAuthenticated
│   ├── login()
│   ├── logout()
│   └── signup()
│
└── AppContext
    ├── currentBudget
    ├── transactions
    ├── categories
    └── notifications
```

### Data Flow

```
User Action
    ▼
Event Handler
    ▼
API Call (Axios)
    ▼
Backend Response
    ▼
State Update
    ▼
Component Re-render
```

## Mobile Architecture

### Screen Navigation

```
AuthStack (When not authenticated)
├── LoginScreen
└── SignupScreen

AppStack (When authenticated)
└── TabNavigator
    ├── DashboardScreen
    ├── BudgetsScreen
    ├── TransactionsScreen
    ├── AnalyticsScreen
    └── SettingsScreen
```

### State Management

```
AuthContext
├── user
├── isAuthenticated
├── login()
├── logout()
└── checkAuth()

Local State (AsyncStorage)
├── JWT token
├── User preferences
└── Last sync timestamp
```

### API Integration

```
Mobile App
    ▼
APIClient (Axios wrapper)
    │
    ├── Token Management (AsyncStorage)
    ├── Interceptors for auth
    └── Auto-retry on 401
    ▼
Backend API
```

## Database Design

### Core Tables

#### users
- Stores user accounts and authentication
- Fields: id, email, password_hash, created_at

#### budgets
- Monthly budgets with targets
- Fields: id, user_id, month, year, total_budgeted

#### categories
- Expense categories
- Fields: id, user_id, name, type, icon, color

#### transactions
- Income/expense records
- Fields: id, user_id, date, amount, description, category_id, source

#### budget_targets
- Spending limits per category
- Fields: id, budget_id, category_id, target_amount

#### user_settings
- User preferences
- Fields: id, user_id, theme, currency, language, notifications

#### investments
- Portfolio tracking
- Fields: id, user_id, type, ticker, shares, purchase_price

#### subscriptions
- Recurring payments
- Fields: id, user_id, name, amount, billing_cycle, next_date

#### budget_rules
- Custom alerts and rules
- Fields: id, budget_id, trigger_type, threshold, action

#### financial_snapshots
- Net worth history
- Fields: id, user_id, date, total_assets, total_liabilities, net_worth

### Key Indexes

```sql
-- User queries
CREATE INDEX idx_users_email ON users(email);

-- Budget queries
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month, year);

-- Transaction queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);

-- Category queries
CREATE INDEX idx_categories_user ON categories(user_id);
```

## API Design

### RESTful Endpoints

#### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Authenticate user
- `POST /auth/logout` - End session
- `POST /auth/refresh-token` - Refresh JWT
- `GET /auth/profile` - Get current user

#### Budgets
- `GET /budgets/:year/:month` - Get monthly budget
- `POST /budgets` - Create budget
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget

#### Transactions
- `GET /transactions` - List transactions
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction
- `POST /transactions/import` - Import CSV
- `POST /transactions/categorize` - Auto-categorize

#### Analytics
- `GET /analytics` - Get analytics summary
- `GET /analytics/trends` - Get spending trends
- `GET /analytics/projections` - Get cash flow

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-05-27T10:30:00Z"
}
```

### Error Handling

```
Status 200: Success
Status 201: Created
Status 400: Bad Request
Status 401: Unauthorized
Status 403: Forbidden
Status 404: Not Found
Status 500: Server Error
```

## Security Architecture

### Authentication Flow

```
User submits credentials
    ▼
Hash password with bcrypt
    ▼
Compare with stored hash
    ▼
Generate JWT token
    ▼
Return token to client
    ▼
Client stores token (localStorage/AsyncStorage)
    ▼
Client includes token in Authorization header
```

### Token Management

- JWT issued with 7-day expiry
- Tokens stored securely on client
- Refresh token mechanism for long sessions
- Automatic token rotation on 401
- Secure token transmission over HTTPS

### Database Security

- Parameterized SQL queries (no string concatenation)
- Database user with minimal required permissions
- Connection pooling with timeout limits
- SSL encryption for connections

## Deployment Architecture

### Local Development

```
Docker Compose
├── PostgreSQL service
├── Backend service
└── Frontend service (development server)
```

### Production

```
Internet Users
    ▼
Vercel CDN (Frontend)
    │
    ├── Static asset caching
    ├── Automatic HTTPS
    └── Geographic distribution
    ▼
Railway/AWS Backend
    │
    ├── Docker container
    ├── Load balancing
    ├── Auto-scaling
    └── Health checks
    ▼
Managed PostgreSQL
    │
    ├── Automatic backups
    ├── High availability
    ├── Read replicas
    └── Encrypted storage
```

## Scalability Considerations

### Horizontal Scaling

1. **Frontend**: Already scalable on Vercel
2. **Backend**: Deploy multiple instances behind load balancer
3. **Database**: Use read replicas for analytics queries

### Vertical Scaling

1. Increase server resources (CPU/RAM)
2. Upgrade database instance size
3. Increase connection pool limits

### Performance Optimization

1. Query result caching (Redis)
2. Database connection pooling
3. API response compression
4. Frontend code splitting
5. Image optimization
6. Lazy loading

## Monitoring and Observability

### Logging

- Application logs: Structured JSON logging
- Database logs: Slow query logs
- Error tracking: Sentry integration
- Audit logs: User action tracking

### Metrics

- API latency (p50, p95, p99)
- Error rates by endpoint
- Database connection pool usage
- Request rate by endpoint
- Cache hit ratio

### Health Checks

```
Backend: /health endpoint
  ├── Database connectivity
  ├── Memory usage
  ├── Response time
  └── Disk space
```

## Technology Decisions

### Why Express?

- Lightweight and flexible
- Large ecosystem of middleware
- TypeScript support
- Familiar to most Node developers

### Why React?

- Component-based architecture
- Large community and ecosystem
- Virtual DOM for performance
- Easy state management with hooks

### Why PostgreSQL?

- ACID compliance for financial data
- Relational data model
- JSON support for flexible schema
- Proven at scale

### Why Docker?

- Consistent development/production environments
- Easy deployment and scaling
- Dependency isolation
- Industry standard

---

**Version**: 1.0.0
**Last Updated**: May 27, 2026
