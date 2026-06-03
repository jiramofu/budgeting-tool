# Compass - Monitoring Setup Guide

**Status**: ✅ **IMPLEMENTED & READY TO CONFIGURE**

This guide walks you through setting up comprehensive monitoring for Compass using Sentry (error tracking) and Google Analytics (usage analytics).

---

## 📊 What's Been Implemented

### Backend
✅ **Sentry Integration**
- Error capturing for all exceptions
- Performance monitoring
- Request tracing
- Transaction tracking
- Release tracking

✅ **Configuration**
- Environment variable support (SENTRY_DSN)
- Development/Production mode detection
- Automatic error handler middleware

### Frontend
✅ **Sentry Integration**
- Error tracking for React components
- Performance monitoring
- Source maps support
- User session tracking

✅ **Google Analytics**
- Page view tracking
- User interaction analytics
- Event tracking capability
- Conversion tracking

✅ **Configuration**
- Environment variable support (VITE_SENTRY_DSN, VITE_GOOGLE_ANALYTICS_ID)
- Conditional initialization (won't break if not configured)

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Create Sentry Account (Free)

1. Go to https://sentry.io/signup/
2. Create a free account (5,000 events/month free tier)
3. Create a new project:
   - Project name: `compass`
   - Platform: **Node.js** (for backend)
4. You'll get a DSN like: `https://xxxxxxx@oxxxxx.ingest.sentry.io/xxxxx`
5. Save this DSN - you'll need it for both backend and frontend

**Note**: Create TWO projects in Sentry:
- One for backend (platform: Node.js)
- One for frontend (platform: React)

---

### Step 2: Create Google Analytics Account (Free)

1. Go to https://analytics.google.com/
2. Sign in with your Google account
3. Click "Create" and set up a property:
   - Property name: `Compass`
   - Time zone: Your timezone
   - Currency: Your currency
4. Create a data stream:
   - Platform: Web
   - Website URL: `https://budgeting-tool-production.up.railway.app`
   - Stream name: `Compass Web`
5. Copy your **Measurement ID** (starts with `G-`)
   - Format: `G-XXXXXXXXXX`

---

### Step 3: Update Environment Variables

#### Backend (.env)

Add to your Railway environment variables or local .env:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn-here@oxxxxx.ingest.sentry.io/xxxxx
```

**Where to set:**
- **Local Development**: Add to `backend/.env`
- **Railway Production**: Add in Railway dashboard → Environment Variables

#### Frontend (.env.local)

Add to your frontend environment:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-sentry-frontend-dsn@oxxxxx.ingest.sentry.io/xxxxx

# Google Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

**Where to set:**
- **Local Development**: Create `frontend/.env.local` with above variables
- **Railway/Vercel Production**: Add in deployment dashboard → Environment Variables

---

### Step 4: Deploy Updates

#### Backend
```bash
cd backend
npm run build
# Push to Railway or your hosting provider
git add -A
git commit -m "Add Sentry error tracking"
git push origin main
```

#### Frontend
```bash
cd frontend
npm run build
# Push to Vercel, Railway, or your hosting provider
git add -A
git commit -m "Add Sentry error tracking and Google Analytics"
git push origin main
```

---

## ✅ VERIFICATION

### Test Sentry Backend (Local)

```bash
# Add this to a test route in backend
router.get('/test-sentry', (req, res) => {
  throw new Error('Test Sentry Error');
});

# Visit http://localhost:5000/test-sentry
# Check Sentry dashboard - you should see the error
```

### Test Sentry Frontend (Browser Console)

```javascript
// In browser console
Sentry.captureException(new Error('Test Frontend Error'));

// Check Sentry dashboard - you should see the error
```

### Test Google Analytics

1. Go to https://analytics.google.com/
2. Navigate to your Compass property
3. Go to Real-time → Overview
4. Visit your app at https://budgeting-tool-production.up.railway.app
5. You should see "1 active user" in real-time

---

## 📊 What You'll See in Sentry

### Error Dashboard
- **Issues**: Grouped exceptions with frequency
- **Error Details**: 
  - Error message and stack trace
  - User information
  - Request context
  - Browser/device info
  - Custom tags
- **Release Tracking**: Which version has the error

### Performance Monitoring
- **Transaction List**: All API endpoints and page loads
- **Performance Metrics**:
  - P50/P95/P99 response times
  - Throughput
  - Failure rate
- **Dependencies**: Database queries, API calls

### Real-time Alerts
- Get notified when errors spike
- Customize alert thresholds
- Slack integration available

---

## 📈 What You'll See in Google Analytics

### Real-time Dashboard
- **Active Users**: Current users on site
- **Current Traffic**: Traffic sources
- **Recent Events**: User interactions

### Engagement Metrics
- **Users**: Total and new users
- **Sessions**: Session count and duration
- **Pages**: Most viewed pages
- **Events**: Custom events (e.g., "budget_created", "transaction_added")

### Conversion Tracking
- **Goals**: Track signup, budget creation, etc.
- **Funnels**: Analyze user journeys
- **Attribution**: Which channels drive conversions

---

## 🎯 Recommended Configuration

### Sentry Settings

1. **Performance Monitoring**
   - Set tracesSampleRate to 0.1 (10% of transactions in production)
   - Helps reduce costs while maintaining visibility

2. **Release Tracking**
   ```typescript
   // Add to backend index.ts Sentry config
   release: '1.0.0', // Update with each release
   ```

3. **Slack Integration** (Optional)
   - Go to Sentry → Settings → Integrations → Slack
   - Get instant notifications of errors in Slack

4. **Issue Alerts** (Optional)
   - Create alerts for:
     - Error rate > 5%
     - New issues
     - Regression detection

### Google Analytics Setup

1. **Custom Events** (Recommended)
   ```typescript
   // In frontend components
   GA4React.event('budget_created', {
     budget_amount: 5000,
     category_count: 10
   });
   ```

2. **User Properties**
   ```typescript
   // Track user segments
   GA4React.setUserId(userId);
   GA4React.setUserProperties({
     plan: 'free',
     signup_date: '2026-06-03'
   });
   ```

3. **Goals/Conversions**
   - Define key actions in GA4 admin panel
   - Track signup, first budget, first spending

---

## 🔍 Monitoring Best Practices

### Error Tracking
- ✅ Monitor error frequency and trends
- ✅ Set up Slack alerts for critical errors
- ✅ Review new issues daily during first week
- ✅ Create custom tags for better grouping
  ```typescript
  Sentry.setTag('user_plan', 'free');
  Sentry.setTag('feature', 'budget_editing');
  ```

### Performance Monitoring
- ✅ Track slow API endpoints (> 1 second)
- ✅ Monitor database query times
- ✅ Watch for memory leaks
- ✅ Track frontend performance metrics

### User Analytics
- ✅ Monitor daily/weekly active users
- ✅ Track feature adoption (budgets created, etc.)
- ✅ Identify user drop-off points
- ✅ Analyze traffic sources

### Incident Response
1. Error spike detected in Sentry
2. Check Sentry for stack trace and affected users
3. Check Google Analytics for user impact
4. Fix issue and deploy
5. Monitor in real-time via Sentry + GA4

---

## 📋 Monitoring Checklist

### Day 1 (Deployment)
- [ ] Deploy with Sentry/GA4 configuration
- [ ] Verify Sentry is receiving errors
- [ ] Verify Google Analytics is tracking page views
- [ ] Test error capturing (Sentry)
- [ ] Test event tracking (Google Analytics)

### Week 1
- [ ] Review Sentry dashboard daily
- [ ] Fix any critical errors immediately
- [ ] Set up Slack alerts for errors
- [ ] Configure alert thresholds
- [ ] Review GA4 daily active users

### Ongoing
- [ ] Weekly review of top errors
- [ ] Monthly performance analysis
- [ ] Monthly user analytics review
- [ ] Quarterly trend analysis

---

## 🚨 Alert Thresholds (Recommended)

### Sentry
- **Critical**: Error rate > 10% in last 5 minutes
- **High**: 10+ same errors in last 1 hour
- **Medium**: New issue type appears
- **Low**: Error rate > 2% for 30 minutes

### Google Analytics
- **Critical**: Traffic drops > 50% vs yesterday
- **High**: Error page views spike
- **Medium**: High bounce rate (> 60%)
- **Low**: CTR below goal threshold

---

## 💰 Cost Breakdown

### Sentry (Free Plan)
- ✅ 5,000 events/month free
- ✅ Unlimited projects
- ✅ Basic error tracking
- **Paid plans**: Start at $29/month for 20,000 events

### Google Analytics (Free)
- ✅ Completely free
- ✅ Unlimited events
- ✅ Basic to advanced reporting
- **GA4 360**: Enterprise option (not needed for MVP)

**Total Cost for MVP**: $0-29/month

---

## 🔗 Useful Links

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Node.js Docs](https://docs.sentry.io/platforms/node/)
- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Google Analytics Documentation](https://support.google.com/analytics)
- [GA4 Event Tracking](https://support.google.com/analytics/answer/9322688)

---

## ✨ Next Steps

1. **Complete Setup** (30 minutes)
   - Create Sentry account and get DSN
   - Create Google Analytics account and get Measurement ID
   - Update environment variables
   - Deploy to production

2. **Verify** (10 minutes)
   - Trigger test error in Sentry
   - Check GA4 real-time dashboard
   - Verify data is flowing

3. **Configure Alerts** (15 minutes)
   - Set up Slack integration in Sentry
   - Configure error rate alerts
   - Test alert notifications

4. **Monitor** (Ongoing)
   - Check dashboards daily for first week
   - Review errors and performance weekly
   - Use insights to improve app

---

**You're all set! Your Compass app is now monitored and ready for production.** 🚀
