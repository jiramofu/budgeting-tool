-- Migration: Add Phase 4 Analytics & Cash Flow Projections
-- Created for Phase 4: Advanced Analytics and Forecasting

-- Cash flow projections table (daily forecasts)
CREATE TABLE IF NOT EXISTS cash_flow_projections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  projection_date DATE NOT NULL,
  projected_balance DECIMAL(12, 2) NOT NULL,
  confidence_level VARCHAR(20) DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, projection_date)
);

-- Projection inputs (recurring items that affect projections)
CREATE TABLE IF NOT EXISTS projection_inputs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  day_of_month INTEGER CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  day_of_week INTEGER CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_income BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly spending analytics (pre-calculated)
CREATE TABLE IF NOT EXISTS spending_analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
  budget_target DECIMAL(12, 2),
  transaction_count INTEGER DEFAULT 0,
  percentage_of_budget DECIMAL(5, 2),
  trend_vs_prev_month DECIMAL(5, 2),
  avg_transaction_amount DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, year, month, category_id)
);

-- Spending trends (seasonal and historical patterns)
CREATE TABLE IF NOT EXISTS spending_trends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  avg_spending_across_years DECIMAL(12, 2),
  min_spending DECIMAL(12, 2),
  max_spending DECIMAL(12, 2),
  sample_size INTEGER DEFAULT 0,
  trend_direction VARCHAR(20) CHECK (trend_direction IN ('up', 'stable', 'down')),
  volatility VARCHAR(20) CHECK (volatility IN ('low', 'medium', 'high')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id, month)
);

-- Scheduler logs (track when projections/analytics were last calculated)
CREATE TABLE IF NOT EXISTS scheduler_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('projection', 'analytics', 'trends')),
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_cash_flow_projections_user_id ON cash_flow_projections(user_id);
CREATE INDEX idx_cash_flow_projections_date_range ON cash_flow_projections(user_id, projection_date);
CREATE INDEX idx_cash_flow_projections_period ON cash_flow_projections(period_start, period_end);

CREATE INDEX idx_projection_inputs_user_id ON projection_inputs(user_id);
CREATE INDEX idx_projection_inputs_active ON projection_inputs(user_id, is_active);
CREATE INDEX idx_projection_inputs_start_date ON projection_inputs(start_date);

CREATE INDEX idx_spending_analytics_user_id ON spending_analytics(user_id);
CREATE INDEX idx_spending_analytics_period ON spending_analytics(user_id, year, month);
CREATE INDEX idx_spending_analytics_category ON spending_analytics(category_id);
CREATE INDEX idx_spending_analytics_user_category ON spending_analytics(user_id, category_id);

CREATE INDEX idx_spending_trends_user_category ON spending_trends(user_id, category_id);
CREATE INDEX idx_spending_trends_user_month ON spending_trends(user_id, month);

CREATE INDEX idx_scheduler_logs_user_job ON scheduler_logs(user_id, job_type);
CREATE INDEX idx_scheduler_logs_status ON scheduler_logs(status);
