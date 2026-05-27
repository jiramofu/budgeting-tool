import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

console.log('[Budget Routes] Loading budget routes...');

// Get current month budget
router.get('/current', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Budget] GET current for user:', req.userId);
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await query(
      'SELECT * FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3',
      [req.userId, month, year]
    );

    if (result.rows.length === 0) {
      console.log('[Budget] No current budget found, creating one');
      // Create budget if it doesn't exist
      const createResult = await query(
        'INSERT INTO budgets (user_id, month, year) VALUES ($1, $2, $3) RETURNING *',
        [req.userId, month, year]
      );
      return res.json(createResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Budget] Error fetching current:', error);
    res.status(500).json({ error: 'Failed to fetch budget: ' + error.message });
  }
});

// Create budget for month
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Budget] POST new:', req.body);
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const result = await query(
      'INSERT INTO budgets (user_id, month, year) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, month, year]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Budget] Error creating:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Budget already exists for this month' });
    }
    res.status(500).json({ error: 'Failed to create budget: ' + error.message });
  }
});

console.log('[Budget Routes] Budget routes loaded successfully');
export default router;
