import { pool } from '../config/database';

interface BudgetSummary {
  categoryName: string;
  spent: number;
  target: number;
  percentage: number;
  status: 'on-track' | 'warning' | 'critical';
}

interface ReportContent {
  periodStart: string;
  periodEnd: string;
  totalSpent: number;
  totalBudget: number;
  spendingByCategory: BudgetSummary[];
  savingsRate?: number;
  goalsProgress?: any[];
  upcomingBills?: any[];
}

/**
 * Generate weekly summary report
 */
export const generateWeeklySummary = async (userId: number): Promise<string> => {
  try {
    const reportContent = await getWeeklyReportContent(userId);
    return formatReportAsHtml(reportContent, 'weekly');
  } catch (error: any) {
    console.error('Error generating weekly summary:', error);
    throw error;
  }
};

/**
 * Generate monthly summary report
 */
export const generateMonthlySummary = async (userId: number): Promise<string> => {
  try {
    const reportContent = await getMonthlyReportContent(userId);
    return formatReportAsHtml(reportContent, 'monthly');
  } catch (error: any) {
    console.error('Error generating monthly summary:', error);
    throw error;
  }
};

/**
 * Generate spending analysis report
 */
export const generateSpendingAnalysis = async (userId: number): Promise<string> => {
  try {
    const reportContent = await getSpendingAnalysisContent(userId);
    return formatReportAsHtml(reportContent, 'analysis');
  } catch (error: any) {
    console.error('Error generating spending analysis:', error);
    throw error;
  }
};

// Helper functions

async function getWeeklyReportContent(userId: number): Promise<ReportContent> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return getTransactionSummary(userId, startOfWeek, endOfWeek);
}

async function getMonthlyReportContent(userId: number): Promise<ReportContent> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return getTransactionSummary(userId, startOfMonth, endOfMonth);
}

async function getSpendingAnalysisContent(userId: number): Promise<ReportContent> {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  threeMonthsAgo.setHours(0, 0, 0, 0);

  return getTransactionSummary(userId, threeMonthsAgo, now);
}

async function getTransactionSummary(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<ReportContent> {
  // Get spending by category
  const spendingResult = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      SUM(CASE WHEN t.transaction_type = 'expense' THEN ABS(t.amount) ELSE 0 END) as spent,
      COUNT(*) as transaction_count
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
      AND t.user_id = $1
      AND t.transaction_date >= $2
      AND t.transaction_date <= $3
      AND t.transaction_type = 'expense'
    WHERE c.user_id = $1
    GROUP BY c.id, c.name
    ORDER BY spent DESC
    `,
    [userId, startDate, endDate]
  );

  // Get budget targets for the period (use current month's budget)
  const budgetResult = await pool.query(
    `
    SELECT
      bt.category_id,
      bt.target_amount
    FROM budget_targets bt
    JOIN budgets b ON bt.budget_id = b.id
    WHERE b.user_id = $1
      AND EXTRACT(YEAR FROM CURRENT_DATE) = b.year
      AND EXTRACT(MONTH FROM CURRENT_DATE) = b.month
    `,
    [userId]
  );

  const budgetMap = new Map();
  budgetResult.rows.forEach((row) => {
    budgetMap.set(row.category_id, parseFloat(row.target_amount));
  });

  // Build spending summary with budget targets
  const spendingByCategory: BudgetSummary[] = spendingResult.rows
    .filter((row) => parseFloat(row.spent) > 0)
    .map((row) => {
      const spent = parseFloat(row.spent);
      const target = budgetMap.get(row.id) || 0;
      const percentage = target > 0 ? (spent / target) * 100 : 0;

      return {
        categoryName: row.name,
        spent,
        target,
        percentage,
        status: percentage >= 100 ? 'critical' : percentage >= 80 ? 'warning' : 'on-track',
      };
    });

  // Calculate totals
  const totalSpent = spendingByCategory.reduce((sum, cat) => sum + cat.spent, 0);
  const totalBudget = spendingByCategory.reduce((sum, cat) => sum + cat.target, 0);

  return {
    periodStart: startDate.toISOString().split('T')[0],
    periodEnd: endDate.toISOString().split('T')[0],
    totalSpent,
    totalBudget,
    spendingByCategory,
    savingsRate: totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0,
  };
}

function formatReportAsHtml(content: ReportContent, type: 'weekly' | 'monthly' | 'analysis'): string {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const categoryRows = content.spendingByCategory
    .map(
      (cat) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${cat.categoryName}</td>
      <td style="padding: 12px; text-align: right;">${formatCurrency(cat.spent)}</td>
      <td style="padding: 12px; text-align: right;">${formatCurrency(cat.target)}</td>
      <td style="padding: 12px; text-align: center;">
        <span style="
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          background-color: ${
            cat.status === 'critical'
              ? '#fee2e2; color: #991b1b;'
              : cat.status === 'warning'
                ? '#fffbeb; color: #92400e;'
                : '#dcfce7; color: #166534;'
          }
        ">
          ${cat.percentage.toFixed(0)}%
        </span>
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead style="background-color: #f3f4f6;">
        <tr>
          <th style="padding: 12px; text-align: left; font-weight: 600;">Category</th>
          <th style="padding: 12px; text-align: right; font-weight: 600;">Spent</th>
          <th style="padding: 12px; text-align: right; font-weight: 600;">Budget</th>
          <th style="padding: 12px; text-align: center; font-weight: 600;">% Used</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRows}
      </tbody>
    </table>

    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; margin: 8px 0;">
        <span style="font-weight: 500;">Total Spent:</span>
        <span>${formatCurrency(content.totalSpent)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 8px 0;">
        <span style="font-weight: 500;">Total Budget:</span>
        <span>${formatCurrency(content.totalBudget)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 8px 0; padding-top: 8px; border-top: 1px solid #d1d5db;">
        <span style="font-weight: 600;">Remaining:</span>
        <span style="font-weight: 600;">${formatCurrency(content.totalBudget - content.totalSpent)}</span>
      </div>
      ${
        content.savingsRate !== undefined
          ? `
      <div style="display: flex; justify-content: space-between; margin: 8px 0;">
        <span style="font-weight: 500;">Savings Rate:</span>
        <span>${content.savingsRate.toFixed(1)}%</span>
      </div>
      `
          : ''
      }
    </div>

    <div style="background-color: #eff6ff; padding: 12px; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 20px 0; font-size: 14px;">
      <p style="margin: 0;">
        ${
          type === 'weekly'
            ? '📊 This is your weekly budget summary. Keep tracking to stay on budget!'
            : type === 'monthly'
              ? '📊 This is your monthly budget summary. Review your spending patterns to improve next month.'
              : '📈 This is your 3-month spending analysis. Use these insights to optimize your budget.'
        }
      </p>
    </div>
  `;
}
