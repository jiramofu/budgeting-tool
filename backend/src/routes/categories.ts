import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { TransactionCategorizer } from '../services/categorizer';

const router = Router();

console.log('[Category Routes] Loading category routes...');

// Get all categories
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Category] GET all for user:', req.userId);
  try {
    const result = await query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name',
      [req.userId]
    );
    console.log('[Category] Found', result.rows.length, 'categories');
    res.json(result.rows);
  } catch (error: any) {
    console.error('[Category] Error fetching:', error);
    res.status(500).json({ error: 'Failed to fetch categories: ' + error.message });
  }
});

// Create category
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Category] POST new:', req.body);
  try {
    const { name, type, color, icon, parentId } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    if (!['fixed', 'variable', 'recurring'].includes(type)) {
      return res.status(400).json({ error: 'Invalid category type' });
    }

    const result = await query(
      'INSERT INTO categories (user_id, name, type, color, icon, parent_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, name, type, color || null, icon || null, parentId || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Category] Error creating:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Failed to create category: ' + error.message });
  }
});

// Suggest category for a transaction
router.post('/suggest', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Category] POST suggest:', req.body);
  try {
    const { description, amount } = req.body;

    if (!description || !amount) {
      return res.status(400).json({ error: 'Description and amount are required' });
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const suggestion = await TransactionCategorizer.suggestCategory(
      req.userId,
      description,
      amount
    );

    if (suggestion) {
      // Get category details
      const categoryResult = await query('SELECT * FROM categories WHERE id = $1', [
        suggestion.categoryId,
      ]);
      if (categoryResult.rows.length > 0) {
        res.json({ suggestion: categoryResult.rows[0], confidence: suggestion.confidence });
      } else {
        res.json({ suggestion: null, confidence: 0 });
      }
    } else {
      res.json({ suggestion: null, confidence: 0 });
    }
  } catch (error: any) {
    console.error('[Category] Error suggesting:', error);
    res.status(500).json({ error: 'Failed to suggest category: ' + error.message });
  }
});

console.log('[Category Routes] Category routes loaded successfully');
export default router;
