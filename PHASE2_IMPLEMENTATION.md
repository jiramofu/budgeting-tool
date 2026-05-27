# Phase 2: User Engagement - Spending Alerts & Email Reports

## Overview
Phase 2 implements comprehensive spending alert system and automated email reporting for the budgeting tool. Users can now receive real-time notifications when spending approaches budget limits and automated budget summaries delivered to their inbox.

## Features Implemented

### 1. Spending Alerts System

#### Backend Services
- **alertService.ts** - Core alert business logic
  - `checkSpendingAlerts()` - Checks user spending against budget targets with customizable thresholds
  - `createOrUpdateAlert()` - Idempotent alert creation/update with duplicate prevention
  - `resolveAlert()` - Marks alerts as resolved and archives to alert_history
  - `getActiveAlerts()` - Retrieves active alerts for a user
  - `getAlertPreferences()` - Fetches user-configurable alert thresholds (default: 80% warning, 100% critical)
  - `updateAlertPreferences()` - Updates alert preferences with validation (0-100 range)
  - `getAllAnomalies()` - Returns all alerts for historical view

#### API Routes (alerts.ts)
- `GET /api/alerts/check/:budgetId` - Check spending against budget limits
- `GET /api/alerts/active` - Get active alerts for user
- `GET /api/alerts/all` - Get all alerts including resolved
- `PUT /api/alerts/:alertId/resolve` - Resolve an active alert
- `GET /api/alerts/preferences/:categoryId` - Get alert thresholds for category
- `PUT /api/alerts/preferences/:categoryId` - Update alert preferences

#### Database Tables
- `spending_alerts` - Stores current and historical alerts
  - Tracks alert severity (warning/critical)
  - Records trigger time, resolution, and status
  - Includes indexes on user_id, category_id, budget_id for performance

- `alert_preferences` - User-configurable thresholds per category
  - Customizable warning threshold (default 80%)
  - Customizable critical threshold (default 100%)
  - Toggle for email and app alerts independently
  - UNIQUE constraint on (user_id, category_id)

- `alert_history` - Archives resolved alerts for compliance
  - Tracks resolution type (manual, automatic, budget adjustment)
  - Maintains audit trail for historical analysis

#### Frontend Components
- **AlertsPage.tsx** - Comprehensive alerts management interface
  - Displays active alerts with severity indicators
  - Shows spending vs. budget comparison for each alert
  - Resolve alert buttons with single-click resolution
  - Category-based alert preference management
  - Expandable preference editor per category
  - Shows resolved alerts for historical context

### 2. Email Report System

#### Backend Services
- **emailService.ts** - Email delivery infrastructure
  - `sendEmail()` - Generic email sending function
  - `sendAlertEmail()` - Formatted alert notification emails
  - `sendReportEmail()` - Formatted report emails with unsubscribe links
  - `verifyEmailConfiguration()` - Tests email service on startup
  - Support for SMTP (production) and Ethereal (testing)

- **emailReportService.ts** - Email report scheduling and management
  - `getEmailPreferences()` - User email content preferences
  - `updateEmailPreferences()` - Customize report content inclusion
  - `getUserEmailReports()` - List scheduled reports
  - `createEmailReport()` - Schedule new report with validation
  - `updateEmailReport()` - Modify report schedule
  - `deleteEmailReport()` - Remove report schedule
  - `getReportsDueForSending()` - Query reports ready to send
  - `markReportAsSent()` - Update send status and schedule next run

- **reportGeneratorService.ts** - Report content generation
  - `generateWeeklySummary()` - Weekly budget summary
  - `generateMonthlySummary()` - Monthly budget summary
  - `generateSpendingAnalysis()` - 3-month spending analysis
  - HTML-formatted report tables with color coding
  - Category breakdowns with percentage tracking
  - Savings rate calculations

#### Scheduled Job (reportSchedulerJob.ts)
- `runReportAndAlertScheduler()` - Main scheduler job
  - Processes spending alerts every 10 minutes
  - Checks for due email reports and sends them
  - Handles email sending with error logging
  - `processAlerts()` - Sends email notifications for triggered alerts
  - `processReports()` - Generates and sends scheduled reports
  - Respects user preferences for alert types and report content

#### API Routes (emailReports.ts)
- `GET /api/email-reports/preferences` - Get email preferences
- `PUT /api/email-reports/preferences` - Update preferences
- `GET /api/email-reports` - List scheduled reports
- `POST /api/email-reports` - Create new report schedule
- `PUT /api/email-reports/:reportId` - Modify report
- `DELETE /api/email-reports/:reportId` - Remove report

#### Database Tables
- `email_reports` - Scheduled report definitions
  - Report type (weekly/monthly/spending_analysis)
  - Recipient email and delivery frequency
  - Scheduled day/time configuration
  - Tracks next send and last send times
  - UNIQUE index on (user_id, report_type, frequency)

- `email_preferences` - User email settings
  - Enable/disable each report type
  - Toggle content sections (budget progress, category breakdown, savings rate, etc.)
  - Unsubscribe token for email compliance
  - UNIQUE constraint on user_id

- `email_report_audit` - Delivery tracking
  - Report period dates
  - Delivery status (pending/sent/failed/bounced)
  - Error messages for failed sends
  - Indexes on user_id, sent_at, delivery_status

#### Frontend Components
- **EmailReportSettings.tsx** - Email report management
  - List scheduled reports with next send times
  - Create new reports with frequency and timing
  - Update report schedules
  - Delete report schedules
  - Comprehensive content preference checkboxes
  - Save preferences with validation
  - Day of week and day of month selectors

### 3. Integration Updates

#### Main Application (index.ts)
- Imported alert and email report routes
- Registered `/api/alerts` and `/api/email-reports` endpoints
- Initialized email service verification on startup
- Started scheduled job for alert and report processing

#### Routing
- Added `/alerts` route to main application
- Integrated AlertsPage into protected routes
- Added "Alerts" navigation link in Layout

#### Settings
- Added "📧 Email Reports" tab to SettingsPage
- Integrated EmailReportSettings component
- Email preferences accessible alongside other user settings

#### Environment Configuration
- Updated .env.example with email service variables
- Added SMTP configuration (host, port, user, password)
- Added Ethereal testing credentials
- Added APP_URL for email links

## Architecture

### Alert Flow
1. Budget spending transaction → Database insert
2. Scheduler checks spending vs. targets (every 10 minutes)
3. If threshold exceeded → Create/update alert
4. If email enabled → Send alert notification email
5. User views in AlertsPage or receives email
6. User resolves alert via API
7. Alert archived to alert_history

### Email Report Flow
1. User creates scheduled report (weekly/monthly)
2. App calculates next send time
3. Scheduler runs every 10 minutes
4. If report due → Generate HTML content
5. Check user preferences for enabled report type
6. Send formatted email with unsubscribe link
7. Log delivery status to email_report_audit
8. Calculate next send time automatically

## Testing Guide

### Manual Testing
1. **Alerts**
   - Create budget with spending targets
   - Add transactions to approach limits
   - Go to Alerts page → Should show active alerts
   - Verify severity levels (warning vs critical)
   - Click "Resolve" → Alert moves to resolved section
   - Check alert preferences → Modify thresholds → Save

2. **Email Reports**
   - In Settings → Email Reports tab
   - Create weekly summary report for your email
   - Set preferred day and time
   - Verify email preferences (include budget progress, etc.)
   - Wait for next scheduled send OR run scheduler manually
   - Check email inbox for formatted report
   - Verify unsubscribe link works

3. **Email Delivery**
   - In development: Uses Ethereal test email (check Ethereal dashboard)
   - In production: Requires SMTP configuration
   - Check server logs for delivery status

### Environment Setup
```bash
# Development - Use Ethereal test email (auto-creates account)
NODE_ENV=development
# Ethereal credentials will be logged to console on first run

# Production - Configure real SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@budgettool.com
APP_URL=https://yourdomain.com
```

## Files Modified/Created

### New Files
- `backend/src/services/emailService.ts` (230 lines)
- `backend/src/services/emailReportService.ts` (290 lines)
- `backend/src/services/reportGeneratorService.ts` (250 lines)
- `backend/src/routes/emailReports.ts` (160 lines)
- `backend/src/jobs/reportSchedulerJob.ts` (220 lines)
- `frontend/src/pages/AlertsPage.tsx` (380 lines)
- `frontend/src/components/EmailReportSettings.tsx` (420 lines)

### Modified Files
- `backend/src/index.ts` - Added imports and route registration
- `backend/src/routes/alerts.ts` - Alert API endpoints (180 lines)
- `backend/database/migrations/002_add_alerts_and_email_reports.sql` - Database schema
- `frontend/src/pages/SettingsPage.tsx` - Added email reports tab
- `frontend/src/App.tsx` - Added /alerts route and import
- `frontend/src/components/Layout.tsx` - Added Alerts navigation link
- `backend/.env.example` - Added email configuration variables

### Existing Support
- Uses existing auth middleware for security
- Integrates with existing category and budget system
- Uses existing database pool and query patterns
- Follows existing TypeScript/React conventions

## Performance Considerations

### Database Optimizations
- Indexes on all query fields for alert lookups
- UNIQUE constraints prevent duplicate records
- Parameterized queries prevent SQL injection
- Efficient date-based queries for report scheduling

### Scheduler Optimization
- Runs every 10 minutes (configurable)
- Processes alerts and reports in parallel
- Handles missing users/categories gracefully
- Logs errors without crashing scheduler

### Email Optimization
- HTML templates pre-formatted
- Supports both SMTP and test providers
- Batch processing compatible
- Unsubscribe tokens for compliance

## Future Enhancements

### Phase 3 Opportunities
1. **Webhook Notifications**
   - Slack/Discord integration for alerts
   - Mobile push notifications
   - SMS alerts (Twilio integration)

2. **Advanced Reporting**
   - PDF export of reports
   - Custom report templates
   - Multi-recipient scheduling

3. **Alert Automation**
   - Auto-adjustment of budgets
   - Spending pause recommendations
   - Predictive alerts (trending toward limit)

4. **Analytics**
   - Email open rates
   - Alert effectiveness tracking
   - Spending pattern insights

## Deployment Notes

1. **Database Migration**
   - Run migration 002_add_alerts_and_email_reports.sql
   - Creates 6 new tables with proper indexes

2. **Email Service**
   - Requires SMTP credentials in production
   - Test with Ethereal in development
   - Verify EMAIL_FROM and APP_URL for email links

3. **Scheduler Job**
   - Runs automatically on server startup
   - Processes alerts and reports every 10 minutes
   - Monitor logs for scheduling errors

4. **Environment Variables**
   - Add all email-related variables from .env.example
   - Update APP_URL for proper email links
   - Test email delivery before deploying to production

## Summary

Phase 2 provides a complete spending alert and email reporting system that keeps users informed about their financial status. The implementation is:

- **Secure**: Uses existing auth middleware and parameterized queries
- **Performant**: Indexed database queries and efficient scheduling
- **User-friendly**: Intuitive UI for managing alerts and preferences
- **Scalable**: Designed for batch processing and concurrent requests
- **Maintainable**: Clean separation of concerns with service layer pattern

Ready for Phase 3: Advanced Features & Analytics
