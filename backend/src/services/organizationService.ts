import { query } from '../config/database';
import { logAuditEvent } from '../middleware/auditLog';

/**
 * Organization Service
 * Handles all business logic for organizations, members, and roles
 */

interface Organization {
  id: number;
  name: string;
  organization_type: 'personal' | 'team' | 'enterprise';
  owner_id: number;
  description?: string;
  logo_url?: string;
  settings?: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface OrganizationMember {
  id: number;
  organization_id: number;
  user_id: number;
  role: 'owner' | 'admin' | 'manager' | 'user' | 'viewer';
  invited_by_id?: number;
  invitation_token?: string;
  invitation_accepted_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new organization
 */
export const createOrganization = async (
  ownerId: number,
  name: string,
  type: 'personal' | 'team' | 'enterprise' = 'personal',
  description?: string
): Promise<Organization> => {
  try {
    const result = await query(
      `INSERT INTO organizations (name, organization_type, owner_id, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name, type, ownerId, description || null]
    );

    const organization = result.rows[0];

    // Add owner as member
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role, invitation_accepted_at, created_at, updated_at)
       VALUES ($1, $2, 'owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [organization.id, ownerId]
    );

    // Create default rate limits
    await query(
      `INSERT INTO api_rate_limits (organization_id, tier, created_at, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [organization.id, 'free']
    );

    // Log audit event
    await logAuditEvent(
      organization.id,
      ownerId,
      'create',
      'organization',
      organization.id,
      `Created organization: ${name}`
    );

    return organization;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

/**
 * Get organization by ID
 */
export const getOrganization = async (organizationId: number): Promise<Organization> => {
  try {
    const result = await query(
      `SELECT * FROM organizations WHERE id = $1`,
      [organizationId]
    );

    if (!result.rows[0]) {
      throw new Error('Organization not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw error;
  }
};

/**
 * Update organization
 */
export const updateOrganization = async (
  organizationId: number,
  updates: {
    name?: string;
    description?: string;
    logo_url?: string;
    settings?: any;
    is_active?: boolean;
  },
  updatedBy: number
): Promise<Organization> => {
  try {
    const current = await getOrganization(organizationId);
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(updates.name);
      paramIndex++;
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(updates.description);
      paramIndex++;
    }

    if (updates.logo_url !== undefined) {
      updateFields.push(`logo_url = $${paramIndex}`);
      values.push(updates.logo_url);
      paramIndex++;
    }

    if (updates.settings !== undefined) {
      updateFields.push(`settings = $${paramIndex}`);
      values.push(JSON.stringify(updates.settings));
      paramIndex++;
    }

    if (updates.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      values.push(updates.is_active);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return current;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(organizationId);

    const sql = `UPDATE organizations SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(sql, values);

    // Log audit event
    await logAuditEvent(
      organizationId,
      updatedBy,
      'update',
      'organization',
      organizationId,
      'Updated organization',
      current,
      result.rows[0]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
};

/**
 * Get organization members
 */
export const getOrganizationMembers = async (
  organizationId: number
): Promise<OrganizationMember[]> => {
  try {
    const result = await query(
      `SELECT om.*, u.email, u.first_name, u.last_name
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.organization_id = $1 AND om.is_active = true
       ORDER BY om.created_at DESC`,
      [organizationId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching organization members:', error);
    throw error;
  }
};

/**
 * Add member to organization
 */
export const addOrganizationMember = async (
  organizationId: number,
  userId: number,
  role: 'admin' | 'manager' | 'user' | 'viewer' = 'user',
  invitedBy: number
): Promise<OrganizationMember> => {
  try {
    // Check if user is already a member
    const existing = await query(
      `SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId]
    );

    if (existing.rows[0]) {
      // Reactivate if previously removed
      const result = await query(
        `UPDATE organization_members SET is_active = true, updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $1 AND user_id = $2
         RETURNING *`,
        [organizationId, userId]
      );
      return result.rows[0];
    }

    const result = await query(
      `INSERT INTO organization_members (
        organization_id, user_id, role, invited_by_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [organizationId, userId, role, invitedBy]
    );

    // Log audit event
    await logAuditEvent(
      organizationId,
      invitedBy,
      'create',
      'organization_member',
      result.rows[0].id,
      `Added member ${userId} with role ${role}`
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error adding organization member:', error);
    throw error;
  }
};

/**
 * Update member role
 */
export const updateMemberRole = async (
  organizationId: number,
  userId: number,
  newRole: 'owner' | 'admin' | 'manager' | 'user' | 'viewer',
  updatedBy: number
): Promise<OrganizationMember> => {
  try {
    const current = await query(
      `SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId]
    );

    if (!current.rows[0]) {
      throw new Error('Member not found');
    }

    const result = await query(
      `UPDATE organization_members SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $2 AND user_id = $3
       RETURNING *`,
      [newRole, organizationId, userId]
    );

    // Log audit event
    await logAuditEvent(
      organizationId,
      updatedBy,
      'update',
      'organization_member',
      result.rows[0].id,
      `Updated member ${userId} role to ${newRole}`,
      current.rows[0],
      result.rows[0]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
};

/**
 * Remove member from organization
 */
export const removeMember = async (
  organizationId: number,
  userId: number,
  removedBy: number
): Promise<void> => {
  try {
    const current = await query(
      `SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId]
    );

    if (!current.rows[0]) {
      throw new Error('Member not found');
    }

    // Soft delete by setting is_active to false
    await query(
      `UPDATE organization_members SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId]
    );

    // Log audit event
    await logAuditEvent(
      organizationId,
      removedBy,
      'delete',
      'organization_member',
      current.rows[0].id,
      `Removed member ${userId}`
    );
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

/**
 * Get user's organizations
 */
export const getUserOrganizations = async (userId: number): Promise<Organization[]> => {
  try {
    const result = await query(
      `SELECT o.* FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1 AND om.is_active = true AND o.is_active = true
       ORDER BY o.created_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    throw error;
  }
};

/**
 * Get user's primary organization (first/default)
 */
export const getUserPrimaryOrganization = async (userId: number): Promise<Organization> => {
  try {
    const organizations = await getUserOrganizations(userId);

    if (organizations.length === 0) {
      throw new Error('User has no organizations');
    }

    return organizations[0];
  } catch (error) {
    console.error('Error fetching primary organization:', error);
    throw error;
  }
};

/**
 * Check if user is member of organization
 */
export const isOrganizationMember = async (
  userId: number,
  organizationId: number
): Promise<boolean> => {
  try {
    const result = await query(
      `SELECT id FROM organization_members
       WHERE user_id = $1 AND organization_id = $2 AND is_active = true`,
      [userId, organizationId]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking organization membership:', error);
    return false;
  }
};

/**
 * Get member's role
 */
export const getMemberRole = async (
  userId: number,
  organizationId: number
): Promise<string | null> => {
  try {
    const result = await query(
      `SELECT role FROM organization_members
       WHERE user_id = $1 AND organization_id = $2 AND is_active = true`,
      [userId, organizationId]
    );

    return result.rows[0]?.role || null;
  } catch (error) {
    console.error('Error fetching member role:', error);
    return null;
  }
};
