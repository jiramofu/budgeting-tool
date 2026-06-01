-- Add password reset columns to users table
-- This migration supports the forgot password and reset password features

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP;

-- Create index for faster lookups during password reset
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Log completion
RAISE NOTICE 'Migration 007: Added password reset columns to users table';
