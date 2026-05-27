import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  checkSpendingAlerts,
  getActiveAlerts,
  getAlertPreferences,
  updateAlertPreferences,
  resolveAlert,
  getAllAnomalies,
} from '../services/alertService';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * Check for spending alerts in a specific budget
 * GET /api/alerts/check/:budgetId
 */
router.get('/check/:budgetId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { budgetId } = req.params;

    const alerts = await checkSpendingAlerts(userId, parseInt(budgetId));

    res.json({
      success: true,
      alerts,
      hasAlerts: alerts.length > 0,
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check alerts',
    });
  }
});

/**
 * Get active alerts for the user
 * GET /api/alerts/active
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const alerts = await getActiveAlerts(userId);

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Error getting active alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active alerts',
    });
  }
});

/**
 * Get all alerts and anomalies (including resolved)
 * GET /api/alerts/all
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const alerts = await getAllAnomalies(userId);

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Error getting all alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get all alerts',
    });
  }
});

/**
 * Resolve an active alert
 * PUT /api/alerts/:alertId/resolve
 */
router.put('/:alertId/resolve', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { alertId } = req.params;

    await resolveAlert(userId, parseInt(alertId));

    res.json({
      success: true,
      message: 'Alert resolved successfully',
    });
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve alert',
    });
  }
});

/**
 * Get alert preferences for a category
 * GET /api/alerts/preferences/:categoryId
 */
router.get('/preferences/:categoryId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { categoryId } = req.params;

    const preferences = await getAlertPreferences(userId, parseInt(categoryId));

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error getting alert preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alert preferences',
    });
  }
});

/**
 * Update alert preferences for a category
 * PUT /api/alerts/preferences/:categoryId
 */
router.put('/preferences/:categoryId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { categoryId } = req.params;
    const {
      alertThresholdPercentage,
      criticalThresholdPercentage,
      enableEmailAlerts,
      enableAppAlerts,
    } = req.body;

    // Validate input
    if (
      alertThresholdPercentage !== undefined &&
      (alertThresholdPercentage < 0 || alertThresholdPercentage > 100)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Alert threshold must be between 0 and 100',
      });
    }

    if (
      criticalThresholdPercentage !== undefined &&
      (criticalThresholdPercentage < 0 || criticalThresholdPercentage > 100)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Critical threshold must be between 0 and 100',
      });
    }

    const preferences = await updateAlertPreferences(userId, parseInt(categoryId), {
      alertThresholdPercentage,
      criticalThresholdPercentage,
      enableEmailAlerts,
      enableAppAlerts,
    });

    res.json({
      success: true,
      preferences,
      message: 'Alert preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating alert preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alert preferences',
    });
  }
});

export default router;
