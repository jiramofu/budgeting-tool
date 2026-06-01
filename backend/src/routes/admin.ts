import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { config } from '../config/env';

const router = Router();

/**
 * Middleware to verify admin/reset token
 * Token should be passed as: Authorization: Bearer <RESET_TOKEN>
 */
function verifyResetToken(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const validToken = process.env.RESET_TOKEN;

  if (!validToken) {
    return res.status(403).json({ error: 'Reset endpoint not enabled' });
  }

  if (token !== validToken) {
    return res.status(401).json({ error: 'Invalid reset token' });
  }

  next();
}

/**
 * DANGEROUS: Reset entire database - delete all user data
 * Requires RESET_TOKEN environment variable
 *
 * Usage:
 * POST /api/admin/reset-database
 * Authorization: Bearer <RESET_TOKEN>
 */
router.post('/reset-database', verifyResetToken, async (req: Request, res: Response) => {
  console.log('[Admin] Database reset initiated');

  try {
    await query('BEGIN');

    // Delete all user data in correct order (respecting foreign keys)
    const deleteQueries = [
      'DELETE FROM organization_members',
      'DELETE FROM organization_roles',
      'DELETE FROM audit_logs',
      'DELETE FROM api_usage_logs',
      'DELETE FROM api_rate_limits',
      'DELETE FROM bank_connections',
      'DELETE FROM budget_targets',
      'DELETE FROM transactions',
      'DELETE FROM bills',
      'DELETE FROM goal_progress',
      'DELETE FROM goals',
      'DELETE FROM categories',
      'DELETE FROM budgets',
      'DELETE FROM user_settings',
      'DELETE FROM notifications',
      'DELETE FROM alert_preferences',
      'DELETE FROM search_history',
      'DELETE FROM organizations',
      'DELETE FROM users'
    ];

    const stats: { [key: string]: number } = {};

    for (const deleteQuery of deleteQueries) {
      try {
        const result = await query(deleteQuery);
        const tableName = deleteQuery.replace('DELETE FROM ', '').trim();
        stats[tableName] = result.rowCount || 0;
        console.log(`[Admin] Deleted ${result.rowCount || 0} rows from ${tableName}`);
      } catch (error: any) {
        const tableName = deleteQuery.replace('DELETE FROM ', '').trim();
        // Skip tables that don't exist (relation does not exist error)
        if (error.message && error.message.includes('does not exist')) {
          console.log(`[Admin] Skipping table ${tableName} - does not exist in schema`);
          stats[tableName] = 0;
        } else {
          throw error; // Re-throw other errors
        }
      }
    }

    // Verify deletion
    let userCount = 0, budgetCount = 0, txnCount = 0, orgCount = 0;

    try {
      const userCountResult = await query('SELECT COUNT(*) as count FROM users');
      userCount = parseInt(userCountResult.rows[0].count);
    } catch (e) {
      console.warn('[Admin] Could not verify users table');
    }

    try {
      const budgetCountResult = await query('SELECT COUNT(*) as count FROM budgets');
      budgetCount = parseInt(budgetCountResult.rows[0].count);
    } catch (e) {
      console.warn('[Admin] Could not verify budgets table');
    }

    try {
      const txnCountResult = await query('SELECT COUNT(*) as count FROM transactions');
      txnCount = parseInt(txnCountResult.rows[0].count);
    } catch (e) {
      console.warn('[Admin] Could not verify transactions table');
    }

    try {
      const orgCountResult = await query('SELECT COUNT(*) as count FROM organizations');
      orgCount = parseInt(orgCountResult.rows[0].count);
    } catch (e) {
      console.warn('[Admin] Could not verify organizations table');
    }

    await query('COMMIT');

    console.log('[Admin] Database reset completed successfully');

    res.json({
      success: true,
      message: 'Database reset completed successfully',
      deletedRecords: stats,
      verification: {
        users: userCount,
        budgets: budgetCount,
        transactions: txnCount,
        organizations: orgCount,
      },
    });
  } catch (error: any) {
    await query('ROLLBACK').catch(() => {}); // Ignore rollback errors
    console.error('[Admin] Database reset failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database reset failed: ' + error.message,
    });
  }
});

/**
 * Health check for admin endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    resetEndpointEnabled: !!process.env.RESET_TOKEN,
  });
});

console.log('[Admin Routes] Admin routes loaded');
export default router;
