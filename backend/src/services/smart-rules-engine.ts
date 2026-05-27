import { pool } from '../config/database';

interface BudgetRecommendation {
  categoryId: number;
  categoryName: string;
  currentTarget: number;
  recommendedTarget: number;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

interface SpendingAlert {
  categoryId: number;
  categoryName: string;
  currentSpending: number;
  target: number;
  percentageOfTarget: number;
  message: string;
  severity: 'warning' | 'critical';
}

class SmartRulesEngine {
  static async analyzeBudgetAndGetRecommendations(userId: number, month: number, year: number): Promise<BudgetRecommendation[]> {
    try {
      const recommendations: BudgetRecommendation[] = [];

      // Get current budget with spending
      const budgetResult = await pool.query(
        `SELECT
          c.id, c.name, bt.target_amount,
          COALESCE(SUM(ABS(t.amount)), 0) as total_spent,
          COUNT(t.id) as transaction_count
        FROM budget_targets bt
        JOIN budgets b ON bt.budget_id = b.id
        JOIN categories c ON bt.category_id = c.id
        LEFT JOIN transactions t ON t.category_id = c.id
          AND t.user_id = $1
          AND EXTRACT(MONTH FROM t.transaction_date) = $2
          AND EXTRACT(YEAR FROM t.transaction_date) = $3
          AND t.transaction_type = 'expense'
        WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
        GROUP BY c.id, c.name, bt.target_amount`,
        [userId, month, year]
      );

      // Get historical spending averages (last 6 months)
      const historyResult = await pool.query(
        `SELECT c.id, AVG(monthly_spending) as avg_spending, STDDEV(monthly_spending) as std_dev
        FROM (
          SELECT c.id,
            EXTRACT(MONTH FROM t.transaction_date) as month,
            EXTRACT(YEAR FROM t.transaction_date) as year,
            SUM(ABS(t.amount)) as monthly_spending
          FROM transactions t
          JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = $1
            AND t.transaction_type = 'expense'
            AND t.transaction_date >= NOW() - INTERVAL '6 months'
          GROUP BY c.id, month, year
        ) monthly_data
        GROUP BY c.id`,
        [userId]
      );

      const historyMap = new Map(historyResult.rows.map(r => [r.id, { avg: parseFloat(r.avg_spending || 0), std: parseFloat(r.std_dev || 0) }]));

      for (const budget of budgetResult.rows) {
        const history = historyMap.get(budget.id);
        if (!history) continue;

        const currentSpent = parseFloat(budget.total_spent);
        const target = parseFloat(budget.target_amount);
        const avgSpending = history.avg;

        // Recommendation 1: If currently spending significantly less than average
        if (currentSpent < avgSpending * 0.7) {
          recommendations.push({
            categoryId: budget.id,
            categoryName: budget.name,
            currentTarget: target,
            recommendedTarget: Math.round(avgSpending * 100) / 100,
            reasoning: `Your spending on ${budget.name} is ${Math.round((1 - currentSpent / avgSpending) * 100)}% below your historical average. Consider reducing the budget to match actual needs.`,
            priority: 'medium',
          });
        }

        // Recommendation 2: If spending consistently exceeds target
        if (currentSpent > target * 1.2) {
          const newTarget = Math.round(avgSpending * 1.1 * 100) / 100;
          recommendations.push({
            categoryId: budget.id,
            categoryName: budget.name,
            currentTarget: target,
            recommendedTarget: newTarget,
            reasoning: `You're consistently overspending on ${budget.name}. Consider increasing the budget target to ${newTarget} based on your recent spending patterns.`,
            priority: 'high',
          });
        }

        // Recommendation 3: Unusual volatility detected
        if (history.std && history.std > avgSpending * 0.5) {
          recommendations.push({
            categoryId: budget.id,
            categoryName: budget.name,
            currentTarget: target,
            recommendedTarget: Math.round((avgSpending + history.std) * 100) / 100,
            reasoning: `Your ${budget.name} spending varies significantly month-to-month. Consider a more flexible budget approach.`,
            priority: 'low',
          });
        }
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  static async detectSpendingAnomalies(userId: number, categoryId: number): Promise<SpendingAlert | null> {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const result = await pool.query(
        `SELECT
          c.name,
          bt.target_amount,
          COALESCE(SUM(ABS(t.amount)), 0) as current_spending
        FROM categories c
        LEFT JOIN budget_targets bt ON c.id = bt.category_id
        LEFT JOIN budgets b ON bt.budget_id = b.id AND b.user_id = $1 AND b.month = $2 AND b.year = $3
        LEFT JOIN transactions t ON c.id = t.category_id
          AND t.user_id = $1
          AND EXTRACT(MONTH FROM t.transaction_date) = $2
          AND EXTRACT(YEAR FROM t.transaction_date) = $3
          AND t.transaction_type = 'expense'
        WHERE c.id = $4
        GROUP BY c.id, c.name, bt.target_amount`,
        [userId, currentMonth, currentYear, categoryId]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const currentSpending = parseFloat(row.current_spending);
      const target = parseFloat(row.target_amount || 0);

      if (target === 0) return null;

      const percentage = (currentSpending / target) * 100;

      if (percentage > 100) {
        return {
          categoryId,
          categoryName: row.name,
          currentSpending,
          target,
          percentageOfTarget: Math.round(percentage),
          message: `⚠️ ${row.name}: You've exceeded your budget by $${(currentSpending - target).toFixed(2)}`,
          severity: percentage > 120 ? 'critical' : 'warning',
        };
      }

      if (percentage > 80) {
        return {
          categoryId,
          categoryName: row.name,
          currentSpending,
          target,
          percentageOfTarget: Math.round(percentage),
          message: `📊 ${row.name}: You're at ${Math.round(percentage)}% of your budget`,
          severity: 'warning',
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  static async getSpendingForecast(userId: number, categoryId: number, daysAhead: number = 30): Promise<{ projectedSpending: number; daysRemaining: number; dailyRate: number }> {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const currentDay = new Date().getDate();
      const daysRemaining = Math.min(daysInMonth - currentDay, daysAhead);

      // Get current month spending
      const currentResult = await pool.query(
        `SELECT COALESCE(SUM(ABS(amount)), 0) as spent
        FROM transactions
        WHERE user_id = $1 AND category_id = $2
          AND EXTRACT(MONTH FROM transaction_date) = $3
          AND EXTRACT(YEAR FROM transaction_date) = $4
          AND transaction_type = 'expense'`,
        [userId, categoryId, currentMonth, currentYear]
      );

      const currentSpent = parseFloat(currentResult.rows[0].spent || 0);
      const dailyRate = currentSpent / currentDay;
      const projectedSpending = currentSpent + (dailyRate * daysRemaining);

      return { projectedSpending, daysRemaining, dailyRate };
    } catch (error) {
      console.error('Error forecasting spending:', error);
      throw error;
    }
  }
}

export default SmartRulesEngine;
