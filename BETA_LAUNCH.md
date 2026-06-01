# Compass Budget Tool - Alpha Beta Launch Guide

**Version:** 1.0.0-alpha  
**Launch Date:** June 1, 2026  
**Status:** Open for Beta Testing  

## What's Ready for Beta?

### Core Features (✓ Ready)
- User Authentication - Signup, login with email/password
- Global State Management - Context API for shared budget state
- Budget Management - Create, edit, and track budgets by category
- Dashboard - Real-time overview of spending vs. budget
- Dark Mode - Full dark/light theme support
- Multi-Currency - Display spending in your local currency
- Email Verification - Verification emails sent after signup

### Coming Soon (Phase Beta)
- Email verification enforcement
- Password reset flow
- Team budgeting & sharing
- Advanced analytics
- Mobile app

## Quick Start for Beta Testers

### Option A: Local Development (Recommended)

#### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm 9+

#### Setup

\`\`\`bash
git clone https://github.com/jiramofu/budgeting-tool.git
cd budgeting-tool

# Backend
cd backend
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev
\`\`\`

Navigate to http://localhost:5173 and sign up!

### Option B: Docker (Production-like)

#### Prerequisites
- Docker & Docker Compose

#### Setup

\`\`\`bash
git clone https://github.com/jiramofu/budgeting-tool.git
cd budgeting-tool
cp .env.example .env
docker-compose up --build
\`\`\`

Frontend: http://localhost:3000
Backend API: http://localhost:3001

## Testing Checklist

### Authentication
- [ ] Sign up with email/password
- [ ] Log in with new account
- [ ] Log out successfully
- [ ] Password validation works
- [ ] Email validation works

### Budget Management
- [ ] Create new budget with categories
- [ ] Edit budget targets
- [ ] Add transactions
- [ ] See budget progress on dashboard
- [ ] Dark mode works

### Data Persistence
- [ ] Refresh page - data still there
- [ ] Navigate between pages - state maintained
- [ ] Income changes appear on Dashboard

### Error Handling
- [ ] Invalid credentials show error
- [ ] Network errors handled gracefully
- [ ] Duplicate email shows error

## Reporting Bugs

Found an issue? Report it on GitHub!

https://github.com/jiramofu/budgeting-tool/issues

Include:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS info
- Screenshots if helpful

## Feedback & Suggestions

- Feature Ideas: GitHub Discussions
- General Feedback: Comment on issues
- Direct: dev@budgetcompass.app

## Security Notes

### Beta Testing
- DO NOT use real financial data
- Use test passwords only
- Keep your token private
- Report security issues privately

## Troubleshooting

### "Cannot connect to database"
Ensure PostgreSQL is running:
\`\`\`bash
psql -U budgetapp -d budgetapp_db
\`\`\`

### "Port 3001 already in use"
Kill existing process:
\`\`\`bash
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
\`\`\`

### "CORS error in browser"
Check backend is running:
\`\`\`bash
curl http://localhost:3001/health
\`\`\`

## Next Steps

1. Set up your environment (Option A or B)
2. Create a test account
3. Follow the Testing Checklist
4. Report any issues on GitHub
5. Share feedback

## Support

- GitHub Issues: https://github.com/jiramofu/budgeting-tool/issues
- Email: dev@budgetcompass.app

---

Thank you for helping test Compass Budget Tool!

Last Updated: June 1, 2026
