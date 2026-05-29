import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';
import { InvestmentService } from '../services/investment-service';

const router = Router();

console.log('[Investment Routes] Loading investment routes...');

// Get portfolio summary
router.get('/portfolio', authenticate, loadUserOrganizations, requireOrganization, async (req: PermissionRequest, res: Response) => {
  console.log('[Investment] GET portfolio');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await InvestmentService.getPortfolioSummary(req.userId, req.organizationId!);
    res.json(summary);
  } catch (error: any) {
    console.error('[Investment] Error getting portfolio:', error);
    res.status(500).json({ error: 'Failed to get portfolio: ' + error.message });
  }
});

// Add investment
router.post('/', authenticate, loadUserOrganizations, requireOrganization, async (req: PermissionRequest, res: Response) => {
  console.log('[Investment] POST investment');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const investment = await InvestmentService.addInvestment(req.userId, {
      userId: req.userId,
      organizationId: req.organizationId!,
      ...req.body,
    });

    res.json(investment);
  } catch (error: any) {
    console.error('[Investment] Error adding investment:', error);
    res.status(500).json({ error: 'Failed to add investment: ' + error.message });
  }
});

// Update investment price
router.put('/:id/price', authenticate, loadUserOrganizations, requireOrganization, async (req: PermissionRequest, res: Response) => {
  console.log('[Investment] PUT investment price');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPrice } = req.body;
    if (currentPrice === undefined) {
      return res.status(400).json({ error: 'Missing currentPrice' });
    }

    const investment = await InvestmentService.updateInvestmentPrice(parseInt(req.params.id), currentPrice, req.organizationId!);
    res.json(investment);
  } catch (error: any) {
    console.error('[Investment] Error updating investment:', error);
    res.status(500).json({ error: 'Failed to update investment: ' + error.message });
  }
});

// Delete investment
router.delete('/:id', authenticate, loadUserOrganizations, requireOrganization, async (req: PermissionRequest, res: Response) => {
  console.log('[Investment] DELETE investment');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await InvestmentService.deleteInvestment(parseInt(req.params.id), req.organizationId!);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Investment] Error deleting investment:', error);
    res.status(500).json({ error: 'Failed to delete investment: ' + error.message });
  }
});

console.log('[Investment Routes] Investment routes loaded successfully');
export default router;
