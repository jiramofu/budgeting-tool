import { Response, NextFunction } from 'express';
import { PermissionRequest } from './permissions';

/**
 * Helper to validate organization context is set
 * Used as first check in protected routes
 */
export const requireOrganization = (
  req: PermissionRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.organizationId) {
    return res.status(401).json({ error: 'Organization context required' });
  }
  next();
};

/**
 * Helper to validate user owns/has access to resource in their organization
 * Checks that resource's organization_id matches request's organization_id
 */
export const validateResourceOwnership = (
  resourceOrganizationId: number | undefined,
  requestOrganizationId: number | undefined
): boolean => {
  if (!resourceOrganizationId || !requestOrganizationId) {
    return false;
  }
  return resourceOrganizationId === requestOrganizationId;
};

/**
 * Helper to build org-scoped WHERE clause for SQL queries
 * Returns parameterized clause for safe SQL injection prevention
 */
export const buildOrgFilter = (paramIndex: number): { clause: string; paramIndex: number } => {
  return {
    clause: `AND organization_id = $${paramIndex}`,
    paramIndex: paramIndex + 1,
  };
};

/**
 * Helper to extract organization_id from query parameters
 * Used when resource IDs need to be validated against org context
 */
export const getOrgIdFromRequest = (req: PermissionRequest): number | null => {
  return req.organizationId || null;
};

/**
 * Helper to validate that a resource exists in user's organization
 * Generic function for any resource table with organization_id
 */
export const validateResourceInOrganization = async (
  db: any,
  tableName: string,
  resourceId: number,
  organizationId: number
): Promise<boolean> => {
  try {
    const result = await db.query(
      `SELECT id FROM ${tableName} WHERE id = $1 AND organization_id = $2`,
      [resourceId, organizationId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error validating resource ${resourceId} in ${tableName}:`, error);
    return false;
  }
};
