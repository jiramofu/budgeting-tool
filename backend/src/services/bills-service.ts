import { query } from '../config/database';

export interface Bill {
  id: number;
  name: string;
  amount: number;
  category_id: number | null;
  categoryName?: string;
  due_date_day: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  is_paid: boolean;
  last_paid_date: string | null;
  next_due_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillSummary {
  totalUpcoming: number;
  billsDueThisMonth: number;
  overdueBills: number;
  bills: Bill[];
}

export class BillsService {
  static async createBill(
    userId: number,
    name: string,
    amount: number,
    dueDateDay: number,
    frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time',
    categoryId?: number,
    notes?: string
  ): Promise<Bill> {
    try {
      const nextDueDate = this.calculateNextDueDate(dueDateDay, frequency);

      const result = await query(
        `INSERT INTO bills (user_id, name, amount, category_id, due_date_day, frequency, next_due_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, name, amount, categoryId || null, dueDateDay, frequency, nextDueDate, notes || null]
      );

      return result.rows[0];
    } catch (error) {
      console.error('[Bills] Error creating bill:', error);
      throw error;
    }
  }

  static async getBill(userId: number, billId: number): Promise<Bill | null> {
    try {
      const result = await query(
        `SELECT b.*, c.name as categoryName
         FROM bills b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.id = $1 AND b.user_id = $2`,
        [billId, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('[Bills] Error getting bill:', error);
      throw error;
    }
  }

  static async getBills(userId: number): Promise<Bill[]> {
    try {
      const result = await query(
        `SELECT b.*, c.name as categoryName
         FROM bills b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.user_id = $1
         ORDER BY b.next_due_date ASC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('[Bills] Error getting bills:', error);
      throw error;
    }
  }

  static async getUpcomingBills(userId: number, daysAhead: number = 30): Promise<Bill[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const result = await query(
        `SELECT b.*, c.name as categoryName
         FROM bills b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.user_id = $1
         AND b.next_due_date <= $2
         AND b.next_due_date >= CURRENT_DATE
         ORDER BY b.next_due_date ASC`,
        [userId, futureDate.toISOString().split('T')[0]]
      );

      return result.rows;
    } catch (error) {
      console.error('[Bills] Error getting upcoming bills:', error);
      throw error;
    }
  }

  static async getBillSummary(userId: number): Promise<BillSummary> {
    try {
      const bills = await this.getBills(userId);

      const today = new Date();
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      let totalUpcoming = 0;
      let billsDueThisMonth = 0;
      let overdueBills = 0;

      for (const bill of bills) {
        if (bill.next_due_date) {
          const dueDate = new Date(bill.next_due_date);
          totalUpcoming += bill.amount;

          if (dueDate <= monthEnd && dueDate >= today) {
            billsDueThisMonth += bill.amount;
          } else if (dueDate < today) {
            overdueBills += 1;
          }
        }
      }

      return {
        totalUpcoming,
        billsDueThisMonth,
        overdueBills,
        bills,
      };
    } catch (error) {
      console.error('[Bills] Error getting bill summary:', error);
      throw error;
    }
  }

  static async markBillAsPaid(userId: number, billId: number): Promise<Bill> {
    try {
      const bill = await this.getBill(userId, billId);
      if (!bill) {
        throw new Error('Bill not found');
      }

      const nextDueDate = this.calculateNextDueDate(bill.due_date_day, bill.frequency);

      const result = await query(
        `UPDATE bills
         SET is_paid = TRUE, last_paid_date = CURRENT_DATE, next_due_date = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [nextDueDate, billId, userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('[Bills] Error marking bill as paid:', error);
      throw error;
    }
  }

  static async updateBill(
    userId: number,
    billId: number,
    updates: Partial<{
      name: string;
      amount: number;
      due_date_day: number;
      frequency: string;
      category_id: number | null;
      notes: string;
    }>
  ): Promise<Bill> {
    try {
      const bill = await this.getBill(userId, billId);
      if (!bill) {
        throw new Error('Bill not found');
      }

      const dueDateDay = updates.due_date_day || bill.due_date_day;
      const frequency = updates.frequency || bill.frequency;
      const nextDueDate = this.calculateNextDueDate(dueDateDay, frequency as any);

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name) {
        fields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.amount !== undefined) {
        fields.push(`amount = $${paramIndex++}`);
        values.push(updates.amount);
      }
      if (updates.due_date_day !== undefined) {
        fields.push(`due_date_day = $${paramIndex++}`);
        values.push(updates.due_date_day);
      }
      if (updates.frequency) {
        fields.push(`frequency = $${paramIndex++}`);
        values.push(updates.frequency);
      }
      if (updates.category_id !== undefined) {
        fields.push(`category_id = $${paramIndex++}`);
        values.push(updates.category_id);
      }
      if (updates.notes !== undefined) {
        fields.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
      }

      fields.push(`next_due_date = $${paramIndex++}`);
      values.push(nextDueDate);

      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(billId);
      values.push(userId);

      const result = await query(
        `UPDATE bills
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      console.error('[Bills] Error updating bill:', error);
      throw error;
    }
  }

  static async deleteBill(userId: number, billId: number): Promise<boolean> {
    try {
      const result = await query('DELETE FROM bills WHERE id = $1 AND user_id = $2', [billId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('[Bills] Error deleting bill:', error);
      throw error;
    }
  }

  static async createTransactionFromBill(userId: number, billId: number): Promise<void> {
    try {
      const bill = await this.getBill(userId, billId);
      if (!bill) {
        throw new Error('Bill not found');
      }

      await query(
        `INSERT INTO transactions (user_id, category_id, amount, description, transaction_date, transaction_type, source)
         VALUES ($1, $2, $3, $4, $5, 'expense', 'manual')`,
        [userId, bill.category_id, bill.amount, `Bill: ${bill.name}`, new Date().toISOString().split('T')[0]]
      );

      await this.markBillAsPaid(userId, billId);
    } catch (error) {
      console.error('[Bills] Error creating transaction from bill:', error);
      throw error;
    }
  }

  private static calculateNextDueDate(dueDateDay: number, frequency: string): string {
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), today.getMonth(), dueDateDay);

    if (nextDate <= today) {
      if (frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (frequency === 'quarterly') {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else if (frequency === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }

    return nextDate.toISOString().split('T')[0];
  }
}
