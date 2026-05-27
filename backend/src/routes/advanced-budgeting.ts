import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AdvancedBudgetingService } from '../services/advanced-budgeting-service';

const router = Router();

console.log('[Advanced Budgeting Routes] Loading routes...');

// Get envelopes (zero-based budgeting)
router.get('/envelopes/:year/:month', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Advanced Budgeting] GET envelopes');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const envelopes = await AdvancedBudgetingService.getEnvelopes(req.userId, month, year);
    res.json(envelopes);
  } catch (error: any) {
    console.error('[Advanced Budgeting] Error getting envelopes:', error);
    res.status(500).json({ error: 'Failed to get envelopes: ' + error.message });
  }
});

// Save budget rule
router.post('/rules', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Advanced Budgeting] POST budget rule');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rule = await AdvancedBudgetingService.saveBudgetRule(req.userId, req.body);
    res.json(rule);
  } catch (error: any) {
    console.error('[Advanced Budgeting] Error saving rule:', error);
    res.status(500).json({ error: 'Failed to save rule: ' + error.message });
  }
});

// Check budget alerts
router.get('/alerts/:year/:month', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Advanced Budgeting] GET alerts');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const alerts = await AdvancedBudgetingService.checkBudgetAlerts(req.userId, month, year);
    res.json(alerts);
  } catch (error: any) {
    console.error('[Advanced Budgeting] Error checking alerts:', error);
    res.status(500).json({ error: 'Failed to check alerts: ' + error.message });
  }
});

// Get budget recommendations
router.get('/recommendations', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Advanced Budgeting] GET recommendations');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recommendations = await AdvancedBudgetingService.getBudgetRecommendations(req.userId);
    res.json(recommendations);
  } catch (error: any) {
    console.error('[Advanced Budgeting] Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations: ' + error.message });
  }
});

// Get budget adherence
router.get('/adherence', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Advanced Budgeting] GET adherence');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const months = parseInt(req.query.months as string) || 3;
    const adherence = await AdvancedBudgetingService.getBudgetAdherence(req.userId, months);
    res.json(adherence);
  } catch (error: any) {
    console.error('[Advanced Budgeting] Error getting adherence:', error);
    res.status(500).json({ error: 'Failed to get adherence: ' + error.message });
  }
});

console.log('[Advanced Budgeting Routes] Routes loaded successfully');
export default router;
