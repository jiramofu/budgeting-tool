import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest } from './auth';

export interface PermissionRequest extends AuthRequest {
  organizationId?: number;
  organizationRole?: string;
  userOrganizations?: Array<{ organizationId: number; role: string }>;
}

/**
 * Middleware to enforce role-based access control (RBAC)
 * Validates that the authenticated user has the required role in the organization
 */
export const requireRole = (requiredRoles: string[]) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    try {
      // Check if user is a member of the organization
      const memberResult = await query(
        `SELECT role FROM organization_members
         WHERE organization_id = $1 AND user_id = $2 AND is_active = true`,
        [req.organizationId, req.userId]
      );

      if (!memberResult.rows[0]) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }

      const userRole = memberResult.rows[0].role;
      req.organizationRole = userRole;

      // Check if user has required role
      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions for this action',
          requiredRoles,
          userRole,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to load user's organizations
 * Attaches array of organizations user is a member of
 */
export const loadUserOrganizations = async (
  req: PermissionRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const orgsResult = await query(
      `SELECT om.organization_id, om.role
       FROM organization_members om
       WHERE om.user_id = $1 AND om.is_active = true
       ORDER BY om.created_at DESC`,
      [req.userId]
    );

    req.userOrganizations = orgsResult.rows.map((row: any) => ({
      organizationId: row.organization_id,
      role: row.role,
    }));

    next();
  } catch (error) {
    console.error('Error loading user organizations:', error);
    return res.status(500).json({ error: 'Failed to load organizations' });
  }
};

/**
 * Middleware to validate resource ownership
 * Checks if the resource being accessed belongs to the organization
 */
export const validateResourceOwnership = (resourceTable: string, resourceIdParam: string) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    if (!req.organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const resourceId = req.params[resourceIdParam];
    if (!resourceId) {
      return res.status(400).json({ error: `Missing ${resourceIdParam} parameter` });
    }

    try {
      const resourceResult = await query(
        `SELECT id FROM ${resourceTable} WHERE id = $1 AND organization_id = $2`,
        [resourceId, req.organizationId]
      );

      if (!resourceResult.rows[0]) {
        return res.status(404).json({ error: 'Resource not found or does not belong to your organization' });
      }

      next();
    } catch (error) {
      console.error(`Resource ownership validation error for ${resourceTable}:`, error);
      return res.status(500).json({ error: 'Resource validation failed' });
    }
  };
};

/**
 * Middleware to validate organization isolation
 * Ensures users can only access data from their organizations
 */
export const validateOrganizationAccess = async (
  req: PermissionRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.organizationId || !req.userId) {
    return next();
  }

  try {
    // Check if user is a member of the requested organization
    const memberResult = await query(
      `SELECT id FROM organization_members
       WHERE organization_id = $1 AND user_id = $2 AND is_active = true`,
      [req.organizationId, req.userId]
    );

    if (!memberResult.rows[0]) {
      return res.status(403).json({ error: 'Access denied to this organization' });
    }

    next();
  } catch (error) {
    console.error('Organization access validation error:', error);
    return res.status(500).json({ error: 'Access validation failed' });
  }
};

/**
 * Role hierarchy helper function
 * Returns true if userRole has permission level >= requiredLevel
 */
export const hasRoleHierarchy = (userRole: string, requiredRole: string): boolean => {
  const hierarchy: { [key: string]: number } = {
    owner: 5,
    admin: 4,
    manager: 3,
    user: 2,
    viewer: 1,
  };

  return (hierarchy[userRole] || 0) >= (hierarchy[requiredRole] || 0);
};

/**
 * Permission check function for use in route handlers
 */
export const checkPermission = async (
  userId: number,
  organizationId: number,
  requiredRole: string
): Promise<boolean> => {
  try {
    const result = await query(
      `SELECT role FROM organization_members
       WHERE organization_id = $1 AND user_id = $2 AND is_active = true`,
      [organizationId, userId]
    );

    if (!result.rows[0]) {
      return false;
    }

    return hasRoleHierarchy(result.rows[0].role, requiredRole);
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};
