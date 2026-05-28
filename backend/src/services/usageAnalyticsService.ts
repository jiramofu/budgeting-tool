import { pool } from '../config/database';

/**
 * Usage Analytics Service
 * Pre-calculates daily usage metrics for fast dashboard queries
 * Tracks API usage patterns and endpoint performance
 */

export interface ApiUsageSummary {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  errorCount: number;
  rateLimitedCount: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  topUsers: Array<{ userId: number; count: number }>;
}

export interface EndpointBreakdown {
  endpoint: string;
  method: string;
  count: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
}

export interface UserActivity {
  userId: number;
  requestCount: number;
  successCount: number;
  errorCount: number;
  lastActive: string;
  avgResponseTime: number;
}

export interface UsageTrendData {
  date: string;
  requests: number;
  errors: number;
  responseTime: number;
  successRate: number;
}

/**
 * Calculate API usage summary for a period
 */
export async function calculateApiUsageSummary(
  organizationId: number,
  startDate: Date,
  endDate: Date
): Promise<ApiUsageSummary> {
  try {
    // Get basic statistics
    const statsResult = await pool.query(
      `SELECT
         COUNT(*) as total_requests,
         SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
         SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
         SUM(CASE WHEN was_rate_limited THEN 1 ELSE 0 END) as rate_limited_count,
         COALESCE(AVG(response_time_ms), 0) as avg_response_time
       FROM api_usage_logs
       WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3`,
      [organizationId, startDate, endDate]
    );

    const stats = statsResult.rows[0];
    const totalRequests = parseInt(stats.total_requests || 0);
    const successCount = parseInt(stats.success_count || 0);
    const errorCount = parseInt(stats.error_count || 0);
    const successRate =
      totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;

    // Get top endpoints
    const endpointsResult = await pool.query(
      `SELECT endpoint, COUNT(*) as count
       FROM api_usage_logs
       WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY endpoint
       ORDER BY count DESC
       LIMIT 10`,
      [organizationId, startDate, endDate]
    );

    // Get top users
    const usersResult = await pool.query(
      `SELECT user_id, COUNT(*) as count
       FROM api_usage_logs
       WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3 AND user_id IS NOT NULL
       GROUP BY user_id
       ORDER BY count DESC
       LIMIT 10`,
      [organizationId, startDate, endDate]
    );

    return {
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: Math.round(parseFloat(stats.avg_response_time) * 100) / 100,
      errorCount: parseInt(stats.error_count || 0),
      rateLimitedCount: parseInt(stats.rate_limited_count || 0),
      topEndpoints: endpointsResult.rows.map((row: any) => ({
        endpoint: row.endpoint,
        count: parseInt(row.count),
      })),
      topUsers: usersResult.rows.map((row: any) => ({
        userId: row.user_id,
        count: parseInt(row.count),
      })),
    };
  } catch (error) {
    console.error('Error calculating API usage summary:', error);
    throw new Error('Failed to calculate usage summary');
  }
}

/**
 * Calculate endpoint-specific breakdown
 */
export async function calculateEndpointBreakdown(
  organizationId: number,
  startDate: Date,
  endDate: Date
): Promise<EndpointBreakdown[]> {
  try {
    const result = await pool.query(
      `SELECT
         endpoint,
         method,
         COUNT(*) as total_count,
         SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
         SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
         COALESCE(AVG(response_time_ms), 0) as avg_response_time,
         COALESCE(MAX(response_time_ms), 0) as max_response_time,
         COALESCE(MIN(response_time_ms), 0) as min_response_time
       FROM api_usage_logs
       WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY endpoint, method
       ORDER BY total_count DESC`,
      [organizationId, startDate, endDate]
    );

    return result.rows.map((row: any) => {
      const totalCount = parseInt(row.total_count);
      const successCount = parseInt(row.success_count);
      const successRate =
        totalCount > 0 ? (successCount / totalCount) * 100 : 100;

      return {
        endpoint: row.endpoint,
        method: row.method,
        count: totalCount,
        successCount,
        errorCount: parseInt(row.error_count || 0),
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(parseFloat(row.avg_response_time) * 100) / 100,
        maxResponseTime: parseInt(row.max_response_time),
        minResponseTime: parseInt(row.min_response_time),
      };
    });
  } catch (error) {
    console.error('Error calculating endpoint breakdown:', error);
    throw new Error('Failed to calculate endpoint breakdown');
  }
}

/**
 * Calculate user activity metrics
 */
export async function calculateUserActivity(
  organizationId: number,
  startDate: Date,
  endDate: Date
): Promise<UserActivity[]> {
  try {
    const result = await pool.query(
      `SELECT
         user_id,
         COUNT(*) as request_count,
         SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
         SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
         MAX(created_at) as last_active,
         COALESCE(AVG(response_time_ms), 0) as avg_response_time
       FROM api_usage_logs
       WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3 AND user_id IS NOT NULL
       GROUP BY user_id
       ORDER BY request_count DESC`,
      [organizationId, startDate, endDate]
    );

    return result.rows.map((row: any) => ({
      userId: row.user_id,
      requestCount: parseInt(row.request_count),
      successCount: parseInt(row.success_count),
      errorCount: parseInt(row.error_count || 0),
      lastActive: row.last_active,
      avgResponseTime: Math.round(parseFloat(row.avg_response_time) * 100) / 100,
    }));
  } catch (error) {
    console.error('Error calculating user activity:', error);
    throw new Error('Failed to calculate user activity');
  }
}

/**
 * Save pre-calculated daily usage summary
 * Called by nightly scheduler job
 */
export async function saveDailyUsageSummary(
  organizationId: number,
  summaryDate: Date
): Promise<void> {
  try {
    const dateStr = summaryDate.toISOString().split('T')[0];
    const nextDay = new Date(summaryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Calculate all metrics for the day
    const statsResult = await pool.query(
      `SELECT
         COUNT(*) as total_requests,
         COALESCE(SUM(bytes_sent), 0) as total_bytes_sent,
         COALESCE(SUM(bytes_received), 0) as total_bytes_received,
         SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
         SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
         COALESCE(AVG(response_time_ms), 0) as avg_response_time,
         COALESCE(MAX(response_time_ms), 0) as max_response_time,
         COALESCE(MIN(response_time_ms), 0) as min_response_time,
         SUM(CASE WHEN was_rate_limited THEN 1 ELSE 0 END) as rate_limited_count,
         SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hit_count
       FROM api_usage_logs
       WHERE organization_id = $1 AND DATE(created_at) = $2`,
      [organizationId, dateStr]
    );

    const stats = statsResult.rows[0];
    const totalRequests = parseInt(stats.total_requests || 0);

    if (totalRequests === 0) {
      return; // No data for this day
    }

    const successCount = parseInt(stats.success_count || 0);
    const successRate =
      totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;
    const cacheHitRate =
      totalRequests > 0
        ? (parseInt(stats.cache_hit_count || 0) / totalRequests) * 100
        : 0;

    // Get endpoint breakdown
    const endpointsResult = await pool.query(
      `SELECT endpoint, COUNT(*) as count
       FROM api_usage_logs
       WHERE organization_id = $1 AND DATE(created_at) = $2
       GROUP BY endpoint
       ORDER BY count DESC
       LIMIT 20`,
      [organizationId, dateStr]
    );

    const requestsByEndpoint = endpointsResult.rows.reduce(
      (acc: any, row: any) => {
        acc[row.endpoint] = parseInt(row.count);
        return acc;
      },
      {}
    );

    // Get user breakdown
    const usersResult = await pool.query(
      `SELECT user_id, COUNT(*) as count
       FROM api_usage_logs
       WHERE organization_id = $1 AND DATE(created_at) = $2 AND user_id IS NOT NULL
       GROUP BY user_id
       ORDER BY count DESC
       LIMIT 20`,
      [organizationId, dateStr]
    );

    const requestsByUser = usersResult.rows.reduce((acc: any, row: any) => {
      acc[row.user_id] = parseInt(row.count);
      return acc;
    }, {});

    // Get status breakdown
    const statusResult = await pool.query(
      `SELECT status_code, COUNT(*) as count
       FROM api_usage_logs
       WHERE organization_id = $1 AND DATE(created_at) = $2
       GROUP BY status_code`,
      [organizationId, dateStr]
    );

    const requestsByStatus = statusResult.rows.reduce(
      (acc: any, row: any) => {
        acc[row.status_code] = parseInt(row.count);
        return acc;
      },
      {}
    );

    // Get top endpoints
    const topEndpoints = endpointsResult.rows.slice(0, 5).map((row: any) => ({
      endpoint: row.endpoint,
      count: parseInt(row.count),
    }));

    const topUsers = usersResult.rows.slice(0, 5).map((row: any) => ({
      user_id: row.user_id,
      count: parseInt(row.count),
    }));

    // Upsert summary record
    await pool.query(
      `INSERT INTO usage_summaries
       (organization_id, summary_date, total_requests, total_bytes_sent, total_bytes_received,
        success_count, error_count, success_rate, avg_response_time_ms, max_response_time_ms,
        min_response_time_ms, requests_by_endpoint, requests_by_user, requests_by_status,
        top_endpoints, top_users, rate_limited_count, cache_hit_rate, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
       ON CONFLICT (organization_id, summary_date)
       DO UPDATE SET
         total_requests = $3,
         total_bytes_sent = $4,
         total_bytes_received = $5,
         success_count = $6,
         error_count = $7,
         success_rate = $8,
         avg_response_time_ms = $9,
         max_response_time_ms = $10,
         min_response_time_ms = $11,
         requests_by_endpoint = $12,
         requests_by_user = $13,
         requests_by_status = $14,
         top_endpoints = $15,
         top_users = $16,
         rate_limited_count = $17,
         cache_hit_rate = $18,
         updated_at = NOW()`,
      [
        organizationId,
        dateStr,
        totalRequests,
        parseInt(stats.total_bytes_sent || 0),
        parseInt(stats.total_bytes_received || 0),
        successCount,
        parseInt(stats.error_count || 0),
        Math.round(successRate * 100) / 100,
        Math.round(parseFloat(stats.avg_response_time) * 100) / 100,
        parseInt(stats.max_response_time),
        parseInt(stats.min_response_time),
        JSON.stringify(requestsByEndpoint),
        JSON.stringify(requestsByUser),
        JSON.stringify(requestsByStatus),
        JSON.stringify(topEndpoints),
        JSON.stringify(topUsers),
        parseInt(stats.rate_limited_count || 0),
        Math.round(cacheHitRate * 100) / 100,
      ]
    );

    console.log(
      `Saved usage summary for org ${organizationId} on ${dateStr}: ${totalRequests} requests`
    );
  } catch (error) {
    console.error('Error saving daily usage summary:', error);
    throw new Error('Failed to save usage summary');
  }
}

/**
 * Get usage trend data for charts
 */
export async function getUsageTrend(
  organizationId: number,
  metric: 'requests' | 'errors' | 'responseTime' = 'requests',
  days: number = 30
): Promise<UsageTrendData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await pool.query(
      `SELECT
         summary_date as date,
         total_requests as requests,
         error_count as errors,
         ROUND(CAST(avg_response_time_ms AS NUMERIC), 2) as response_time,
         success_rate
       FROM usage_summaries
       WHERE organization_id = $1 AND summary_date >= $2
       ORDER BY summary_date ASC`,
      [organizationId, startDate.toISOString().split('T')[0]]
    );

    return result.rows.map((row: any) => ({
      date: row.date,
      requests: parseInt(row.requests),
      errors: parseInt(row.errors),
      responseTime: parseFloat(row.response_time),
      successRate: parseFloat(row.success_rate),
    }));
  } catch (error) {
    console.error('Error getting usage trend:', error);
    throw new Error('Failed to get usage trend');
  }
}

/**
 * Calculate storage metrics
 * Called by nightly scheduler
 */
export async function calculateStorageMetrics(
  organizationId: number,
  metricDate: Date
): Promise<void> {
  try {
    // Calculate active logs size
    const activeResult = await pool.query(
      `SELECT COUNT(*) as log_count,
              COALESCE(SUM(OCTET_LENGTH(changes::text) + OCTET_LENGTH(before_values::text) + OCTET_LENGTH(after_values::text)) / 1024.0 / 1024.0, 0) as size_mb
       FROM audit_logs
       WHERE organization_id = $1`,
      [organizationId]
    );

    // Calculate archived logs size
    const archiveResult = await pool.query(
      `SELECT COUNT(*) as log_count,
              COALESCE(SUM(archive_size_bytes) / 1024.0 / 1024.0, 0) as size_mb
       FROM audit_log_archives
       WHERE organization_id = $1`,
      [organizationId]
    );

    const activeLogs = activeResult.rows[0];
    const archiveLogs = archiveResult.rows[0];

    const activeSize = parseFloat(activeLogs.size_mb || 0);
    const archiveSize = parseFloat(archiveLogs.size_mb || 0);
    const totalSize = activeSize + archiveSize;

    const dateStr = metricDate.toISOString().split('T')[0];

    // Get previous day's total for growth calculation
    const previousResult = await pool.query(
      `SELECT COALESCE(total_size_mb, 0) as prev_size
       FROM storage_metrics
       WHERE organization_id = $1 AND metric_date = $2
       LIMIT 1`,
      [organizationId, new Date(metricDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    );

    const prevSize = parseFloat(previousResult.rows[0]?.prev_size || 0);
    const growthPercent =
      prevSize > 0
        ? Math.round(((totalSize - prevSize) / prevSize) * 100 * 100) / 100
        : 0;

    // Upsert storage metric
    await pool.query(
      `INSERT INTO storage_metrics
       (organization_id, metric_date, active_logs_count, active_logs_size_mb, archive_logs_count, archive_logs_size_mb, total_size_mb, growth_percent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (organization_id, metric_date)
       DO UPDATE SET
         active_logs_count = $3,
         active_logs_size_mb = $4,
         archive_logs_count = $5,
         archive_logs_size_mb = $6,
         total_size_mb = $7,
         growth_percent = $8`,
      [
        organizationId,
        dateStr,
        parseInt(activeLogs.log_count),
        activeSize,
        parseInt(archiveLogs.log_count),
        archiveSize,
        totalSize,
        growthPercent,
      ]
    );

    console.log(
      `Calculated storage metrics for org ${organizationId} on ${dateStr}: ${totalSize}MB`
    );
  } catch (error) {
    console.error('Error calculating storage metrics:', error);
    throw new Error('Failed to calculate storage metrics');
  }
}
