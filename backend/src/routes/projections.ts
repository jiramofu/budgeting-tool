import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ProjectionService } from '../services/projection-service';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';

const router = Router();

console.log('[Projection Routes] Loading projection routes...');

// Get 90-day cash flow projection
router.get(
  '/cash-flow',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Projection] GET cash-flow');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 90;
      const projection = await ProjectionService.projectCashFlow(req.userId, Math.min(days, 365));

      res.json(projection);
    } catch (error: any) {
      console.error('[Projection] Error getting projection:', error);
      res.status(500).json({ error: 'Failed to get projection: ' + error.message });
    }
  }
);

// Get projection summary with alerts
router.get(
  '/summary',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Projection] GET summary');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const summary = await ProjectionService.getProjectionSummary(req.userId);
      res.json(summary);
    } catch (error: any) {
      console.error('[Projection] Error getting summary:', error);
      res.status(500).json({ error: 'Failed to get summary: ' + error.message });
    }
  }
);

console.log('[Projection Routes] Projection routes loaded successfully');
export default router;
