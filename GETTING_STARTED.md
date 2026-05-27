# Getting Started with Budgeting Tool

## Quick Start (5 minutes)

### Step 1: Set Up PostgreSQL

If you don't have PostgreSQL installed:
- **macOS**: `brew install postgresql@15`
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Linux**: `sudo apt-get install postgresql`

Start PostgreSQL:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows - runs as service
```

### Step 2: Initialize Database

```bash
cd backend

# Initialize database
psql -U postgres -f database/init.sql

# Verify database created
psql -U postgres -l | grep budgeting_tool
```

### Step 3: Start Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

The backend will start on `http://localhost:5000`

Test it:
```bash
curl http://localhost:5000/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### Step 4: Start Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

The frontend will open at `http://localhost:3000`

## First Time Usage

1. **Sign Up**: 
   - Click "Sign up" on the login page
   - Enter email and password
   - Click "Sign Up"

2. **Create Categories** (Optional - defaults are provided):
   - Default categories: Groceries, Utilities, Entertainment, etc.
   - Add custom categories in budget management

3. **Add Transactions**:
   - Click "Add Transaction" form
   - Select category
   - Enter amount and date
   - Click "Add Transaction"

4. **View Dashboard**:
   - See budget breakdown by category
   - View recent transactions
   - Track spending vs targets

## Troubleshooting

### PostgreSQL Connection Error
```
Error: could not connect to server
```
**Solution**: Make sure PostgreSQL is running
```bash
# Check status
psql -U postgres -c "SELECT NOW()"

# If not running:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: 
- Change PORT in backend/.env to 5001
- Update frontend/.env VITE_API_URL to http://localhost:5001

### Database Already Exists
```
Error: database "budgeting_tool" already exists
```
**Solution**: Drop the old database
```bash
dropdb -U postgres budgeting_tool
psql -U postgres -f backend/database/init.sql
```

### CORS Error
```
Error: Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Verify CORS_ORIGIN in backend/.env matches frontend URL
```
# backend/.env
CORS_ORIGIN=http://localhost:3000
```

## Development Tips

### Useful Commands

```bash
# Backend
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm test            # Run tests

# Frontend
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Database Commands

```bash
# Connect to database
psql -U postgres budgeting_tool

# Useful queries
SELECT * FROM users;
SELECT * FROM budgets;
SELECT * FROM transactions;

# Reset database (WARNING: deletes all data)
dropdb -U postgres budgeting_tool
psql -U postgres -f backend/database/init.sql
```

### Test Users

Create test users via the signup form, or insert directly:

```bash
psql -U postgres budgeting_tool

INSERT INTO users (email, password_hash) 
VALUES ('test@example.com', '$2a$10$...');
```

## Next Steps

1. **Explore the Dashboard**: Add some test transactions
2. **Create Categories**: Add custom budget categories
3. **Set Budget Targets**: Define spending limits
4. **Review Transactions**: Filter and analyze spending

## Getting Help

- Check [README.md](./README.md) for full documentation
- Review [Implementation Plan](../.claude/plans/joyful-puzzling-pudding.md)
- Check backend server logs if something isn't working

## Phase 2 (CSV Import)

To prepare for Phase 2:

1. Export a sample CSV from your bank
2. Format should be: Date, Description, Amount
3. Keep it for testing when CSV import is added
