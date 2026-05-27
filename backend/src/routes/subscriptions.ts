import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { SubscriptionService } from '../services/subscription-service';

const router = Router();

console.log('[Subscription Routes] Loading subscription routes...');

// Get subscription summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Subscription] GET summary');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await SubscriptionService.getSubscriptionSummary(req.userId);
    res.json(summary);
  } catch (error: any) {
    console.error('[Subscription] Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get summary: ' + error.message });
  }
});

// Get upcoming billings
router.get('/upcoming', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Subscription] GET upcoming');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const upcoming = await SubscriptionService.getUpcomingBillings(req.userId, days);
    res.json(upcoming);
  } catch (error: any) {
    console.error('[Subscription] Error getting upcoming:', error);
    res.status(500).json({ error: 'Failed to get upcoming: ' + error.message });
  }
});

// Add subscription
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Subscription] POST subscription');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await SubscriptionService.addSubscription(req.userId, {
      userId: req.userId,
      ...req.body,
    });

    res.json(subscription);
  } catch (error: any) {
    console.error('[Subscription] Error adding subscription:', error);
    res.status(500).json({ error: 'Failed to add subscription: ' + error.message });
  }
});

// Cancel subscription
router.put('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Subscription] PUT cancel');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await SubscriptionService.cancelSubscription(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Subscription] Error canceling:', error);
    res.status(500).json({ error: 'Failed to cancel: ' + error.message });
  }
});

console.log('[Subscription Routes] Subscription routes loaded successfully');
export default router;
