import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { GoalsService } from '../services/goals-service';

const router = Router();

console.log('[Goals Routes] Loading goals routes...');

// Get all goals
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Goals] GET all goals');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const activeOnly = req.query.active === 'true';
    const goals = await GoalsService.getGoals(req.userId, activeOnly);
    res.json(goals);
  } catch (error: any) {
    console.error('[Goals] Error getting goals:', error);
    res.status(500).json({ error: 'Failed to get goals: ' + error.message });
  }
});

// Get goal summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Goals] GET summary');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await GoalsService.getGoalSummary(req.userId);
    res.json(summary);
  } catch (error: any) {
    console.error('[Goals] Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get summary: ' + error.message });
  }
});

// Get goal alerts
router.get('/alerts', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Goals] GET alerts');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const alerts = await GoalsService.checkGoalAlerts(req.userId);
    res.json(alerts);
  } catch (error: any) {
    console.error('[Goals] Error getting alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts: ' + error.message });
  }
});

// Get single goal
router.get('/:goalId', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Goals] GET goal by id');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const goalId = parseInt(req.params.goalId);
    const goal = await GoalsService.getGoal(req.userId, goalId);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error: any) {
    console.error('[Goals] Error getting goal:', error);
    res.status(500).json({ error: 'Failed to get goal: ' + error.message });
  }
});

// Get goal progress
router.get('/:goalId/progress', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Goals] GET goal progress');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const goalId = parseInt(req.params.goalId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const progress = await GoalsService.getGoalProgress(req.userId, goalId, Math.min(limit, 365));

    res.json(progress);
  } catch (error: any) {
    console.error('[Goals] Error getting progress:', error);
    res.status(500).json({ error: 'Failed to get progress: ' + error.message });
  }
});

// Create goal
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Goals] POST create goal');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, goalType, targetAmount, targetDate, categoryId, description } = req.body;

    if (!name || !goalType || !targetAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const goal = await GoalsService.createGoal(
      req.userId,
      name,
      goalType,
      targetAmount,
      targetDate,
      categoryId,
      description
    );

    res.status(201).json(goal);
  } catch (error: any) {
    console.error('[Goals] Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal: ' + error.message });
  }
});

// Update goal
router.put('/:goalId', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Goals] PUT update goal');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const goalId = parseInt(req.params.goalId);
    const goal = await GoalsService.updateGoal(req.userId, goalId, req.body);

    res.json(goal);
  } catch (error: any) {
    console.error('[Goals] Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal: ' + error.message });
  }
});

// Add progress to goal
router.post('/:goalId/progress', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Goals] POST add progress');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, notes } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const goalId = parseInt(req.params.goalId);
    const progress = await GoalsService.addProgress(req.userId, goalId, amount, notes);

    res.status(201).json(progress);
  } catch (error: any) {
    console.error('[Goals] Error adding progress:', error);
    res.status(500).json({ error: 'Failed to add progress: ' + error.message });
  }
});

// Delete goal
router.delete('/:goalId', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Goals] DELETE goal');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const goalId = parseInt(req.params.goalId);
    const success = await GoalsService.deleteGoal(req.userId, goalId);

    if (!success) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Goals] Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal: ' + error.message });
  }
});

console.log('[Goals Routes] Goals routes loaded successfully');
export default router;
