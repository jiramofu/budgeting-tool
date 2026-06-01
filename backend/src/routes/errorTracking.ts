import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get recent errors for admin dashboard
router.get('/recent-errors', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is admin (can be expanded)
    const result = await query(
      `SELECT 
        id,
        action,
        resource_type,
        description,
        status,
        error_message,
        user_id,
        ip_address,
        created_at
      FROM audit_logs
      WHERE status = 'failure'
      ORDER BY created_at DESC
      LIMIT 50`
    );

    res.json({
      errors: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get signup/auth errors specifically
router.get('/auth-errors', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        id,
        action,
        resource_type,
        description,
        error_message,
        user_id,
        ip_address,
        created_at
      FROM audit_logs
      WHERE resource_type IN ('auth', 'signup', 'login')
      AND status = 'failure'
      ORDER BY created_at DESC
      LIMIT 100`
    );

    res.json({
      authErrors: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get signup success/failure counts
router.get('/signup-stats', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE status = 'success') as successes,
        COUNT(*) FILTER (WHERE status = 'failure') as failures
      FROM audit_logs
      WHERE resource_type = 'signup'
      AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC`
    );

    res.json({ stats: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get error details by type
router.get('/errors-by-type', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        resource_type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'failure') as failures
      FROM audit_logs
      WHERE status = 'failure'
      AND created_at > NOW() - INTERVAL '24 hours'
      GROUP BY resource_type
      ORDER BY failures DESC`
    );

    res.json({ errorsByType: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Log error manually (for client-side errors)
router.post('/log-client-error', async (req: Request, res: Response) => {
  try {
    const { message, stack, context, userAgent, url } = req.body;

    await query(
      `INSERT INTO audit_logs 
      (organization_id, action, resource_type, description, error_message, user_agent, status, created_at)
      VALUES ($1, 'error', 'client', $2, $3, $4, 'failure', CURRENT_TIMESTAMP)`,
      [
        1, // default org
        `Client error: ${context || 'unknown'}`,
        message,
        userAgent,
      ]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error logging client error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
