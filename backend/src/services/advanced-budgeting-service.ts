import { query } from '../config/database';

interface BudgetRule {
  id?: number;
  budgetId: number;
  categoryId: number;
  triggerAmount: number;
  triggerType: 'exceeds' | 'increases_by' | 'decreases_to';
  action: 'alert' | 'adjust_budget' | 'auto_transfer';
  actionValue?: number;
}

interface BudgetAlert {
  categoryId: number;
  categoryName: string;
  spent: number;
  budgeted: number;
  percentageUsed: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

interface EnvelopeStatus {
  categoryId: number;
  categoryName: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
}

export class AdvancedBudgetingService {
  // Get all budget envelopes with status (zero-based budgeting)
  static async getEnvelopes(userId: number, month: number, year: number, organizationId?: number): Promise<EnvelopeStatus[]> {
    try {
      const result = await query(
        `SELECT c.id, c.name,
                COALESCE(bt.target_amount, 0) as allocated,
                COALESCE(SUM(CAST(t.amount AS NUMERIC)), 0) as spent
         FROM categories c
         LEFT JOIN budget_targets bt ON c.id = bt.category_id
         LEFT JOIN transactions t ON c.id = t.category_id
           AND t.user_id = $1
           AND EXTRACT(MONTH FROM t.transaction_date) = $2
           AND EXTRACT(YEAR FROM t.transaction_date) = $3 ${organizationId ? 'AND t.organization_id = $4' : ''}
         WHERE c.user_id = $1 ${organizationId ? 'AND c.organization_id = $4' : ''}
         GROUP BY c.id, c.name, bt.target_amount
         ORDER BY c.name`,
        organizationId ? [userId, month, year, organizationId] : [userId, month, year]
      );

      return result.rows.map((row: any) => ({
        categoryId: row.id,
        categoryName: row.name,
        allocated: row.allocated,
        spent: Math.abs(row.spent),
        remaining: row.allocated - Math.abs(row.spent),
        percentageUsed: row.allocated > 0 ? (Math.abs(row.spent) / row.allocated) * 100 : 0,
      }));
    } catch (error) {
      console.error('[Advanced Budget] Error getting envelopes:', error);
      throw error;
    }
  }

  // Create or update budget rules
  static async saveBudgetRule(userId: number, rule: BudgetRule, organizationId?: number): Promise<BudgetRule> {
    try {
      if (rule.id) {
        // Update existing rule
        await query(
          `UPDATE budget_rules
           SET trigger_amount = $1, trigger_type = $2, action = $3, action_value = $4
           WHERE id = $5 AND budget_id IN (
             SELECT id FROM budgets WHERE user_id = $6 ${organizationId ? 'AND organization_id = $7' : ''}
           )`,
          organizationId ? [rule.triggerAmount, rule.triggerType, rule.action, rule.actionValue, rule.id, userId, organizationId] : [rule.triggerAmount, rule.triggerType, rule.action, rule.actionValue, rule.id, userId]
        );
      } else {
        // Create new rule
        const result = await query(
          `INSERT INTO budget_rules (budget_id, category_id, trigger_amount, trigger_type, action, action_value)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [rule.budgetId, rule.categoryId, rule.triggerAmount, rule.triggerType, rule.action, rule.actionValue]
        );
        rule.id = result.rows[0].id;
      }
      return rule;
    } catch (error) {
      console.error('[Advanced Budget] Error saving rule:', error);
      throw error;
    }
  }

  // Check budget rules and generate alerts
  static async checkBudgetAlerts(userId: number, month: number, year: number, organizationId?: number): Promise<BudgetAlert[]> {
    try {
      const envelopes = await this.getEnvelopes(userId, month, year, organizationId);
      const alerts: BudgetAlert[] = [];

      for (const envelope of envelopes) {
        let severity: 'info' | 'warning' | 'critical' = 'info';
        let shouldAlert = false;

        if (envelope.percentageUsed > 100) {
          severity = 'critical';
          shouldAlert = true;
        } else if (envelope.percentageUsed > 85) {
          severity = 'warning';
          shouldAlert = true;
        } else if (envelope.percentageUsed > 75) {
          severity = 'info';
          shouldAlert = true;
        }

        if (shouldAlert) {
          alerts.push({
            categoryId: envelope.categoryId,
            categoryName: envelope.categoryName,
            spent: envelope.spent,
            budgeted: envelope.allocated,
            percentageUsed: envelope.percentageUsed,
            severity,
            message: `${envelope.categoryName}: $${envelope.spent.toFixed(2)} of $${envelope.allocated.toFixed(2)} (${Math.round(envelope.percentageUsed)}%)`,
          });
        }
      }

      return alerts.sort((a, b) => b.percentageUsed - a.percentageUsed);
    } catch (error) {
      console.error('[Advanced Budget] Error checking alerts:', error);
      throw error;
    }
  }

  // Get recommended budget adjustments
  static async getBudgetRecommendations(userId: number, organizationId?: number): Promise<any[]> {
    try {
      const result = await query(
        `SELECT c.id, c.name,
                AVG(CAST(monthly_amount AS NUMERIC)) as recommended_amount,
                MAX(CAST(monthly_amount AS NUMERIC)) as peak_amount,
                COUNT(*) as months_of_data
         FROM (
           SELECT c.id, c.name,
                  SUM(CAST(t.amount AS NUMERIC)) as monthly_amount
           FROM transactions t
           JOIN categories c ON t.category_id = c.id
           WHERE t.user_id = $1
           AND t.transaction_date >= NOW() - INTERVAL '6 months' ${organizationId ? 'AND t.organization_id = $2' : ''}
           GROUP BY c.id, c.name, EXTRACT(YEAR FROM t.transaction_date), EXTRACT(MONTH FROM t.transaction_date)
         ) monthly
         GROUP BY id, name
         HAVING COUNT(*) >= 3
         ORDER BY AVG(CAST(monthly_amount AS NUMERIC)) DESC`,
        organizationId ? [userId, organizationId] : [userId]
      );

      return result.rows.map((row: any) => ({
        categoryId: row.id,
        categoryName: row.name,
        recommendedBudget: Math.round(row.recommended_amount * 1.1 * 100) / 100, // Add 10% buffer
        historicalAverage: Math.round(row.recommended_amount * 100) / 100,
        peakSpending: Math.round(row.peak_amount * 100) / 100,
        confidence: Math.min(95, 50 + (row.months_of_data * 10)),
      }));
    } catch (error) {
      console.error('[Advanced Budget] Error getting recommendations:', error);
      throw error;
    }
  }

  // Track budget adherence over time
  static async getBudgetAdherence(userId: number, months: number = 3, organizationId?: number): Promise<any[]> {
    try {
      const result = await query(
        `SELECT EXTRACT(YEAR FROM t.transaction_date) as year,
                EXTRACT(MONTH FROM t.transaction_date) as month,
                COUNT(*) as transactions_count,
                AVG(CAST(t.amount AS NUMERIC)) as avg_transaction,
                SUM(CASE WHEN CAST(t.amount AS NUMERIC) > 0 THEN CAST(t.amount AS NUMERIC) ELSE 0 END) as income,
                SUM(CASE WHEN CAST(t.amount AS NUMERIC) < 0 THEN CAST(t.amount AS NUMERIC) ELSE 0 END) as expenses
         FROM transactions t
         WHERE t.user_id = $1
         AND t.transaction_date >= NOW() - INTERVAL '1 month' * $2 ${organizationId ? 'AND t.organization_id = $3' : ''}
         GROUP BY year, month
         ORDER BY year DESC, month DESC`,
        organizationId ? [userId, months, organizationId] : [userId, months]
      );

      return result.rows.map((row: any) => ({
        period: `${row.year}-${String(row.month).padStart(2, '0')}`,
        transactionCount: row.transactions_count,
        averageTransaction: Math.round(row.avg_transaction * 100) / 100,
        totalIncome: Math.round(row.income * 100) / 100,
        totalExpenses: Math.abs(Math.round(row.expenses * 100) / 100),
        netCashFlow: Math.round((row.income + row.expenses) * 100) / 100,
      }));
    } catch (error) {
      console.error('[Advanced Budget] Error getting adherence:', error);
      throw error;
    }
  }
}
