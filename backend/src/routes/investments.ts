import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';
import { InvestmentService } from '../services/investment-service';
import { InvestmentStockService } from '../services/investment-stock-service';

const router = Router();

console.log('[Investment Routes] Loading investment routes...');

// Get portfolio summary
router.get('/portfolio', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Investment] GET portfolio');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await InvestmentService.getPortfolioSummary(req.userId);
    res.json(summary);
  } catch (error: any) {
    console.error('[Investment] Error getting portfolio:', error);
    res.status(500).json({ error: 'Failed to get portfolio: ' + error.message });
  }
});

// Add investment
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Investment] POST investment');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const investment = await InvestmentService.addInvestment(req.userId, req.body);

    res.json(investment);
  } catch (error: any) {
    console.error('[Investment] Error adding investment:', error);
    res.status(500).json({ error: 'Failed to add investment: ' + error.message });
  }
});

// Update investment price
router.put('/:id/price', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Investment] PUT investment price');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPrice } = req.body;
    if (currentPrice === undefined) {
      return res.status(400).json({ error: 'Missing currentPrice' });
    }

    const investment = await InvestmentService.updateInvestmentPrice(parseInt(req.params.id), currentPrice);
    res.json(investment);
  } catch (error: any) {
    console.error('[Investment] Error updating investment:', error);
    res.status(500).json({ error: 'Failed to update investment: ' + error.message });
  }
});

// Delete investment
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Investment] DELETE investment');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await InvestmentService.deleteInvestment(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Investment] Error deleting investment:', error);
    res.status(500).json({ error: 'Failed to delete investment: ' + error.message });
  }
});

// Get current stock price by ticker
router.get('/stock-price/:ticker', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Investment] GET stock price for ticker:', req.params.ticker);
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ticker } = req.params;
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker symbol required' });
    }

    const stockData = await InvestmentStockService.getStockPrice(ticker);
    res.json(stockData);
  } catch (error: any) {
    console.error('[Investment] Error getting stock price:', error);
    res.status(500).json({ error: 'Failed to get stock price: ' + error.message });
  }
});

console.log('[Investment Routes] Investment routes loaded successfully');
export default router;
