import { query } from '../config/database';

export interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  type: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

export interface SpendingAnalysis {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  categoryBreakdown: CategoryBreakdown[];
  topCategories: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  averageDailySpend: number;
  savingsRate: number;
}

export class AnalyticsService {
  static async getMonthlyAnalysis(userId: number, month: number, year: number, organizationId?: number): Promise<SpendingAnalysis> {
    try {
      // Get transactions for the month
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const result = await query(
        `SELECT
          c.id as category_id,
          c.name as category_name,
          c.type,
          SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END) as income,
          SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) as expenses,
          COUNT(*) as count
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 ${organizationId ? 'AND t.organization_id = $4' : ''}
         AND DATE(t.transaction_date) >= $2
         AND DATE(t.transaction_date) <= $3
         GROUP BY c.id, c.name, c.type`,
        organizationId ? [userId, startDate, endDate, organizationId] : [userId, startDate, endDate]
      );

      const transactions = result.rows;

      const totalIncome = transactions.reduce((sum: number, t: any) => sum + (t.income || 0), 0);
      const totalExpenses = transactions.reduce((sum: number, t: any) => sum + (t.expenses || 0), 0);

      // Build category breakdown
      const categoryBreakdown = transactions
        .filter((t: any) => t.category_id !== null)
        .map((t: any) => ({
          categoryId: t.category_id,
          categoryName: t.category_name,
          type: t.type,
          amount: t.expenses || 0,
          percentage: totalExpenses > 0 ? ((t.expenses || 0) / totalExpenses) * 100 : 0,
          transactionCount: t.count,
        }))
        .filter((c: any) => c.amount > 0)
        .sort((a: any, b: any) => b.amount - a.amount);

      // Get monthly trends
      const trendsResult = await query(
        `SELECT
          EXTRACT(YEAR FROM t.transaction_date)::INT as year,
          EXTRACT(MONTH FROM t.transaction_date)::INT as month,
          SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END) as total_income,
          SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) as total_expenses
         FROM transactions t
         WHERE t.user_id = $1 ${organizationId ? 'AND t.organization_id = $2' : ''}
         AND DATE(t.transaction_date) >= DATE '2020-01-01'
         GROUP BY year, month
         ORDER BY year DESC, month DESC
         LIMIT 12`,
        organizationId ? [userId, organizationId] : [userId]
      );

      const monthlyTrends: MonthlyTrend[] = trendsResult.rows
        .reverse()
        .map((t: any) => ({
          month: new Date(t.year, t.month - 1).toLocaleDateString('en-US', { month: 'short' }),
          year: t.year,
          totalIncome: t.total_income || 0,
          totalExpenses: t.total_expenses || 0,
          netCashFlow: (t.total_income || 0) - (t.total_expenses || 0),
        }));

      // Calculate metrics
      const daysInMonth = new Date(year, month, 0).getDate();
      const averageDailySpend = totalExpenses / daysInMonth;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      return {
        period: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        categoryBreakdown,
        topCategories: categoryBreakdown.slice(0, 5),
        monthlyTrends,
        averageDailySpend,
        savingsRate: Math.max(0, savingsRate),
      };
    } catch (error) {
      console.error('[Analytics] Error getting monthly analysis:', error);
      throw error;
    }
  }

  static async getYearlyAnalysis(userId: number, year: number, organizationId?: number): Promise<SpendingAnalysis> {
    try {
      const startDate = new Date(year, 0, 1).toISOString().split('T')[0];
      const endDate = new Date(year, 11, 31).toISOString().split('T')[0];

      const result = await query(
        `SELECT
          c.id as category_id,
          c.name as category_name,
          c.type,
          SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END) as income,
          SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) as expenses,
          COUNT(*) as count
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 ${organizationId ? 'AND t.organization_id = $4' : ''}
         AND DATE(t.transaction_date) >= $2
         AND DATE(t.transaction_date) <= $3
         GROUP BY c.id, c.name, c.type`,
        organizationId ? [userId, startDate, endDate, organizationId] : [userId, startDate, endDate]
      );

      const transactions = result.rows;

      const totalIncome = transactions.reduce((sum: number, t: any) => sum + (t.income || 0), 0);
      const totalExpenses = transactions.reduce((sum: number, t: any) => sum + (t.expenses || 0), 0);

      // Build category breakdown
      const categoryBreakdown = transactions
        .filter((t: any) => t.category_id !== null)
        .map((t: any) => ({
          categoryId: t.category_id,
          categoryName: t.category_name,
          type: t.type,
          amount: t.expenses || 0,
          percentage: totalExpenses > 0 ? ((t.expenses || 0) / totalExpenses) * 100 : 0,
          transactionCount: t.count,
        }))
        .filter((c: any) => c.amount > 0)
        .sort((a: any, b: any) => b.amount - a.amount);

      // Get monthly trends for the year
      const trendsResult = await query(
        `SELECT
          EXTRACT(MONTH FROM t.transaction_date)::INT as month,
          SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END) as total_income,
          SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) as total_expenses
         FROM transactions t
         WHERE t.user_id = $1 ${organizationId ? 'AND t.organization_id = $4' : ''}
         AND DATE(t.transaction_date) >= $2
         AND DATE(t.transaction_date) <= $3
         GROUP BY month
         ORDER BY month`,
        organizationId ? [userId, startDate, endDate, organizationId] : [userId, startDate, endDate]
      );

      const monthlyTrends: MonthlyTrend[] = trendsResult.rows.map((t: any) => ({
        month: new Date(year, t.month - 1).toLocaleDateString('en-US', { month: 'short' }),
        year,
        totalIncome: t.total_income || 0,
        totalExpenses: t.total_expenses || 0,
        netCashFlow: (t.total_income || 0) - (t.total_expenses || 0),
      }));

      const averageDailySpend = totalExpenses / 365;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      return {
        period: `${year}`,
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        categoryBreakdown,
        topCategories: categoryBreakdown.slice(0, 5),
        monthlyTrends,
        averageDailySpend,
        savingsRate: Math.max(0, savingsRate),
      };
    } catch (error) {
      console.error('[Analytics] Error getting yearly analysis:', error);
      throw error;
    }
  }
}
