import { query } from '../config/database';

export interface CategoryAnalytics {
  categoryId: number;
  categoryName: string;
  totalSpent: number;
  budgetTarget: number;
  percentageOfBudget: number;
  transactionCount: number;
  averageTransaction: number;
  trend: 'up' | 'stable' | 'down';
  trendPercentage: number;
}

export interface MonthlyAnalytics {
  year: number;
  month: number;
  monthName: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  categories: CategoryAnalytics[];
  savingsRate: number;
  averageDailySpend: number;
}

export interface AnalyticsSummary {
  currentMonth: MonthlyAnalytics;
  lastMonth: MonthlyAnalytics;
  yearToDate: MonthlyAnalytics;
  lastYear: MonthlyAnalytics;
  monthlyTrend: MonthlyAnalytics[];
  topCategories: CategoryAnalytics[];
  budgetComplianceRate: number;
}

export class Phase4AnalyticsService {
  /**
   * Calculate analytics for a specific month
   */
  static async getMonthAnalytics(userId: number, year: number, month: number, organizationId?: number): Promise<MonthlyAnalytics> {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Get transactions for the month
      const transactionsResult = await query(
        `SELECT
          c.id as category_id,
          c.name as category_name,
          t.transaction_type,
          SUM(t.amount) as total_amount,
          COUNT(*) as transaction_count,
          AVG(t.amount) as avg_amount
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         AND DATE(t.transaction_date) >= $2
         AND DATE(t.transaction_date) <= $3 ${organizationId ? 'AND t.organization_id = $4' : ''}
         GROUP BY c.id, c.name, t.transaction_type`,
        organizationId ? [userId, startDate, endDate, organizationId] : [userId, startDate, endDate]
      );

      const transactions = transactionsResult.rows;
      const totalIncome = transactions
        .filter((t: any) => t.transaction_type === 'income')
        .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

      const totalExpenses = transactions
        .filter((t: any) => t.transaction_type === 'expense')
        .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

      // Get budget targets for categories
      const budgetsResult = await query(
        `SELECT
          bt.category_id,
          bt.target_amount,
          b.month,
          b.year
         FROM budget_targets bt
         JOIN budgets b ON bt.budget_id = b.id
         WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3 ${organizationId ? 'AND b.organization_id = $4' : ''}`,
        organizationId ? [userId, month, year, organizationId] : [userId, month, year]
      );

      const budgets = new Map();
      budgetsResult.rows.forEach((row: any) => {
        budgets.set(row.category_id, row.target_amount);
      });

      // Build category analytics
      const categories: CategoryAnalytics[] = [];
      for (const trans of transactions) {
        if (trans.category_id && trans.transaction_type === 'expense') {
          const budgetTarget = budgets.get(trans.category_id) || 0;
          const percentageOfBudget = budgetTarget > 0 ? (trans.total_amount / budgetTarget) * 100 : 0;

          // Get previous month data for trend
          const prevMonth = month === 1 ? 12 : month - 1;
          const prevYear = month === 1 ? year - 1 : year;
          const prevStartDate = new Date(prevYear, prevMonth - 1, 1).toISOString().split('T')[0];
          const prevEndDate = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

          const prevResult = await query(
            `SELECT SUM(amount) as prev_total FROM transactions
             WHERE user_id = $1 AND category_id = $2
             AND DATE(transaction_date) >= $3 AND DATE(transaction_date) <= $4
             AND transaction_type = 'expense' ${organizationId ? 'AND organization_id = $5' : ''}`,
            organizationId ? [userId, trans.category_id, prevStartDate, prevEndDate, organizationId] : [userId, trans.category_id, prevStartDate, prevEndDate]
          );

          const prevTotal = prevResult.rows[0]?.prev_total || 0;
          const trendPercentage = prevTotal > 0 ? ((trans.total_amount - prevTotal) / prevTotal) * 100 : 0;
          const trend: 'up' | 'stable' | 'down' =
            trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';

          categories.push({
            categoryId: trans.category_id,
            categoryName: trans.category_name,
            totalSpent: trans.total_amount,
            budgetTarget,
            percentageOfBudget,
            transactionCount: trans.transaction_count,
            averageTransaction: trans.avg_amount || 0,
            trend,
            trendPercentage,
          });
        }
      }

      const daysInMonth = new Date(year, month, 0).getDate();
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      return {
        year,
        month,
        monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        categories: categories.sort((a, b) => b.totalSpent - a.totalSpent),
        savingsRate: Math.max(0, savingsRate),
        averageDailySpend: totalExpenses / daysInMonth,
      };
    } catch (error) {
      console.error('[Phase4 Analytics] Error getting month analytics:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics summary (current, last month, YTD, etc.)
   */
  static async getAnalyticsSummary(userId: number, organizationId?: number): Promise<AnalyticsSummary> {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const currentMonthData = await this.getMonthAnalytics(userId, currentYear, currentMonth, organizationId);

      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const lastMonthData = await this.getMonthAnalytics(userId, lastMonthYear, lastMonth, organizationId);

      // YTD calculation
      const ytdStartDate = new Date(currentYear, 0, 1).toISOString().split('T')[0];
      const ytdEndDate = today.toISOString().split('T')[0];

      const ytdResult = await query(
        `SELECT
          SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses
         FROM transactions
         WHERE user_id = $1 AND DATE(transaction_date) >= $2 AND DATE(transaction_date) <= $3 ${organizationId ? 'AND organization_id = $4' : ''}`,
        organizationId ? [userId, ytdStartDate, ytdEndDate, organizationId] : [userId, ytdStartDate, ytdEndDate]
      );

      const ytdRow = ytdResult.rows[0];
      const ytdData: MonthlyAnalytics = {
        year: currentYear,
        month: 0,
        monthName: `YTD ${currentYear}`,
        totalIncome: ytdRow?.total_income || 0,
        totalExpenses: ytdRow?.total_expenses || 0,
        netCashFlow: (ytdRow?.total_income || 0) - (ytdRow?.total_expenses || 0),
        categories: [],
        savingsRate: ytdRow?.total_income > 0 ? (((ytdRow?.total_income || 0) - (ytdRow?.total_expenses || 0)) / (ytdRow?.total_income || 1)) * 100 : 0,
        averageDailySpend: (ytdRow?.total_expenses || 0) / Math.ceil((today.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)),
      };

      // Last year calculation
      const lastYearStart = new Date(currentYear - 1, 0, 1).toISOString().split('T')[0];
      const lastYearEnd = new Date(currentYear - 1, 11, 31).toISOString().split('T')[0];

      const lastYearResult = await query(
        `SELECT
          SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses
         FROM transactions
         WHERE user_id = $1 AND DATE(transaction_date) >= $2 AND DATE(transaction_date) <= $3 ${organizationId ? 'AND organization_id = $4' : ''}`,
        organizationId ? [userId, lastYearStart, lastYearEnd, organizationId] : [userId, lastYearStart, lastYearEnd]
      );

      const lastYearRow = lastYearResult.rows[0];
      const lastYearData: MonthlyAnalytics = {
        year: currentYear - 1,
        month: 0,
        monthName: `${currentYear - 1}`,
        totalIncome: lastYearRow?.total_income || 0,
        totalExpenses: lastYearRow?.total_expenses || 0,
        netCashFlow: (lastYearRow?.total_income || 0) - (lastYearRow?.total_expenses || 0),
        categories: [],
        savingsRate: lastYearRow?.total_income > 0 ? (((lastYearRow?.total_income || 0) - (lastYearRow?.total_expenses || 0)) / (lastYearRow?.total_income || 1)) * 100 : 0,
        averageDailySpend: (lastYearRow?.total_expenses || 0) / 365,
      };

      // Monthly trend (last 12 months)
      const monthlyTrendResult = await query(
        `SELECT
          EXTRACT(YEAR FROM transaction_date)::INT as year,
          EXTRACT(MONTH FROM transaction_date)::INT as month,
          SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses
         FROM transactions
         WHERE user_id = $1 AND transaction_date >= NOW() - INTERVAL '12 months' ${organizationId ? 'AND organization_id = $2' : ''}
         GROUP BY year, month
         ORDER BY year ASC, month ASC`,
        organizationId ? [userId, organizationId] : [userId]
      );

      const monthlyTrend: MonthlyAnalytics[] = monthlyTrendResult.rows.map((row: any) => ({
        year: row.year,
        month: row.month,
        monthName: new Date(row.year, row.month - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        totalIncome: row.total_income || 0,
        totalExpenses: row.total_expenses || 0,
        netCashFlow: (row.total_income || 0) - (row.total_expenses || 0),
        categories: [],
        savingsRate: row.total_income > 0 ? (((row.total_income || 0) - (row.total_expenses || 0)) / (row.total_income || 1)) * 100 : 0,
        averageDailySpend: (row.total_expenses || 0) / 30,
      }));

      // Budget compliance rate
      const budgetComplianceResult = await query(
        `SELECT
          COALESCE(
            COUNT(CASE WHEN sa.total_spent <= sa.budget_target THEN 1 END)::FLOAT / NULLIF(COUNT(*)::FLOAT, 0) * 100,
            0
          ) as compliance_rate
         FROM spending_analytics sa
         WHERE sa.user_id = $1 AND sa.budget_target > 0 ${organizationId ? 'AND sa.organization_id = $2' : ''}`,
        organizationId ? [userId, organizationId] : [userId]
      );

      const budgetComplianceRate = budgetComplianceResult.rows[0]?.compliance_rate || 0;

      return {
        currentMonth: currentMonthData,
        lastMonth: lastMonthData,
        yearToDate: ytdData,
        lastYear: lastYearData,
        monthlyTrend,
        topCategories: currentMonthData.categories.slice(0, 5),
        budgetComplianceRate,
      };
    } catch (error) {
      console.error('[Phase4 Analytics] Error getting summary:', error);
      throw error;
    }
  }

  /**
   * Save analytics to database for performance
   */
  static async saveAnalyticsToDB(userId: number, organizationId?: number): Promise<void> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      // Get all categories
      const categoriesResult = await query(
        `SELECT id FROM categories WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''}`,
        organizationId ? [userId, organizationId] : [userId]
      );

      // Clear existing analytics for this month
      await query(`DELETE FROM spending_analytics WHERE user_id = $1 AND year = $2 AND month = $3 ${organizationId ? 'AND organization_id = $4' : ''}`,
        organizationId ? [userId, year, month, organizationId] : [userId, year, month]);

      // Calculate and save analytics for each category
      for (const { id: categoryId } of categoriesResult.rows) {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const result = await query(
          `SELECT
            SUM(amount) as total_spent,
            COUNT(*) as transaction_count,
            AVG(amount) as avg_amount
           FROM transactions
           WHERE user_id = $1 AND category_id = $2
           AND DATE(transaction_date) >= $3 AND DATE(transaction_date) <= $4
           AND transaction_type = 'expense' ${organizationId ? 'AND organization_id = $5' : ''}`,
          organizationId ? [userId, categoryId, startDate, endDate, organizationId] : [userId, categoryId, startDate, endDate]
        );

        const row = result.rows[0];
        const totalSpent = row?.total_spent || 0;
        const transactionCount = row?.transaction_count || 0;

        if (totalSpent > 0) {
          // Get budget target
          const budgetResult = await query(
            `SELECT target_amount FROM budget_targets bt
             JOIN budgets b ON bt.budget_id = b.id
             WHERE b.user_id = $1 AND bt.category_id = $2 AND b.month = $3 AND b.year = $4 ${organizationId ? 'AND b.organization_id = $5' : ''}`,
            organizationId ? [userId, categoryId, month, year, organizationId] : [userId, categoryId, month, year]
          );

          const budgetTarget = budgetResult.rows[0]?.target_amount || 0;
          const percentageOfBudget = budgetTarget > 0 ? (totalSpent / budgetTarget) * 100 : 0;

          // Get previous month data for trend
          const prevMonth = month === 1 ? 12 : month - 1;
          const prevYear = month === 1 ? year - 1 : year;
          const prevStartDate = new Date(prevYear, prevMonth - 1, 1).toISOString().split('T')[0];
          const prevEndDate = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

          const prevResult = await query(
            `SELECT SUM(amount) as prev_total FROM transactions
             WHERE user_id = $1 AND category_id = $2
             AND DATE(transaction_date) >= $3 AND DATE(transaction_date) <= $4
             AND transaction_type = 'expense' ${organizationId ? 'AND organization_id = $5' : ''}`,
            organizationId ? [userId, categoryId, prevStartDate, prevEndDate, organizationId] : [userId, categoryId, prevStartDate, prevEndDate]
          );

          const prevTotal = prevResult.rows[0]?.prev_total || 0;
          const trendPercentage = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;

          await query(
            `INSERT INTO spending_analytics
             (user_id, year, month, category_id, total_spent, budget_target, transaction_count, percentage_of_budget, trend_vs_prev_month, avg_transaction_amount, organization_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [userId, year, month, categoryId, totalSpent, budgetTarget, transactionCount, percentageOfBudget, trendPercentage, row?.avg_amount || 0, organizationId || null]
          );
        }
      }

      console.log(`[Phase4 Analytics] Saved analytics to DB for user ${userId}`);
    } catch (error) {
      console.error('[Phase4 Analytics] Error saving analytics:', error);
      throw error;
    }
  }
}
