# Changelog

All notable changes to the Budgeting Tool project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-27

### Added

#### Backend Services
- User authentication with JWT and bcrypt
- Budget management API with monthly targets
- Transaction management with CSV import
- Auto-categorization with ML-powered suggestions
- Financial wellness metrics (net worth, debt payoff, savings rate)
- Spending anomaly detection
- Cash flow projection engine
- Bill tracking and recurring transactions
- Investment portfolio tracking
- Budget rules and custom alerts
- User settings and preferences
- Database auto-initialization on startup

#### Frontend Web App
- Authentication pages (login/signup)
- Dashboard with budget health overview
- Budget management interface
- Transaction list with filtering
- Analytics and spending reports
- Settings page with user preferences
- CSV transaction import
- Responsive design with Tailwind CSS

#### Mobile App (React Native)
- iOS and Android support
- User authentication
- Dashboard screen
- Budgets screen with category breakdown
- Transactions list with search
- Analytics screen with spending trends
- Settings screen with preferences
- Pull-to-refresh on all screens
- AsyncStorage for offline persistence

#### Database
- PostgreSQL schema with 10+ tables
- User management
- Budget and category organization
- Transaction history
- Investment tracking
- Subscription management
- Financial snapshots for net worth history
- Automatic schema initialization

#### DevOps & Deployment
- Docker containers for backend and frontend
- Docker Compose for local development
- Environment variable configuration
- Production-ready Dockerfiles with security best practices
- Comprehensive deployment guide
- Support for Vercel, Railway, AWS, DigitalOcean
- Database backup strategies
- Monitoring and logging setup

#### Documentation
- Comprehensive README.md
- Detailed API documentation
- Deployment guide with multiple platforms
- Contributing guidelines
- Development setup instructions
- Troubleshooting guide

### Technical Stack

- **Backend**: Node.js 18+ with Express and TypeScript
- **Frontend**: React 18 with TypeScript and Tailwind CSS
- **Mobile**: React Native 0.72+ with React Navigation
- **Database**: PostgreSQL 13+
- **Authentication**: JWT with bcrypt
- **Charts**: Recharts (web) and react-native-svg-charts (mobile)
- **API Client**: Axios with interceptors
- **Testing**: Jest and Vitest
- **Containerization**: Docker and Docker Compose

### Performance

- Database query optimization with indexes
- Connection pooling support
- Request rate limiting
- Compression middleware
- Response caching
- Image optimization on web

### Security

- Secure password hashing with bcrypt (10+ rounds)
- JWT authentication with short expiry
- SQL injection prevention with parameterized queries
- CORS configuration for specific origins
- Rate limiting on authentication endpoints
- HTTPS support for production
- 2FA support for account security
- Secure session management

### Known Issues

None reported in initial release.

### Future Plans

- **Phase 11**: Plaid bank integration for automatic transaction sync
- **Phase 12**: Household budgeting with multi-user support
- **Phase 13**: Mobile app camera integration for receipt scanning
- **Phase 14**: Browser extension for transaction capture
- **Phase 15**: Advanced AI features (spending predictions, financial advice)

---

## Release Process

### Version Format

Uses [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Updating Changelog

When making a release:

1. Update version in `package.json` files
2. Add release date to this file
3. Document all changes under version heading
4. Create git tag: `git tag v1.0.0`
5. Push tag to repository

### Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes and improvements

---

## Installation

### From Release

```bash
# Download release from GitHub
# Extract archive
# Follow setup instructions in README.md
```

### From Source

```bash
git clone https://github.com/budgeting-tool/repo.git
cd budgeting-tool
git checkout v1.0.0
# Follow development setup in README.md
```

---

**Current Version**: 1.0.0
**Release Date**: May 27, 2026
