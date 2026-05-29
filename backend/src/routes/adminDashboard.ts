import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  requireRole,
  validateOrganizationAccess,
} from '../middleware/permissions';
import * as usageAnalytics from '../services/usageAnalyticsService';
import * as rateLimitConfig from '../services/rateLimitConfigService';
import { getAuditRetentionPolicy, getAuditStorageUsage } from '../services/auditRetentionService';
import { PermissionRequest } from '../middleware/permissions';
import { pool } from '../config/database';

const router = Router();

/**
 * Get dashboard summary
 * GET /api/admin/dashboard/summary
 * Returns: org name, tier, member count, active endpoints, storage usage
 */
router.get(
  '/summary',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const orgResult = await pool.query(
        `SELECT name, organization_type, owner_id, created_at FROM organizations WHERE id = $1`,
        [req.organizationId]
      );

      const memberResult = await pool.query(
        `SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1 AND is_active = true`,
        [req.organizationId]
      );

      const tierResult = await pool.query(
        `SELECT tier FROM api_rate_limits WHERE organization_id = $1`,
        [req.organizationId]
      );

      const endpointResult = await pool.query(
        `SELECT COUNT(DISTINCT endpoint) as count FROM api_usage_logs WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
        [req.organizationId]
      );

      const storage = await getAuditStorageUsage(req.organizationId!);
      const policy = await getAuditRetentionPolicy(req.organizationId!);

      res.json({
        organization: {
          id: req.organizationId!,
          name: orgResult.rows[0]?.name || 'Organization',
          type: orgResult.rows[0]?.organization_type || 'team',
          created_at: orgResult.rows[0]?.created_at,
        },
        tier: tierResult.rows[0]?.tier || 'free',
        members: {
          count: parseInt(memberResult.rows[0]?.count || 0),
        },
        activeEndpoints: parseInt(endpointResult.rows[0]?.count || 0),
        storage: {
          activeLogsMB: (storage.activeBytes / 1024 / 1024).toFixed(2),
          archiveLogsMB: (storage.archiveBytes / 1024 / 1024).toFixed(2),
          totalMB: (storage.totalBytes / 1024 / 1024).toFixed(2),
        },
        retentionPolicy: {
          activeDays: policy.active_days,
          archiveDays: policy.archive_days,
          autoDelete: policy.auto_delete,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
  }
);

/**
 * Get API usage metrics
 * GET /api/admin/dashboard/api-usage?period=week&days=7
 * Returns: usage trends and breakdown
 */
router.get(
  '/api-usage',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const days = parseInt((req.query.days as string) || '7');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const endDate = new Date();

      const summary = await usageAnalytics.calculateApiUsageSummary(
        startDate,
        endDate,
        req.organizationId!
      );

      const breakdown = await usageAnalytics.calculateEndpointBreakdown(
        startDate,
        endDate,
        req.organizationId!
      );

      const trend = await usageAnalytics.getUsageTrend(
        req.organizationId!,
        'requests',
        days
      );

      const usage = await rateLimitConfig.getRateLimitUsage(
        req.organizationId!,
        'today'
      );

      res.json({
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        summary,
        endpoints: breakdown,
        trend,
        todayUsage: usage,
      });
    } catch (error) {
      console.error('Error fetching API usage:', error);
      res.status(500).json({ error: 'Failed to fetch API usage metrics' });
    }
  }
);

/**
 * Get audit activity summary
 * GET /api/admin/dashboard/audit-summary?days=30
 * Returns: audit log statistics and activity
 */
router.get(
  '/audit-summary',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const days = parseInt((req.query.days as string) || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await pool.query(
        `SELECT
           action,
           COUNT(*) as count,
           SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
           SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure_count
         FROM audit_logs
         WHERE organization_id = $1 AND created_at >= $2
         GROUP BY action
         ORDER BY count DESC`,
        [req.organizationId!, startDate]
      );

      const resourceResult = await pool.query(
        `SELECT
           resource_type,
           COUNT(*) as count
         FROM audit_logs
         WHERE organization_id = $1 AND created_at >= $2
         GROUP BY resource_type
         ORDER BY count DESC
         LIMIT 10`,
        [req.organizationId!, startDate]
      );

      const userResult = await pool.query(
        `SELECT
           user_id,
           COUNT(*) as count
         FROM audit_logs
         WHERE organization_id = $1 AND created_at >= $2 AND user_id IS NOT NULL
         GROUP BY user_id
         ORDER BY count DESC
         LIMIT 10`,
        [req.organizationId!, startDate]
      );

      const totalResult = await pool.query(
        `SELECT
           COUNT(*) as total_events,
           SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
           SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure_count
         FROM audit_logs
         WHERE organization_id = $1 AND created_at >= $2`,
        [req.organizationId!, startDate]
      );

      const totals = totalResult.rows[0];
      const totalEvents = parseInt(totals.total_events || 0);
      const successCount = parseInt(totals.success_count || 0);
      const successRate =
        totalEvents > 0
          ? Math.round((successCount / totalEvents) * 100 * 100) / 100
          : 100;

      res.json({
        period: {
          days,
          startDate: startDate.toISOString(),
        },
        totals: {
          totalEvents,
          successCount,
          failureCount: parseInt(totals.failure_count || 0),
          successRate,
        },
        byAction: result.rows.map((row: any) => ({
          action: row.action,
          count: parseInt(row.count),
          successCount: parseInt(row.success_count),
          failureCount: parseInt(row.failure_count),
        })),
        byResource: resourceResult.rows.map((row: any) => ({
          resourceType: row.resource_type,
          count: parseInt(row.count),
        })),
        topUsers: userResult.rows.map((row: any) => ({
          userId: row.user_id,
          eventCount: parseInt(row.count),
        })),
      });
    } catch (error) {
      console.error('Error fetching audit summary:', error);
      res.status(500).json({ error: 'Failed to fetch audit summary' });
    }
  }
);

/**
 * Get rate limit status
 * GET /api/admin/dashboard/rate-limits
 * Returns: current rate limits, usage, and alerts
 */
router.get(
  '/rate-limits',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const tierResult = await pool.query(
        `SELECT * FROM api_rate_limits WHERE organization_id = $1`,
        [req.organizationId]
      );

      const limits = tierResult.rows[0];
      const status = await rateLimitConfig.checkRateLimit(
        'GET /api',
        'GET',
        req.organizationId!
      );
      const alerts = await rateLimitConfig.getQuotaAlerts(req.organizationId!);
      const usage = await rateLimitConfig.getRateLimitUsage(
        req.organizationId!,
        'today'
      );

      res.json({
        tier: limits?.tier || 'free',
        globalLimits: {
          requestsPerMinute: limits?.requests_per_minute || 60,
          requestsPerHour: limits?.requests_per_hour || 1000,
          requestsPerDay: limits?.requests_per_day || 10000,
          burstAllowance: limits?.burst_allowance || 10,
        },
        currentStatus: status,
        todayUsage: usage,
        endpointsNearLimit: alerts.length,
        alerts: alerts.slice(0, 5), // Top 5 alerts
      });
    } catch (error) {
      console.error('Error fetching rate limits:', error);
      res.status(500).json({ error: 'Failed to fetch rate limit status' });
    }
  }
);

/**
 * Get member activity
 * GET /api/admin/dashboard/members-activity?days=7
 * Returns: active members and their usage patterns
 */
router.get(
  '/members-activity',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const days = parseInt((req.query.days as string) || '7');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all organization members
      const membersResult = await pool.query(
        `SELECT om.user_id, om.role, u.email, om.created_at
         FROM organization_members om
         JOIN users u ON om.user_id = u.id
         WHERE om.organization_id = $1 AND om.is_active = true
         ORDER BY om.created_at DESC`,
        [req.organizationId]
      );

      // Get activity for each member
      const activity = await usageAnalytics.calculateUserActivity(
        startDate,
        new Date(),
        req.organizationId!
      );

      const members = membersResult.rows.map((member: any) => {
        const userActivity = activity.find((a) => a.userId === member.user_id);
        return {
          userId: member.user_id,
          email: member.email,
          role: member.role,
          joinedAt: member.created_at,
          activity: userActivity || {
            requestCount: 0,
            successCount: 0,
            errorCount: 0,
            lastActive: null,
            avgResponseTime: 0,
          },
        };
      });

      res.json({
        period: {
          days,
          startDate: startDate.toISOString(),
        },
        members: members.sort(
          (a: any, b: any) => (b.activity?.requestCount || 0) - (a.activity?.requestCount || 0)
        ),
      });
    } catch (error) {
      console.error('Error fetching member activity:', error);
      res.status(500).json({ error: 'Failed to fetch member activity' });
    }
  }
);

/**
 * Get storage metrics
 * GET /api/admin/dashboard/storage-metrics
 * Returns: storage usage and retention information
 */
router.get(
  '/storage-metrics',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId || !req.organizationId!) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const storage = await getAuditStorageUsage(req.organizationId!);
      const policy = await getAuditRetentionPolicy(req.organizationId!);

      // Get last 30 days of storage metrics
      const metricsResult = await pool.query(
        `SELECT * FROM storage_metrics
         WHERE organization_id = $1
         ORDER BY metric_date DESC
         LIMIT 30`,
        [req.organizationId]
      );

      res.json({
        current: {
          activeLogsMB: (storage.activeBytes / 1024 / 1024).toFixed(2),
          archiveLogsMB: (storage.archiveBytes / 1024 / 1024).toFixed(2),
          totalMB: (storage.totalBytes / 1024 / 1024).toFixed(2),
          activeLogCount: storage.logCountActive,
          archiveLogCount: storage.logCountArchive,
        },
        retentionPolicy: {
          activeDays: policy.active_days,
          archiveDays: policy.archive_days,
          autoDelete: policy.auto_delete,
          exportFormat: policy.export_format,
        },
        historicalMetrics: metricsResult.rows.map((row: any) => ({
          date: row.metric_date,
          activeSizeMB: parseFloat(row.active_logs_size_mb),
          archiveSizeMB: parseFloat(row.archive_logs_size_mb),
          totalSizeMB: parseFloat(row.total_size_mb),
          growthPercent: row.growth_percent,
        })),
      });
    } catch (error) {
      console.error('Error fetching storage metrics:', error);
      res.status(500).json({ error: 'Failed to fetch storage metrics' });
    }
  }
);

export default router;
