import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';
import { AIInsightsService } from '../services/ai-insights-service';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate, loadUserOrganizations, requireOrganization);

console.log('[Insights Routes] Loading insights routes...');

// Detect spending anomalies
router.get('/anomalies/:year/:month', async (req: PermissionRequest, res: Response) => {
  console.log('[Insights] GET anomalies');
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const anomalies = await AIInsightsService.detectAnomalies(req.userId, month, year, req.organizationId!);
    res.json(anomalies);
  } catch (error: any) {
    console.error('[Insights] Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies: ' + error.message });
  }
});

// Generate insights
router.get('/generate', async (req: PermissionRequest, res: Response) => {
  console.log('[Insights] GET generated insights');
  try {
    const insights = await AIInsightsService.generateInsights(req.userId, req.organizationId!);
    res.json(insights);
  } catch (error: any) {
    console.error('[Insights] Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights: ' + error.message });
  }
});

// Predict next month
router.get('/predict-next-month', async (req: PermissionRequest, res: Response) => {
  console.log('[Insights] GET next month prediction');
  try {
    const predictions = await AIInsightsService.predictNextMonth(req.userId, req.organizationId!);
    res.json(predictions);
  } catch (error: any) {
    console.error('[Insights] Error predicting next month:', error);
    res.status(500).json({ error: 'Failed to predict next month: ' + error.message });
  }
});

// Suggest category for transaction
router.post('/suggest-category', async (req: PermissionRequest, res: Response) => {
  console.log('[Insights] POST suggest category');
  try {
    const { description, amount } = req.body;

    if (!description || amount === undefined) {
      return res.status(400).json({ error: 'Missing description or amount' });
    }

    const categoryId = await AIInsightsService.suggestCategory(req.userId, description, amount, req.organizationId!);
    res.json({ categoryId });
  } catch (error: any) {
    console.error('[Insights] Error suggesting category:', error);
    res.status(500).json({ error: 'Failed to suggest category: ' + error.message });
  }
});

console.log('[Insights Routes] Insights routes loaded successfully');
export default router;
