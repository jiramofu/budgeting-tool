-- Fix: Add missing organization_id column to subscriptions table
-- This migration fixes the broken subscriptions table from migration 010

-- Add the organization_id column if it doesn't exist
ALTER TABLE IF EXISTS subscriptions
ADD COLUMN IF NOT EXISTS organization_id INTEGER;

-- Add indexes for the column
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON subscriptions(user_id, is_active);
