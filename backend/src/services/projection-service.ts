import { query } from '../config/database';

export interface ProjectedDay {
  date: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  closingBalance: number;
  riskLevel: 'safe' | 'warning' | 'critical';
}

export class ProjectionService {
  static async projectCashFlow(userId: number, days: number = 90): Promise<ProjectedDay[]> {
    try {
      const projection: ProjectedDay[] = [];

      // Get current account balance (sum of transactions)
      const balanceResult = await query(
        `SELECT COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END), 0) as balance
         FROM transactions
         WHERE user_id = $1`,
        [userId]
      );

      let currentBalance = balanceResult.rows[0]?.balance || 0;

      // Get recurring expenses and income for projection
      const recurringResult = await query(
        `SELECT
          c.name,
          SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE t.amount END) as avg_amount,
          COUNT(*) as frequency,
          EXTRACT(DAY FROM DATE(MAX(t.transaction_date))) as last_day
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         AND t.transaction_date > NOW() - INTERVAL '90 days'
         AND c.type IN ('recurring', 'fixed')
         AND t.category_id IS NOT NULL
         GROUP BY c.name, c.type
         ORDER BY frequency DESC`,
        [userId]
      );

      const recurringTransactions = recurringResult.rows;

      // Generate projection for next N days
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < days; i++) {
        const projDate = new Date(today);
        projDate.setDate(projDate.getDate() + i);

        const dateStr = projDate.toISOString().split('T')[0];

        // Calculate projected inflows and outflows
        let inflow = 0;
        let outflow = 0;

        // Project recurring transactions
        for (const recurring of recurringTransactions) {
          const dayOfMonth = projDate.getDate();
          const lastDayOfRecurrence = recurring.last_day || 15;

          // Simple heuristic: if transaction happens mid-month, project it on that day
          if (dayOfMonth === lastDayOfRecurrence || (i % 30 === lastDayOfRecurrence % 30)) {
            const amount = recurring.avg_amount || 0;
            if (amount > 0) {
              inflow += amount;
            } else {
              outflow += Math.abs(amount);
            }
          }
        }

        const closingBalance = currentBalance + inflow - outflow;

        // Determine risk level based on balance
        const riskLevel: 'safe' | 'warning' | 'critical' =
          closingBalance < 500 ? 'critical' : closingBalance < 2000 ? 'warning' : 'safe';

        projection.push({
          date: dateStr,
          openingBalance: currentBalance,
          inflow,
          outflow,
          closingBalance,
          riskLevel,
        });

        currentBalance = closingBalance;
      }

      return projection;
    } catch (error) {
      console.error('[Projection] Error projecting cash flow:', error);
      throw error;
    }
  }

  static async getProjectionSummary(userId: number) {
    try {
      const projection = await this.projectCashFlow(userId, 90);

      const lowestBalance = Math.min(...projection.map((p) => p.closingBalance));
      const averageBalance =
        projection.reduce((sum, p) => sum + p.closingBalance, 0) / projection.length;

      const criticalDays = projection.filter((p) => p.riskLevel === 'critical').length;
      const warningDays = projection.filter((p) => p.riskLevel === 'warning').length;

      return {
        currentBalance: projection[0]?.openingBalance || 0,
        projectedBalance: projection[projection.length - 1]?.closingBalance || 0,
        lowestBalance,
        averageBalance,
        criticalDays,
        warningDays,
        projection,
      };
    } catch (error) {
      console.error('[Projection] Error getting summary:', error);
      throw error;
    }
  }
}
