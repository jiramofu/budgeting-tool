import { pool } from '../config/database';
import { randomBytes } from 'crypto';

interface EmailPreferences {
  id: number;
  userId: number;
  weeklySummaryEnabled: boolean;
  monthlySummaryEnabled: boolean;
  spendingAnalysisEnabled: boolean;
  includeBudgetProgress: boolean;
  includeSpendingByCategory: boolean;
  includeSavingsRate: boolean;
  includeGoalsProgress: boolean;
  includeBillReminders: boolean;
  isUnsubscribed: boolean;
}

interface EmailReport {
  id: number;
  userId: number;
  reportType: string;
  recipientEmail: string;
  frequency: string;
  scheduledDayOfWeek?: number;
  scheduledDayOfMonth?: number;
  scheduledTime: string;
  isActive: boolean;
  lastSentAt?: string;
  nextSendAt?: string;
  createdAt: string;
}

/**
 * Get email preferences for a user
 */
export async function getEmailPreferences(userId: number, organizationId?: number): Promise<EmailPreferences> {
  try {
    // Get or create preferences
    let result = await pool.query(
      `SELECT * FROM email_preferences WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''}`,
      organizationId ? [userId, organizationId] : [userId]
    );

    if (result.rows.length === 0) {
      // Create default preferences
      result = await pool.query(
        `
        INSERT INTO email_preferences (
          user_id,
          organization_id,
          weekly_summary_enabled,
          monthly_summary_enabled,
          spending_analysis_enabled,
          include_budget_progress,
          include_spending_by_category,
          include_savings_rate,
          include_goals_progress,
          include_bill_reminders,
          unsubscribe_token
        )
        VALUES ($1, $2, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, $3)
        RETURNING
          id,
          user_id as "userId",
          weekly_summary_enabled as "weeklySummaryEnabled",
          monthly_summary_enabled as "monthlySummaryEnabled",
          spending_analysis_enabled as "spendingAnalysisEnabled",
          include_budget_progress as "includeBudgetProgress",
          include_spending_by_category as "includeSpendingByCategory",
          include_savings_rate as "includeSavingsRate",
          include_goals_progress as "includeGoalsProgress",
          include_bill_reminders as "includeBillReminders",
          is_unsubscribed as "isUnsubscribed"
        `,
        [userId, organizationId || null, randomBytes(16).toString('hex')]
      );
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id || row.userId,
      weeklySummaryEnabled: row.weekly_summary_enabled !== false && row.weeklySummaryEnabled !== false,
      monthlySummaryEnabled: row.monthly_summary_enabled !== false && row.monthlySummaryEnabled !== false,
      spendingAnalysisEnabled: row.spending_analysis_enabled === true || row.spendingAnalysisEnabled === true,
      includeBudgetProgress: row.include_budget_progress !== false && row.includeBudgetProgress !== false,
      includeSpendingByCategory: row.include_spending_by_category !== false && row.includeSpendingByCategory !== false,
      includeSavingsRate: row.include_savings_rate !== false && row.includeSavingsRate !== false,
      includeGoalsProgress: row.include_goals_progress !== false && row.includeGoalsProgress !== false,
      includeBillReminders: row.include_bill_reminders !== false && row.includeBillReminders !== false,
      isUnsubscribed: row.is_unsubscribed === true || row.isUnsubscribed === true,
    };
  } catch (error: any) {
    console.error('Error getting email preferences:', error);
    throw error;
  }
}

/**
 * Update email preferences for a user
 */
export async function updateEmailPreferences(
  userId: number,
  updates: Partial<EmailPreferences>,
  organizationId: number
): Promise<EmailPreferences> {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Map camelCase to snake_case
    const fieldMap: { [key: string]: string } = {
      weeklySummaryEnabled: 'weekly_summary_enabled',
      monthlySummaryEnabled: 'monthly_summary_enabled',
      spendingAnalysisEnabled: 'spending_analysis_enabled',
      includeBudgetProgress: 'include_budget_progress',
      includeSpendingByCategory: 'include_spending_by_category',
      includeSavingsRate: 'include_savings_rate',
      includeGoalsProgress: 'include_goals_progress',
      includeBillReminders: 'include_bill_reminders',
    };

    for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
      if (updates[camelKey as keyof EmailPreferences] !== undefined) {
        setClauses.push(`${snakeKey} = $${paramIndex++}`);
        values.push(updates[camelKey as keyof EmailPreferences]);
      }
    }

    if (setClauses.length === 0) {
      return getEmailPreferences(userId, organizationId);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);
    if (organizationId) values.push(organizationId);

    const whereClause = organizationId ? `WHERE user_id = $${paramIndex} AND organization_id = $${paramIndex + 1}` : `WHERE user_id = $${paramIndex}`;

    const result = await pool.query(
      `
      UPDATE email_preferences
      SET ${setClauses.join(', ')}
      ${whereClause}
      RETURNING
        id,
        user_id as "userId",
        weekly_summary_enabled as "weeklySummaryEnabled",
        monthly_summary_enabled as "monthlySummaryEnabled",
        spending_analysis_enabled as "spendingAnalysisEnabled",
        include_budget_progress as "includeBudgetProgress",
        include_spending_by_category as "includeSpendingByCategory",
        include_savings_rate as "includeSavingsRate",
        include_goals_progress as "includeGoalsProgress",
        include_bill_reminders as "includeBillReminders",
        is_unsubscribed as "isUnsubscribed"
      `,
      values
    );

    if (result.rows.length === 0) {
      return getEmailPreferences(userId, organizationId);
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      weeklySummaryEnabled: row.weeklySummaryEnabled,
      monthlySummaryEnabled: row.monthlySummaryEnabled,
      spendingAnalysisEnabled: row.spendingAnalysisEnabled,
      includeBudgetProgress: row.includeBudgetProgress,
      includeSpendingByCategory: row.includeSpendingByCategory,
      includeSavingsRate: row.includeSavingsRate,
      includeGoalsProgress: row.includeGoalsProgress,
      includeBillReminders: row.includeBillReminders,
      isUnsubscribed: row.isUnsubscribed,
    };
  } catch (error: any) {
    console.error('Error updating email preferences:', error);
    throw error;
  }
}

/**
 * Get all email reports for a user
 */
export async function getUserEmailReports(userId: number, organizationId?: number): Promise<EmailReport[]> {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        user_id as "userId",
        report_type as "reportType",
        recipient_email as "recipientEmail",
        frequency,
        scheduled_day_of_week as "scheduledDayOfWeek",
        scheduled_day_of_month as "scheduledDayOfMonth",
        scheduled_time as "scheduledTime",
        is_active as "isActive",
        last_sent_at as "lastSentAt",
        next_send_at as "nextSendAt",
        created_at as "createdAt"
      FROM email_reports
      WHERE user_id = $1 AND is_active = TRUE ${organizationId ? 'AND organization_id = $2' : ''}
      ORDER BY created_at DESC
      `,
      organizationId ? [userId, organizationId] : [userId]
    );

    return result.rows;
  } catch (error: any) {
    console.error('Error getting email reports:', error);
    throw error;
  }
}

/**
 * Create a new email report schedule
 */
export async function createEmailReport(
  userId: number,
  report: {
    reportType: string;
    recipientEmail: string;
    frequency: string;
    scheduledDayOfWeek?: number;
    scheduledDayOfMonth?: number;
    scheduledTime: string;
  },
  organizationId: number
): Promise<EmailReport> {
  try {
    // Calculate next send time
    const nextSendAt = calculateNextSendTime(
      report.frequency,
      report.scheduledDayOfWeek,
      report.scheduledDayOfMonth,
      report.scheduledTime
    );

    const result = await pool.query(
      `
      INSERT INTO email_reports (
        user_id,
        organization_id,
        report_type,
        recipient_email,
        frequency,
        scheduled_day_of_week,
        scheduled_day_of_month,
        scheduled_time,
        next_send_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        user_id as "userId",
        report_type as "reportType",
        recipient_email as "recipientEmail",
        frequency,
        scheduled_day_of_week as "scheduledDayOfWeek",
        scheduled_day_of_month as "scheduledDayOfMonth",
        scheduled_time as "scheduledTime",
        is_active as "isActive",
        last_sent_at as "lastSentAt",
        next_send_at as "nextSendAt",
        created_at as "createdAt"
      `,
      [
        userId,
        organizationId || null,
        report.reportType,
        report.recipientEmail,
        report.frequency,
        report.scheduledDayOfWeek || null,
        report.scheduledDayOfMonth || null,
        report.scheduledTime,
        nextSendAt,
      ]
    );

    return result.rows[0];
  } catch (error: any) {
    console.error('Error creating email report:', error);
    throw error;
  }
}

/**
 * Update an email report schedule
 */
export async function updateEmailReport(
  userId: number,
  reportId: number,
  updates: Partial<EmailReport>,
  organizationId: number
): Promise<EmailReport> {
  try {
    // Verify user owns this report
    const ownerCheck = await pool.query(
      `SELECT id FROM email_reports WHERE id = $1 AND user_id = $2 ${organizationId ? 'AND organization_id = $3' : ''}`,
      organizationId ? [reportId, userId, organizationId] : [reportId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Report not found or not owned by user');
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: { [key: string]: string } = {
      reportType: 'report_type',
      recipientEmail: 'recipient_email',
      frequency: 'frequency',
      scheduledDayOfWeek: 'scheduled_day_of_week',
      scheduledDayOfMonth: 'scheduled_day_of_month',
      scheduledTime: 'scheduled_time',
      isActive: 'is_active',
    };

    for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
      if (updates[camelKey as keyof EmailReport] !== undefined) {
        setClauses.push(`${snakeKey} = $${paramIndex++}`);
        values.push(updates[camelKey as keyof EmailReport]);
      }
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(reportId);
    if (organizationId) values.push(organizationId);

    const whereClause = organizationId ? `WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}` : `WHERE id = $${paramIndex}`;

    const result = await pool.query(
      `
      UPDATE email_reports
      SET ${setClauses.join(', ')}
      ${whereClause}
      RETURNING
        id,
        user_id as "userId",
        report_type as "reportType",
        recipient_email as "recipientEmail",
        frequency,
        scheduled_day_of_week as "scheduledDayOfWeek",
        scheduled_day_of_month as "scheduledDayOfMonth",
        scheduled_time as "scheduledTime",
        is_active as "isActive",
        last_sent_at as "lastSentAt",
        next_send_at as "nextSendAt",
        created_at as "createdAt"
      `,
      values
    );

    return result.rows[0];
  } catch (error: any) {
    console.error('Error updating email report:', error);
    throw error;
  }
}

/**
 * Delete an email report schedule
 */
export async function deleteEmailReport(
  userId: number,
  reportId: number,
  organizationId: number
): Promise<void> {
  try {
    const result = await pool.query(
      `
      UPDATE email_reports
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 ${organizationId ? 'AND organization_id = $3' : ''}
      `,
      organizationId ? [reportId, userId, organizationId] : [reportId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Report not found or not owned by user');
    }
  } catch (error: any) {
    console.error('Error deleting email report:', error);
    throw error;
  }
}

/**
 * Mark a report as sent and calculate next send time
 */
export async function markReportAsSent(
  reportId: number,
  success: boolean,
  organizationId: number,
  errorMessage?: string
): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (success) {
        // Update report and schedule next send
        const reportResult = await client.query(
          `SELECT frequency, scheduled_day_of_week, scheduled_day_of_month, scheduled_time FROM email_reports WHERE id = $1`,
          [reportId]
        );

        if (reportResult.rows.length > 0) {
          const report = reportResult.rows[0];
          const nextSendAt = calculateNextSendTime(
            report.frequency,
            report.scheduled_day_of_week,
            report.scheduled_day_of_month,
            report.scheduled_time
          );

          await client.query(
            `
            UPDATE email_reports
            SET last_sent_at = CURRENT_TIMESTAMP, next_send_at = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [reportId, nextSendAt]
          );
        }
      } else {
        // Log failure in audit table
        await client.query(
          `
          INSERT INTO email_report_audit (
            user_id,
            email_report_id,
            recipient_email,
            report_type,
            report_period_start,
            report_period_end,
            sent_at,
            delivery_status,
            error_message
          )
          SELECT
            er.user_id,
            er.id,
            er.recipient_email,
            er.report_type,
            CURRENT_DATE,
            CURRENT_DATE,
            CURRENT_TIMESTAMP,
            'failed',
            $2
          FROM email_reports er
          WHERE er.id = $1
          `,
          [reportId, errorMessage || 'Unknown error']
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error marking report as sent:', error);
    throw error;
  }
}

/**
 * Calculate next send time based on frequency and schedule
 */
function calculateNextSendTime(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  time: string = '09:00'
): Date {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);

  if (frequency === 'weekly' && dayOfWeek !== undefined) {
    const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7 || 7;
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysUntilTarget);
    nextDate.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for next week
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 7);
    }

    return nextDate;
  } else if (frequency === 'monthly' && dayOfMonth !== undefined) {
    const nextDate = new Date(now);
    const targetDate = Math.min(dayOfMonth, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate());

    if (nextDate.getDate() < targetDate) {
      nextDate.setDate(targetDate);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(targetDate);
    }

    nextDate.setHours(hours, minutes, 0, 0);

    // If time has passed, schedule for next month
    if (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
  }

  // Default: next occurrence of the time
  const nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);

  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
}

/**
 * Send a test email to verify email service is working
 */
export async function sendTestEmail(recipientEmail: string, organizationId?: number): Promise<{ success: boolean; message: string }> {
  try {
    // Import email service
    const { sendEmail } = await import('./emailService');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f9fafb;
              color: #1f2937;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .content {
              font-size: 14px;
              line-height: 1.6;
            }
            .success-badge {
              background-color: #dcfce7;
              color: #166534;
              padding: 12px;
              border-radius: 4px;
              margin: 20px 0;
              text-align: center;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Budget Tool - Test Email</h1>
            </div>
            <div class="content">
              <div class="success-badge">✓ Email Service is Working!</div>
              <p>This is a test email from your Budget Tool application.</p>
              <p>If you received this email, it means your email service is properly configured and ready to send:</p>
              <ul>
                <li>Spending alerts when you exceed budget thresholds</li>
                <li>Weekly and monthly spending reports</li>
                <li>Budget notifications and reminders</li>
              </ul>
              <p>You can now close this email or adjust your <strong>Email Preferences</strong> to customize what emails you receive.</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Sent at ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to: recipientEmail,
      subject: '💰 Test Email from Budget Tool',
      html: html,
      text: 'This is a test email from your Budget Tool application. If you received this, your email service is working correctly!',
    });

    if (result.success) {
      return {
        success: true,
        message: 'Test email sent successfully! Check your inbox.',
      };
    } else {
      return {
        success: false,
        message: `Failed to send test email: ${result.error}`,
      };
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      message: `Error sending test email: ${error.message}`,
    };
  }
}
