# 🚀 Performance Testing Guide

**Last Updated:** May 29, 2026  
**Purpose:** Verify API endpoint responsiveness and system performance

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Testing](#basic-testing)
3. [Load Testing](#load-testing)
4. [Performance Profiling](#performance-profiling)
5. [Reporting & Analysis](#reporting--analysis)
6. [Optimization Recommendations](#optimization-recommendations)

---

## 🏃 Quick Start

### 1. Start the Backend Server

```bash
cd budgeting-tool/backend
npm install
npm run dev
```

Expected output:
```
Server running on port 5000
Database connected
```

### 2. Verify Server is Running

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-29T12:00:00.000Z"
}
```

---

## 🔍 Basic Testing

### Test Individual Endpoints

#### Health Check (No Auth Required)
```bash
curl -w "\nResponse Time: %{time_total}s\n" \
  http://localhost:5000/api/health
```

#### Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -w "\nResponse Time: %{time_total}s\n"
```

#### Get Settings (With Auth)
```bash
# First get a token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Then use it to test settings
curl -H "Authorization: Bearer $TOKEN" \
  -w "\nResponse Time: %{time_total}s\n" \
  http://localhost:5000/api/user/settings
```

#### Update Settings
```bash
curl -X POST http://localhost:5000/api/user/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "EUR",
    "theme": "dark",
    "language": "en"
  }' \
  -w "\nResponse Time: %{time_total}s\n"
```

---

## ⚡ Load Testing

### Option 1: Apache Bench (Simple)

```bash
# Test single endpoint with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:5000/api/health

# Expected output shows:
# - Mean response time
# - Min/Max response times
# - Requests per second
# - Failed requests (should be 0)
```

### Option 2: Artillery (Recommended)

#### Install Artillery
```bash
npm install -g artillery
```

#### Run Load Test
```bash
# Quick test
artillery quick --count 100 --num 50 http://localhost:5000/api/health

# Full scenario test
artillery run PERFORMANCE_TEST_CONFIG.js
```

#### Interpret Results
- **Mean Response Time:** Target < 200ms
- **p95 Response Time:** Target < 500ms
- **Error Rate:** Target < 0.1%
- **Throughput:** Target > 50 RPS

### Option 3: k6 (Advanced)

#### Install k6
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo apt-get install k6
```

#### Run k6 Test
```bash
k6 run PERFORMANCE_TEST_CONFIG.js

# With options
k6 run \
  --vus 100 \
  --duration 60s \
  PERFORMANCE_TEST_CONFIG.js
```

---

## 📊 Performance Profiling

### Node.js Profiling

#### Using clinic.js
```bash
# Install
npm install -g clinic

# Profile with clinic
clinic doctor -- node src/index.ts

# Analyze the results
clinic doctor --open
```

#### Using Node's Built-in Profiler
```bash
# Create profile
node --prof src/index.ts

# Process profile
node --prof-process isolate-*.log > profile.txt

# View results
cat profile.txt
```

### Database Query Profiling

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.5;

-- View slow queries
SELECT * FROM mysql.slow_log;

-- Analyze specific query
EXPLAIN ANALYZE SELECT * FROM transactions WHERE category_id = 1;
```

### Memory Profiling

```bash
# Monitor heap usage
node --expose-gc --inspect src/index.ts

# Connect DevTools
chrome://inspect
```

---

## 📈 Reporting & Analysis

### Key Performance Indicators (KPIs)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Response Time (p50) | < 100ms | > 150ms | > 300ms |
| Response Time (p95) | < 300ms | > 500ms | > 1000ms |
| Error Rate | < 0.1% | > 0.5% | > 1% |
| Throughput | > 50 RPS | < 40 RPS | < 10 RPS |
| CPU Usage | < 60% | > 75% | > 90% |
| Memory Usage | < 70% | > 80% | > 90% |
| DB Connections | < 80% | > 90% | Maxed |

### Create Performance Baseline

```bash
# Run baseline test
artillery run PERFORMANCE_TEST_CONFIG.js > baseline.json

# Run comparison test after optimization
artillery run PERFORMANCE_TEST_CONFIG.js > after.json

# Compare results
artillery report baseline.json after.json
```

### Generate HTML Report

```bash
artillery run \
  --output results.json \
  PERFORMANCE_TEST_CONFIG.js

artillery report results.json --output report.html
```

---

## 🔧 Optimization Recommendations

### Quick Wins (Implement First)

#### 1. **Add Response Caching**
```typescript
// Cache GET endpoints for 5 minutes
app.get('/api/categories', 
  cache('5 minutes'),
  (req, res) => { ... }
);
```

#### 2. **Enable GZIP Compression**
```typescript
import compression from 'compression';
app.use(compression());
```

#### 3. **Optimize Database Queries**
```typescript
// Bad: N+1 query problem
const budgets = await Budget.findAll();
for (const budget of budgets) {
  budget.categories = await Category.find({ budgetId: budget.id });
}

// Good: Use joins
const budgets = await Budget.findAll({
  include: { relation: 'categories' }
});
```

#### 4. **Add Database Indexes**
```sql
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_budget_id ON transactions(budget_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
```

#### 5. **Connection Pooling**
```typescript
// Increase pool size for better throughput
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Medium-term Improvements

- [ ] Implement Redis caching for frequently accessed data
- [ ] Use database materialized views for analytics
- [ ] Implement request debouncing on frontend
- [ ] Optimize bundle size (lazy loading, code splitting)
- [ ] Enable CDN for static assets
- [ ] Implement GraphQL with DataLoader for efficient queries

### Long-term Optimizations

- [ ] Microservices architecture
- [ ] Message queue (RabbitMQ, Kafka) for async operations
- [ ] Read replicas for analytics queries
- [ ] Elasticsearch for advanced search
- [ ] CDN for images and assets
- [ ] API rate limiting with sliding window

---

## 📝 Test Results Template

```markdown
# Performance Test Results
Date: 2026-05-29
Environment: Staging
Configuration: [Artillery/k6/Apache Bench]

## Test Parameters
- Duration: 120 seconds
- Concurrent Users: 100
- Total Requests: 5,000
- Test Scenarios: [List scenarios]

## Results Summary

### Overall Performance
| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Mean Response Time | XXms | <200ms | ✅/❌ |
| p95 Response Time | XXms | <500ms | ✅/❌ |
| p99 Response Time | XXms | <1000ms | ✅/❌ |
| Error Rate | X% | <0.1% | ✅/❌ |
| Throughput | XX RPS | >50 RPS | ✅/❌ |

### Endpoint Performance
[Table with response times for each endpoint]

### Resource Utilization
- CPU: XX%
- Memory: XX%
- Database Connections: XX%
- Network: XX Mbps

## Issues Found
[List any performance issues]

## Recommendations
[List optimization recommendations]

## Approval
- Tested by: [Name]
- Date: [Date]
- Status: ✅ PASS / ❌ FAIL
```

---

## 🚨 Troubleshooting

### High Response Times

1. Check database queries:
   ```bash
   SHOW PROCESSLIST;
   ```

2. Check server resources:
   ```bash
   top
   free -h
   df -h
   ```

3. Check logs:
   ```bash
   tail -f logs/error.log
   ```

### High Error Rate

1. Check error logs
2. Verify database connectivity
3. Check rate limiting status
4. Review authentication tokens

### Memory Leaks

1. Monitor heap:
   ```bash
   node --inspect src/index.ts
   # Open chrome://inspect
   ```

2. Take heap dump:
   ```bash
   kill -USR2 [PID]
   ```

---

## ✅ Pre-Launch Checklist

- [ ] Health check passes
- [ ] All endpoints respond within SLA
- [ ] Error rate < 0.1%
- [ ] Load test passes at 100 concurrent users
- [ ] Database indexes in place
- [ ] Caching enabled
- [ ] GZIP compression enabled
- [ ] Rate limiting configured
- [ ] Error monitoring active
- [ ] Backup procedures tested
- [ ] Failover tested
- [ ] Documentation updated

---

**Status:** Ready for Implementation  
**Next Step:** Run initial load test on staging environment
