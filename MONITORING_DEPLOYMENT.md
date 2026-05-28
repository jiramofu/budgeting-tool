# Phase 9c Monitoring & Deployment Guide

**Status**: Ready for Implementation  
**Timeline**: May 28 - June 1, 2026  
**Target**: Production Deployment with Full Observability

---

## Implementation Checklist

### Phase 1: Test Suite Execution (May 28-29)

**Backend Tests**
```bash
cd backend
npm install  # Ensure ts-jest is installed
npm test     # Run all 51 tests
```

✓ Toast Notifications (8 tests)
✓ Skeleton Loaders (8 tests)
✓ Help Icons/Tooltips (8 tests)
✓ Keyboard Shortcuts (6 tests)
✓ Favorites System (6 tests)
✓ Error Boundaries (6 tests)
✓ Dark Mode (6 tests)
✓ Integration Tests (3 tests)
✓ Accessibility Tests (3 tests)
✓ Performance Tests (1 test suite)

**Frontend Tests**
```bash
cd frontend
npm install  # Install Vitest dependencies
npm test     # Run frontend tests
npm run test:coverage  # Generate coverage report
```

### Phase 2: Monitoring Infrastructure (May 29-30)

**1. Sentry Setup**
```bash
# Backend Sentry initialization
npm install @sentry/node @sentry/profiling-node

# Add to .env:
SENTRY_DSN=https://[key]@[project].ingest.sentry.io/[number]
```

**2. Google Analytics 4**
```bash
# Frontend GA4 initialization
npm install @react-router-dom

# Add to .env:
REACT_APP_GA4_ID=G-XXXXXXXXXX
```

**3. Datadog Agent** (Optional for advanced monitoring)
```bash
# Install Datadog Agent
npm install @datadog/browser-rum @datadog/browser-logs
```

**4. Health Checks**
```bash
# Create health check endpoint
curl http://localhost:3001/health
# Expected: { status: "ok", timestamp: "2026-05-28T..." }
```

### Phase 3: Deployment (June 1)

**Canary Rollout Strategy**
1. **10% Rollout** (8:00 AM) - Monitor for 30 mins
   - Alert threshold: Error rate > 2%
   
2. **50% Rollout** (8:45 AM) - Monitor for 1 hour
   - Alert threshold: Error rate > 1%
   
3. **100% Rollout** (10:00 AM) - Full production
   - Alert threshold: Error rate > 0.5%

**Pre-Deployment Checklist**
- [ ] All 51 tests passing
- [ ] Code coverage > 85%
- [ ] Monitoring infrastructure configured
- [ ] Incident response team briefed
- [ ] Rollback procedure documented
- [ ] Database backups completed

---

## Monitoring Metrics

### Real-Time Dashboards

**Dashboard 1: Error Tracking (Sentry)**
- Total errors in last 24h
- Error rate trend
- Top 5 errors
- User affected count

**Dashboard 2: Performance (Datadog/New Relic)**
- Toast appearance time (target < 100ms)
- Skeleton animation smoothness (60fps)
- Tooltip delay (target < 300ms)
- Keyboard shortcut response (target < 50ms)
- Page load time (target < 2s)

**Dashboard 3: User Analytics (Google Analytics 4)**
- Active users (real-time)
- Feature adoption:
  - Dark mode toggle rate
  - Favorites system usage
  - Keyboard shortcuts usage
- User engagement funnels

**Dashboard 4: Infrastructure**
- API response times by endpoint
- Database query performance
- Server CPU/Memory usage
- Network I/O

---

## Alert Thresholds

### Critical (Page Alert)
- Error rate > 5%
- API response time > 5s (p95)
- Database error rate > 1%
- Server down (uptime < 99%)

### High (Slack #alerts)
- Error rate > 1% and < 5%
- API response time > 2s (p95)
- Memory usage > 80%
- Slow transaction rate > 10%

### Medium (Slack #monitoring)
- Error rate > 0.1% and < 1%
- API response time > 1s (p95)
- Database slow queries > 5%
- Toast appearance > 150ms

### Low (Email digest)
- Error rate > 0% and < 0.1%
- API response time > 500ms (p95)
- Feature adoption metrics

---

## Incident Response

### Tier 1: Immediate Action (Error rate > 5%)
1. **First 5 minutes**: Trigger on-call responder
2. **Page alert sent** to incident channel
3. **Assess severity**: 
   - Check affected user count
   - Check feature impact
   - Check data corruption risk
4. **Decision point**: Rollback vs. Fix Forward
   - If data corruption risk: ROLLBACK immediately
   - If user-facing but recoverable: Begin fix
   - If backend-only: Hot patch if available

### Tier 2: Urgent (Error rate 1-5%)
1. **Slack alert** to team
2. **Investigation**: Root cause analysis
3. **Action**: Deploy fix or rollback
4. **Timeline**: Resolve within 15 minutes

### Tier 3: Moderate (Error rate 0.1-1%)
1. **Slack alert** to engineering
2. **Investigation**: Low priority
3. **Action**: Plan fix for next deployment
4. **Timeline**: 24-48 hours

### Tier 4: Low (Error rate < 0.1%)
1. **Email digest** next morning
2. **Action**: Include in next sprint
3. **Timeline**: Next regular deployment

---

## Post-Deployment Monitoring (June 1-30)

### Day 1 (June 1)
- **8:00 AM**: Initial 10% rollout (30 min monitoring)
- **8:30 AM**: Check error rate, performance metrics
- **8:45 AM**: 50% rollout if all clear
- **10:00 AM**: 100% rollout if stable
- **5:00 PM**: End-of-day status report

### Week 1 (June 1-7)
- **Daily 9:00 AM**: 15-minute standup
  - Error rate trend
  - Performance metrics
  - User feedback
  - Any rolling back needed
  
- **Daily 5:00 PM**: Summary email
  - Key metrics dashboard
  - Alert summary
  - Action items

### Week 2-4 (June 8-30)
- **Daily**: Automated metrics email
- **Weekly Monday 10:00 AM**: Monitoring review
  - Performance trends
  - Feature adoption
  - Cost analysis
  - Resource optimization
  
- **Monthly 1st day**: Strategic review
  - Overall stability assessment
  - Cost vs. benefit
  - Scaling needs
  - Optimization opportunities

---

## Rollback Procedures

### Immediate Rollback (< 2 minutes)
```bash
# 1. Revert to previous image
docker pull budgeting-tool:v1.0.1
docker stop budgeting-tool
docker run -d budgeting-tool:v1.0.1

# 2. Verify health check
curl http://localhost:3001/health

# 3. Monitor error rate
# Should drop to < 0.1% within 30 seconds
```

### Partial Rollback (Canary)
```bash
# If 10% rollout fails:
# 1. Stop sending traffic to v1.0.2
# 2. Keep 90% on v1.0.1
# 3. Investigate issue
# 4. Deploy v1.0.3 fix
```

### Database Rollback
```bash
# If data corruption detected:
# 1. Stop all write operations
# 2. Restore from backup: backup_2026-06-01_08-00.sql
# 3. Run migration to sync state
# 4. Verify data integrity
```

---

## Success Criteria

### Deployment Success
- ✓ 100% of 51 tests passing
- ✓ Code coverage > 85%
- ✓ Zero critical errors in first hour
- ✓ Error rate < 0.5% by end of day 1
- ✓ Performance metrics met for all features
- ✓ No user data loss

### Week 1 Success
- ✓ Sustained error rate < 0.5%
- ✓ 99.5% uptime
- ✓ Average API response < 500ms
- ✓ Toast appearance < 110ms (avg)
- ✓ No production incidents

### Month 1 Success
- ✓ Dark mode adoption > 20%
- ✓ Favorites system used by > 15% of users
- ✓ Keyboard shortcuts discovered by > 10% of users
- ✓ Error rate trending down to < 0.2%
- ✓ Zero critical incidents

---

## Tool Setup Instructions

### 1. Sentry (Backend Error Tracking)
```bash
# Account: Create account at sentry.io
# Project: New Project (Node.js)
# DSN: Copy DSN to backend .env

# Verify:
curl -X POST https://your-sentry-dsn.ingest.sentry.io \
  -H "Content-Type: application/json" \
  -d '{"event_id":"test"}'
```

### 2. Google Analytics 4
```bash
# Account: analytics.google.com
# Property: Create Web property
# Measurement ID: Copy to frontend .env as REACT_APP_GA4_ID

# Verify in DevTools:
window.gtag('event', 'test_event', {test: true})
# Should appear in GA4 Realtime view
```

### 3. Datadog (Optional)
```bash
npm install @datadog/browser-rum

# Initialize in frontend:
import {datadogRum} from '@datadog/browser-rum'
datadogRum.init({applicationId: 'YOUR_APP_ID', clientToken: 'YOUR_TOKEN'})
```

### 4. Uptime Monitoring (Uptime Robot)
- Create monitor for: https://api.budgeting-tool.com/health
- Alert if down for > 1 minute
- Check every 5 minutes

---

## Cost Estimation

| Tool | Monthly Cost | Usage | Notes |
|------|------------|-------|-------|
| Sentry | $29 | 50K events/month | Error tracking |
| GA4 | Free | Up to 10M hits/month | Analytics |
| Datadog | $231 | 1GB logs/day | APM & monitoring |
| Uptime Robot | Free | 50 monitors | Uptime tracking |
| Status Page | $29 | Custom status | Public status page |
| **Total** | **$289/month** | — | All-in monitoring |

---

## Contacts & Escalation

**On-Call Rotation (24/7 during first week)**
- Mon-Wed: Engineer A
- Wed-Fri: Engineer B
- Sat-Sun: Engineer C
- Holidays: Manager

**Escalation Path**
1. Detection (Automated alert)
2. Notification (Slack, PagerDuty)
3. Investigation (5 minutes)
4. Response (15 minutes)
5. Escalation to manager (if not resolved in 15 min)
6. Executive decision (if critical > 30 min)

---

## Next Steps

1. **Today (May 28)**
   - [ ] Install test dependencies
   - [ ] Run test suite
   - [ ] Fix any failing tests

2. **Tomorrow (May 29)**
   - [ ] Set up Sentry project
   - [ ] Set up GA4 property
   - [ ] Configure monitoring dashboards

3. **May 30**
   - [ ] Deploy to staging
   - [ ] Run smoke tests
   - [ ] Verify monitoring works

4. **June 1**
   - [ ] Final pre-deployment checks
   - [ ] 10% → 50% → 100% canary rollout
   - [ ] Monitor metrics

5. **June 1-30**
   - [ ] Daily monitoring reviews
   - [ ] Weekly analysis
   - [ ] Monthly retrospective

---

**Prepared by**: Phase 9c Team  
**Last updated**: May 28, 2026  
**Status**: Ready for Execution ✓
