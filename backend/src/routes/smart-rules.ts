import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import SmartRulesEngine from '../services/smart-rules-engine';

const router = Router();

router.get('/recommendations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    const recommendations = await SmartRulesEngine.analyzeBudgetAndGetRecommendations(
      req.userId,
      parseInt(month as string),
      parseInt(year as string)
    );

    res.json({ recommendations });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations: ' + error.message });
  }
});

router.get('/anomalies/:categoryId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const categoryId = parseInt(req.params.categoryId);
    const alert = await SmartRulesEngine.detectSpendingAnomalies(req.userId, categoryId);

    res.json({ alert });
  } catch (error: any) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies: ' + error.message });
  }
});

router.get('/forecast/:categoryId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const categoryId = parseInt(req.params.categoryId);
    const { daysAhead = '30' } = req.query;

    const forecast = await SmartRulesEngine.getSpendingForecast(
      req.userId,
      categoryId,
      parseInt(daysAhead as string)
    );

    res.json(forecast);
  } catch (error: any) {
    console.error('Error forecasting spending:', error);
    res.status(500).json({ error: 'Failed to forecast spending: ' + error.message });
  }
});

router.get('/all-anomalies', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const categoriesResult = await (require('../config/database')).pool.query(
      `SELECT DISTINCT c.id FROM categories c
       WHERE c.user_id = $1`,
      [req.userId]
    );

    const alerts = [];
    for (const category of categoriesResult.rows) {
      const alert = await SmartRulesEngine.detectSpendingAnomalies(req.userId, category.id);
      if (alert) alerts.push(alert);
    }

    res.json({ alerts: alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })});
  } catch (error: any) {
    console.error('Error getting all anomalies:', error);
    res.status(500).json({ error: 'Failed to get anomalies: ' + error.message });
  }
});

export default router;
