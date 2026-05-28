import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Phase4AnalyticsService } from '../services/phase4-analytics-service';
import { Phase4TrendsService } from '../services/phase4-trends-service';

const router = express.Router();

console.log('[Phase4 Analytics Routes] Loading...');

/**
 * GET /api/phase4/analytics/summary
 * Get comprehensive analytics summary (current month, last month, YTD, etc.)
 */
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await Phase4AnalyticsService.getAnalyticsSummary(userId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[Phase4 Analytics] Error getting summary:', error);
    res.status(500).json({
      error: 'Failed to get analytics summary',
      details: String(error),
    });
  }
});

/**
 * GET /api/phase4/analytics/month/:year/:month
 * Get analytics for specific month
 */
router.get('/month/:year/:month', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const analytics = await Phase4AnalyticsService.getMonthAnalytics(userId, year, month);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[Phase4 Analytics] Error getting month analytics:', error);
    res.status(500).json({
      error: 'Failed to get month analytics',
      details: String(error),
    });
  }
});

/**
 * POST /api/phase4/analytics/refresh
 * Recalculate and save analytics to database
 */
router.post('/refresh', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Phase4AnalyticsService.saveAnalyticsToDB(userId);

    const summary = await Phase4AnalyticsService.getAnalyticsSummary(userId);

    res.json({
      success: true,
      data: summary,
      message: 'Analytics refreshed successfully',
    });
  } catch (error) {
    console.error('[Phase4 Analytics] Error refreshing analytics:', error);
    res.status(500).json({
      error: 'Failed to refresh analytics',
      details: String(error),
    });
  }
});

/**
 * GET /api/phase4/trends/seasonal
 * Get seasonal insights for all categories
 */
router.get('/trends/seasonal', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const insights = await Phase4TrendsService.getSeasonalInsights(userId);

    res.json({
      success: true,
      data: insights,
      count: insights.length,
    });
  } catch (error) {
    console.error('[Phase4 Analytics] Error getting seasonal insights:', error);
    res.status(500).json({
      error: 'Failed to get seasonal insights',
      details: String(error),
    });
  }
});

/**
 * GET /api/phase4/trends/category/:categoryId
 * Get trends for a specific category
 */
router.get('/trends/category/:categoryId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const categoryId = parseInt(req.params.categoryId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!categoryId) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const trends = await Phase4TrendsService.getCategoryTrends(userId, categoryId);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('[Phase4 Analytics] Error getting category trends:', error);
    res.status(500).json({
      error: 'Failed to get category trends',
      details: String(error),
    });
  }
});

/**
 * POST /api/phase4/trends/refresh
 * Recalculate and save trends to database
 */
router.post('/trends/refresh', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Phase4TrendsService.saveTrendsToDB(userId);

    const insights = await Phase4TrendsService.getSeasonalInsights(userId);

    res.json({
      success: true,
      data: insights,
      message: 'Trends refreshed successfully',
    });
  } catch (error) {
    console.error('[Phase4 Analytics] Error refreshing trends:', error);
    res.status(500).json({
      error: 'Failed to refresh trends',
      details: String(error),
    });
  }
});

console.log('[Phase4 Analytics Routes] Loaded successfully');

export default router;
