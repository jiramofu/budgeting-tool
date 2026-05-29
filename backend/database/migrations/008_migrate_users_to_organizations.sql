-- Migration 008: Migrate existing users to organizations (for Phase 8 Enterprise Features)
-- Ensures all existing users have a default personal organization

-- Create default organizations for users who don't have one yet
INSERT INTO organizations (name, description, owner_id, organization_type, created_at, updated_at)
SELECT
  COALESCE(u.first_name || ' ' || u.last_name, u.email) || '''s Budget' as name,
  'Personal budgeting' as description,
  u.id as owner_id,
  'personal' as organization_type,
  NOW() as created_at,
  NOW() as updated_at
FROM users u
WHERE u.id NOT IN (SELECT DISTINCT owner_id FROM organizations)
ON CONFLICT DO NOTHING;

-- Add all users as members of their organizations if they're not already
INSERT INTO organization_members (organization_id, user_id, role, invitation_accepted_at, is_active, created_at, updated_at)
SELECT
  o.id as organization_id,
  u.id as user_id,
  'owner' as role,
  NOW() as invitation_accepted_at,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM users u
JOIN organizations o ON o.owner_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.organization_id = o.id
  AND om.user_id = u.id
)
ON CONFLICT DO NOTHING;
