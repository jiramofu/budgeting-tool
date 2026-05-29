import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  requireRole,
  validateOrganizationAccess,
} from '../middleware/permissions';
import { getAuditLogs, exportAuditLogs } from '../middleware/auditLog';
import { PermissionRequest } from '../middleware/permissions';
import { Response } from 'express';

const router = Router();

/**
 * Get audit logs for organization
 * GET /api/audit-logs
 * Query params: action, resourceType, userId, startDate, endDate, limit, offset
 */
router.get(
  '/',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const {
        action,
        resourceType,
        userId,
        startDate,
        endDate,
        limit = 100,
        offset = 0,
      } = req.query;

      const filters: any = {
        limit: parseInt(limit as string) || 100,
        offset: parseInt(offset as string) || 0,
      };

      if (action) {
        filters.action = action as string;
      }

      if (resourceType) {
        filters.resourceType = resourceType as string;
      }

      if (userId) {
        filters.userId = parseInt(userId as string);
      }

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const logs = await getAuditLogs(req.organizationId!, filters);

      res.json({
        logs,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: logs.length, // Note: This is simplified; production should include a total count
        },
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

/**
 * Get single audit log entry
 * GET /api/audit-logs/:id
 */
router.get(
  '/:id',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;

      const logs = await getAuditLogs(req.organizationId!, {
        limit: 1,
      });

      const log = logs.find((l: any) => l.id === parseInt(id));

      if (!log) {
        return res.status(404).json({ error: 'Audit log not found' });
      }

      res.json(log);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      res.status(500).json({ error: 'Failed to fetch audit log' });
    }
  }
);

/**
 * Get audit logs summary/statistics
 * GET /api/audit-logs/summary
 */
router.get(
  '/summary/stats',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const logs = await getAuditLogs(req.organizationId!, { limit: 10000 });

      // Aggregate statistics
      const stats = {
        totalEvents: logs.length,
        eventsByAction: {} as { [key: string]: number },
        eventsByResource: {} as { [key: string]: number },
        eventsByStatus: {} as { [key: string]: number },
        eventsByUser: {} as { [key: number]: number },
        successRate: 0,
      };

      logs.forEach((log: any) => {
        // By action
        stats.eventsByAction[log.action] = (stats.eventsByAction[log.action] || 0) + 1;

        // By resource
        stats.eventsByResource[log.resource_type] =
          (stats.eventsByResource[log.resource_type] || 0) + 1;

        // By status
        stats.eventsByStatus[log.status] = (stats.eventsByStatus[log.status] || 0) + 1;

        // By user
        if (log.user_id) {
          stats.eventsByUser[log.user_id] = (stats.eventsByUser[log.user_id] || 0) + 1;
        }
      });

      // Calculate success rate
      const successCount = stats.eventsByStatus['success'] || 0;
      stats.successRate = stats.totalEvents > 0 ? (successCount / stats.totalEvents) * 100 : 0;

      res.json(stats);
    } catch (error) {
      console.error('Error fetching audit summary:', error);
      res.status(500).json({ error: 'Failed to fetch audit summary' });
    }
  }
);

/**
 * Export audit logs
 * GET /api/audit-logs/export/:format
 * Formats: json, csv
 */
router.get(
  '/export/:format',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { format } = req.params;

      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json({ error: 'Invalid export format. Use json or csv' });
      }

      const data = await exportAuditLogs(req.organizationId!, format as 'json' | 'csv');

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
      }

      res.send(data);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({ error: 'Failed to export audit logs' });
    }
  }
);

/**
 * Get audit logs by resource
 * GET /api/audit-logs/resource/:resourceType/:resourceId
 */
router.get(
  '/resource/:resourceType/:resourceId',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin', 'manager']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { resourceType, resourceId } = req.params;

      const logs = await getAuditLogs(req.organizationId!, {
        resourceType,
        limit: 1000,
      });

      const resourceLogs = logs.filter((l: any) => l.resource_id === resourceId);

      res.json(resourceLogs);
    } catch (error) {
      console.error('Error fetching resource audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch resource audit logs' });
    }
  }
);

export default router;
