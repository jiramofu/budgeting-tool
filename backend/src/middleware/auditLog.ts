import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { PermissionRequest } from './permissions';

export interface AuditLogRequest extends PermissionRequest {
  requestId?: string;
  requestStartTime?: number;
  originalBody?: any;
  originalParams?: any;
  originalQuery?: any;
}

/**
 * Generate a unique request ID for tracking
 */
const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Middleware to attach request ID and capture request data
 */
export const auditRequestSetup = (req: AuditLogRequest, res: Response, next: NextFunction) => {
  req.requestId = generateRequestId();
  req.requestStartTime = Date.now();

  // Store original request data for comparison after changes
  req.originalBody = { ...req.body };
  req.originalParams = { ...req.params };
  req.originalQuery = { ...req.query };

  next();
};

/**
 * Log audit event to database
 */
export const logAuditEvent = async (
  organizationId: number,
  userId: number | null,
  action: 'create' | 'read' | 'update' | 'delete',
  resourceType: string,
  resourceId: string | number | null,
  description: string,
  beforeValues?: any,
  afterValues?: any,
  ipAddress?: string,
  userAgent?: string,
  requestId?: string,
  status: 'success' | 'failure' = 'success',
  errorMessage?: string
): Promise<void> => {
  try {
    await query(
      `INSERT INTO audit_logs (
        organization_id, user_id, action, resource_type, resource_id,
        description, before_values, after_values, ip_address, user_agent,
        request_id, status, error_message, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)`,
      [
        organizationId,
        userId,
        action,
        resourceType,
        resourceId?.toString() || null,
        description,
        beforeValues ? JSON.stringify(beforeValues) : null,
        afterValues ? JSON.stringify(afterValues) : null,
        ipAddress || null,
        userAgent || null,
        requestId || null,
        status,
        errorMessage || null,
      ]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - we don't want audit logging failures to break the application
  }
};

/**
 * Middleware to capture response and log mutations
 * Wraps res.json() to intercept the response
 */
export const captureAuditResponse = (req: AuditLogRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);

  // Only capture data-modifying operations (POST, PUT, DELETE)
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  res.json = function (data: any) {
    // Determine action based on HTTP method
    let action: 'create' | 'update' | 'delete' = 'create';
    if (req.method === 'PUT' || req.method === 'PATCH') {
      action = 'update';
    } else if (req.method === 'DELETE') {
      action = 'delete';
    }

    // Log the audit event
    if (req.userId && req.organizationId) {
      const resourceId = req.params.id || req.body.id || null;
      const resourceType = extractResourceType(req.path);

      logAuditEvent(
        req.organizationId,
        req.userId,
        action,
        resourceType,
        resourceId,
        `${req.method} ${req.path}`,
        req.originalBody,
        req.body,
        req.ip,
        req.get('user-agent'),
        req.requestId,
        res.statusCode >= 400 ? 'failure' : 'success',
        undefined
      ).catch((err) => console.error('Audit logging error:', err));
    }

    return originalJson(data);
  };

  next();
};

/**
 * Helper function to extract resource type from request path
 */
const extractResourceType = (path: string): string => {
  // Examples: /api/budgets/123 -> budgets, /api/transactions -> transactions
  const match = path.match(/\/api\/([a-z]+)/i);
  return match ? match[1] : 'unknown';
};

/**
 * Middleware to log errors with audit context
 */
export const auditErrorLogger = (
  err: any,
  req: AuditLogRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.userId && req.organizationId) {
    const resourceType = extractResourceType(req.path);

    logAuditEvent(
      req.organizationId,
      req.userId,
      'create',
      resourceType,
      req.params.id || null,
      `${req.method} ${req.path} (ERROR)`,
      undefined,
      undefined,
      req.ip,
      req.get('user-agent'),
      req.requestId,
      'failure',
      err.message
    ).catch((logErr) => console.error('Failed to log error audit:', logErr));
  }

  next(err);
};

/**
 * Get audit logs for organization
 */
export const getAuditLogs = async (
  organizationId: number,
  filters?: {
    userId?: number;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<any[]> => {
  let sql = `SELECT * FROM audit_logs WHERE organization_id = $1`;
  const params: any[] = [organizationId];
  let paramIndex = 2;

  if (filters?.userId) {
    sql += ` AND user_id = $${paramIndex}`;
    params.push(filters.userId);
    paramIndex++;
  }

  if (filters?.action) {
    sql += ` AND action = $${paramIndex}`;
    params.push(filters.action);
    paramIndex++;
  }

  if (filters?.resourceType) {
    sql += ` AND resource_type = $${paramIndex}`;
    params.push(filters.resourceType);
    paramIndex++;
  }

  if (filters?.startDate) {
    sql += ` AND created_at >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }

  if (filters?.endDate) {
    sql += ` AND created_at <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }

  sql += ` ORDER BY created_at DESC`;

  if (filters?.limit) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;
  }

  if (filters?.offset) {
    sql += ` OFFSET $${paramIndex}`;
    params.push(filters.offset);
    paramIndex++;
  }

  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

/**
 * Export audit logs as JSON
 */
export const exportAuditLogs = async (
  organizationId: number,
  format: 'json' | 'csv' = 'json'
): Promise<string> => {
  try {
    const logs = await getAuditLogs(organizationId, { limit: 100000 });

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'ID',
        'User ID',
        'Action',
        'Resource Type',
        'Resource ID',
        'Description',
        'Status',
        'Created At',
      ];
      const rows = logs.map((log) => [
        log.id,
        log.user_id || '',
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.description.replace(/"/g, '""'),
        log.status,
        log.created_at,
      ]);

      return (
        headers.map((h) => `"${h}"`).join(',') +
        '\n' +
        rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
      );
    } else {
      // JSON format
      return JSON.stringify(logs, null, 2);
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw error;
  }
};
