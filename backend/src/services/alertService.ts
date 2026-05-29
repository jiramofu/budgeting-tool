import { pool } from '../config/database';

interface SpendingAlert {
  id: number;
  userId: number;
  categoryId: number;
  budgetId: number;
  currentSpending: number;
  budgetTarget: number;
  percentageOfBudget: number;
  severity: 'warning' | 'critical';
  message: string;
  isActive: boolean;
  triggeredAt: string;
  organization_id: number;
}

interface AlertPreference {
  id: number;
  userId: number;
  categoryId: number;
  alertThresholdPercentage: number;
  criticalThresholdPercentage: number;
  enableEmailAlerts: boolean;
  enableAppAlerts: boolean;
}

interface AlertCheckResult {
  categoryId: number;
  categoryName: string;
  currentSpending: number;
  budgetTarget: number;
  percentageOfBudget: number;
  shouldAlert: boolean;
  severity: 'warning' | 'critical';
  message: string;
}

/**
 * Check for spending alerts for a user's budget
 */
export const checkSpendingAlerts = async (
  userId: number,
  budgetId: number,
  organizationId: number
): Promise<AlertCheckResult[]> => {
  try {
    // Get all budget targets and current spending for this budget
    const result = await pool.query(
      `
      SELECT
        bt.category_id,
        c.name as category_name,
        bt.target_amount,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN ABS(t.amount) ELSE 0 END), 0) as current_spending,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN ABS(t.amount) ELSE 0 END), 0) / NULLIF(bt.target_amount, 0) * 100 as percentage_of_budget
      FROM budget_targets bt
      JOIN categories c ON bt.category_id = c.id
      LEFT JOIN transactions t ON t.category_id = bt.category_id
        AND t.user_id = $1
        AND EXTRACT(YEAR FROM t.transaction_date) = (SELECT year FROM budgets WHERE id = $2)
        AND EXTRACT(MONTH FROM t.transaction_date) = (SELECT month FROM budgets WHERE id = $2)
      WHERE bt.budget_id = $2 ${organizationId ? 'AND bt.organization_id = $3' : ''}
      GROUP BY bt.category_id, c.name, bt.target_amount
      `,
      organizationId ? [userId, budgetId, organizationId] : [userId, budgetId]
    );

    const alerts: AlertCheckResult[] = [];

    // Check each category against user's alert preferences
    for (const row of result.rows) {
      const preferences = await getAlertPreferences(userId, row.category_id, organizationId);

      const percentageOfBudget = parseFloat(row.percentage_of_budget) || 0;
      const alertThreshold = preferences?.alertThresholdPercentage || 80;
      const criticalThreshold = preferences?.criticalThresholdPercentage || 100;

      let shouldAlert = false;
      let severity: 'warning' | 'critical' = 'warning';

      if (percentageOfBudget >= criticalThreshold) {
        shouldAlert = true;
        severity = 'critical';
      } else if (percentageOfBudget >= alertThreshold) {
        shouldAlert = true;
        severity = 'warning';
      }

      if (shouldAlert) {
        alerts.push({
          categoryId: row.category_id,
          categoryName: row.category_name,
          currentSpending: parseFloat(row.current_spending),
          budgetTarget: parseFloat(row.target_amount),
          percentageOfBudget: percentageOfBudget,
          shouldAlert: true,
          severity,
          message: generateAlertMessage(
            row.category_name,
            parseFloat(row.current_spending),
            parseFloat(row.target_amount),
            percentageOfBudget,
            severity
          ),
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error checking spending alerts:', error);
    throw error;
  }
};

/**
 * Create or update a spending alert
 */
export const createOrUpdateAlert = async (
  userId: number,
  categoryId: number,
  budgetId: number,
  currentSpending: number,
  budgetTarget: number,
  percentageOfBudget: number,
  severity: 'warning' | 'critical',
  message: string
): Promise<SpendingAlert> => {
  try {
    // Check if alert already exists and is active
    const existingAlert = await pool.query(
      `
      SELECT id FROM spending_alerts
      WHERE user_id = $1 AND category_id = $2 AND budget_id = $3 AND is_active = TRUE
      `,
      [userId, categoryId, budgetId]
    );

    if (existingAlert.rows.length > 0) {
      // Update existing alert
      const result = await pool.query(
        `
        UPDATE spending_alerts
        SET current_spending = $1, budget_target = $2, percentage_of_budget = $3,
            severity = $4, message = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
        `,
        [
          currentSpending,
          budgetTarget,
          percentageOfBudget,
          severity,
          message,
          existingAlert.rows[0].id,
        ]
      );
      return mapAlertRow(result.rows[0]);
    } else {
      // Create new alert
      const result = await pool.query(
        `
        INSERT INTO spending_alerts
        (user_id, category_id, budget_id, current_spending, budget_target,
         percentage_of_budget, severity, message, is_active, triggered_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, CURRENT_TIMESTAMP)
        RETURNING *
        `,
        [
          userId,
          categoryId,
          budgetId,
          currentSpending,
          budgetTarget,
          percentageOfBudget,
          severity,
          message,
        ]
      );
      return mapAlertRow(result.rows[0]);
    }
  } catch (error) {
    console.error('Error creating/updating alert:', error);
    throw error;
  }
};

/**
 * Resolve a spending alert
 */
export const resolveAlert = async (
  userId: number,
  alertId: number,
  organizationId: number
): Promise<void> => {
  try {
    // Get alert details before resolving
    const alertResult = await pool.query(
      `
      SELECT * FROM spending_alerts WHERE id = $1 AND user_id = $2 ${organizationId ? 'AND organization_id = $3' : ''}
      `,
      organizationId ? [alertId, userId, organizationId] : [alertId, userId]
    );

    if (alertResult.rows.length === 0) {
      throw new Error('Alert not found');
    }

    const alert = alertResult.rows[0];

    // Mark alert as resolved
    await pool.query(
      `
      UPDATE spending_alerts
      SET is_active = FALSE, resolved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [alertId]
    );

    // Archive to alert history
    await pool.query(
      `
      INSERT INTO alert_history
      (user_id, alert_id, category_id, current_spending, budget_target,
       percentage_of_budget, severity, triggered_at, resolved_at, resolution_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, 'manual_resolution')
      `,
      [
        userId,
        alertId,
        alert.category_id,
        alert.current_spending,
        alert.budget_target,
        alert.percentage_of_budget,
        alert.severity,
        alert.triggered_at,
      ]
    );
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
};

/**
 * Get active alerts for a user
 */
export const getActiveAlerts = async (userId: number, organizationId?: number): Promise<SpendingAlert[]> => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM spending_alerts
      WHERE user_id = $1 AND is_active = TRUE ${organizationId ? 'AND organization_id = $2' : ''}
      ORDER BY triggered_at DESC
      `,
      organizationId ? [userId, organizationId] : [userId]
    );

    return result.rows.map(mapAlertRow);
  } catch (error) {
    console.error('Error getting active alerts:', error);
    throw error;
  }
};

/**
 * Get alert preferences for a category
 */
export const getAlertPreferences = async (
  userId: number,
  categoryId: number,
  organizationId: number
): Promise<AlertPreference | null> => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM alert_preferences
      WHERE user_id = $1 AND category_id = $2 ${organizationId ? 'AND organization_id = $3' : ''}
      `,
      organizationId ? [userId, categoryId, organizationId] : [userId, categoryId]
    );

    if (result.rows.length === 0) {
      // Return default preferences if not set
      return {
        id: 0,
        userId,
        categoryId,
        alertThresholdPercentage: 80,
        criticalThresholdPercentage: 100,
        enableEmailAlerts: true,
        enableAppAlerts: true,
      };
    }

    return mapAlertPreferenceRow(result.rows[0]);
  } catch (error) {
    console.error('Error getting alert preferences:', error);
    throw error;
  }
};

/**
 * Update alert preferences for a category
 */
export const updateAlertPreferences = async (
  userId: number,
  categoryId: number,
  preferences: Partial<AlertPreference>,
  organizationId: number
): Promise<AlertPreference> => {
  try {
    const existingPref = await pool.query(
      `
      SELECT id FROM alert_preferences
      WHERE user_id = $1 AND category_id = $2 ${organizationId ? 'AND organization_id = $3' : ''}
      `,
      organizationId ? [userId, categoryId, organizationId] : [userId, categoryId]
    );

    if (existingPref.rows.length > 0) {
      // Update existing preferences
      const result = await pool.query(
        `
        UPDATE alert_preferences
        SET alert_threshold_percentage = COALESCE($1, alert_threshold_percentage),
            critical_threshold_percentage = COALESCE($2, critical_threshold_percentage),
            enable_email_alerts = COALESCE($3, enable_email_alerts),
            enable_app_alerts = COALESCE($4, enable_app_alerts),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $5 AND category_id = $6 ${organizationId ? 'AND organization_id = $7' : ''}
        RETURNING *
        `,
        organizationId
          ? [
              preferences.alertThresholdPercentage,
              preferences.criticalThresholdPercentage,
              preferences.enableEmailAlerts,
              preferences.enableAppAlerts,
              userId,
              categoryId,
              organizationId,
            ]
          : [
              preferences.alertThresholdPercentage,
              preferences.criticalThresholdPercentage,
              preferences.enableEmailAlerts,
              preferences.enableAppAlerts,
              userId,
              categoryId,
            ]
      );
      return mapAlertPreferenceRow(result.rows[0]);
    } else {
      // Create new preferences
      const result = await pool.query(
        `
        INSERT INTO alert_preferences
        (user_id, category_id, alert_threshold_percentage, critical_threshold_percentage,
         enable_email_alerts, enable_app_alerts ${organizationId ? ', organization_id' : ''})
        VALUES ($1, $2, $3, $4, $5, $6 ${organizationId ? ', $7' : ''})
        RETURNING *
        `,
        organizationId
          ? [
              userId,
              categoryId,
              preferences.alertThresholdPercentage || 80,
              preferences.criticalThresholdPercentage || 100,
              preferences.enableEmailAlerts !== false,
              preferences.enableAppAlerts !== false,
              organizationId,
            ]
          : [
              userId,
              categoryId,
              preferences.alertThresholdPercentage || 80,
              preferences.criticalThresholdPercentage || 100,
              preferences.enableEmailAlerts !== false,
              preferences.enableAppAlerts !== false,
            ]
      );
      return mapAlertPreferenceRow(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating alert preferences:', error);
    throw error;
  }
};

/**
 * Get all alerts for a user (including resolved)
 */
export const getAllAnomalies = async (userId: number, organizationId?: number): Promise<SpendingAlert[]> => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM spending_alerts
      WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''}
      ORDER BY triggered_at DESC
      LIMIT 100
      `,
      organizationId ? [userId, organizationId] : [userId]
    );

    return result.rows.map(mapAlertRow);
  } catch (error) {
    console.error('Error getting all anomalies:', error);
    throw error;
  }
};

// Helper functions

function generateAlertMessage(
  categoryName: string,
  currentSpending: number,
  budgetTarget: number,
  percentageOfBudget: number,
  severity: 'warning' | 'critical'
): string {
  const remaining = budgetTarget - currentSpending;

  if (severity === 'critical') {
    if (remaining < 0) {
      return `⛔ Critical: ${categoryName} budget exceeded by $${Math.abs(remaining).toFixed(2)} (${percentageOfBudget.toFixed(0)}% of budget used)`;
    } else {
      return `⚠️ Critical: ${categoryName} budget at limit - only $${remaining.toFixed(2)} remaining`;
    }
  } else {
    return `⚠️ Warning: ${categoryName} spending at ${percentageOfBudget.toFixed(0)}% of budget ($${remaining.toFixed(2)} remaining)`;
  }
}

function mapAlertRow(row: any): SpendingAlert {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    budgetId: row.budget_id,
    currentSpending: parseFloat(row.current_spending),
    budgetTarget: parseFloat(row.budget_target),
    percentageOfBudget: parseFloat(row.percentage_of_budget),
    severity: row.severity,
    message: row.message,
    isActive: row.is_active,
    triggeredAt: row.triggered_at,
    organization_id: row.organization_id,
  };
}

function mapAlertPreferenceRow(row: any): AlertPreference {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    alertThresholdPercentage: parseFloat(row.alert_threshold_percentage),
    criticalThresholdPercentage: parseFloat(row.critical_threshold_percentage),
    enableEmailAlerts: row.enable_email_alerts,
    enableAppAlerts: row.enable_app_alerts,
  };
}
