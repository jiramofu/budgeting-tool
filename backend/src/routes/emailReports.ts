import express, { Response } from 'express';
import { authenticate } from '../middleware/auth';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';
import {
  getEmailPreferences,
  updateEmailPreferences,
  getUserEmailReports,
  createEmailReport,
  updateEmailReport,
  deleteEmailReport,
  sendTestEmail,
} from '../services/emailReportService';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate, loadUserOrganizations, requireOrganization);

/**
 * Get email preferences for the user
 * GET /api/email-reports/preferences
 */
router.get('/preferences', async (req: PermissionRequest, res: Response) => {
  try {
    const userId = req.userId;
    const preferences = await getEmailPreferences(userId, req.organizationId!);

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error getting email preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email preferences',
    });
  }
});

/**
 * Update email preferences
 * PUT /api/email-reports/preferences
 */
router.put('/preferences', async (req: PermissionRequest, res: Response) => {
  try {
    const userId = req.userId;
    const preferences = await updateEmailPreferences(userId, req.body, req.organizationId!);

    res.json({
      success: true,
      preferences,
      message: 'Email preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email preferences',
    });
  }
});

/**
 * Send a test email to verify email service is working
 * POST /api/email-reports/test
 */
router.post('/test', async (req: PermissionRequest, res: Response) => {
  try {
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'recipientEmail is required',
      });
    }

    const result = await sendTestEmail(recipientEmail, req.organizationId!);

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
    });
  }
});

/**
 * Get all email report schedules for the user
 * GET /api/email-reports
 */
router.get('/', async (req: PermissionRequest, res: Response) => {
  try {
    const userId = req.userId;
    const reports = await getUserEmailReports(userId, req.organizationId!);

    res.json({
      success: true,
      reports,
      count: reports.length,
    });
  } catch (error) {
    console.error('Error getting email reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email reports',
    });
  }
});

/**
 * Create a new email report schedule
 * POST /api/email-reports
 */
router.post('/', async (req: PermissionRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      reportType,
      recipientEmail,
      frequency,
      scheduledDayOfWeek,
      scheduledDayOfMonth,
      scheduledTime,
    } = req.body;

    // Validate required fields
    if (!reportType || !recipientEmail || !frequency || !scheduledTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportType, recipientEmail, frequency, scheduledTime',
      });
    }

    // Validate frequency-specific fields
    if (frequency === 'weekly' && scheduledDayOfWeek === undefined) {
      return res.status(400).json({
        success: false,
        error: 'scheduledDayOfWeek is required for weekly frequency',
      });
    }

    if (frequency === 'monthly' && scheduledDayOfMonth === undefined) {
      return res.status(400).json({
        success: false,
        error: 'scheduledDayOfMonth is required for monthly frequency',
      });
    }

    const report = await createEmailReport(userId, {
      reportType,
      recipientEmail,
      frequency,
      scheduledDayOfWeek,
      scheduledDayOfMonth,
      scheduledTime,
    }, req.organizationId!);

    res.status(201).json({
      success: true,
      report,
      message: 'Email report scheduled successfully',
    });
  } catch (error) {
    console.error('Error creating email report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create email report',
    });
  }
});

/**
 * Update an email report schedule
 * PUT /api/email-reports/:reportId
 */
router.put('/:reportId', async (req: PermissionRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { reportId } = req.params;

    const report = await updateEmailReport(
      userId,
      parseInt(reportId),
      req.body,
      req.organizationId
    );

    res.json({
      success: true,
      report,
      message: 'Email report updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating email report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update email report',
    });
  }
});

/**
 * Delete an email report schedule
 * DELETE /api/email-reports/:reportId
 */
router.delete('/:reportId', async (req: PermissionRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { reportId } = req.params;

    await deleteEmailReport(userId, parseInt(reportId), req.organizationId!);

    res.json({
      success: true,
      message: 'Email report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting email report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete email report',
    });
  }
});

export default router;
