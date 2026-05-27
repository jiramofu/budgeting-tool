-- Migration: Add advanced search and budget templates
-- Created for Phase 3: Search & Discovery

-- Saved search queries table
CREATE TABLE IF NOT EXISTS search_queries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filters_json JSONB NOT NULL DEFAULT '{}',
  search_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Budget templates library
CREATE TABLE IF NOT EXISTS budget_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('minimalist', 'comfortable', 'luxury', 'family', 'student', 'retirement', 'custom')),
  category_structure JSONB NOT NULL,
  target_percentages JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget template applications (tracks which templates users have applied)
CREATE TABLE IF NOT EXISTS template_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES budget_templates(id) ON DELETE CASCADE,
  budget_id INTEGER REFERENCES budgets(id) ON DELETE SET NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  customizations_json JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, budget_id)
);

-- Search statistics table (tracks popular search terms and filters)
CREATE TABLE IF NOT EXISTS search_analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_term VARCHAR(255),
  filters_used JSONB,
  results_count INTEGER,
  search_duration_ms INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX idx_search_queries_is_favorite ON search_queries(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_budget_templates_type ON budget_templates(template_type);
CREATE INDEX idx_template_applications_user_id ON template_applications(user_id);
CREATE INDEX idx_template_applications_template_id ON template_applications(template_id);
CREATE INDEX idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX idx_search_analytics_timestamp ON search_analytics(timestamp DESC);
