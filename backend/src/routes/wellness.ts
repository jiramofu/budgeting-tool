import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { FinancialWellnessService } from '../services/financial-wellness-service';

const router = Router();

console.log('[Wellness Routes] Loading wellness routes...');

// Calculate net worth
router.get('/net-worth', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Wellness] GET net worth');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await FinancialWellnessService.calculateNetWorth(req.userId);
    res.json(snapshot);
  } catch (error: any) {
    console.error('[Wellness] Error calculating net worth:', error);
    res.status(500).json({ error: 'Failed to calculate net worth: ' + error.message });
  }
});

// Get debt payoff plans
router.get('/debt-payoff-plans', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Wellness] GET debt payoff plans');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const plans = await FinancialWellnessService.getDebtPayoffPlans(req.userId);
    res.json(plans);
  } catch (error: any) {
    console.error('[Wellness] Error getting debt payoff plans:', error);
    res.status(500).json({ error: 'Failed to get debt payoff plans: ' + error.message });
  }
});

// Get tax insights
router.get('/tax-insights', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Wellness] GET tax insights');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const insights = await FinancialWellnessService.getTaxInsights(req.userId);
    res.json(insights);
  } catch (error: any) {
    console.error('[Wellness] Error getting tax insights:', error);
    res.status(500).json({ error: 'Failed to get tax insights: ' + error.message });
  }
});

// Get savings rate analysis
router.get('/savings-rate', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Wellness] GET savings rate');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const months = parseInt(req.query.months as string) || 6;
    const analysis = await FinancialWellnessService.getSavingsRateAnalysis(req.userId, months);
    res.json(analysis);
  } catch (error: any) {
    console.error('[Wellness] Error analyzing savings rate:', error);
    res.status(500).json({ error: 'Failed to analyze savings rate: ' + error.message });
  }
});

console.log('[Wellness Routes] Wellness routes loaded successfully');
export default router;
