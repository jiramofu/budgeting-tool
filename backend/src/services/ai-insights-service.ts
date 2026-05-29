import { query } from '../config/database';

interface Anomaly {
  categoryId: number;
  categoryName: string;
  amount: number;
  expectedAmount: number;
  percentageDeviation: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface Insight {
  type: 'savings' | 'warning' | 'trend' | 'opportunity';
  title: string;
  description: string;
  impact: number;
  recommendation: string;
}

interface PredictedExpense {
  categoryId: number;
  categoryName: string;
  predictedAmount: number;
  confidence: number;
}

export class AIInsightsService {
  // Detect spending anomalies compared to historical average
  static async detectAnomalies(userId: number, month: number, year: number, organizationId?: number): Promise<Anomaly[]> {
    try {
      // Get current month transactions by category
      const currentResult = await query(
        `SELECT c.id, c.name, SUM(CAST(t.amount AS NUMERIC)) as total
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         AND EXTRACT(MONTH FROM t.transaction_date) = $2
         AND EXTRACT(YEAR FROM t.transaction_date) = $3 ${organizationId ? 'AND t.organization_id = $4' : ''}
         GROUP BY c.id, c.name`,
        organizationId ? [userId, month, year, organizationId] : [userId, month, year]
      );

      // Get average transactions for past 6 months (excluding current)
      const avgResult = await query(
        `SELECT c.id, c.name, AVG(CAST(monthly_total AS NUMERIC)) as avg_amount
         FROM (
           SELECT c.id, c.name, SUM(CAST(t.amount AS NUMERIC)) as monthly_total
           FROM transactions t
           JOIN categories c ON t.category_id = c.id
           WHERE t.user_id = $1
           AND (EXTRACT(YEAR FROM t.transaction_date) < $2
             OR (EXTRACT(YEAR FROM t.transaction_date) = $2 AND EXTRACT(MONTH FROM t.transaction_date) < $3))
           AND EXTRACT(MONTH FROM t.transaction_date) + EXTRACT(YEAR FROM t.transaction_date) * 12 >=
               ($3 + $2 * 12 - 6) ${organizationId ? 'AND t.organization_id = $4' : ''}
           GROUP BY EXTRACT(YEAR FROM t.transaction_date), EXTRACT(MONTH FROM t.transaction_date), c.id, c.name
         ) monthly
         GROUP BY id, name`,
        organizationId ? [userId, year, month, organizationId] : [userId, year, month]
      );

      const avgMap = new Map(avgResult.rows.map((r: any) => [r.id, r.avg_amount]));
      const anomalies: Anomaly[] = [];

      for (const current of currentResult.rows) {
        const currentTotal = parseFloat(current.total as string);
        const avgAmount = parseFloat((avgMap.get(current.id) || 0).toString());
        if (avgAmount === 0) continue;

        const deviation = ((currentTotal - avgAmount) / avgAmount) * 100;
        const absDeviation = Math.abs(deviation);

        if (absDeviation > 30) {
          let severity: 'low' | 'medium' | 'high' = 'low';
          if (absDeviation > 75) severity = 'high';
          else if (absDeviation > 50) severity = 'medium';

          const direction = deviation > 0 ? 'increased' : 'decreased';
          anomalies.push({
            categoryId: current.id,
            categoryName: current.name,
            amount: currentTotal,
            expectedAmount: avgAmount,
            percentageDeviation: Math.round(deviation),
            severity,
            message: `${current.name} ${direction} by ${Math.abs(Math.round(deviation))}% (${direction === 'increased' ? 'from' : 'to'} $${avgAmount.toFixed(2)})`,
          });
        }
      }

      return anomalies.sort((a, b) => Math.abs(b.percentageDeviation) - Math.abs(a.percentageDeviation));
    } catch (error) {
      console.error('[AI] Error detecting anomalies:', error);
      throw error;
    }
  }

  // Generate smart insights based on spending patterns
  static async generateInsights(userId: number, organizationId?: number): Promise<Insight[]> {
    try {
      const insights: Insight[] = [];

      // Check savings rate
      const savingsResult = await query(
        `SELECT
           SUM(CASE WHEN amount > 0 THEN CAST(amount AS NUMERIC) ELSE 0 END) as income,
           SUM(CASE WHEN amount < 0 THEN CAST(amount AS NUMERIC) ELSE 0 END) as expenses
         FROM transactions
         WHERE user_id = $1 AND transaction_date >= NOW() - INTERVAL '30 days' ${organizationId ? 'AND organization_id = $2' : ''}`,
        organizationId ? [userId, organizationId] : [userId]
      );

      const { income = 0, expenses = 0 } = savingsResult.rows[0] || {};
      const savingsRate = income > 0 ? ((income + expenses) / income) * 100 : 0;

      if (savingsRate > 20) {
        insights.push({
          type: 'savings',
          title: 'Great Savings Rate! 🎯',
          description: `You're saving ${Math.round(savingsRate)}% of your income this month`,
          impact: savingsRate,
          recommendation: 'Keep up this momentum! Consider setting a savings goal.',
        });
      } else if (savingsRate < 5) {
        insights.push({
          type: 'warning',
          title: 'Low Savings Rate',
          description: `You're only saving ${Math.round(savingsRate)}% of your income`,
          impact: savingsRate,
          recommendation: 'Look for areas to cut back or increase income.',
        });
      }

      // Check for spending trends
      const trendResult = await query(
        `SELECT c.name,
                SUM(CAST(t.amount AS NUMERIC)) as total,
                COUNT(*) as frequency
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         AND t.transaction_date >= NOW() - INTERVAL '30 days' ${organizationId ? 'AND t.organization_id = $2' : ''}
         GROUP BY c.id, c.name
         ORDER BY total DESC
         LIMIT 3`,
        organizationId ? [userId, organizationId] : [userId]
      );

      if (trendResult.rows.length > 0) {
        const topCategory = trendResult.rows[0];
        const percentOfTotal = trendResult.rows.reduce((sum: number, r: any) => sum + r.total, 0);
        const categoryPercent = (topCategory.total / percentOfTotal) * 100;

        if (categoryPercent > 40) {
          insights.push({
            type: 'trend',
            title: `${topCategory.name} is Your Biggest Expense`,
            description: `${topCategory.name} accounts for ${Math.round(categoryPercent)}% of your spending`,
            impact: categoryPercent,
            recommendation: `Consider budgeting this category or finding alternatives.`,
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('[AI] Error generating insights:', error);
      throw error;
    }
  }

  // Predict future spending based on patterns
  static async predictNextMonth(userId: number, organizationId?: number): Promise<PredictedExpense[]> {
    try {
      const result = await query(
        `SELECT c.id, c.name, AVG(CAST(monthly_total AS NUMERIC)) as predicted_amount,
                STDDEV(CAST(monthly_total AS NUMERIC)) as std_dev,
                COUNT(*) as data_points
         FROM (
           SELECT c.id, c.name,
                  SUM(CAST(t.amount AS NUMERIC)) as monthly_total,
                  EXTRACT(YEAR FROM t.transaction_date) as year,
                  EXTRACT(MONTH FROM t.transaction_date) as month
           FROM transactions t
           JOIN categories c ON t.category_id = c.id
           WHERE t.user_id = $1 ${organizationId ? 'AND t.organization_id = $2' : ''}
           GROUP BY c.id, c.name, year, month
         ) monthly
         GROUP BY id, name
         HAVING COUNT(*) >= 2
         ORDER BY AVG(CAST(monthly_total AS NUMERIC)) DESC`,
        organizationId ? [userId, organizationId] : [userId]
      );

      return result.rows.map((row: any) => ({
        categoryId: row.id,
        categoryName: row.name,
        predictedAmount: Math.round(row.predicted_amount * 100) / 100,
        confidence: Math.min(95, 50 + (row.data_points * 10)), // Confidence increases with more data
      }));
    } catch (error) {
      console.error('[AI] Error predicting expenses:', error);
      throw error;
    }
  }

  // Smart categorization using transaction description and history
  static async suggestCategory(userId: number, description: string, amount: number, organizationId?: number): Promise<number | null> {
    try {
      // Find similar transactions
      const result = await query(
        `SELECT c.id, COUNT(*) as match_count
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         AND (t.description ILIKE '%' || $2 || '%'
           OR LOWER(t.description) SIMILAR TO LOWER($2)) ${organizationId ? 'AND t.organization_id = $3' : ''}
         GROUP BY c.id
         ORDER BY match_count DESC
         LIMIT 1`,
        organizationId ? [userId, description.split(' ')[0], organizationId] : [userId, description.split(' ')[0]] // Use first word for pattern matching
      );

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Fallback: suggest based on amount patterns
      const amountResult = await query(
        `SELECT c.id
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         AND CAST(t.amount AS NUMERIC) BETWEEN $2 * 0.7 AND $2 * 1.3 ${organizationId ? 'AND t.organization_id = $3' : ''}
         GROUP BY c.id
         ORDER BY COUNT(*) DESC
         LIMIT 1`,
        organizationId ? [userId, amount, organizationId] : [userId, amount]
      );

      return amountResult.rows.length > 0 ? amountResult.rows[0].id : null;
    } catch (error) {
      console.error('[AI] Error suggesting category:', error);
      return null;
    }
  }
}
