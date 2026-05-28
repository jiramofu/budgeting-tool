import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analytics-service';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';

const router = Router();

console.log('[Analytics Routes] Loading analytics routes...');

// Get monthly spending analysis
router.get(
  '/monthly/:year/:month',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
  console.log('[Analytics] GET monthly analysis');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const analysis = await AnalyticsService.getMonthlyAnalysis(req.userId, month, year);
    res.json(analysis);
  } catch (error: any) {
    console.error('[Analytics] Error getting monthly analysis:', error);
    res.status(500).json({ error: 'Failed to get analysis: ' + error.message });
  }
});

// Get yearly spending analysis
router.get(
  '/yearly/:year',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
  console.log('[Analytics] GET yearly analysis');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const year = parseInt(req.params.year);

    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const analysis = await AnalyticsService.getYearlyAnalysis(req.userId, year);
    res.json(analysis);
  } catch (error: any) {
    console.error('[Analytics] Error getting yearly analysis:', error);
    res.status(500).json({ error: 'Failed to get analysis: ' + error.message });
  }
});

console.log('[Analytics Routes] Analytics routes loaded successfully');
export default router;
