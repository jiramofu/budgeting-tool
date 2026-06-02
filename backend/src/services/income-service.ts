import { query } from '../config/database';

export interface UserIncome {
  id: number;
  user_id: number;
  gross_pay: number;
  net_pay: number;
  deductions: number;
  month: number;
  year: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeSummary {
  month: number;
  year: number;
  gross_pay: number;
  net_pay: number;
  deductions: number;
  savings_potential: number; // net_pay (available for budget)
}

export class IncomeService {
  static async createIncome(
    userId: number,
    grossPay: number,
    netPay: number,
    deductions: number,
    month: number,
    year: number,
    notes?: string
  ): Promise<UserIncome> {
    try {
      console.log('[Income] Creating income entry:', { userId, grossPay, netPay, deductions, month, year });

      const result = await query(
        `INSERT INTO user_income (user_id, gross_pay, net_pay, deductions, month, year, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, grossPay, netPay, deductions, month, year, notes || null]
      );

      console.log('[Income] Income entry created:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('[Income] Error creating income entry:', error);
      throw error;
    }
  }

  static async getIncome(
    userId: number,
    incomeId: number
  ): Promise<UserIncome | null> {
    try {
      const result = await query(
        `SELECT * FROM user_income
         WHERE id = $1 AND user_id = $2`,
        [incomeId, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('[Income] Error getting income entry:', error);
      throw error;
    }
  }

  static async getIncomeByMonth(
    userId: number,
    month: number,
    year: number
  ): Promise<UserIncome | null> {
    try {
      const result = await query(
        `SELECT * FROM user_income
         WHERE user_id = $1 AND month = $2 AND year = $3`,
        [userId, month, year]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('[Income] Error getting income by month:', error);
      throw error;
    }
  }

  static async getAllIncomeEntries(userId: number): Promise<UserIncome[]> {
    try {
      const result = await query(
        `SELECT * FROM user_income
         WHERE user_id = $1
         ORDER BY year DESC, month DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('[Income] Error getting all income entries:', error);
      throw error;
    }
  }

  static async getIncomeForYear(userId: number, year: number): Promise<UserIncome[]> {
    try {
      const result = await query(
        `SELECT * FROM user_income
         WHERE user_id = $1 AND year = $2
         ORDER BY month ASC`,
        [userId, year]
      );

      return result.rows;
    } catch (error) {
      console.error('[Income] Error getting income for year:', error);
      throw error;
    }
  }

  static async updateIncome(
    userId: number,
    incomeId: number,
    updates: Partial<{
      gross_pay: number;
      net_pay: number;
      deductions: number;
      notes: string;
    }>
  ): Promise<UserIncome> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.gross_pay !== undefined) {
        fields.push(`gross_pay = $${paramIndex++}`);
        values.push(updates.gross_pay);
      }
      if (updates.net_pay !== undefined) {
        fields.push(`net_pay = $${paramIndex++}`);
        values.push(updates.net_pay);
      }
      if (updates.deductions !== undefined) {
        fields.push(`deductions = $${paramIndex++}`);
        values.push(updates.deductions);
      }
      if (updates.notes !== undefined) {
        fields.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
      }

      if (fields.length === 0) {
        const income = await this.getIncome(userId, incomeId);
        if (!income) throw new Error('Income entry not found');
        return income;
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(incomeId);
      values.push(userId);

      const result = await query(
        `UPDATE user_income
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Income entry not found or unauthorized');
      }

      return result.rows[0];
    } catch (error) {
      console.error('[Income] Error updating income entry:', error);
      throw error;
    }
  }

  static async deleteIncome(userId: number, incomeId: number): Promise<boolean> {
    try {
      const result = await query(
        `DELETE FROM user_income
         WHERE id = $1 AND user_id = $2`,
        [incomeId, userId]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('[Income] Error deleting income entry:', error);
      throw error;
    }
  }

  static async getCurrentMonthIncome(userId: number): Promise<UserIncome | null> {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      return this.getIncomeByMonth(userId, month, year);
    } catch (error) {
      console.error('[Income] Error getting current month income:', error);
      throw error;
    }
  }

  static calculateSavingsPotential(netPay: number): number {
    return netPay; // Net pay is the available amount for budget
  }
}
