-- Migration: Add spending alerts and email reports tables
-- Created for Phase 2: User Engagement

-- Spending alerts table (tracks alert history and current alerts)
CREATE TABLE IF NOT EXISTS spending_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  current_spending DECIMAL(12, 2) NOT NULL,
  budget_target DECIMAL(12, 2) NOT NULL,
  percentage_of_budget DECIMAL(5, 2) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'critical')),
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  resolved_at TIMESTAMP,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert preferences table (user settings for spending alerts per category)
CREATE TABLE IF NOT EXISTS alert_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  alert_threshold_percentage DECIMAL(5, 2) NOT NULL DEFAULT 80.0 CHECK (alert_threshold_percentage >= 0 AND alert_threshold_percentage <= 100),
  critical_threshold_percentage DECIMAL(5, 2) NOT NULL DEFAULT 100.0 CHECK (critical_threshold_percentage >= 0 AND critical_threshold_percentage <= 100),
  enable_email_alerts BOOLEAN DEFAULT TRUE,
  enable_app_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id)
);

-- Email reports table (tracks scheduled email reports)
CREATE TABLE IF NOT EXISTS email_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('weekly_summary', 'monthly_summary', 'spending_analysis')),
  recipient_email VARCHAR(255) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'custom')),
  scheduled_day_of_week INTEGER CHECK (scheduled_day_of_week IS NULL OR (scheduled_day_of_week >= 0 AND scheduled_day_of_week <= 6)),
  scheduled_day_of_month INTEGER CHECK (scheduled_day_of_month IS NULL OR (scheduled_day_of_month >= 1 AND scheduled_day_of_month <= 31)),
  scheduled_time VARCHAR(5) DEFAULT '09:00', -- HH:MM format
  is_active BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMP,
  next_send_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email preferences table (user settings for email reports)
CREATE TABLE IF NOT EXISTS email_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  weekly_summary_enabled BOOLEAN DEFAULT TRUE,
  monthly_summary_enabled BOOLEAN DEFAULT TRUE,
  spending_analysis_enabled BOOLEAN DEFAULT FALSE,
  include_budget_progress BOOLEAN DEFAULT TRUE,
  include_spending_by_category BOOLEAN DEFAULT TRUE,
  include_savings_rate BOOLEAN DEFAULT TRUE,
  include_goals_progress BOOLEAN DEFAULT TRUE,
  include_bill_reminders BOOLEAN DEFAULT TRUE,
  unsubscribe_token VARCHAR(255) UNIQUE,
  is_unsubscribed BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert history table (archive of resolved alerts for historical tracking)
CREATE TABLE IF NOT EXISTS alert_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_id INTEGER REFERENCES spending_alerts(id) ON DELETE SET NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  current_spending DECIMAL(12, 2) NOT NULL,
  budget_target DECIMAL(12, 2) NOT NULL,
  percentage_of_budget DECIMAL(5, 2) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  triggered_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution_type VARCHAR(30) CHECK (resolution_type IN ('manual_resolution', 'automatic_reset', 'budget_adjustment')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email report audit table (tracks sent reports and delivery status)
CREATE TABLE IF NOT EXISTS email_report_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_report_id INTEGER REFERENCES email_reports(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  opened_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_spending_alerts_user_id ON spending_alerts(user_id);
CREATE INDEX idx_spending_alerts_category_id ON spending_alerts(category_id);
CREATE INDEX idx_spending_alerts_budget_id ON spending_alerts(budget_id);
CREATE INDEX idx_spending_alerts_triggered_at ON spending_alerts(triggered_at);
CREATE INDEX idx_spending_alerts_is_active ON spending_alerts(is_active);
CREATE INDEX idx_spending_alerts_user_active ON spending_alerts(user_id, is_active);

CREATE INDEX idx_alert_preferences_user_id ON alert_preferences(user_id);
CREATE INDEX idx_alert_preferences_category_id ON alert_preferences(category_id);

CREATE INDEX idx_email_reports_user_id ON email_reports(user_id);
CREATE INDEX idx_email_reports_next_send_at ON email_reports(next_send_at);
CREATE INDEX idx_email_reports_is_active ON email_reports(is_active);
CREATE INDEX idx_email_reports_frequency ON email_reports(frequency);

CREATE INDEX idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX idx_email_preferences_unsubscribe_token ON email_preferences(unsubscribe_token);

CREATE INDEX idx_alert_history_user_id ON alert_history(user_id);
CREATE INDEX idx_alert_history_category_id ON alert_history(category_id);
CREATE INDEX idx_alert_history_triggered_at ON alert_history(triggered_at);

CREATE INDEX idx_email_report_audit_user_id ON email_report_audit(user_id);
CREATE INDEX idx_email_report_audit_sent_at ON email_report_audit(sent_at);
CREATE INDEX idx_email_report_audit_delivery_status ON email_report_audit(delivery_status);
