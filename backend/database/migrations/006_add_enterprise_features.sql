-- Migration 006: Enterprise Features - Multi-Organization, RBAC, Audit Logging, Rate Limiting
-- Created for Phase 8: Enterprise Features

-- ============================================================================
-- 1. ORGANIZATIONS TABLE - Replace/Extend household concept
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(50) NOT NULL DEFAULT 'personal' CHECK (organization_type IN ('personal', 'team', 'enterprise')),
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  logo_url VARCHAR(500),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);
CREATE INDEX idx_organizations_type ON organizations(organization_type);

-- ============================================================================
-- 2. ORGANIZATION_MEMBERS TABLE - Membership and role assignment
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'user', 'viewer')),
  invited_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  invitation_token VARCHAR(255),
  invitation_accepted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_role ON organization_members(role);
CREATE INDEX idx_organization_members_is_active ON organization_members(is_active);
CREATE INDEX idx_organization_members_invitation_token ON organization_members(invitation_token);

-- ============================================================================
-- 3. ORGANIZATION_ROLES TABLE - Permission definitions per role
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_roles (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, role_name)
);

CREATE INDEX idx_organization_roles_organization_id ON organization_roles(organization_id);

-- ============================================================================
-- 4. AUDIT_LOGS TABLE - Immutable audit trail (append-only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  changes JSONB,
  before_values JSONB,
  after_values JSONB,
  request_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partition by organization for better query performance
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_org_date ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_org_user_date ON audit_logs(organization_id, user_id, created_at DESC);

-- ============================================================================
-- 5. API_RATE_LIMITS TABLE - Configuration per organization
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  requests_per_minute INTEGER NOT NULL DEFAULT 60,
  requests_per_hour INTEGER NOT NULL DEFAULT 1000,
  requests_per_day INTEGER NOT NULL DEFAULT 10000,
  burst_allowance INTEGER DEFAULT 10,
  reset_schedule VARCHAR(50) NOT NULL DEFAULT 'calendar_day' CHECK (reset_schedule IN ('calendar_day', 'calendar_month', 'rolling_window')),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_rate_limits_organization_id ON api_rate_limits(organization_id);
CREATE INDEX idx_api_rate_limits_tier ON api_rate_limits(tier);

-- ============================================================================
-- 6. API_USAGE_LOGS TABLE - Real-time usage tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(45),
  request_id VARCHAR(255),
  was_rate_limited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_usage_logs_organization_id ON api_usage_logs(organization_id);
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX idx_api_usage_logs_org_date ON api_usage_logs(organization_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_rate_limited ON api_usage_logs(was_rate_limited);

-- ============================================================================
-- 7. ADD ORGANIZATION_ID TO EXISTING TABLES
-- ============================================================================

-- Add organization_id to budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE budgets ADD CONSTRAINT fk_budgets_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_budgets_organization_id ON budgets(organization_id);

-- Add organization_id to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE categories ADD CONSTRAINT fk_categories_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_categories_organization_id ON categories(organization_id);

-- Add organization_id to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON transactions(organization_id);

-- Add organization_id to bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE bills ADD CONSTRAINT fk_bills_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_bills_organization_id ON bills(organization_id);

-- Add organization_id to goals
ALTER TABLE goals ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE goals ADD CONSTRAINT fk_goals_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_goals_organization_id ON goals(organization_id);

-- Add organization_id to spending_alerts
ALTER TABLE spending_alerts ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE spending_alerts ADD CONSTRAINT fk_spending_alerts_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_spending_alerts_organization_id ON spending_alerts(organization_id);

-- Add organization_id to email_reports
ALTER TABLE email_reports ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE email_reports ADD CONSTRAINT fk_email_reports_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_email_reports_organization_id ON email_reports(organization_id);

-- Add organization_id to cash_flow_projections
ALTER TABLE cash_flow_projections ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE cash_flow_projections ADD CONSTRAINT fk_cash_flow_projections_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_cash_flow_projections_organization_id ON cash_flow_projections(organization_id);

-- Add organization_id to projection_inputs
ALTER TABLE projection_inputs ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE projection_inputs ADD CONSTRAINT fk_projection_inputs_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_projection_inputs_organization_id ON projection_inputs(organization_id);

-- Add organization_id to spending_analytics
ALTER TABLE spending_analytics ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE spending_analytics ADD CONSTRAINT fk_spending_analytics_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_spending_analytics_organization_id ON spending_analytics(organization_id);

-- Add organization_id to spending_trends
ALTER TABLE spending_trends ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE spending_trends ADD CONSTRAINT fk_spending_trends_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_spending_trends_organization_id ON spending_trends(organization_id);

-- Add organization_id to search_queries
ALTER TABLE search_queries ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE search_queries ADD CONSTRAINT fk_search_queries_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_search_queries_organization_id ON search_queries(organization_id);

-- Add organization_id to search_analytics
ALTER TABLE search_analytics ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE search_analytics ADD CONSTRAINT fk_search_analytics_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_search_analytics_organization_id ON search_analytics(organization_id);

-- Add organization_id to budget_templates
ALTER TABLE budget_templates ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE budget_templates ADD CONSTRAINT fk_budget_templates_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_budget_templates_organization_id ON budget_templates(organization_id);

-- ============================================================================
-- 8. DATA MIGRATION - Create default organization for existing users
-- ============================================================================

-- Create personal organizations for all existing users
INSERT INTO organizations (name, organization_type, owner_id, created_at, updated_at)
SELECT
  CONCAT(COALESCE(first_name, 'User'), '''s Budget'),
  'personal',
  id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users
WHERE id NOT IN (SELECT owner_id FROM organizations)
ON CONFLICT DO NOTHING;

-- Add existing users as owners of their personal organizations
INSERT INTO organization_members (organization_id, user_id, role, invitation_accepted_at, created_at, updated_at)
SELECT
  o.id,
  u.id,
  'owner',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users u
JOIN organizations o ON o.owner_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.organization_id = o.id AND om.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- Set organization_id for existing data to their default personal organization
UPDATE budgets SET organization_id = (
  SELECT id FROM organizations WHERE owner_id = budgets.user_id LIMIT 1
) WHERE organization_id IS NULL;

UPDATE categories SET organization_id = (
  SELECT id FROM organizations WHERE owner_id = categories.user_id LIMIT 1
) WHERE organization_id IS NULL;

UPDATE transactions SET organization_id = (
  SELECT id FROM organizations WHERE owner_id = transactions.user_id LIMIT 1
) WHERE organization_id IS NULL;

UPDATE bills SET organization_id = (
  SELECT id FROM organizations WHERE owner_id = bills.user_id LIMIT 1
) WHERE organization_id IS NULL;

UPDATE goals SET organization_id = (
  SELECT id FROM organizations WHERE owner_id = goals.user_id LIMIT 1
) WHERE organization_id IS NULL;

-- Create default rate limits for all organizations
INSERT INTO api_rate_limits (organization_id, tier, requests_per_minute, requests_per_hour, requests_per_day, created_at, updated_at)
SELECT
  id,
  'free',
  60,
  1000,
  10000,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM api_rate_limits)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. FINAL NOTES
-- ============================================================================
-- Migration completed successfully.
-- Phase 8A: Database foundation for enterprise features is ready.
-- Next: Create middleware for permissions, audit logging, and rate limiting.
-- Feature flag: ENABLE_ORGANIZATIONS (default: false for safe rollout)
