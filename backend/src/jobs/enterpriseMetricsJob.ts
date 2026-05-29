import { pool } from '../config/database';
import * as auditRetention from '../services/auditRetentionService';
import * as usageAnalytics from '../services/usageAnalyticsService';
import * as rateLimitConfig from '../services/rateLimitConfigService';
import { sendEmail } from '../services/emailService';

/**
 * Enterprise Metrics Job
 * Handles nightly scheduled jobs for:
 * - Audit log archival and cleanup
 * - Usage analytics aggregation
 * - Quota alerts
 * - Storage metrics
 *
 * Follows the pattern of phase4-calculation-jobs with recursive setTimeout
 */

let auditArchivalJobTimer: NodeJS.Timeout | null = null;
let auditDeletionJobTimer: NodeJS.Timeout | null = null;
let usageSummaryJobTimer: NodeJS.Timeout | null = null;
let quotaAlertJobTimer: NodeJS.Timeout | null = null;
let storageMetricsJobTimer: NodeJS.Timeout | null = null;

interface JobStatus {
  jobName: string;
  lastExecuted: Date | null;
  nextExecution: Date | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  recordsProcessed: number;
  executionTimeMs: number;
  errorMessage: string | null;
}

const jobStatuses: Map<string, JobStatus> = new Map();

/**
 * Initialize all enterprise metrics jobs
 * Called on server startup
 */
export function initializeEnterpriseMetricsJobs(): void {
  console.log('🔄 Initializing Enterprise Metrics Jobs...');

  // Schedule at 1:00 AM daily
  scheduleAuditArchivalJob();

  // Schedule at 2:00 AM daily
  scheduleAuditDeletionJob();

  // Schedule at 1:30 AM daily
  scheduleUsageSummaryJob();

  // Schedule at 3:00 AM daily
  scheduleQuotaAlertJob();

  // Schedule at 3:30 AM daily
  scheduleStorageMetricsJob();

  console.log('✅ Enterprise Metrics Jobs initialized');
}

/**
 * Schedule audit archival job (1:00 AM daily)
 * Archives audit logs older than retention policy
 */
function scheduleAuditArchivalJob(): void {
  const scheduleName = 'audit_archival_job';

  function runJob(): void {
    const startTime = Date.now();
    console.log(`[${scheduleName}] Starting job execution...`);

    updateJobStatus(scheduleName, 'running', 0, 0, null);

    auditArchivalJob()
      .then((recordsProcessed) => {
        const executionTime = Date.now() - startTime;
        console.log(
          `[${scheduleName}] Completed successfully. Processed: ${recordsProcessed} records. Time: ${executionTime}ms`
        );
        updateJobStatus(scheduleName, 'completed', recordsProcessed, executionTime, null);
        scheduleNextRun('audit_archival_job', 1, 0); // 1 AM daily
      })
      .catch((error) => {
        const executionTime = Date.now() - startTime;
        console.error(`[${scheduleName}] Failed:`, error);
        updateJobStatus(
          scheduleName,
          'failed',
          0,
          executionTime,
          error.message
        );
        scheduleNextRun('audit_archival_job', 1, 0); // Retry tomorrow
      });
  }

  scheduleNextRun('audit_archival_job', 1, 0, runJob);
}

/**
 * Schedule audit deletion job (2:00 AM daily)
 * Permanently deletes archived logs past retention period
 */
function scheduleAuditDeletionJob(): void {
  const scheduleName = 'audit_deletion_job';

  function runJob(): void {
    const startTime = Date.now();
    console.log(`[${scheduleName}] Starting job execution...`);

    updateJobStatus(scheduleName, 'running', 0, 0, null);

    auditDeletionJob()
      .then((recordsProcessed) => {
        const executionTime = Date.now() - startTime;
        console.log(
          `[${scheduleName}] Completed successfully. Processed: ${recordsProcessed} records. Time: ${executionTime}ms`
        );
        updateJobStatus(scheduleName, 'completed', recordsProcessed, executionTime, null);
        scheduleNextRun('audit_deletion_job', 2, 0); // 2 AM daily
      })
      .catch((error) => {
        const executionTime = Date.now() - startTime;
        console.error(`[${scheduleName}] Failed:`, error);
        updateJobStatus(
          scheduleName,
          'failed',
          0,
          executionTime,
          error.message
        );
        scheduleNextRun('audit_deletion_job', 2, 0); // Retry tomorrow
      });
  }

  scheduleNextRun('audit_deletion_job', 2, 0, runJob);
}

/**
 * Schedule usage summary job (1:30 AM daily)
 * Aggregates previous day's API usage into daily summaries
 */
function scheduleUsageSummaryJob(): void {
  const scheduleName = 'usage_summary_job';

  function runJob(): void {
    const startTime = Date.now();
    console.log(`[${scheduleName}] Starting job execution...`);

    updateJobStatus(scheduleName, 'running', 0, 0, null);

    usageSummaryJob()
      .then((recordsProcessed) => {
        const executionTime = Date.now() - startTime;
        console.log(
          `[${scheduleName}] Completed successfully. Processed: ${recordsProcessed} organizations. Time: ${executionTime}ms`
        );
        updateJobStatus(scheduleName, 'completed', recordsProcessed, executionTime, null);
        scheduleNextRun('usage_summary_job', 1, 30); // 1:30 AM daily
      })
      .catch((error) => {
        const executionTime = Date.now() - startTime;
        console.error(`[${scheduleName}] Failed:`, error);
        updateJobStatus(
          scheduleName,
          'failed',
          0,
          executionTime,
          error.message
        );
        scheduleNextRun('usage_summary_job', 1, 30); // Retry tomorrow
      });
  }

  scheduleNextRun('usage_summary_job', 1, 30, runJob);
}

/**
 * Schedule quota alert job (3:00 AM daily)
 * Checks for organizations exceeding quota thresholds and sends alerts
 */
function scheduleQuotaAlertJob(): void {
  const scheduleName = 'quota_alert_job';

  function runJob(): void {
    const startTime = Date.now();
    console.log(`[${scheduleName}] Starting job execution...`);

    updateJobStatus(scheduleName, 'running', 0, 0, null);

    quotaAlertJob()
      .then((recordsProcessed) => {
        const executionTime = Date.now() - startTime;
        console.log(
          `[${scheduleName}] Completed successfully. Alerts processed: ${recordsProcessed}. Time: ${executionTime}ms`
        );
        updateJobStatus(scheduleName, 'completed', recordsProcessed, executionTime, null);
        scheduleNextRun('quota_alert_job', 3, 0); // 3 AM daily
      })
      .catch((error) => {
        const executionTime = Date.now() - startTime;
        console.error(`[${scheduleName}] Failed:`, error);
        updateJobStatus(
          scheduleName,
          'failed',
          0,
          executionTime,
          error.message
        );
        scheduleNextRun('quota_alert_job', 3, 0); // Retry tomorrow
      });
  }

  scheduleNextRun('quota_alert_job', 3, 0, runJob);
}

/**
 * Schedule storage metrics job (3:30 AM daily)
 * Calculates and stores storage usage metrics
 */
function scheduleStorageMetricsJob(): void {
  const scheduleName = 'storage_metrics_job';

  function runJob(): void {
    const startTime = Date.now();
    console.log(`[${scheduleName}] Starting job execution...`);

    updateJobStatus(scheduleName, 'running', 0, 0, null);

    storageMetricsJob()
      .then((recordsProcessed) => {
        const executionTime = Date.now() - startTime;
        console.log(
          `[${scheduleName}] Completed successfully. Processed: ${recordsProcessed} organizations. Time: ${executionTime}ms`
        );
        updateJobStatus(scheduleName, 'completed', recordsProcessed, executionTime, null);
        scheduleNextRun('storage_metrics_job', 3, 30); // 3:30 AM daily
      })
      .catch((error) => {
        const executionTime = Date.now() - startTime;
        console.error(`[${scheduleName}] Failed:`, error);
        updateJobStatus(
          scheduleName,
          'failed',
          0,
          executionTime,
          error.message
        );
        scheduleNextRun('storage_metrics_job', 3, 30); // Retry tomorrow
      });
  }

  scheduleNextRun('storage_metrics_job', 3, 30, runJob);
}

/**
 * Audit Archival Job Implementation
 * Archives all audit logs older than retention policy
 */
async function auditArchivalJob(): Promise<number> {
  try {
    const organizations = await pool.query(
      `SELECT DISTINCT organization_id FROM organizations`
    );

    let totalArchived = 0;

    for (const org of organizations.rows) {
      const policy = await auditRetention.getAuditRetentionPolicy(org.organization_id);
      const beforeDate = new Date();
      beforeDate.setDate(beforeDate.getDate() - policy.active_days);

      const archivedCount = await auditRetention.archiveAuditLogs(
        beforeDate,
        org.organization_id
      );
      totalArchived += archivedCount;
    }

    return totalArchived;
  } catch (error) {
    console.error('Audit archival job error:', error);
    throw error;
  }
}

/**
 * Audit Deletion Job Implementation
 * Permanently deletes archived logs past retention period
 */
async function auditDeletionJob(): Promise<number> {
  try {
    const organizations = await pool.query(
      `SELECT DISTINCT organization_id FROM organizations`
    );

    let totalDeleted = 0;

    for (const org of organizations.rows) {
      const policy = await auditRetention.getAuditRetentionPolicy(org.organization_id);

      if (policy.auto_delete) {
        const beforeDate = new Date();
        beforeDate.setDate(beforeDate.getDate() - policy.archive_days);

        const deletedCount = await auditRetention.deleteArchivedLogs(
          beforeDate,
          org.organization_id
        );
        totalDeleted += deletedCount;
      }
    }

    return totalDeleted;
  } catch (error) {
    console.error('Audit deletion job error:', error);
    throw error;
  }
}

/**
 * Usage Summary Job Implementation
 * Aggregates previous day's API usage into daily summaries
 */
async function usageSummaryJob(): Promise<number> {
  try {
    const organizations = await pool.query(
      `SELECT DISTINCT organization_id FROM organizations`
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let processedCount = 0;

    for (const org of organizations.rows) {
      try {
        await usageAnalytics.saveDailyUsageSummary(yesterday, org.organization_id);
        processedCount++;
      } catch (error) {
        console.error(
          `Failed to save usage summary for org ${org.organization_id}:`,
          error
        );
      }
    }

    return processedCount;
  } catch (error) {
    console.error('Usage summary job error:', error);
    throw error;
  }
}

/**
 * Quota Alert Job Implementation
 * Checks for organizations exceeding thresholds and sends alerts
 */
async function quotaAlertJob(): Promise<number> {
  try {
    const organizations = await pool.query(
      `SELECT id FROM organizations`
    );

    let alertsProcessed = 0;

    for (const org of organizations.rows) {
      try {
        const alerts = await rateLimitConfig.getQuotaAlerts(org.id);

        for (const alert of alerts) {
          // Check if alert was already created today
          const existingAlert = await pool.query(
            `SELECT id FROM quota_alerts
             WHERE organization_id = $1 AND resource_name = $2 AND DATE(created_at) = CURRENT_DATE
             LIMIT 1`,
            [org.id, alert.endpoint_pattern]
          );

          if (existingAlert.rows.length === 0) {
            // Create new alert
            await pool.query(
              `INSERT INTO quota_alerts
               (organization_id, alert_type, resource_name, threshold_percent, current_percent, message)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                org.id,
                'endpoint',
                alert.endpoint_pattern,
                80, // Default threshold
                Math.round(alert.usage_percent),
                `Endpoint ${alert.endpoint_pattern} has reached ${Math.round(alert.usage_percent)}% of quota`,
              ]
            );

            // Send email to org owner if usage > 80%
            if (alert.usage_percent >= 80) {
              try {
                const ownerResult = await pool.query(
                  `SELECT u.email FROM users u
                   JOIN organizations o ON u.id = o.owner_id
                   WHERE o.id = $1`,
                  [org.id]
                );

                if (ownerResult.rows.length > 0) {
                  await sendEmail({
                    to: ownerResult.rows[0].email,
                    subject: 'API Quota Alert - High Usage Detected',
                    html: `
                      <h2>API Quota Alert</h2>
                      <p>Your organization has reached ${Math.round(alert.usage_percent)}% of quota for:</p>
                      <p><strong>${alert.endpoint_pattern}</strong></p>
                      <p>Please review your API usage in the admin dashboard.</p>
                    `,
                  });
                }
              } catch (emailError) {
                console.error('Failed to send quota alert email:', emailError);
              }
            }

            alertsProcessed++;
          }
        }
      } catch (error) {
        console.error(`Failed to check quota alerts for org ${org.id}:`, error);
      }
    }

    return alertsProcessed;
  } catch (error) {
    console.error('Quota alert job error:', error);
    throw error;
  }
}

/**
 * Storage Metrics Job Implementation
 * Calculates storage usage for all organizations
 */
async function storageMetricsJob(): Promise<number> {
  try {
    const organizations = await pool.query(
      `SELECT id FROM organizations`
    );

    let processedCount = 0;

    for (const org of organizations.rows) {
      try {
        const metricDate = new Date();
        metricDate.setDate(metricDate.getDate() - 1); // Yesterday
        await usageAnalytics.calculateStorageMetrics(metricDate, org.id);
        processedCount++;
      } catch (error) {
        console.error(
          `Failed to calculate storage metrics for org ${org.id}:`,
          error
        );
      }
    }

    return processedCount;
  } catch (error) {
    console.error('Storage metrics job error:', error);
    throw error;
  }
}

/**
 * Helper: Calculate next run time
 */
function scheduleNextRun(
  jobName: string,
  targetHour: number,
  targetMinute: number,
  callback?: () => void
): void {
  const now = new Date();
  const nextRun = new Date();

  nextRun.setHours(targetHour, targetMinute, 0, 0);

  // If the time has passed today, schedule for tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const delay = nextRun.getTime() - now.getTime();

  console.log(
    `[${jobName}] Next execution scheduled for ${nextRun.toISOString()} (in ${(delay / 1000 / 60).toFixed(0)} minutes)`
  );

  if (callback) {
    if (jobName === 'audit_archival_job' && auditArchivalJobTimer) {
      clearTimeout(auditArchivalJobTimer);
    } else if (jobName === 'audit_deletion_job' && auditDeletionJobTimer) {
      clearTimeout(auditDeletionJobTimer);
    } else if (jobName === 'usage_summary_job' && usageSummaryJobTimer) {
      clearTimeout(usageSummaryJobTimer);
    } else if (jobName === 'quota_alert_job' && quotaAlertJobTimer) {
      clearTimeout(quotaAlertJobTimer);
    } else if (jobName === 'storage_metrics_job' && storageMetricsJobTimer) {
      clearTimeout(storageMetricsJobTimer);
    }

    const timer = setTimeout(callback, delay);

    if (jobName === 'audit_archival_job') {
      auditArchivalJobTimer = timer;
    } else if (jobName === 'audit_deletion_job') {
      auditDeletionJobTimer = timer;
    } else if (jobName === 'usage_summary_job') {
      usageSummaryJobTimer = timer;
    } else if (jobName === 'quota_alert_job') {
      quotaAlertJobTimer = timer;
    } else if (jobName === 'storage_metrics_job') {
      storageMetricsJobTimer = timer;
    }
  }
}

/**
 * Update job status in database
 */
async function updateJobStatus(
  jobName: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  recordsProcessed: number,
  executionTimeMs: number,
  errorMessage: string | null
): Promise<void> {
  try {
    const nextExecution = new Date();
    nextExecution.setDate(nextExecution.getDate() + 1); // Tomorrow

    await pool.query(
      `UPDATE scheduler_jobs
       SET status = $1,
           last_executed_at = NOW(),
           next_execution_at = $2,
           execution_time_ms = $3,
           records_processed = $4,
           error_message = $5,
           updated_at = NOW()
       WHERE job_name = $6`,
      [status, nextExecution, executionTimeMs, recordsProcessed, errorMessage, jobName]
    );
  } catch (error) {
    console.error('Failed to update job status:', error);
  }
}

/**
 * Cleanup function
 * Call this on server shutdown to clean up timers
 */
export function cleanupEnterpriseMetricsJobs(): void {
  if (auditArchivalJobTimer) clearTimeout(auditArchivalJobTimer);
  if (auditDeletionJobTimer) clearTimeout(auditDeletionJobTimer);
  if (usageSummaryJobTimer) clearTimeout(usageSummaryJobTimer);
  if (quotaAlertJobTimer) clearTimeout(quotaAlertJobTimer);
  if (storageMetricsJobTimer) clearTimeout(storageMetricsJobTimer);
  console.log('✅ Enterprise Metrics Jobs cleaned up');
}
