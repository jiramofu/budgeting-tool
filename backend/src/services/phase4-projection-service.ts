import { query } from '../config/database';

export interface ProjectedDay {
  date: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  closingBalance: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  events: ProjectedEvent[];
}

export interface ProjectedEvent {
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface ProjectionSummary {
  currentBalance: number;
  projectedBalance: number;
  lowestBalance: number;
  highestBalance: number;
  averageBalance: number;
  criticalDays: number;
  warningDays: number;
  safeDays: number;
  projection: ProjectedDay[];
}

export class Phase4ProjectionService {
  /**
   * Calculate cash flow projections for next 90 days
   * Uses projection_inputs table for recurring items
   */
  static async projectCashFlow(userId: number, days: number = 90, organizationId?: number): Promise<ProjectedDay[]> {
    try {
      console.log(`[Phase4 Projection] Starting 90-day cash flow projection for user ${userId}`);

      // Get current balance from transactions
      const balanceResult = await query(
        `SELECT COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END), 0) as balance
         FROM transactions
         WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''}`,
        organizationId ? [userId, organizationId] : [userId]
      );

      let currentBalance = balanceResult.rows[0]?.balance || 0;

      // Get all active recurring items (from projection_inputs table)
      const recurringResult = await query(
        `SELECT
          id,
          description,
          amount,
          frequency,
          start_date,
          end_date,
          day_of_month,
          day_of_week,
          is_income
         FROM projection_inputs
         WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''} AND is_active = true`,
        organizationId ? [userId, organizationId] : [userId]
      );

      const recurringItems = recurringResult.rows;

      const projection: ProjectedDay[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Generate 90-day projection
      for (let i = 0; i < days; i++) {
        const projDate = new Date(today);
        projDate.setDate(projDate.getDate() + i);

        const dateStr = projDate.toISOString().split('T')[0];
        let inflow = 0;
        let outflow = 0;
        const events: ProjectedEvent[] = [];

        // Check which recurring items apply to this date
        for (const item of recurringItems) {
          const startDate = new Date(item.start_date);
          const endDate = item.end_date ? new Date(item.end_date) : null;

          // Check if item is active for this date
          if (projDate < startDate || (endDate && projDate > endDate)) {
            continue;
          }

          let shouldApply = false;

          switch (item.frequency) {
            case 'daily':
              shouldApply = true;
              break;
            case 'weekly':
              shouldApply = projDate.getDay() === item.day_of_week;
              break;
            case 'bi-weekly':
              const daysSinceStart = Math.floor((projDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              shouldApply = daysSinceStart % 14 === 0;
              break;
            case 'monthly':
              shouldApply = projDate.getDate() === item.day_of_month;
              break;
            case 'quarterly':
              shouldApply = projDate.getDate() === item.day_of_month && (projDate.getMonth() % 3) === (startDate.getMonth() % 3);
              break;
            case 'yearly':
              shouldApply = projDate.getDate() === startDate.getDate() && projDate.getMonth() === startDate.getMonth();
              break;
          }

          if (shouldApply) {
            if (item.is_income) {
              inflow += item.amount;
              events.push({ description: item.description, amount: item.amount, type: 'income' });
            } else {
              outflow += item.amount;
              events.push({ description: item.description, amount: item.amount, type: 'expense' });
            }
          }
        }

        const closingBalance = currentBalance + inflow - outflow;

        // Determine risk level
        const riskLevel: 'safe' | 'warning' | 'critical' =
          closingBalance < 500 ? 'critical' : closingBalance < 2000 ? 'warning' : 'safe';

        projection.push({
          date: dateStr,
          openingBalance: currentBalance,
          inflow,
          outflow,
          closingBalance,
          riskLevel,
          events,
        });

        currentBalance = closingBalance;
      }

      console.log(`[Phase4 Projection] Completed projection for user ${userId}: ${projection.length} days`);
      return projection;
    } catch (error) {
      console.error('[Phase4 Projection] Error projecting cash flow:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive projection summary
   */
  static async getProjectionSummary(userId: number, organizationId?: number): Promise<ProjectionSummary> {
    try {
      const projection = await this.projectCashFlow(userId, 90, organizationId);

      const balances = projection.map((p) => p.closingBalance);
      const lowestBalance = Math.min(...balances);
      const highestBalance = Math.max(...balances);
      const averageBalance = balances.reduce((sum, b) => sum + b, 0) / balances.length;

      const criticalDays = projection.filter((p) => p.riskLevel === 'critical').length;
      const warningDays = projection.filter((p) => p.riskLevel === 'warning').length;
      const safeDays = projection.filter((p) => p.riskLevel === 'safe').length;

      return {
        currentBalance: projection[0]?.openingBalance || 0,
        projectedBalance: projection[projection.length - 1]?.closingBalance || 0,
        lowestBalance,
        highestBalance,
        averageBalance,
        criticalDays,
        warningDays,
        safeDays,
        projection,
      };
    } catch (error) {
      console.error('[Phase4 Projection] Error getting summary:', error);
      throw error;
    }
  }

  /**
   * Save projections to database for performance
   */
  static async saveProjectionsToDB(userId: number, organizationId?: number): Promise<void> {
    try {
      const projection = await this.projectCashFlow(userId, 90, organizationId);

      // Clear old projections
      await query(
        `DELETE FROM cash_flow_projections WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''}`,
        organizationId ? [userId, organizationId] : [userId]
      );

      // Insert new projections
      for (const day of projection) {
        await query(
          `INSERT INTO cash_flow_projections
           (user_id, organization_id, projection_date, projected_balance, confidence_level, period_start, period_end)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            organizationId || null,
            day.date,
            day.closingBalance,
            day.riskLevel === 'safe' ? 'high' : day.riskLevel === 'warning' ? 'medium' : 'low',
            new Date().toISOString().split('T')[0],
            new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ]
        );
      }

      console.log(`[Phase4 Projection] Saved ${projection.length} projections to DB for user ${userId}`);
    } catch (error) {
      console.error('[Phase4 Projection] Error saving projections:', error);
      throw error;
    }
  }

  /**
   * Add a recurring item
   */
  static async addRecurringItem(userId: number, item: {
    description: string;
    amount: number;
    frequency: string;
    start_date: string;
    end_date?: string;
    day_of_month?: number;
    day_of_week?: number;
    category_id?: number;
    is_income: boolean;
  }, organizationId?: number): Promise<any> {
    try {
      const result = await query(
        `INSERT INTO projection_inputs
         (user_id, organization_id, description, amount, frequency, start_date, end_date, day_of_month, day_of_week, category_id, is_income, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
         RETURNING *`,
        [
          userId,
          organizationId || null,
          item.description,
          item.amount,
          item.frequency,
          item.start_date,
          item.end_date || null,
          item.day_of_month || null,
          item.day_of_week || null,
          item.category_id || null,
          item.is_income,
        ]
      );

      console.log(`[Phase4 Projection] Added recurring item for user ${userId}:`, item.description);
      return result.rows[0];
    } catch (error) {
      console.error('[Phase4 Projection] Error adding recurring item:', error);
      throw error;
    }
  }

  /**
   * Get all recurring items for a user
   */
  static async getRecurringItems(userId: number, organizationId?: number): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM projection_inputs WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''} ORDER BY start_date DESC`,
        organizationId ? [userId, organizationId] : [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('[Phase4 Projection] Error getting recurring items:', error);
      throw error;
    }
  }
}
