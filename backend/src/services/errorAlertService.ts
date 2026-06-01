import { sendEmail } from './emailService';
import { query } from '../config/database';

interface ErrorAlert {
  errorMessage: string;
  resourceType: string;
  count: number;
  lastOccurred: string;
}

export class ErrorAlertService {
  private static readonly ALERT_THRESHOLD = 5; // Alert after 5 errors of same type in 1 hour
  private static readonly ALERT_COOLDOWN = 3600000; // 1 hour cooldown between alerts

  static async checkAndSendAlert(
    errorMessage: string,
    resourceType: string,
    userEmail: string
  ): Promise<void> {
    try {
      // Count recent errors of this type in the last hour
      const result = await query(
        `SELECT COUNT(*) as count, MAX(created_at) as last_occurred
         FROM audit_logs
         WHERE resource_type = $1
         AND error_message = $2
         AND status = 'failure'
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [resourceType, errorMessage]
      );

      const errorCount = parseInt(result.rows[0].count);

      if (errorCount >= this.ALERT_THRESHOLD) {
        // Send alert email
        const subject = `🚨 Alert: ${resourceType} errors detected (${errorCount} in last hour)`;
        const body = `
          <h2>Error Alert</h2>
          <p><strong>Resource Type:</strong> ${resourceType}</p>
          <p><strong>Error Count (Last Hour):</strong> ${errorCount}</p>
          <p><strong>Error Message:</strong> ${errorMessage}</p>
          <p><strong>Last Occurred:</strong> ${result.rows[0].last_occurred}</p>
          <p>Please check the admin error dashboard for more details.</p>
        `;

        await sendEmail({
          to: userEmail,
          subject,
          html: body,
        });

        console.log(`[ErrorAlert] Sent alert for ${resourceType} - ${errorCount} errors`);
      }
    } catch (error) {
      console.error('[ErrorAlert] Failed to check and send alert:', error);
    }
  }

  static async getSummary(): Promise<ErrorAlert[]> {
    try {
      const result = await query(
        `SELECT 
          error_message,
          resource_type,
          COUNT(*) as count,
          MAX(created_at) as last_occurred
         FROM audit_logs
         WHERE status = 'failure'
         AND created_at > NOW() - INTERVAL '24 hours'
         GROUP BY error_message, resource_type
         HAVING COUNT(*) >= $1
         ORDER BY count DESC`,
        [this.ALERT_THRESHOLD]
      );

      return result.rows.map(row => ({
        errorMessage: row.error_message,
        resourceType: row.resource_type,
        count: parseInt(row.count),
        lastOccurred: row.last_occurred,
      }));
    } catch (error) {
      console.error('[ErrorAlert] Failed to get summary:', error);
      return [];
    }
  }
}
