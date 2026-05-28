import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';

const router = Router();

console.log('[Transaction Routes] Loading transaction routes...');

// Get transactions
router.get(
  '/',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Transaction] GET all for user:', req.userId, 'org:', req.organizationId);
    try {
      const { budgetId, categoryId, startDate, endDate } = req.query;
      let queryStr = 'SELECT * FROM transactions WHERE user_id = $1 AND organization_id = $2';
      const params: any[] = [req.userId, req.organizationId];
      let paramCount = 2;

      if (budgetId) {
        queryStr += ` AND budget_id = $${++paramCount}`;
        params.push(budgetId);
      }

      if (categoryId) {
        queryStr += ` AND category_id = $${++paramCount}`;
        params.push(categoryId);
      }

      if (startDate) {
        queryStr += ` AND transaction_date >= $${++paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        queryStr += ` AND transaction_date <= $${++paramCount}`;
        params.push(endDate);
      }

      queryStr += ' ORDER BY transaction_date DESC';

      const result = await query(queryStr, params);
      console.log('[Transaction] Found', result.rows.length, 'transactions');
      res.json(result.rows);
    } catch (error: any) {
      console.error('[Transaction] Error fetching:', error);
      res.status(500).json({ error: 'Failed to fetch transactions: ' + error.message });
    }
  }
);

// Create transaction
router.post(
  '/',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Transaction] POST new:', req.body);
    try {
      const {
        budgetId,
        categoryId,
        amount,
        description,
        transactionDate,
        transactionType = 'expense',
      } = req.body;

      if (!categoryId || !amount || !transactionDate) {
        return res.status(400).json({ error: 'Required fields missing' });
      }

      const result = await query(
        `INSERT INTO transactions (user_id, budget_id, category_id, amount, description, transaction_date, transaction_type, source, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          req.userId,
          budgetId || null,
          categoryId,
          amount,
          description || null,
          transactionDate,
          transactionType,
          'manual',
          req.organizationId,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('[Transaction] Error creating:', error);
      res.status(500).json({ error: 'Failed to create transaction: ' + error.message });
    }
  }
);

console.log('[Transaction Routes] Transaction routes loaded successfully');
export default router;
