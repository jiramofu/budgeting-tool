-- Migration 007: Audit Retention Policies & Usage Analytics
-- Created for Phase 8B: Enterprise Features - Audit Logging & Rate Limiting Services
-- Extends Phase 8A with advanced audit lifecycle management and analytics infrastructure

-- ============================================================================
-- 1. AUDIT_LOG_ARCHIVES TABLE - Bulk storage for archived audit logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log_archives (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  archive_date DATE NOT NULL,
  log_count INTEGER NOT NULL DEFAULT 0,
  archive_size_bytes BIGINT,
  logs_data JSONB NOT NULL DEFAULT '[]',
  is_compressed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_archives_organization_id ON audit_log_archives(organization_id);
CREATE INDEX idx_audit_log_archives_created_at ON audit_log_archives(created_at DESC);
CREATE INDEX idx_audit_log_archives_org_date ON audit_log_archives(organization_id, created_at DESC);

-- ============================================================================
-- 2. AUDIT_RETENTION_POLICIES TABLE - Per-organization retention rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_retention_policies (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  active_days INTEGER NOT NULL DEFAULT 90,
  archive_days INTEGER NOT NULL DEFAULT 365,
  auto_delete BOOLEAN DEFAULT TRUE,
  export_format VARCHAR(50) DEFAULT 'json' CHECK (export_format IN ('json', 'csv', 'both')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_retention_policies_organization_id ON audit_retention_policies(organization_id);
CREATE INDEX idx_audit_retention_policies_is_active ON audit_retention_policies(is_active);

-- ============================================================================
-- 3. ENDPOINT_RATE_LIMITS TABLE - Per-endpoint granular limits
-- ============================================================================

CREATE TABLE IF NOT EXISTS endpoint_rate_limits (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  endpoint_pattern VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  limit_per_minute INTEGER,
  limit_per_hour INTEGER,
  limit_per_day INTEGER,
  burst_allowance INTEGER DEFAULT 5,
  alert_threshold_percent INTEGER DEFAULT 80,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, endpoint_pattern, method)
);

CREATE INDEX idx_endpoint_rate_limits_organization_id ON endpoint_rate_limits(organization_id);
CREATE INDEX idx_endpoint_rate_limits_endpoint_pattern ON endpoint_rate_limits(endpoint_pattern);
CREATE INDEX idx_endpoint_rate_limits_is_active ON endpoint_rate_limits(is_active);

-- ============================================================================
-- 4. ENDPOINT_USAGE_LOGS TABLE - Enhanced usage tracking with response times
-- ============================================================================

CREATE TABLE IF NOT EXISTS endpoint_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  status_code INTEGER,
  response_time_ms INTEGER,
  bytes_sent BIGINT,
  bytes_received BIGINT,
  ip_address VARCHAR(45),
  request_id VARCHAR(255),
  cache_hit BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_endpoint_usage_logs_organization_id ON endpoint_usage_logs(organization_id);
CREATE INDEX idx_endpoint_usage_logs_user_id ON endpoint_usage_logs(user_id);
CREATE INDEX idx_endpoint_usage_logs_endpoint ON endpoint_usage_logs(endpoint);
CREATE INDEX idx_endpoint_usage_logs_method ON endpoint_usage_logs(method);
CREATE INDEX idx_endpoint_usage_logs_created_at ON endpoint_usage_logs(created_at DESC);
CREATE INDEX idx_endpoint_usage_logs_org_date ON endpoint_usage_logs(organization_id, created_at DESC);
CREATE INDEX idx_endpoint_usage_logs_status_code ON endpoint_usage_logs(status_code);

-- ============================================================================
-- 5. USAGE_SUMMARIES TABLE - Pre-calculated daily aggregations
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_summaries (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_requests BIGINT DEFAULT 0,
  total_bytes_sent BIGINT DEFAULT 0,
  total_bytes_received BIGINT DEFAULT 0,
  success_count BIGINT DEFAULT 0,
  error_count BIGINT DEFAULT 0,
  success_rate NUMERIC(5, 2) DEFAULT 100.0,
  avg_response_time_ms NUMERIC(10, 2) DEFAULT 0.0,
  max_response_time_ms INTEGER DEFAULT 0,
  min_response_time_ms INTEGER DEFAULT 0,
  requests_by_endpoint JSONB DEFAULT '{}',
  requests_by_user JSONB DEFAULT '{}',
  requests_by_status JSONB DEFAULT '{}',
  top_endpoints JSONB DEFAULT '[]',
  top_users JSONB DEFAULT '[]',
  rate_limited_count BIGINT DEFAULT 0,
  cache_hit_rate NUMERIC(5, 2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, summary_date)
);

CREATE INDEX idx_usage_summaries_organization_id ON usage_summaries(organization_id);
CREATE INDEX idx_usage_summaries_summary_date ON usage_summaries(summary_date DESC);
CREATE INDEX idx_usage_summaries_org_date ON usage_summaries(organization_id, summary_date DESC);

-- ============================================================================
-- 6. QUOTA_ALERTS TABLE - Track when orgs exceed quota thresholds
-- ============================================================================

CREATE TABLE IF NOT EXISTS quota_alerts (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN ('endpoint', 'organization', 'storage')),
  resource_name VARCHAR(500),
  threshold_percent INTEGER NOT NULL,
  current_percent INTEGER NOT NULL,
  message TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quota_alerts_organization_id ON quota_alerts(organization_id);
CREATE INDEX idx_quota_alerts_alert_type ON quota_alerts(alert_type);
CREATE INDEX idx_quota_alerts_created_at ON quota_alerts(created_at DESC);
CREATE INDEX idx_quota_alerts_org_created ON quota_alerts(organization_id, created_at DESC);
CREATE INDEX idx_quota_alerts_email_sent ON quota_alerts(email_sent);

-- ============================================================================
-- 7. STORAGE_METRICS TABLE - Track audit log storage usage over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS storage_metrics (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  active_logs_count BIGINT DEFAULT 0,
  active_logs_size_mb NUMERIC(12, 2) DEFAULT 0.0,
  archive_logs_count BIGINT DEFAULT 0,
  archive_logs_size_mb NUMERIC(12, 2) DEFAULT 0.0,
  total_size_mb NUMERIC(12, 2) DEFAULT 0.0,
  growth_percent NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, metric_date)
);

CREATE INDEX idx_storage_metrics_organization_id ON storage_metrics(organization_id);
CREATE INDEX idx_storage_metrics_metric_date ON storage_metrics(metric_date DESC);
CREATE INDEX idx_storage_metrics_org_date ON storage_metrics(organization_id, metric_date DESC);

-- ============================================================================
-- 8. SCHEDULER_JOBS TABLE - Track scheduled job execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduler_jobs (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(255) NOT NULL UNIQUE,
  last_executed_at TIMESTAMP,
  next_execution_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  execution_time_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduler_jobs_job_name ON scheduler_jobs(job_name);
CREATE INDEX idx_scheduler_jobs_status ON scheduler_jobs(status);
CREATE INDEX idx_scheduler_jobs_last_executed ON scheduler_jobs(last_executed_at DESC);

-- ============================================================================
-- 9. DEFAULT DATA INSERTION
-- ============================================================================

-- Insert default retention policies for existing organizations
INSERT INTO audit_retention_policies (organization_id, active_days, archive_days, auto_delete)
SELECT id, 90, 365, TRUE FROM organizations
WHERE id NOT IN (SELECT organization_id FROM audit_retention_policies)
ON CONFLICT (organization_id) DO NOTHING;

-- Insert default storage metrics for tracking
INSERT INTO storage_metrics (organization_id, metric_date)
SELECT DISTINCT id, CURRENT_DATE FROM organizations
WHERE id NOT IN (SELECT DISTINCT organization_id FROM storage_metrics WHERE metric_date = CURRENT_DATE)
ON CONFLICT (organization_id, metric_date) DO NOTHING;

-- Initialize scheduler job tracking
INSERT INTO scheduler_jobs (job_name, status) VALUES
  ('audit_archival_job', 'pending'),
  ('audit_deletion_job', 'pending'),
  ('usage_summary_job', 'pending'),
  ('quota_alert_job', 'pending'),
  ('storage_metrics_job', 'pending')
ON CONFLICT (job_name) DO NOTHING;
