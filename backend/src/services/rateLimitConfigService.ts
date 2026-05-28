import { pool } from '../config/database';

/**
 * Rate Limit Config Service
 * Manages per-endpoint granular rate limiting configuration
 * Allows per-endpoint overrides with smart defaults
 */

export interface EndpointRateLimit {
  id: number;
  organization_id: number;
  endpoint_pattern: string;
  method: string;
  limit_per_minute?: number;
  limit_per_hour?: number;
  limit_per_day?: number;
  burst_allowance: number;
  alert_threshold_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RateLimitStatus {
  tier: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  usage_minute: number;
  usage_hour: number;
  usage_day: number;
  remaining_minute: number;
  remaining_hour: number;
  remaining_day: number;
  reset_at: string;
  alert_threshold_percent: number;
}

export interface QuotaAlert {
  organization_id: number;
  endpoint_pattern: string;
  method: string;
  usage_percent: number;
  current_usage: number;
  limit: number;
  limit_window: string;
}

// Smart defaults for different endpoint types
const ENDPOINT_DEFAULTS: {
  [key: string]: { minute?: number; hour?: number; day?: number };
} = {
  // Auth endpoints - strict
  'POST /api/auth/login': { minute: 5, hour: 20, day: 100 },
  'POST /api/auth/signup': { minute: 3, hour: 10, day: 50 },
  'POST /api/auth/refresh': { minute: 10, hour: 100, day: 1000 },

  // Write endpoints - moderate
  'POST /api/': { minute: 30, hour: 300, day: 3000 },
  'PUT /api/': { minute: 30, hour: 300, day: 3000 },
  'DELETE /api/': { minute: 20, hour: 200, day: 2000 },

  // Read endpoints - relaxed
  'GET /api/': { minute: 60, hour: 600, day: 6000 },

  // Organization/admin endpoints - moderate
  'POST /api/organizations': { minute: 10, hour: 50, day: 500 },
  'PUT /api/organizations': { minute: 20, hour: 100, day: 1000 },
  'DELETE /api/organizations': { minute: 5, hour: 20, day: 100 },

  // Audit logs - strict (sensitive data)
  'GET /api/audit-logs': { minute: 10, hour: 100, day: 1000 },
  'POST /api/audit-logs/export': { minute: 5, hour: 20, day: 100 },
};

/**
 * Get rate limit for an endpoint
 * Returns custom limit or organization tier default
 */
export async function getEndpointRateLimit(
  organizationId: number,
  endpoint: string,
  method: string
): Promise<EndpointRateLimit | null> {
  try {
    // Exact match first
    let result = await pool.query(
      `SELECT * FROM endpoint_rate_limits
       WHERE organization_id = $1 AND endpoint_pattern = $2 AND method = $3 AND is_active = true`,
      [organizationId, endpoint, method]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Pattern matching (e.g., "GET /api/budgets/*" matches "GET /api/budgets/123")
    const patterns = Object.keys(ENDPOINT_DEFAULTS)
      .filter((p) => p.startsWith(method))
      .sort((a, b) => b.length - a.length); // Longest match first

    for (const pattern of patterns) {
      const regex = new RegExp(
        '^' + pattern.replace('*', '.*').replace(/\//g, '\\/') + '$'
      );
      if (regex.test(method + ' ' + endpoint)) {
        result = await pool.query(
          `SELECT * FROM endpoint_rate_limits
           WHERE organization_id = $1 AND endpoint_pattern = $2 AND method = $3 AND is_active = true`,
          [organizationId, pattern, method]
        );

        if (result.rows.length > 0) {
          return result.rows[0];
        }

        break;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting endpoint rate limit:', error);
    return null;
  }
}

/**
 * Set per-endpoint rate limit override
 * Admin only operation
 */
export async function setEndpointRateLimit(
  organizationId: number,
  endpointPattern: string,
  method: string,
  limits: {
    limit_per_minute?: number;
    limit_per_hour?: number;
    limit_per_day?: number;
    alert_threshold_percent?: number;
  }
): Promise<EndpointRateLimit> {
  try {
    const result = await pool.query(
      `INSERT INTO endpoint_rate_limits
       (organization_id, endpoint_pattern, method, limit_per_minute, limit_per_hour, limit_per_day, alert_threshold_percent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (organization_id, endpoint_pattern, method)
       DO UPDATE SET
         limit_per_minute = COALESCE($4, endpoint_rate_limits.limit_per_minute),
         limit_per_hour = COALESCE($5, endpoint_rate_limits.limit_per_hour),
         limit_per_day = COALESCE($6, endpoint_rate_limits.limit_per_day),
         alert_threshold_percent = COALESCE($7, endpoint_rate_limits.alert_threshold_percent),
         updated_at = NOW()
       RETURNING *`,
      [
        organizationId,
        endpointPattern,
        method,
        limits.limit_per_minute,
        limits.limit_per_hour,
        limits.limit_per_day,
        limits.alert_threshold_percent || 80,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error setting endpoint rate limit:', error);
    throw new Error('Failed to set endpoint rate limit');
  }
}

/**
 * Get organization's tier
 * Determines default rate limits
 */
export async function getOrgRateLimitTier(
  organizationId: number
): Promise<string> {
  try {
    const result = await pool.query(
      `SELECT tier FROM api_rate_limits WHERE organization_id = $1`,
      [organizationId]
    );

    if (result.rows.length === 0) {
      return 'free';
    }

    return result.rows[0].tier;
  } catch (error) {
    console.error('Error getting organization tier:', error);
    return 'free';
  }
}

/**
 * Check if request is within rate limits
 * Returns detailed status
 */
export async function checkRateLimit(
  organizationId: number,
  endpoint: string,
  method: string
): Promise<RateLimitStatus | null> {
  try {
    // Get org tier and limits
    const tierResult = await pool.query(
      `SELECT tier, requests_per_minute, requests_per_hour, requests_per_day
       FROM api_rate_limits
       WHERE organization_id = $1 AND is_active = true`,
      [organizationId]
    );

    if (tierResult.rows.length === 0) {
      return null;
    }

    const orgLimits = tierResult.rows[0];

    // Check for endpoint-specific overrides
    const customLimit = await getEndpointRateLimit(
      organizationId,
      endpoint,
      method
    );

    // Use custom limits if set, otherwise use org defaults
    const minute = customLimit?.limit_per_minute || orgLimits.requests_per_minute;
    const hour = customLimit?.limit_per_hour || orgLimits.requests_per_hour;
    const day = customLimit?.limit_per_day || orgLimits.requests_per_day;

    // Get current usage
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const usageResult = await pool.query(
      `SELECT
         SUM(CASE WHEN created_at >= $2 THEN 1 ELSE 0 END) as minute_count,
         SUM(CASE WHEN created_at >= $3 THEN 1 ELSE 0 END) as hour_count,
         SUM(CASE WHEN created_at >= $4 THEN 1 ELSE 0 END) as day_count
       FROM api_usage_logs
       WHERE organization_id = $1`,
      [organizationId, oneMinuteAgo, oneHourAgo, oneDayAgo]
    );

    const usage = usageResult.rows[0];
    const usageMinute = parseInt(usage.minute_count || 0);
    const usageHour = parseInt(usage.hour_count || 0);
    const usageDay = parseInt(usage.day_count || 0);

    return {
      tier: orgLimits.tier,
      requests_per_minute: minute,
      requests_per_hour: hour,
      requests_per_day: day,
      usage_minute: usageMinute,
      usage_hour: usageHour,
      usage_day: usageDay,
      remaining_minute: Math.max(0, minute - usageMinute),
      remaining_hour: Math.max(0, hour - usageHour),
      remaining_day: Math.max(0, day - usageDay),
      reset_at: new Date(now.getTime() + 60 * 1000).toISOString(),
      alert_threshold_percent: customLimit?.alert_threshold_percent || 80,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return null;
  }
}

/**
 * Get current quota alerts for organization
 * Returns list of endpoints exceeding threshold
 */
export async function getQuotaAlerts(
  organizationId: number
): Promise<QuotaAlert[]> {
  try {
    const alerts: QuotaAlert[] = [];

    // Get organization limits
    const orgResult = await pool.query(
      `SELECT tier, requests_per_minute, requests_per_hour, requests_per_day
       FROM api_rate_limits
       WHERE organization_id = $1`,
      [organizationId]
    );

    if (orgResult.rows.length === 0) {
      return alerts;
    }

    const orgLimits = orgResult.rows[0];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Check endpoint-specific limits
    const endpointResult = await pool.query(
      `SELECT DISTINCT endpoint, method FROM api_usage_logs
       WHERE organization_id = $1 AND created_at >= $2`,
      [organizationId, oneDayAgo]
    );

    for (const row of endpointResult.rows) {
      const customLimit = await getEndpointRateLimit(
        organizationId,
        row.endpoint,
        row.method
      );

      if (!customLimit?.is_active) continue;

      const threshold = customLimit.alert_threshold_percent || 80;

      // Check minute limit
      if (customLimit.limit_per_minute) {
        const minuteUsage = await pool.query(
          `SELECT COUNT(*) as count FROM api_usage_logs
           WHERE organization_id = $1 AND endpoint = $2 AND method = $3 AND created_at >= $4`,
          [organizationId, row.endpoint, row.method, oneMinuteAgo]
        );

        const count = parseInt(minuteUsage.rows[0].count);
        const percent = (count / customLimit.limit_per_minute) * 100;

        if (percent >= threshold) {
          alerts.push({
            organization_id: organizationId,
            endpoint_pattern: row.endpoint,
            method: row.method,
            usage_percent: percent,
            current_usage: count,
            limit: customLimit.limit_per_minute,
            limit_window: 'minute',
          });
        }
      }

      // Check hour limit
      if (customLimit.limit_per_hour) {
        const hourUsage = await pool.query(
          `SELECT COUNT(*) as count FROM api_usage_logs
           WHERE organization_id = $1 AND endpoint = $2 AND method = $3 AND created_at >= $4`,
          [organizationId, row.endpoint, row.method, oneHourAgo]
        );

        const count = parseInt(hourUsage.rows[0].count);
        const percent = (count / customLimit.limit_per_hour) * 100;

        if (percent >= threshold) {
          alerts.push({
            organization_id: organizationId,
            endpoint_pattern: row.endpoint,
            method: row.method,
            usage_percent: percent,
            current_usage: count,
            limit: customLimit.limit_per_hour,
            limit_window: 'hour',
          });
        }
      }

      // Check day limit
      if (customLimit.limit_per_day) {
        const dayUsage = await pool.query(
          `SELECT COUNT(*) as count FROM api_usage_logs
           WHERE organization_id = $1 AND endpoint = $2 AND method = $3 AND created_at >= $4`,
          [organizationId, row.endpoint, row.method, oneDayAgo]
        );

        const count = parseInt(dayUsage.rows[0].count);
        const percent = (count / customLimit.limit_per_day) * 100;

        if (percent >= threshold) {
          alerts.push({
            organization_id: organizationId,
            endpoint_pattern: row.endpoint,
            method: row.method,
            usage_percent: percent,
            current_usage: count,
            limit: customLimit.limit_per_day,
            limit_window: 'day',
          });
        }
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error getting quota alerts:', error);
    return [];
  }
}

/**
 * Get rate limit usage for organization
 */
export async function getRateLimitUsage(
  organizationId: number,
  period: 'today' | 'week' | 'month' = 'today'
): Promise<{
  total_requests: number;
  unique_endpoints: number;
  unique_users: number;
  rate_limited_count: number;
}> {
  try {
    let dateFilter = '';

    if (period === 'today') {
      dateFilter = "created_at >= CURRENT_DATE";
    } else if (period === 'week') {
      dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const result = await pool.query(
      `SELECT
         COUNT(*) as total_requests,
         COUNT(DISTINCT endpoint) as unique_endpoints,
         COUNT(DISTINCT user_id) as unique_users,
         SUM(CASE WHEN was_rate_limited THEN 1 ELSE 0 END) as rate_limited_count
       FROM api_usage_logs
       WHERE organization_id = $1 AND ${dateFilter}`,
      [organizationId]
    );

    return {
      total_requests: parseInt(result.rows[0].total_requests || 0),
      unique_endpoints: parseInt(result.rows[0].unique_endpoints || 0),
      unique_users: parseInt(result.rows[0].unique_users || 0),
      rate_limited_count: parseInt(result.rows[0].rate_limited_count || 0),
    };
  } catch (error) {
    console.error('Error getting rate limit usage:', error);
    throw new Error('Failed to get rate limit usage');
  }
}
