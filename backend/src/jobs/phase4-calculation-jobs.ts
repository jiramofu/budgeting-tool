import { Phase4ProjectionService } from '../services/phase4-projection-service';
import { Phase4AnalyticsService } from '../services/phase4-analytics-service';
import { Phase4TrendsService } from '../services/phase4-trends-service';
import { query } from '../config/database';

/**
 * Nightly job to recalculate cash flow projections for all users
 */
export async function runProjectionCalculationJob() {
  try {
    console.log('[Phase4 Jobs] Starting projection calculation job...');

    // Get all active users
    const usersResult = await query(
      `SELECT DISTINCT user_id FROM transactions
       WHERE created_at >= NOW() - INTERVAL '30 days'
       ORDER BY user_id`
    );

    const users = usersResult.rows;
    let successCount = 0;
    let errorCount = 0;

    for (const { user_id } of users) {
      try {
        await Phase4ProjectionService.saveProjectionsToDB(user_id);
        successCount++;
      } catch (error) {
        console.error(`[Phase4 Jobs] Error calculating projections for user ${user_id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `[Phase4 Jobs] Projection calculation job completed. Success: ${successCount}, Errors: ${errorCount}`
    );

    // Log job status
    await query(
      `INSERT INTO scheduler_logs (user_id, job_type, last_run_at, status, records_processed)
       VALUES ($1, $2, NOW(), $3, $4)`,
      [1, 'projection', errorCount === 0 ? 'completed' : 'failed', successCount]
    );
  } catch (error) {
    console.error('[Phase4 Jobs] Error in projection calculation job:', error);
  }
}

/**
 * Nightly job to recalculate spending analytics for all users
 */
export async function runAnalyticsCalculationJob() {
  try {
    console.log('[Phase4 Jobs] Starting analytics calculation job...');

    // Get all active users
    const usersResult = await query(
      `SELECT DISTINCT user_id FROM transactions
       WHERE created_at >= NOW() - INTERVAL '30 days'
       ORDER BY user_id`
    );

    const users = usersResult.rows;
    let successCount = 0;
    let errorCount = 0;

    for (const { user_id } of users) {
      try {
        await Phase4AnalyticsService.saveAnalyticsToDB(user_id);
        successCount++;
      } catch (error) {
        console.error(`[Phase4 Jobs] Error calculating analytics for user ${user_id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `[Phase4 Jobs] Analytics calculation job completed. Success: ${successCount}, Errors: ${errorCount}`
    );

    // Log job status
    await query(
      `INSERT INTO scheduler_logs (user_id, job_type, last_run_at, status, records_processed)
       VALUES ($1, $2, NOW(), $3, $4)`,
      [1, 'analytics', errorCount === 0 ? 'completed' : 'failed', successCount]
    );
  } catch (error) {
    console.error('[Phase4 Jobs] Error in analytics calculation job:', error);
  }
}

/**
 * Nightly job to calculate seasonal trends for all users
 */
export async function runTrendsCalculationJob() {
  try {
    console.log('[Phase4 Jobs] Starting trends calculation job...');

    // Get all active users
    const usersResult = await query(
      `SELECT DISTINCT user_id FROM transactions
       WHERE created_at >= NOW() - INTERVAL '30 days'
       ORDER BY user_id`
    );

    const users = usersResult.rows;
    let successCount = 0;
    let errorCount = 0;

    for (const { user_id } of users) {
      try {
        await Phase4TrendsService.saveTrendsToDB(user_id);
        successCount++;
      } catch (error) {
        console.error(`[Phase4 Jobs] Error calculating trends for user ${user_id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `[Phase4 Jobs] Trends calculation job completed. Success: ${successCount}, Errors: ${errorCount}`
    );

    // Log job status
    await query(
      `INSERT INTO scheduler_logs (user_id, job_type, last_run_at, status, records_processed)
       VALUES ($1, $2, NOW(), $3, $4)`,
      [1, 'trends', errorCount === 0 ? 'completed' : 'failed', successCount]
    );
  } catch (error) {
    console.error('[Phase4 Jobs] Error in trends calculation job:', error);
  }
}

/**
 * Initialize Phase 4 calculation jobs
 */
export function initializePhase4Jobs() {
  console.log('[Phase4 Jobs] Initializing Phase 4 calculation jobs...');

  // Run jobs immediately on startup
  setTimeout(() => {
    runProjectionCalculationJob();
    runAnalyticsCalculationJob();
    runTrendsCalculationJob();
  }, 5000);

  // Schedule to run every night at 2 AM
  const scheduleNightlyJob = () => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(2, 0, 0, 0);

    // If 2 AM has already passed today, schedule for tomorrow
    if (scheduledTime < now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNextRun = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      console.log('[Phase4 Jobs] Running scheduled nightly calculations...');
      runProjectionCalculationJob();
      runAnalyticsCalculationJob();
      runTrendsCalculationJob();

      // Reschedule for the next day
      scheduleNightlyJob();
    }, timeUntilNextRun);

    console.log(
      `[Phase4 Jobs] Next calculation job scheduled for ${scheduledTime.toLocaleString()}`
    );
  };

  scheduleNightlyJob();
}
