-- User settings table (preferences, theme, currency, language, etc.)
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  currency VARCHAR(3) DEFAULT 'USD',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  default_budgeting_method VARCHAR(20) DEFAULT 'flex' CHECK (default_budgeting_method IN ('zero-based', 'flex', 'hybrid')),
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Initialize settings for existing users
INSERT INTO user_settings (user_id, theme, currency, date_format, default_budgeting_method, email_notifications, push_notifications, two_factor_enabled, language)
SELECT id, 'light', 'USD', 'MM/DD/YYYY', 'flex', TRUE, FALSE, FALSE, 'en'
FROM users
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;
