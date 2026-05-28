-- Migration 005: Add Performance Optimization Indexes
-- Purpose: Improve query performance on common lookups and searches
-- Date: May 28, 2026

-- Transaction Performance Indexes
-- Most queries filter by user_id and date range
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
ON transactions(user_id, transaction_date DESC);

-- Support for transaction type filtering
CREATE INDEX IF NOT EXISTS idx_transactions_user_type
ON transactions(user_id, transaction_type);

-- Support for category-based searches
CREATE INDEX IF NOT EXISTS idx_transactions_category_user
ON transactions(category_id, user_id) WHERE category_id IS NOT NULL;

-- Support for amount range queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_amount
ON transactions(user_id, amount);

-- Budget Performance Indexes
-- Most budget queries filter by user_id and month/year
CREATE INDEX IF NOT EXISTS idx_budgets_user_month
ON budgets(user_id, year, month);

-- Budget targets are frequently accessed by budget_id
CREATE INDEX IF NOT EXISTS idx_budget_targets_budget
ON budget_targets(budget_id, category_id);

-- Category Performance Indexes
-- Categories are looked up by user
CREATE INDEX IF NOT EXISTS idx_categories_user_name
ON categories(user_id, name);

-- Support for category tree hierarchies
CREATE INDEX IF NOT EXISTS idx_categories_user_parent
ON categories(user_id, parent_id) WHERE parent_id IS NOT NULL;

-- Projection Input Indexes (Phase 4)
-- Recurring items frequently filtered by user and active status
CREATE INDEX IF NOT EXISTS idx_projection_inputs_user_active
ON projection_inputs(user_id, is_active)
WHERE is_active = true;

-- Support for date-based filtering in projections
CREATE INDEX IF NOT EXISTS idx_projection_inputs_user_dates
ON projection_inputs(user_id, start_date, end_date);

-- Cash Flow Projection Indexes
-- Projections are frequently queried by user and date
CREATE INDEX IF NOT EXISTS idx_cash_flow_projections_user_date
ON cash_flow_projections(user_id, projection_date);

-- Support for range queries on projected_balance
CREATE INDEX IF NOT EXISTS idx_cash_flow_projections_user_balance
ON cash_flow_projections(user_id, projected_balance);

-- Spending Analytics Indexes
-- Analytics frequently filtered by user and month
CREATE INDEX IF NOT EXISTS idx_spending_analytics_user_month
ON spending_analytics(user_id, year, month);

-- Category-specific analytics lookups
CREATE INDEX IF NOT EXISTS idx_spending_analytics_category
ON spending_analytics(user_id, category_id);

-- Spending Trends Indexes
-- Trends filtered by user and category over time
CREATE INDEX IF NOT EXISTS idx_spending_trends_user_category
ON spending_trends(user_id, category_id, month);

-- Support for category and month queries
CREATE INDEX IF NOT EXISTS idx_spending_trends_user_month
ON spending_trends(user_id, month);

-- User Performance Indexes
-- Email lookups for authentication
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- Support for user discovery features
CREATE INDEX IF NOT EXISTS idx_users_created_at
ON users(created_at DESC);

-- Alert Performance Indexes
-- Alerts frequently filtered by user and category
CREATE INDEX IF NOT EXISTS idx_spending_alerts_user
ON spending_alerts(user_id, category_id);

-- Email Report Indexes
-- Reports filtered by user and active status
CREATE INDEX IF NOT EXISTS idx_email_reports_user_status
ON email_reports(user_id, is_active);

-- Support for scheduled report execution
CREATE INDEX IF NOT EXISTS idx_email_reports_schedule
ON email_reports(user_id, next_send_at)
WHERE is_active = true;

-- Search Query Indexes (Phase 3)
-- Popular searches by user
CREATE INDEX IF NOT EXISTS idx_search_queries_user_date
ON search_queries(user_id, last_used_at DESC);

-- Support for search analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_term
ON search_analytics(user_id, search_term);

-- Favorite searches lookup
CREATE INDEX IF NOT EXISTS idx_search_queries_user_favorite
ON search_queries(user_id, is_favorite)
WHERE is_favorite = true;

-- Scheduler Logs Index
-- Track job execution for monitoring
CREATE INDEX IF NOT EXISTS idx_scheduler_logs_job_date
ON scheduler_logs(job_type, last_run_at DESC);

-- Support for failed job monitoring
CREATE INDEX IF NOT EXISTS idx_scheduler_logs_status
ON scheduler_logs(status, last_run_at DESC)
WHERE status = 'failed';

-- Composite indexes for common multi-filter queries
-- Transaction search by user, date, and category
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_category
ON transactions(user_id, transaction_date, category_id)
WHERE category_id IS NOT NULL;

-- Budget targets composite lookup
CREATE INDEX IF NOT EXISTS idx_budget_targets_user_budget_category
ON budget_targets(budget_id, category_id);

-- Partial Indexes for Active Records
-- Most queries filter for active items
CREATE INDEX IF NOT EXISTS idx_projection_inputs_active
ON projection_inputs(user_id)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_email_reports_active_schedule
ON email_reports(user_id, next_send_at)
WHERE is_active = true;

-- Support for DISTINCT user queries (for dashboards)
CREATE INDEX IF NOT EXISTS idx_transactions_user_only
ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_projections_user_only
ON cash_flow_projections(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user_only
ON spending_analytics(user_id);

-- Analyze all indexes
ANALYZE;

-- Note: These indexes improve query performance but increase write times.
-- Monitor with EXPLAIN ANALYZE to verify index usage:
-- EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = 1 AND transaction_date > NOW() - INTERVAL '30 days';
