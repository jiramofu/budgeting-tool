import { pool } from '../config/database';
import {
  generateWeeklySummary,
  generateMonthlySummary,
  generateSpendingAnalysis,
} from '../services/reportGeneratorService';
import { sendReportEmail, sendAlertEmail } from '../services/emailService';
import { markReportAsSent } from '../services/emailReportService';
import { getActiveAlerts, getAlertPreferences } from '../services/alertService';

/**
 * Main job that runs periodically (e.g., every hour) to:
 * 1. Check for spending alerts that need to trigger email notifications
 * 2. Check for scheduled email reports that are due to be sent
 */
export async function runReportAndAlertScheduler() {
  console.log('[Scheduler] Running report and alert scheduler...');

  try {
    // Process alerts
    await processAlerts();

    // Process reports
    await processReports();

    console.log('[Scheduler] Completed report and alert scheduler');
  } catch (error: any) {
    console.error('[Scheduler] Error in report and alert scheduler:', error);
  }
}

/**
 * Process alerts: check if active alerts need to send email notifications
 */
async function processAlerts() {
  try {
    // Get all active alerts
    const alertResult = await pool.query(
      `
      SELECT DISTINCT sa.user_id
      FROM spending_alerts sa
      WHERE sa.is_active = TRUE
        AND sa.triggered_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
      LIMIT 100
      `
    );

    for (const row of alertResult.rows) {
      const userId = row.user_id;

      try {
        const alerts = await getActiveAlerts(userId);

        for (const alert of alerts) {
          // Get user's email
          const userResult = await pool.query(
            `SELECT email FROM users WHERE id = $1`,
            [userId]
          );

          if (userResult.rows.length === 0) continue;

          const userEmail = userResult.rows[0].email;

          // Get category info
          const categoryResult = await pool.query(
            `SELECT name FROM categories WHERE id = $1`,
            [alert.categoryId]
          );

          const categoryName = categoryResult.rows[0]?.name || 'Unknown';

          // Check if this alert should trigger email
          const preferences = await getAlertPreferences(userId, alert.categoryId);

          if (preferences?.enableEmailAlerts) {
            const result = await sendAlertEmail(userEmail, {
              categoryName,
              message: alert.message,
              severity: alert.severity,
              currentSpending: alert.currentSpending,
              budgetTarget: alert.budgetTarget,
              percentageOfBudget: alert.percentageOfBudget,
            });

            if (result.success) {
              console.log(
                `[Scheduler] Alert email sent to ${userEmail} for ${categoryName}`
              );
            } else {
              console.error(
                `[Scheduler] Failed to send alert email: ${result.error}`
              );
            }
          }
        }
      } catch (error: any) {
        console.error(`[Scheduler] Error processing alerts for user ${userId}:`, error);
      }
    }
  } catch (error: any) {
    console.error('[Scheduler] Error processing alerts:', error);
  }
}

/**
 * Process reports: check if any scheduled reports are due and send them
 */
async function processReports() {
  try {
    // Get all reports that are due (within next 1 hour)
    const reportResult = await pool.query(
      `
      SELECT
        er.id,
        er.user_id,
        er.report_type,
        er.recipient_email,
        er.frequency,
        ep.weekly_summary_enabled,
        ep.monthly_summary_enabled,
        ep.spending_analysis_enabled,
        ep.unsubscribe_token
      FROM email_reports er
      LEFT JOIN email_preferences ep ON er.user_id = ep.user_id
      WHERE er.is_active = TRUE
        AND er.next_send_at IS NOT NULL
        AND er.next_send_at <= CURRENT_TIMESTAMP + INTERVAL '10 minutes'
        AND er.next_send_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
      ORDER BY er.next_send_at ASC
      LIMIT 50
      `
    );

    for (const report of reportResult.rows) {
      try {
        // Check if user has enabled this report type
        const isEnabled =
          (report.report_type === 'weekly_summary' && report.weekly_summary_enabled) ||
          (report.report_type === 'monthly_summary' && report.monthly_summary_enabled) ||
          (report.report_type === 'spending_analysis' && report.spending_analysis_enabled);

        if (!isEnabled) {
          console.log(
            `[Scheduler] Skipping ${report.report_type} - disabled by user`
          );
          continue;
        }

        // Generate report content
        let reportHtml: string;
        const periodLabel = getPeriodLabel(report.report_type);

        if (report.report_type === 'weekly_summary') {
          reportHtml = await generateWeeklySummary(report.user_id);
        } else if (report.report_type === 'monthly_summary') {
          reportHtml = await generateMonthlySummary(report.user_id);
        } else {
          reportHtml = await generateSpendingAnalysis(report.user_id);
        }

        // Send email
        const emailResult = await sendReportEmail(report.recipient_email, {
          reportType: report.report_type,
          period: periodLabel,
          summaryHtml: reportHtml,
          unsubscribeToken: report.unsubscribe_token,
        });

        if (emailResult.success) {
          console.log(
            `[Scheduler] Report email sent to ${report.recipient_email} (${report.report_type})`
          );

          // Mark as sent and schedule next send
          await markReportAsSent(report.id, true);
        } else {
          console.error(
            `[Scheduler] Failed to send report: ${emailResult.error}`
          );
          await markReportAsSent(report.id, false, emailResult.error);
        }
      } catch (error: any) {
        console.error(
          `[Scheduler] Error processing report ${report.id}:`,
          error
        );
        await markReportAsSent(report.id, false, String(error)).catch(
          (e: any) => console.error('Error marking report as failed:', e)
        );
      }
    }
  } catch (error: any) {
    console.error('[Scheduler] Error processing reports:', error);
  }
}

function getPeriodLabel(reportType: string): string {
  const today = new Date();

  if (reportType === 'weekly_summary') {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  } else if (reportType === 'monthly_summary') {
    const monthName = today.toLocaleString('default', { month: 'long' });
    return `${monthName} ${today.getFullYear()}`;
  } else {
    // 3-month analysis
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    return `${formatDate(threeMonthsAgo)} - ${formatDate(today)}`;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Initialize scheduler - should be called when server starts
 */
export function initializeScheduler() {
  console.log('[Scheduler] Initializing report and alert scheduler...');

  // Run scheduler every 10 minutes
  const intervalId = setInterval(() => {
    runReportAndAlertScheduler();
  }, 10 * 60 * 1000); // 10 minutes

  // Also run once on startup
  runReportAndAlertScheduler();

  // Return interval ID so it can be cleared if needed
  return intervalId;
}
