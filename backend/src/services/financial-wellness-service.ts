import { query } from '../config/database';

interface NetWorthAsset {
  name: string;
  value: number;
  type: 'cash' | 'investment' | 'savings' | 'property' | 'vehicle' | 'other';
  lastUpdated: string;
}

interface NetWorthSnapshot {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  trend: number;
  date: string;
}

interface DebtPayoffPlan {
  id?: number;
  categoryId: number;
  categoryName: string;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  payoffMonths: number;
  totalInterestPaid: number;
  payoffDate: string;
  strategy: 'snowball' | 'avalanche';
}

interface TaxInsight {
  category: string;
  amount: number;
  estimatedTaxBenefit: number;
  recommendation: string;
}

export class FinancialWellnessService {
  // Calculate net worth from all accounts
  static async calculateNetWorth(userId: number, organizationId?: number): Promise<NetWorthSnapshot> {
    try {
      // Get positive transactions (assets/income)
      const assetsResult = await query(
        `SELECT COALESCE(SUM(CAST(t.amount AS NUMERIC)), 0) as total
         FROM transactions t
         WHERE t.user_id = $1 AND t.amount > 0 ${organizationId ? 'AND t.organization_id = $2' : ''}
         AND t.transaction_date >= NOW() - INTERVAL '12 months'`,
        organizationId ? [userId, organizationId] : [userId]
      );

      // Get negative transactions (liabilities/expenses)
      const liabilitiesResult = await query(
        `SELECT COALESCE(ABS(SUM(CAST(t.amount AS NUMERIC))), 0) as total
         FROM transactions t
         WHERE t.user_id = $1 AND t.amount < 0 ${organizationId ? 'AND t.organization_id = $2' : ''}
         AND t.transaction_date >= NOW() - INTERVAL '12 months'`,
        organizationId ? [userId, organizationId] : [userId]
      );

      // Get previous snapshot for trend
      const previousResult = await query(
        `SELECT net_worth FROM financial_snapshots
         WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''}
         ORDER BY created_at DESC
         LIMIT 2`,
        organizationId ? [userId, organizationId] : [userId]
      );

      const totalAssets = assetsResult.rows[0].total;
      const totalLiabilities = liabilitiesResult.rows[0].total;
      const netWorth = totalAssets - totalLiabilities;

      let trend = 0;
      if (previousResult.rows.length >= 2) {
        const previous = previousResult.rows[1].net_worth;
        trend = netWorth - previous;
      }

      // Store snapshot
      const incomeResult = await query(
        `SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as income FROM transactions
         WHERE user_id = $1 AND amount > 0 ${organizationId ? 'AND organization_id = $2' : ''} AND transaction_date >= NOW() - INTERVAL '12 months'`,
        organizationId ? [userId, organizationId] : [userId]
      );
      const totalIncome = incomeResult.rows[0]?.income || 0;

      await query(
        `INSERT INTO financial_snapshots (user_id, organization_id, snapshot_date, net_worth, total_assets, total_liabilities, total_income, total_expenses)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)`,
        [userId, organizationId || null, netWorth, totalAssets, totalLiabilities, totalIncome, totalAssets + totalLiabilities]
      );

      return {
        totalAssets,
        totalLiabilities,
        netWorth,
        trend,
        date: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Wellness] Error calculating net worth:', error);
      throw error;
    }
  }

  // Calculate debt payoff timeline
  static async calculateDebtPayoff(
    currentBalance: number,
    monthlyPayment: number,
    annualInterestRate: number,
    strategy: 'snowball' | 'avalanche' = 'avalanche'
  ): Promise<{ months: number; totalInterest: number; payoffDate: string }> {
    let balance = currentBalance;
    let totalInterest = 0;
    let months = 0;
    const monthlyRate = annualInterestRate / 100 / 12;

    while (balance > 0 && months < 600) {
      // 50 year max
      const interestCharge = balance * monthlyRate;
      totalInterest += interestCharge;
      balance = Math.max(0, balance + interestCharge - monthlyPayment);
      months++;
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    return {
      months,
      totalInterest: Math.round(totalInterest * 100) / 100,
      payoffDate: payoffDate.toISOString(),
    };
  }

  // Get debt payoff plans for all expense categories
  static async getDebtPayoffPlans(userId: number, organizationId?: number): Promise<DebtPayoffPlan[]> {
    try {
      // Get all negative balance categories (debt-like)
      const result = await query(
        `SELECT c.id, c.name,
                ABS(SUM(CAST(t.amount AS NUMERIC))) as balance
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.amount < 0 ${organizationId ? 'AND t.organization_id = $2' : ''}
         GROUP BY c.id, c.name
         HAVING ABS(SUM(CAST(t.amount AS NUMERIC))) > 100
         ORDER BY ABS(SUM(CAST(t.amount AS NUMERIC))) DESC
         LIMIT 5`,
        organizationId ? [userId, organizationId] : [userId]
      );

      const plans: DebtPayoffPlan[] = [];

      for (const row of result.rows) {
        const monthlyPayment = row.balance * 0.1; // Assume 10% monthly payment
        const { months, totalInterest, payoffDate } = await this.calculateDebtPayoff(
          row.balance,
          monthlyPayment,
          5 // Assume 5% interest
        );

        plans.push({
          categoryId: row.id,
          categoryName: row.name,
          currentBalance: Math.round(row.balance * 100) / 100,
          interestRate: 5,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          payoffMonths: months,
          totalInterestPaid: totalInterest,
          payoffDate,
          strategy: 'avalanche',
        });
      }

      return plans;
    } catch (error) {
      console.error('[Wellness] Error getting debt payoff plans:', error);
      throw error;
    }
  }

  // Generate tax insights
  static async getTaxInsights(userId: number, organizationId?: number): Promise<TaxInsight[]> {
    try {
      const insights: TaxInsight[] = [];

      // Get deductible categories
      const result = await query(
        `SELECT c.name,
                ABS(SUM(CAST(t.amount AS NUMERIC))) as total,
                COUNT(*) as transaction_count
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 ${organizationId ? 'AND t.organization_id = $2' : ''}
         AND t.transaction_date >= DATE_TRUNC('year', NOW())
         AND t.amount < 0
         AND c.name IN ('Medical', 'Charitable', 'Education', 'Home Office', 'Business Expenses', 'Professional Services')
         GROUP BY c.id, c.name
         ORDER BY ABS(SUM(CAST(t.amount AS NUMERIC))) DESC`,
        organizationId ? [userId, organizationId] : [userId]
      );

      for (const row of result.rows) {
        const estimatedTaxBenefit = row.total * 0.24; // Assume 24% tax bracket

        insights.push({
          category: row.name,
          amount: Math.round(row.total * 100) / 100,
          estimatedTaxBenefit: Math.round(estimatedTaxBenefit * 100) / 100,
          recommendation: `Track ${row.name} expenses for tax deduction. Estimated savings: $${estimatedTaxBenefit.toFixed(2)}`,
        });
      }

      return insights;
    } catch (error) {
      console.error('[Wellness] Error getting tax insights:', error);
      throw error;
    }
  }

  // Calculate savings rate
  static async getSavingsRateAnalysis(userId: number, months: number = 6, organizationId?: number): Promise<any> {
    try {
      const result = await query(
        `SELECT
           SUM(CASE WHEN amount > 0 THEN CAST(amount AS NUMERIC) ELSE 0 END) as total_income,
           SUM(CASE WHEN amount < 0 THEN ABS(CAST(amount AS NUMERIC)) ELSE 0 END) as total_expenses
         FROM transactions
         WHERE user_id = $1 ${organizationId ? 'AND organization_id = $3' : ''}
         AND transaction_date >= NOW() - INTERVAL '1 month' * $2`,
        organizationId ? [userId, months, organizationId] : [userId, months]
      );

      const { total_income = 0, total_expenses = 0 } = result.rows[0] || {};
      const savingsAmount = total_income - total_expenses;
      const savingsRate = total_income > 0 ? (savingsAmount / total_income) * 100 : 0;

      return {
        totalIncome: Math.round(total_income * 100) / 100,
        totalExpenses: Math.round(total_expenses * 100) / 100,
        savingsAmount: Math.round(savingsAmount * 100) / 100,
        savingsRate: Math.round(savingsRate * 100) / 100,
        savingsGoal: 20, // 20% recommended savings rate
        onTrack: savingsRate >= 20,
        recommendation: savingsRate >= 20
          ? 'Excellent! You\'re meeting the recommended 20% savings rate.'
          : `Try to save an additional $${Math.round((total_income * 0.2 - savingsAmount) * 100) / 100} to reach 20% savings rate.`,
      };
    } catch (error) {
      console.error('[Wellness] Error analyzing savings rate:', error);
      throw error;
    }
  }
}
