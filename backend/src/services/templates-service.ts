import { query } from '../config/database';

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: Array<{
    name: string;
    type: 'fixed' | 'variable' | 'recurring';
    suggestedPercentage?: number;
  }>;
}

export interface CategorySuggestion {
  name: string;
  frequency: number;
  confidence: number;
  type: 'fixed' | 'variable' | 'recurring';
}

export class TemplatesService {
  // Budget templates for different lifestyle types
  static readonly BUDGET_TEMPLATES: Record<string, BudgetTemplate> = {
    minimalist: {
      id: 'minimalist',
      name: 'Minimalist Budget',
      description: 'Perfect for those focused on savings and reducing expenses',
      icon: '🏠',
      categories: [
        { name: 'Housing', type: 'fixed', suggestedPercentage: 30 },
        { name: 'Utilities', type: 'fixed', suggestedPercentage: 5 },
        { name: 'Transportation', type: 'variable', suggestedPercentage: 10 },
        { name: 'Groceries', type: 'variable', suggestedPercentage: 15 },
        { name: 'Insurance', type: 'fixed', suggestedPercentage: 10 },
        { name: 'Savings', type: 'recurring', suggestedPercentage: 20 },
        { name: 'Miscellaneous', type: 'variable', suggestedPercentage: 10 },
      ],
    },
    balanced: {
      id: 'balanced',
      name: 'Balanced Budget',
      description: 'A well-rounded budget for steady income earners',
      icon: '⚖️',
      categories: [
        { name: 'Housing', type: 'fixed', suggestedPercentage: 25 },
        { name: 'Utilities', type: 'fixed', suggestedPercentage: 5 },
        { name: 'Groceries', type: 'variable', suggestedPercentage: 12 },
        { name: 'Dining Out', type: 'variable', suggestedPercentage: 8 },
        { name: 'Transportation', type: 'variable', suggestedPercentage: 12 },
        { name: 'Entertainment', type: 'variable', suggestedPercentage: 8 },
        { name: 'Insurance', type: 'fixed', suggestedPercentage: 10 },
        { name: 'Health & Wellness', type: 'variable', suggestedPercentage: 5 },
        { name: 'Savings', type: 'recurring', suggestedPercentage: 10 },
        { name: 'Miscellaneous', type: 'variable', suggestedPercentage: 5 },
      ],
    },
    family: {
      id: 'family',
      name: 'Family Budget',
      description: 'Designed for families with multiple expenses',
      icon: '👨‍👩‍👧‍👦',
      categories: [
        { name: 'Housing', type: 'fixed', suggestedPercentage: 28 },
        { name: 'Utilities', type: 'fixed', suggestedPercentage: 6 },
        { name: 'Groceries', type: 'variable', suggestedPercentage: 15 },
        { name: 'Dining Out', type: 'variable', suggestedPercentage: 5 },
        { name: 'Transportation', type: 'variable', suggestedPercentage: 10 },
        { name: 'Child Care', type: 'fixed', suggestedPercentage: 12 },
        { name: 'Education', type: 'variable', suggestedPercentage: 5 },
        { name: 'Entertainment', type: 'variable', suggestedPercentage: 5 },
        { name: 'Insurance', type: 'fixed', suggestedPercentage: 8 },
        { name: 'Health & Wellness', type: 'variable', suggestedPercentage: 4 },
        { name: 'Savings', type: 'recurring', suggestedPercentage: 2 },
      ],
    },
    highIncome: {
      id: 'highIncome',
      name: 'High Income Budget',
      description: 'For high earners with investment and luxury goals',
      icon: '💰',
      categories: [
        { name: 'Housing', type: 'fixed', suggestedPercentage: 20 },
        { name: 'Utilities', type: 'fixed', suggestedPercentage: 3 },
        { name: 'Groceries', type: 'variable', suggestedPercentage: 8 },
        { name: 'Dining Out', type: 'variable', suggestedPercentage: 10 },
        { name: 'Transportation', type: 'variable', suggestedPercentage: 8 },
        { name: 'Entertainment', type: 'variable', suggestedPercentage: 8 },
        { name: 'Travel', type: 'variable', suggestedPercentage: 8 },
        { name: 'Shopping', type: 'variable', suggestedPercentage: 5 },
        { name: 'Insurance', type: 'fixed', suggestedPercentage: 5 },
        { name: 'Investments', type: 'recurring', suggestedPercentage: 15 },
        { name: 'Charity', type: 'recurring', suggestedPercentage: 5 },
        { name: 'Savings', type: 'recurring', suggestedPercentage: 5 },
      ],
    },
    debtFree: {
      id: 'debtFree',
      name: 'Debt-Free Budget',
      description: 'Focused on paying off debt and building wealth',
      icon: '💪',
      categories: [
        { name: 'Housing', type: 'fixed', suggestedPercentage: 25 },
        { name: 'Utilities', type: 'fixed', suggestedPercentage: 5 },
        { name: 'Groceries', type: 'variable', suggestedPercentage: 12 },
        { name: 'Transportation', type: 'variable', suggestedPercentage: 10 },
        { name: 'Insurance', type: 'fixed', suggestedPercentage: 10 },
        { name: 'Debt Payoff', type: 'recurring', suggestedPercentage: 20 },
        { name: 'Savings', type: 'recurring', suggestedPercentage: 10 },
        { name: 'Personal Care', type: 'variable', suggestedPercentage: 3 },
        { name: 'Entertainment', type: 'variable', suggestedPercentage: 3 },
        { name: 'Miscellaneous', type: 'variable', suggestedPercentage: 2 },
      ],
    },
  };

  static getTemplates(): BudgetTemplate[] {
    return Object.values(this.BUDGET_TEMPLATES);
  }

  static getTemplate(templateId: string): BudgetTemplate | null {
    return this.BUDGET_TEMPLATES[templateId] || null;
  }

  static async applyTemplate(userId: number, templateId: string, budgetId: number, organizationId?: number): Promise<any> {
    try {
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const results = [];

      for (const categoryTemplate of template.categories) {
        const result = await query(
          `INSERT INTO categories (user_id, name, type, is_system)
           VALUES ($1, $2, $3, FALSE)
           ON CONFLICT (user_id, name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [userId, categoryTemplate.name, categoryTemplate.type]
        );

        const category = result.rows[0];
        results.push(category);

        if (categoryTemplate.suggestedPercentage) {
          const targetAmount = 5000 * (categoryTemplate.suggestedPercentage / 100);

          await query(
            `INSERT INTO budget_targets (budget_id, category_id, target_amount)
             VALUES ($1, $2, $3)
             ON CONFLICT (budget_id, category_id) DO UPDATE SET target_amount = EXCLUDED.target_amount
             `,
            [budgetId, category.id, targetAmount]
          );
        }
      }

      return results;
    } catch (error) {
      console.error('[Templates] Error applying template:', error);
      throw error;
    }
  }

  static async suggestCategories(userId: number, limit: number = 10, organizationId?: number): Promise<CategorySuggestion[]> {
    try {
      const result = await query(
        `SELECT
          c.name,
          COUNT(*) as frequency,
          ROUND(CAST(COUNT(*) AS DECIMAL) / (SELECT COUNT(*) FROM transactions WHERE user_id = $1) * 100, 2) as confidence,
          c.type
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         AND c.id IS NOT NULL
         GROUP BY c.id, c.name, c.type
         ORDER BY frequency DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map((row: any) => ({
        name: row.name,
        frequency: row.frequency,
        confidence: row.confidence,
        type: row.type,
      }));
    } catch (error) {
      console.error('[Templates] Error suggesting categories:', error);
      throw error;
    }
  }

  static async getCategoryStats(userId: number, organizationId?: number): Promise<any> {
    try {
      const result = await query(
        `SELECT
          COUNT(DISTINCT category_id) as totalCategories,
          COUNT(DISTINCT c.type) as categoryTypes,
          SUM(CASE WHEN t.transaction_type = 'expense' THEN 1 ELSE 0 END) as expenseCount,
          SUM(CASE WHEN t.transaction_type = 'income' THEN 1 ELSE 0 END) as incomeCount
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('[Templates] Error getting category stats:', error);
      throw error;
    }
  }
}
