import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';

const router = Router();

console.log('[Budget Routes] Loading budget routes...');

// List all budgets for user
const getBudgetsHandler = async (req: PermissionRequest, res: Response) => {
  console.log('[Budget] GET all budgets for user:', req.userId, 'org:', req.organizationId!);
  try {
    const result = await query(
      'SELECT * FROM budgets WHERE user_id = $1 AND organization_id = $2 ORDER BY year DESC, month DESC',
      [req.userId, req.organizationId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('[Budget] Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets: ' + error.message });
  }
};

// Get all budgets - use explicit path with named routes FIRST
router.get(
  '/list',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  getBudgetsHandler
);

// Root path handler - MUST come after named routes
router.get(
  '/',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  getBudgetsHandler
);

// Get current month budget
router.get(
  '/current',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Budget] GET current for user:', req.userId, 'org:', req.organizationId!);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const result = await query(
        'SELECT * FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3 AND organization_id = $4',
        [req.userId, month, year, req.organizationId]
      );

      if (result.rows.length === 0) {
        console.log('[Budget] No current budget found, creating one');
        // Create budget if it doesn't exist
        const createResult = await query(
          'INSERT INTO budgets (user_id, month, year, organization_id) VALUES ($1, $2, $3, $4) RETURNING *',
          [req.userId, month, year, req.organizationId]
        );
        return res.json(createResult.rows[0]);
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('[Budget] Error fetching current:', error);
      res.status(500).json({ error: 'Failed to fetch budget: ' + error.message });
    }
  }
);

// Create budget for month
router.post(
  '/',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Budget] POST new:', req.body);
    try {
      const { month, year } = req.body;

      if (!month || !year) {
        return res.status(400).json({ error: 'Month and year are required' });
      }

      const result = await query(
        'INSERT INTO budgets (user_id, month, year, organization_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.userId, month, year, req.organizationId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('[Budget] Error creating:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Budget already exists for this month' });
      }
      res.status(500).json({ error: 'Failed to create budget: ' + error.message });
    }
  }
);

// Update budget target for category
router.put(
  '/:budgetId/targets/:categoryId',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Budget] PUT target:', req.params, req.body);
    try {
      const { budgetId, categoryId } = req.params;
      const { targetAmount } = req.body;

      if (!targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) < 0) {
        return res.status(400).json({ error: 'Valid target amount is required' });
      }

      // Verify budget belongs to user
      const budgetCheck = await query(
        'SELECT * FROM budgets WHERE id = $1 AND user_id = $2',
        [budgetId, req.userId]
      );

      if (budgetCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      // Verify category belongs to user
      const categoryCheck = await query(
        'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
        [categoryId, req.userId]
      );

      if (categoryCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Update or create budget target
      const result = await query(
        `INSERT INTO budget_targets (budget_id, category_id, target_amount)
         VALUES ($1, $2, $3)
         ON CONFLICT (budget_id, category_id)
         DO UPDATE SET target_amount = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [budgetId, categoryId, parseFloat(targetAmount)]
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('[Budget] Error updating target:', error);
      res.status(500).json({ error: 'Failed to update budget target: ' + error.message });
    }
  }
);

// Get budget targets for a budget
router.get(
  '/:budgetId/targets',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Budget] GET targets for budget:', req.params.budgetId);
    try {
      const { budgetId } = req.params;

      // Verify budget belongs to user
      const budgetCheck = await query(
        'SELECT * FROM budgets WHERE id = $1 AND user_id = $2',
        [budgetId, req.userId]
      );

      if (budgetCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      // Get all targets for this budget
      const result = await query(
        `SELECT bt.*, c.name as category_name
         FROM budget_targets bt
         JOIN categories c ON bt.category_id = c.id
         WHERE bt.budget_id = $1
         ORDER BY c.name`,
        [budgetId]
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error('[Budget] Error fetching targets:', error);
      res.status(500).json({ error: 'Failed to fetch budget targets: ' + error.message });
    }
  }
);

console.log('[Budget Routes] Budget routes loaded successfully');
export default router;
