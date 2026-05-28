import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Phase4ProjectionService } from '../services/phase4-projection-service';

const router = express.Router();

console.log('[Phase4 Projections Routes] Loading...');

/**
 * @swagger
 * /api/phase4/projections:
 *   get:
 *     summary: Get 90-day cash flow projection summary
 *     description: Returns a comprehensive summary of the next 90-day cash flow projection including current balance, projected balance, risk levels, and day breakdown.
 *     tags:
 *       - Phase 4 Projections
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projection summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentBalance:
 *                       type: number
 *                       description: Current account balance
 *                     projectedBalance:
 *                       type: number
 *                       description: Projected balance after 90 days
 *                     lowestBalance:
 *                       type: number
 *                       description: Lowest balance during projection period
 *                     highestBalance:
 *                       type: number
 *                       description: Highest balance during projection period
 *                     averageBalance:
 *                       type: number
 *                       description: Average balance over 90 days
 *                     criticalDays:
 *                       type: number
 *                       description: Days with balance < $500
 *                     warningDays:
 *                       type: number
 *                       description: Days with balance $500-$2000
 *                     safeDays:
 *                       type: number
 *                       description: Days with balance > $2000
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await Phase4ProjectionService.getProjectionSummary(userId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[Phase4 Projections] Error getting projection summary:', error);
    res.status(500).json({
      error: 'Failed to get projection summary',
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /api/phase4/projections/detailed:
 *   get:
 *     summary: Get detailed 90-day projection
 *     description: Returns full day-by-day projection data with opening balance, inflows, outflows, closing balance, and events for each day.
 *     tags:
 *       - Phase 4 Projections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         description: Number of days to project (default 90)
 *         schema:
 *           type: integer
 *           default: 90
 *     responses:
 *       200:
 *         description: Detailed projection retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     days:
 *                       type: number
 *                     projection:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           openingBalance:
 *                             type: number
 *                           inflow:
 *                             type: number
 *                           outflow:
 *                             type: number
 *                           closingBalance:
 *                             type: number
 *                           riskLevel:
 *                             type: string
 *                             enum: [critical, warning, safe]
 *                           events:
 *                             type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/detailed', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const days = parseInt(req.query.days as string) || 90;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const projection = await Phase4ProjectionService.projectCashFlow(userId, days);

    res.json({
      success: true,
      data: {
        days: projection.length,
        projection,
      },
    });
  } catch (error) {
    console.error('[Phase4 Projections] Error getting detailed projection:', error);
    res.status(500).json({
      error: 'Failed to get detailed projection',
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /api/phase4/projections/recurring:
 *   get:
 *     summary: Get all recurring items
 *     description: Returns a list of all recurring income and expense items for the user.
 *     tags:
 *       - Phase 4 Projections
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recurring items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       description:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       frequency:
 *                         type: string
 *                         enum: [daily, weekly, bi-weekly, monthly, quarterly, yearly]
 *                       start_date:
 *                         type: string
 *                         format: date
 *                       is_income:
 *                         type: boolean
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/recurring', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const items = await Phase4ProjectionService.getRecurringItems(userId);

    res.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('[Phase4 Projections] Error getting recurring items:', error);
    res.status(500).json({
      error: 'Failed to get recurring items',
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /api/phase4/projections/recurring:
 *   post:
 *     summary: Add a new recurring item
 *     description: Creates a new recurring income or expense item for cash flow projection.
 *     tags:
 *       - Phase 4 Projections
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amount
 *               - frequency
 *               - start_date
 *               - is_income
 *             properties:
 *               description:
 *                 type: string
 *                 description: Name of the recurring item (e.g., "Monthly Rent")
 *               amount:
 *                 type: number
 *                 description: Amount in dollars
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, bi-weekly, monthly, quarterly, yearly]
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Optional end date for the recurring item
 *               day_of_month:
 *                 type: integer
 *                 description: Required for monthly/quarterly/yearly
 *               day_of_week:
 *                 type: integer
 *                 description: Required for weekly (0=Sunday, 6=Saturday)
 *               is_income:
 *                 type: boolean
 *               category_id:
 *                 type: integer
 *                 description: Optional category ID
 *     responses:
 *       200:
 *         description: Recurring item created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/recurring', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      description,
      amount,
      frequency,
      start_date,
      end_date,
      day_of_month,
      day_of_week,
      category_id,
      is_income,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!description || !amount || !frequency || !start_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const item = await Phase4ProjectionService.addRecurringItem(userId, {
      description,
      amount: parseFloat(amount),
      frequency,
      start_date,
      end_date,
      day_of_month: day_of_month ? parseInt(day_of_month) : undefined,
      day_of_week: day_of_week ? parseInt(day_of_week) : undefined,
      category_id: category_id ? parseInt(category_id) : undefined,
      is_income: is_income || false,
    });

    res.json({
      success: true,
      data: item,
      message: 'Recurring item added successfully',
    });
  } catch (error) {
    console.error('[Phase4 Projections] Error adding recurring item:', error);
    res.status(500).json({
      error: 'Failed to add recurring item',
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /api/phase4/projections/refresh:
 *   post:
 *     summary: Recalculate and save projections
 *     description: Triggers a recalculation of the 90-day cash flow projection and saves it to the database for performance optimization.
 *     tags:
 *       - Phase 4 Projections
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projections refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Updated projection summary
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/refresh', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Phase4ProjectionService.saveProjectionsToDB(userId);

    const summary = await Phase4ProjectionService.getProjectionSummary(userId);

    res.json({
      success: true,
      data: summary,
      message: 'Projections refreshed successfully',
    });
  } catch (error) {
    console.error('[Phase4 Projections] Error refreshing projections:', error);
    res.status(500).json({
      error: 'Failed to refresh projections',
      details: String(error),
    });
  }
});

console.log('[Phase4 Projections Routes] Loaded successfully');

export default router;
