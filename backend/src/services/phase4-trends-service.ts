import { query } from '../config/database';

export interface TrendData {
  categoryId: number;
  categoryName: string;
  month: number;
  monthName: string;
  avgSpending: number;
  minSpending: number;
  maxSpending: number;
  sampleSize: number;
  trend: 'up' | 'stable' | 'down';
  volatility: 'low' | 'medium' | 'high';
  yearOverYearChange: number;
}

export interface SeasonalInsight {
  categoryId: number;
  categoryName: string;
  highestMonth: number;
  highestMonthName: string;
  highestAverage: number;
  lowestMonth: number;
  lowestMonthName: string;
  lowestAverage: number;
  seasonalVariance: number;
  recommendations: string[];
}

export class Phase4TrendsService {
  /**
   * Calculate seasonal spending trends for a category
   */
  static async getCategoryTrends(userId: number, categoryId: number): Promise<TrendData[]> {
    try {
      const trends: TrendData[] = [];

      // For each month, calculate stats across all years of data
      for (let month = 1; month <= 12; month++) {
        const result = await query(
          `SELECT
            EXTRACT(MONTH FROM transaction_date)::INT as month,
            AVG(amount) as avg_amount,
            MIN(amount) as min_amount,
            MAX(amount) as max_amount,
            COUNT(DISTINCT EXTRACT(YEAR FROM transaction_date)) as year_count,
            SUM(amount) as total_amount
           FROM transactions
           WHERE user_id = $1 AND category_id = $2
           AND EXTRACT(MONTH FROM transaction_date) = $3
           AND transaction_type = 'expense'
           GROUP BY month`,
          [userId, categoryId, month]
        );

        if (result.rows.length > 0) {
          const row = result.rows[0];

          // Get category name
          const catResult = await query('SELECT name FROM categories WHERE id = $1', [categoryId]);
          const categoryName = catResult.rows[0]?.name || 'Unknown';

          // Get last 3 years data for trend
          const lastYearResult = await query(
            `SELECT
              SUM(CASE WHEN EXTRACT(YEAR FROM transaction_date)::INT = EXTRACT(YEAR FROM NOW())::INT - 3 THEN amount ELSE 0 END) as year3,
              SUM(CASE WHEN EXTRACT(YEAR FROM transaction_date)::INT = EXTRACT(YEAR FROM NOW())::INT - 2 THEN amount ELSE 0 END) as year2,
              SUM(CASE WHEN EXTRACT(YEAR FROM transaction_date)::INT = EXTRACT(YEAR FROM NOW())::INT - 1 THEN amount ELSE 0 END) as year1
             FROM transactions
             WHERE user_id = $1 AND category_id = $2
             AND EXTRACT(MONTH FROM transaction_date) = $3
             AND transaction_type = 'expense'`,
            [userId, categoryId, month]
          );

          const yearData = lastYearResult.rows[0];
          const year1 = yearData?.year1 || 0;
          const year2 = yearData?.year2 || 0;

          let trend: 'up' | 'stable' | 'down' = 'stable';
          let yearOverYearChange = 0;

          if (year2 > 0) {
            yearOverYearChange = ((year1 - year2) / year2) * 100;
            trend = yearOverYearChange > 5 ? 'up' : yearOverYearChange < -5 ? 'down' : 'stable';
          }

          // Calculate volatility (coefficient of variation)
          const volatilityResult = await query(
            `SELECT
              STDDEV(total) as std_dev,
              AVG(total) as avg
             FROM (
              SELECT
                EXTRACT(YEAR FROM transaction_date)::INT as year,
                SUM(amount) as total
               FROM transactions
               WHERE user_id = $1 AND category_id = $2
               AND EXTRACT(MONTH FROM transaction_date) = $3
               AND transaction_type = 'expense'
               GROUP BY year
             ) subq`,
            [userId, categoryId, month]
          );

          const volData = volatilityResult.rows[0];
          const avgAmount = volData?.avg || 0;
          const stdDev = volData?.std_dev || 0;
          const coefficientOfVariation = avgAmount > 0 ? stdDev / avgAmount : 0;

          let volatility: 'low' | 'medium' | 'high' = 'low';
          if (coefficientOfVariation > 0.5) volatility = 'high';
          else if (coefficientOfVariation > 0.25) volatility = 'medium';

          trends.push({
            categoryId,
            categoryName,
            month,
            monthName: new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' }),
            avgSpending: row.avg_amount || 0,
            minSpending: row.min_amount || 0,
            maxSpending: row.max_amount || 0,
            sampleSize: row.year_count || 0,
            trend,
            volatility,
            yearOverYearChange,
          });
        }
      }

      return trends;
    } catch (error) {
      console.error('[Phase4 Trends] Error getting category trends:', error);
      throw error;
    }
  }

  /**
   * Get seasonal insights for all categories
   */
  static async getSeasonalInsights(userId: number): Promise<SeasonalInsight[]> {
    try {
      // Get all categories for the user
      const categoriesResult = await query(
        `SELECT DISTINCT c.id, c.name
         FROM categories c
         JOIN transactions t ON c.id = t.category_id
         WHERE c.user_id = $1 AND t.transaction_type = 'expense'
         ORDER BY c.name`,
        [userId]
      );

      const insights: SeasonalInsight[] = [];

      for (const { id: categoryId, name: categoryName } of categoriesResult.rows) {
        const trends = await this.getCategoryTrends(userId, categoryId);

        if (trends.length > 0) {
          const highestMonth = trends.reduce((max, t) => (t.avgSpending > max.avgSpending ? t : max));
          const lowestMonth = trends.reduce((min, t) => (t.avgSpending < min.avgSpending ? t : min));

          const avgSpends = trends.map((t) => t.avgSpending);
          const seasonalVariance =
            ((Math.max(...avgSpends) - Math.min(...avgSpends)) / (Math.min(...avgSpends) || 1)) * 100;

          // Generate recommendations
          const recommendations: string[] = [];

          if (seasonalVariance > 50) {
            recommendations.push(
              `High seasonal variation detected. Budget is ${seasonalVariance.toFixed(0)}% higher in ${highestMonth.monthName} than ${lowestMonth.monthName}.`
            );
            recommendations.push(`Consider adjusting budget allocations to account for seasonal patterns.`);
          }

          const highTrendCount = trends.filter((t) => t.trend === 'up').length;
          if (highTrendCount >= 3) {
            recommendations.push(`Spending in this category is trending upward. Monitor for budget overruns.`);
          }

          const highVolatilityCount = trends.filter((t) => t.volatility === 'high').length;
          if (highVolatilityCount >= 3) {
            recommendations.push(`Spending is highly variable. Consider setting alerts or increasing budget cushion.`);
          }

          insights.push({
            categoryId,
            categoryName,
            highestMonth: highestMonth.month,
            highestMonthName: highestMonth.monthName,
            highestAverage: highestMonth.avgSpending,
            lowestMonth: lowestMonth.month,
            lowestMonthName: lowestMonth.monthName,
            lowestAverage: lowestMonth.avgSpending,
            seasonalVariance,
            recommendations,
          });
        }
      }

      return insights.sort((a, b) => b.seasonalVariance - a.seasonalVariance);
    } catch (error) {
      console.error('[Phase4 Trends] Error getting seasonal insights:', error);
      throw error;
    }
  }

  /**
   * Save trend data to database for performance
   */
  static async saveTrendsToDB(userId: number): Promise<void> {
    try {
      // Get all categories
      const categoriesResult = await query(
        `SELECT DISTINCT c.id FROM categories c
         JOIN transactions t ON c.id = t.category_id
         WHERE c.user_id = $1 AND t.transaction_type = 'expense'`,
        [userId]
      );

      // Clear old trends
      await query('DELETE FROM spending_trends WHERE user_id = $1', [userId]);

      // Calculate and save trends for each category
      for (const { id: categoryId } of categoriesResult.rows) {
        const trends = await this.getCategoryTrends(userId, categoryId);

        for (const trend of trends) {
          await query(
            `INSERT INTO spending_trends
             (user_id, category_id, month, avg_spending_across_years, min_spending, max_spending, sample_size, trend_direction, volatility)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              userId,
              categoryId,
              trend.month,
              trend.avgSpending,
              trend.minSpending,
              trend.maxSpending,
              trend.sampleSize,
              trend.trend,
              trend.volatility,
            ]
          );
        }
      }

      console.log(`[Phase4 Trends] Saved trends to DB for user ${userId}`);
    } catch (error) {
      console.error('[Phase4 Trends] Error saving trends:', error);
      throw error;
    }
  }
}
