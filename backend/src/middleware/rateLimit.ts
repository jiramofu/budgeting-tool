import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { PermissionRequest } from './permissions';

export interface RateLimitRequest extends PermissionRequest {
  requestId?: string;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
    limited: boolean;
  };
}

/**
 * In-memory cache for rate limit tracking (production should use Redis)
 * Format: {organizationId}:{endpoint}:{minute} -> request count
 */
const requestCache: { [key: string]: { count: number; resetTime: number } } = {};

/**
 * Get rate limit config for organization
 */
const getRateLimitConfig = async (organizationId: number) => {
  try {
    const result = await query(
      `SELECT requests_per_minute, requests_per_hour, requests_per_day, burst_allowance
       FROM api_rate_limits
       WHERE organization_id = $1`,
      [organizationId]
    );

    if (!result.rows[0]) {
      // Default limits if not configured
      return {
        requests_per_minute: 60,
        requests_per_hour: 1000,
        requests_per_day: 10000,
        burst_allowance: 10,
      };
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching rate limit config:', error);
    // Return defaults on error
    return {
      requests_per_minute: 60,
      requests_per_hour: 1000,
      requests_per_day: 10000,
      burst_allowance: 10,
    };
  }
};

/**
 * Get current request count for organization
 */
const getRequestCount = async (
  organizationId: number,
  window: 'minute' | 'hour' | 'day'
): Promise<number> => {
  const now = new Date();
  let startTime: Date;

  if (window === 'minute') {
    startTime = new Date(now.getTime() - 60 * 1000);
  } else if (window === 'hour') {
    startTime = new Date(now.getTime() - 60 * 60 * 1000);
  } else {
    startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM api_usage_logs
       WHERE organization_id = $1 AND created_at >= $2`,
      [organizationId, startTime]
    );

    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error(`Error counting requests for ${window}:`, error);
    return 0;
  }
};

/**
 * Log API usage
 */
const logApiUsage = async (
  organizationId: number,
  userId: number | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  ipAddress: string | undefined,
  requestId: string | undefined,
  wasRateLimited: boolean
): Promise<void> => {
  try {
    await query(
      `INSERT INTO api_usage_logs (
        organization_id, user_id, endpoint, method, status_code, response_time_ms,
        ip_address, request_id, was_rate_limited, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
      [
        organizationId,
        userId,
        endpoint,
        method,
        statusCode,
        responseTime,
        ipAddress || null,
        requestId || null,
        wasRateLimited,
      ]
    );
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
};

/**
 * Main rate limiting middleware
 */
export const applyRateLimit = async (
  req: RateLimitRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip rate limiting if no organization (unauthenticated endpoints)
  if (!req.organizationId) {
    return next();
  }

  const startTime = Date.now();

  try {
    const config = await getRateLimitConfig(req.organizationId);

    // Check minute-level limit
    const minuteCount = await getRequestCount(req.organizationId, 'minute');
    const minuteLimit = config.requests_per_minute;

    if (minuteCount >= minuteLimit) {
      const rateLimitInfo = {
        limit: minuteLimit,
        remaining: 0,
        reset: Math.floor((Date.now() + 60 * 1000) / 1000),
        limited: true,
      };

      req.rateLimitInfo = rateLimitInfo;

      // Log usage
      logApiUsage(
        req.organizationId,
        req.userId || null,
        req.path,
        req.method,
        429,
        Date.now() - startTime,
        req.ip,
        req.requestId,
        true
      ).catch((err) => console.error('Failed to log rate limit event:', err));

      res.setHeader('X-RateLimit-Limit', rateLimitInfo.limit);
      res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitInfo.reset);
      res.setHeader('Retry-After', '60');

      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: 60,
        limit: minuteLimit,
      });
    }

    // Set rate limit headers
    const remaining = minuteLimit - minuteCount;
    const reset = Math.floor((Date.now() + 60 * 1000) / 1000);

    req.rateLimitInfo = {
      limit: minuteLimit,
      remaining,
      reset,
      limited: false,
    };

    res.setHeader('X-RateLimit-Limit', minuteLimit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    // Hook into response to log usage after response is sent
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      logApiUsage(
        req.organizationId!,
        req.userId || null,
        req.path,
        req.method,
        res.statusCode,
        Date.now() - startTime,
        req.ip,
        req.requestId,
        false
      ).catch((err) => console.error('Failed to log API usage:', err));

      return originalJson(data);
    };

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // On error, allow the request to proceed
    next();
  }
};

/**
 * Get rate limit status for organization
 */
export const getRateLimitStatus = async (organizationId: number) => {
  try {
    const config = await getRateLimitConfig(organizationId);
    const minuteCount = await getRequestCount(organizationId, 'minute');
    const hourCount = await getRequestCount(organizationId, 'hour');
    const dayCount = await getRequestCount(organizationId, 'day');

    return {
      minute: {
        limit: config.requests_per_minute,
        used: minuteCount,
        remaining: Math.max(0, config.requests_per_minute - minuteCount),
        percentage: Math.round((minuteCount / config.requests_per_minute) * 100),
      },
      hour: {
        limit: config.requests_per_hour,
        used: hourCount,
        remaining: Math.max(0, config.requests_per_hour - hourCount),
        percentage: Math.round((hourCount / config.requests_per_hour) * 100),
      },
      day: {
        limit: config.requests_per_day,
        used: dayCount,
        remaining: Math.max(0, config.requests_per_day - dayCount),
        percentage: Math.round((dayCount / config.requests_per_day) * 100),
      },
      tier: 'free', // Would fetch from api_rate_limits in production
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    throw error;
  }
};

/**
 * Update rate limit config for organization
 */
export const updateRateLimitConfig = async (
  organizationId: number,
  config: {
    tier?: string;
    requests_per_minute?: number;
    requests_per_hour?: number;
    requests_per_day?: number;
    burst_allowance?: number;
  }
): Promise<void> => {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (config.tier) {
      updates.push(`tier = $${paramIndex}`);
      values.push(config.tier);
      paramIndex++;
    }

    if (config.requests_per_minute !== undefined) {
      updates.push(`requests_per_minute = $${paramIndex}`);
      values.push(config.requests_per_minute);
      paramIndex++;
    }

    if (config.requests_per_hour !== undefined) {
      updates.push(`requests_per_hour = $${paramIndex}`);
      values.push(config.requests_per_hour);
      paramIndex++;
    }

    if (config.requests_per_day !== undefined) {
      updates.push(`requests_per_day = $${paramIndex}`);
      values.push(config.requests_per_day);
      paramIndex++;
    }

    if (config.burst_allowance !== undefined) {
      updates.push(`burst_allowance = $${paramIndex}`);
      values.push(config.burst_allowance);
      paramIndex++;
    }

    if (updates.length === 0) {
      return;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(organizationId);

    const sql = `UPDATE api_rate_limits SET ${updates.join(', ')} WHERE organization_id = $${paramIndex}`;

    await query(sql, values);
  } catch (error) {
    console.error('Error updating rate limit config:', error);
    throw error;
  }
};
