-- Migration 009: Add profile picture support
-- Adds profile_picture column to users and user_settings tables

-- Add profile_picture column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Add profile_picture column to user_settings table if it exists
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Create index for faster profile picture lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture);
CREATE INDEX IF NOT EXISTS idx_user_settings_profile_picture ON user_settings(profile_picture);
