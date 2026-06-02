-- Add organization_id to investments table for enterprise support
ALTER TABLE investments
ADD COLUMN organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for organization filtering
CREATE INDEX idx_investments_user_org ON investments(user_id, organization_id);
CREATE INDEX idx_investments_org_id ON investments(organization_id);
