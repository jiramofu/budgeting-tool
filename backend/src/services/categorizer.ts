import { query } from '../config/database';

interface CategoryMatch {
  categoryId: number;
  confidence: number;
}

export class TransactionCategorizer {
  private static KEYWORDS: { [key: string]: number[] } = {
    // Groceries
    'grocery|safeway|whole foods|trader joes|costco|kroger|albertsons|publix|sprouts|wholefoods':
      [],
    // Dining Out
    'restaurant|cafe|coffee|pizza|burger|sushi|taco|steak|bar|brewpub|lounge':
      [],
    // Gas
    'shell|chevron|exxon|mobil|bp|sunoco|speedway|citgo|sunoco|fuel|gas station|pump':
      [],
    // Transportation
    'uber|lyft|taxi|transit|metro|train|bus|amtrak':
      [],
    // Entertainment
    'movie|cinema|theater|netflix|spotify|hulu|disney|hbo|concert|ticket|event|game|steam':
      [],
    // Shopping
    'amazon|target|walmart|costco|mall|store|retail|shop':
      [],
    // Utilities
    'electric|water|gas|utility|power|service|internet|phone':
      [],
    // Insurance
    'insurance|allstate|geico|state farm|progressive|aetna|blue cross|aarp':
      [],
    // Health
    'pharmacy|cvs|walgreens|doctor|hospital|medical|clinic|dental|dentist|therapy|gym|fitness':
      [],
    // Subscriptions
    'subscription|membership|renewal|annual fee|monthly fee|trial':
      [],
  };

  static async suggestCategory(
    userId: number,
    description: string,
    amount: number,
    organizationId: number
  ): Promise<CategoryMatch | null> {
    try {
      // First, try keyword matching
      const keywordMatch = this.matchKeywords(description);
      if (keywordMatch) {
        const categoryId = await this.getCategoryIdByName(userId, keywordMatch, organizationId);
        if (categoryId) {
          return { categoryId, confidence: 0.85 };
        }
      }

      // If no keyword match, try learning from user's history
      const historicalMatch = await this.matchFromHistory(userId, description, amount, organizationId);
      if (historicalMatch) {
        return historicalMatch;
      }

      return null;
    } catch (error) {
      console.error('[Categorizer] Error suggesting category:', error);
      return null;
    }
  }

  private static matchKeywords(description: string): string | null {
    const lowerDesc = description.toLowerCase();

    for (const [keywords, _] of Object.entries(this.KEYWORDS)) {
      const keywordArray = keywords.split('|');
      if (keywordArray.some((kw) => lowerDesc.includes(kw))) {
        // Extract category type from keywords
        if (
          keywords.includes('grocery') ||
          keywords.includes('safeway') ||
          keywords.includes('whole')
        ) {
          return 'Groceries';
        }
        if (keywords.includes('restaurant') || keywords.includes('cafe')) {
          return 'Dining Out';
        }
        if (keywords.includes('shell') || keywords.includes('chevron')) {
          return 'Gas';
        }
        if (
          keywords.includes('uber') ||
          keywords.includes('lyft') ||
          keywords.includes('taxi')
        ) {
          return 'Transportation';
        }
        if (
          keywords.includes('movie') ||
          keywords.includes('netflix') ||
          keywords.includes('spotify')
        ) {
          return 'Entertainment';
        }
        if (
          keywords.includes('amazon') ||
          keywords.includes('target') ||
          keywords.includes('walmart')
        ) {
          return 'Shopping';
        }
        if (
          keywords.includes('electric') ||
          keywords.includes('utility') ||
          keywords.includes('internet')
        ) {
          return 'Utilities';
        }
        if (keywords.includes('insurance')) {
          return 'Insurance';
        }
        if (
          keywords.includes('pharmacy') ||
          keywords.includes('doctor') ||
          keywords.includes('gym')
        ) {
          return 'Health & Wellness';
        }
        if (keywords.includes('subscription') || keywords.includes('membership')) {
          return 'Subscriptions';
        }
      }
    }

    return null;
  }

  private static async getCategoryIdByName(
    userId: number,
    categoryName: string,
    organizationId: number
  ): Promise<number | null> {
    try {
      const result = await query(
        `SELECT id FROM categories WHERE user_id = $1 AND name = $2 ${organizationId ? 'AND organization_id = $3' : ''} LIMIT 1`,
        organizationId ? [userId, categoryName, organizationId] : [userId, categoryName]
      );
      return result.rows.length > 0 ? result.rows[0].id : null;
    } catch (error) {
      console.error('[Categorizer] Error getting category ID:', error);
      return null;
    }
  }

  private static async matchFromHistory(
    userId: number,
    description: string,
    amount: number,
    organizationId: number
  ): Promise<CategoryMatch | null> {
    try {
      // Find similar transactions from user history
      const searchTerm = description.split(' ')[0]; // Use first word as search term
      if (searchTerm.length < 3) {
        return null;
      }

      const result = await query(
        `SELECT category_id, COUNT(*) as count
         FROM transactions
         WHERE user_id = $1
         AND description ILIKE $2
         AND category_id IS NOT NULL ${organizationId ? 'AND organization_id = $3' : ''}
         GROUP BY category_id
         ORDER BY count DESC
         LIMIT 1`,
        organizationId ? [userId, `%${searchTerm}%`, organizationId] : [userId, `%${searchTerm}%`]
      );

      if (result.rows.length > 0) {
        return {
          categoryId: result.rows[0].category_id,
          confidence: 0.7,
        };
      }

      // Try matching by similar amount
      const amountMatch = await query(
        `SELECT category_id, COUNT(*) as count,
                ABS(AVG(amount) - $2) as amount_diff
         FROM transactions
         WHERE user_id = $1
         AND category_id IS NOT NULL
         AND amount BETWEEN $2 * 0.8 AND $2 * 1.2 ${organizationId ? 'AND organization_id = $3' : ''}
         GROUP BY category_id
         HAVING COUNT(*) > 2
         ORDER BY amount_diff ASC, count DESC
         LIMIT 1`,
        organizationId ? [userId, amount, organizationId] : [userId, amount]
      );

      if (amountMatch.rows.length > 0) {
        return {
          categoryId: amountMatch.rows[0].category_id,
          confidence: 0.5,
        };
      }

      return null;
    } catch (error) {
      console.error('[Categorizer] Error matching from history:', error);
      return null;
    }
  }

  static async recordFeedback(
    userId: number,
    transactionId: number,
    categoryId: number,
    organizationId: number
  ): Promise<void> {
    try {
      await query(
        `UPDATE transactions SET category_id = $1 WHERE id = $2 AND user_id = $3 ${organizationId ? 'AND organization_id = $4' : ''}`,
        organizationId ? [categoryId, transactionId, userId, organizationId] : [categoryId, transactionId, userId]
      );
      console.log('[Categorizer] Recorded user feedback for categorization');
    } catch (error) {
      console.error('[Categorizer] Error recording feedback:', error);
    }
  }
}
