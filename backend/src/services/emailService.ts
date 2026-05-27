import nodemailer from 'nodemailer';
import { config } from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Initialize transporter - configure based on environment
let transporter: nodemailer.Transporter | null = null;

function initializeTransporter() {
  if (transporter) return transporter;

  // For production, use SendGrid or similar
  if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // For development, use Ethereal Email (test service)
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASSWORD || 'test',
      },
    });
  }

  return transporter;
}

/**
 * Send an email
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  try {
    const transporter = initializeTransporter();

    const result = await transporter.sendMail({
      from: `"Budget Tool" <${process.env.EMAIL_FROM || 'noreply@budgettool.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`Email sent to ${options.to}: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: String(error),
    };
  }
};

/**
 * Send alert notification email
 */
export const sendAlertEmail = async (
  recipientEmail: string,
  alertData: {
    categoryName: string;
    message: string;
    severity: 'warning' | 'critical';
    currentSpending: number;
    budgetTarget: number;
    percentageOfBudget: number;
  }
): Promise<EmailResult> => {
  const severityColor = alertData.severity === 'critical' ? '#dc2626' : '#f59e0b';
  const severityBgColor = alertData.severity === 'critical' ? '#fee2e2' : '#fffbeb';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .alert-box {
            background-color: ${severityBgColor};
            border-left: 4px solid ${severityColor};
            padding: 16px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .alert-title {
            color: ${severityColor};
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .alert-message {
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 12px;
          }
          .stats {
            background-color: #f3f4f6;
            padding: 16px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .stat-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
          }
          .stat-label {
            color: #6b7280;
          }
          .stat-value {
            font-weight: 600;
            color: #1f2937;
          }
          .action-button {
            display: inline-block;
            background-color: ${severityColor};
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: 500;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Budget Alert</h2>
          </div>

          <div class="alert-box">
            <div class="alert-title">${alertData.severity === 'critical' ? '⛔ Critical Alert' : '⚠️ Warning'}</div>
            <div class="alert-message">${alertData.message}</div>
          </div>

          <div class="stats">
            <div class="stat-row">
              <span class="stat-label">Category:</span>
              <span class="stat-value">${alertData.categoryName}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Current Spending:</span>
              <span class="stat-value">$${alertData.currentSpending.toFixed(2)}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Budget Target:</span>
              <span class="stat-value">$${alertData.budgetTarget.toFixed(2)}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Percentage Used:</span>
              <span class="stat-value">${alertData.percentageOfBudget.toFixed(1)}%</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" class="action-button">
              View Your Budget
            </a>
          </div>

          <div class="footer">
            <p>This is an automated alert from your Budget Tool. You can manage alert preferences in your account settings.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `[${alertData.severity.toUpperCase()}] ${alertData.categoryName} budget alert`,
    html,
    text: alertData.message,
  });
};

/**
 * Send weekly/monthly summary report email
 */
export const sendReportEmail = async (
  recipientEmail: string,
  reportData: {
    reportType: 'weekly_summary' | 'monthly_summary' | 'spending_analysis';
    period: string;
    summaryHtml: string;
    unsubscribeToken: string;
  }
): Promise<EmailResult> => {
  const subject =
    reportData.reportType === 'weekly_summary'
      ? `Your Weekly Budget Summary - ${reportData.period}`
      : reportData.reportType === 'monthly_summary'
        ? `Your Monthly Budget Summary - ${reportData.period}`
        : `Your Spending Analysis - ${reportData.period}`;

  const unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:3000'}/unsubscribe/${reportData.unsubscribeToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1f2937;
            margin: 0 0 5px 0;
          }
          .period {
            color: #6b7280;
            font-size: 14px;
          }
          .content {
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          .unsubscribe {
            margin-top: 10px;
          }
          .unsubscribe a {
            color: #3b82f6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Budget Summary</h1>
            <div class="period">${reportData.period}</div>
          </div>

          <div class="content">
            ${reportData.summaryHtml}
          </div>

          <div class="footer">
            <p>This is your ${reportData.reportType === 'weekly_summary' ? 'weekly' : 'monthly'} budget summary from your Budget Tool.</p>
            <div class="unsubscribe">
              <a href="${unsubscribeUrl}">Unsubscribe from email reports</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
};

/**
 * Verify email configuration
 */
export const verifyEmailConfiguration = async (): Promise<boolean> => {
  try {
    const transporter = initializeTransporter();
    await transporter.verify();
    console.log('Email service configured successfully');
    return true;
  } catch (error) {
    console.error('Email service verification failed:', error);
    return false;
  }
};
