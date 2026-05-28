import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';

const router = Router();

console.log('[Budget Routes] Loading budget routes...');

// Get current month budget
router.get(
  '/current',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Budget] GET current for user:', req.userId, 'org:', req.organizationId);
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

console.log('[Budget Routes] Budget routes loaded successfully');
export default router;
