import { query } from '../config/database';

interface Investment {
  id?: number;
  userId: number;
  name: string;
  type: 'stocks' | 'bonds' | 'mutual_funds' | 'etf' | 'crypto' | 'real_estate' | 'other';
  ticker?: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  createdAt?: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  gainPercentage: number;
  byType: { type: string; value: number; percentage: number }[];
  investments: Investment[];
}

export class InvestmentService {
  static async getPortfolioSummary(userId: number, organizationId?: number): Promise<PortfolioSummary> {
    try {
      const result = await query(
        `SELECT type,
                SUM(CAST(shares AS NUMERIC) * CAST(current_price AS NUMERIC)) as total_value,
                SUM(CAST(shares AS NUMERIC) * CAST(purchase_price AS NUMERIC)) as total_cost
         FROM investments
         WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''}
         GROUP BY type`,
        organizationId ? [userId, organizationId] : [userId]
      );

      let totalValue = 0;
      let totalCost = 0;
      const byType: any[] = [];

      result.rows.forEach((row: any) => {
        const value = Number(row.total_value) || 0;
        const cost = Number(row.total_cost) || 0;
        totalValue += value;
        totalCost += cost;

        byType.push({
          type: row.type,
          value,
          percentage: 0,
        });
      });

      const totalGain = totalValue - totalCost;
      const gainPercentage = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

      byType.forEach((item) => {
        item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
      });

      const investmentsResult = await query(
        `SELECT id, user_id, name, type, ticker, shares, purchase_price, current_price, purchase_date, created_at
         FROM investments
         WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''}
         ORDER BY created_at DESC`,
        organizationId ? [userId, organizationId] : [userId]
      );

      const investments: Investment[] = investmentsResult.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        type: row.type,
        ticker: row.ticker,
        shares: Number(row.shares),
        purchasePrice: Number(row.purchase_price),
        currentPrice: Number(row.current_price),
        purchaseDate: row.purchase_date,
        createdAt: row.created_at,
      }));

      return {
        totalValue: Math.round(totalValue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalGain: Math.round(totalGain * 100) / 100,
        gainPercentage: Math.round(gainPercentage * 100) / 100,
        byType,
        investments,
      };
    } catch (error) {
      console.error('[Investment] Error getting portfolio summary:', error);
      throw error;
    }
  }

  static async addInvestment(userId: number, investment: Investment, organizationId?: number): Promise<Investment> {
    try {
      const result = await query(
        `INSERT INTO investments (user_id, organization_id, name, type, ticker, shares, purchase_price, current_price, purchase_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, user_id, name, type, ticker, shares, purchase_price, current_price, purchase_date, created_at`,
        [
          userId,
          organizationId || null,
          investment.name,
          investment.type,
          investment.ticker,
          investment.shares,
          investment.purchasePrice,
          investment.currentPrice,
          investment.purchaseDate,
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        type: row.type,
        ticker: row.ticker,
        shares: Number(row.shares),
        purchasePrice: Number(row.purchase_price),
        currentPrice: Number(row.current_price),
        purchaseDate: row.purchase_date,
        createdAt: row.created_at,
      };
    } catch (error) {
      console.error('[Investment] Error adding investment:', error);
      throw error;
    }
  }

  static async updateInvestmentPrice(investmentId: number, userId: number, currentPrice: number, organizationId?: number): Promise<Investment> {
    try {
      const result = await query(
        `UPDATE investments
         SET current_price = $1
         WHERE id = $2 AND user_id = $3 ${organizationId ? 'AND organization_id = $4' : ''}
         RETURNING id, user_id, name, type, ticker, shares, purchase_price, current_price, purchase_date, created_at`,
        organizationId ? [currentPrice, investmentId, userId, organizationId] : [currentPrice, investmentId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Investment not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        type: row.type,
        ticker: row.ticker,
        shares: Number(row.shares),
        purchasePrice: Number(row.purchase_price),
        currentPrice: Number(row.current_price),
        purchaseDate: row.purchase_date,
        createdAt: row.created_at,
      };
    } catch (error) {
      console.error('[Investment] Error updating investment price:', error);
      throw error;
    }
  }

  static async deleteInvestment(investmentId: number, userId: number, organizationId?: number): Promise<void> {
    try {
      await query(
        `DELETE FROM investments WHERE id = $1 AND user_id = $2 ${organizationId ? 'AND organization_id = $3' : ''}`,
        organizationId ? [investmentId, userId, organizationId] : [investmentId, userId]
      );
    } catch (error) {
      console.error('[Investment] Error deleting investment:', error);
      throw error;
    }
  }
}
