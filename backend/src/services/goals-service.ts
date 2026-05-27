import { query } from '../config/database';

export interface Goal {
  id: number;
  name: string;
  description: string | null;
  goal_type: 'savings' | 'debt-payoff' | 'expense-reduction' | 'investment';
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  categoryName?: string;
  is_active: boolean;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  id: number;
  goal_id: number;
  amount: number;
  progress_date: string;
  notes: string | null;
  created_at: string;
}

export interface GoalSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overallProgress: number;
  totalTargeted: number;
  totalProgress: number;
  goals: Goal[];
}

export class GoalsService {
  static async createGoal(
    userId: number,
    name: string,
    goalType: 'savings' | 'debt-payoff' | 'expense-reduction' | 'investment',
    targetAmount: number,
    targetDate?: string,
    categoryId?: number,
    description?: string
  ): Promise<Goal> {
    try {
      const result = await query(
        `INSERT INTO goals (user_id, name, description, goal_type, target_amount, target_date, category_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         RETURNING *`,
        [userId, name, description || null, goalType, targetAmount, targetDate || null, categoryId || null]
      );

      return result.rows[0];
    } catch (error) {
      console.error('[Goals] Error creating goal:', error);
      throw error;
    }
  }

  static async getGoal(userId: number, goalId: number): Promise<Goal | null> {
    try {
      const result = await query(
        `SELECT g.*, c.name as categoryName
         FROM goals g
         LEFT JOIN categories c ON g.category_id = c.id
         WHERE g.id = $1 AND g.user_id = $2`,
        [goalId, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('[Goals] Error getting goal:', error);
      throw error;
    }
  }

  static async getGoals(userId: number, activeOnly: boolean = false): Promise<Goal[]> {
    try {
      const whereClause = activeOnly ? 'AND g.is_active = TRUE' : '';
      const result = await query(
        `SELECT g.*, c.name as categoryName
         FROM goals g
         LEFT JOIN categories c ON g.category_id = c.id
         WHERE g.user_id = $1 ${whereClause}
         ORDER BY g.target_date ASC, g.created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('[Goals] Error getting goals:', error);
      throw error;
    }
  }

  static async updateGoal(
    userId: number,
    goalId: number,
    updates: Partial<{
      name: string;
      description: string;
      goal_type: string;
      target_amount: number;
      target_date: string;
      category_id: number;
      is_active: boolean;
    }>
  ): Promise<Goal> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name) {
        fields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }
      if (updates.goal_type) {
        fields.push(`goal_type = $${paramIndex++}`);
        values.push(updates.goal_type);
      }
      if (updates.target_amount !== undefined) {
        fields.push(`target_amount = $${paramIndex++}`);
        values.push(updates.target_amount);
      }
      if (updates.target_date !== undefined) {
        fields.push(`target_date = $${paramIndex++}`);
        values.push(updates.target_date);
      }
      if (updates.category_id !== undefined) {
        fields.push(`category_id = $${paramIndex++}`);
        values.push(updates.category_id);
      }
      if (updates.is_active !== undefined) {
        fields.push(`is_active = $${paramIndex++}`);
        values.push(updates.is_active);
      }

      if (fields.length === 0) {
        const goal = await this.getGoal(userId, goalId);
        if (!goal) throw new Error('Goal not found');
        return goal;
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(goalId);
      values.push(userId);

      const result = await query(
        `UPDATE goals
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      console.error('[Goals] Error updating goal:', error);
      throw error;
    }
  }

  static async addProgress(userId: number, goalId: number, amount: number, notes?: string): Promise<GoalProgress> {
    try {
      const goal = await this.getGoal(userId, goalId);
      if (!goal) {
        throw new Error('Goal not found');
      }

      const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);
      const progressPercentage = (newAmount / goal.target_amount) * 100;

      await query(
        `UPDATE goals
         SET current_amount = $1, progress_percentage = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newAmount, progressPercentage, goalId]
      );

      const progressResult = await query(
        `INSERT INTO goal_progress (goal_id, amount, progress_date, notes)
         VALUES ($1, $2, CURRENT_DATE, $3)
         RETURNING *`,
        [goalId, amount, notes || null]
      );

      return progressResult.rows[0];
    } catch (error) {
      console.error('[Goals] Error adding progress:', error);
      throw error;
    }
  }

  static async getGoalProgress(userId: number, goalId: number, limit: number = 30): Promise<GoalProgress[]> {
    try {
      const result = await query(
        `SELECT gp.* FROM goal_progress gp
         JOIN goals g ON gp.goal_id = g.id
         WHERE g.user_id = $1 AND gp.goal_id = $2
         ORDER BY gp.progress_date DESC
         LIMIT $3`,
        [userId, goalId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('[Goals] Error getting goal progress:', error);
      throw error;
    }
  }

  static async getGoalSummary(userId: number): Promise<GoalSummary> {
    try {
      const goals = await this.getGoals(userId);

      const totalGoals = goals.length;
      const activeGoals = goals.filter((g) => g.is_active).length;
      const completedGoals = goals.filter((g) => g.progress_percentage >= 100).length;

      let totalTargeted = 0;
      let totalProgress = 0;

      for (const goal of goals) {
        totalTargeted += goal.target_amount;
        totalProgress += goal.current_amount;
      }

      const overallProgress = totalTargeted > 0 ? (totalProgress / totalTargeted) * 100 : 0;

      return {
        totalGoals,
        activeGoals,
        completedGoals,
        overallProgress: Math.min(overallProgress, 100),
        totalTargeted,
        totalProgress,
        goals,
      };
    } catch (error) {
      console.error('[Goals] Error getting goal summary:', error);
      throw error;
    }
  }

  static async deleteGoal(userId: number, goalId: number): Promise<boolean> {
    try {
      const result = await query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [goalId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('[Goals] Error deleting goal:', error);
      throw error;
    }
  }

  static async checkGoalAlerts(userId: number): Promise<{ goalId: number; name: string; alert: string }[]> {
    try {
      const goals = await this.getGoals(userId, true);
      const alerts: { goalId: number; name: string; alert: string }[] = [];

      const today = new Date();

      for (const goal of goals) {
        if (goal.target_date) {
          const targetDate = new Date(goal.target_date);
          const daysUntilTarget = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilTarget <= 30 && daysUntilTarget > 0) {
            const progressNeeded = 100 - goal.progress_percentage;
            alerts.push({
              goalId: goal.id,
              name: goal.name,
              alert: `${progressNeeded.toFixed(1)}% remaining with ${daysUntilTarget} days left`,
            });
          } else if (daysUntilTarget <= 0) {
            alerts.push({
              goalId: goal.id,
              name: goal.name,
              alert: goal.progress_percentage >= 100 ? 'Goal completed!' : 'Target date passed',
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error('[Goals] Error checking goal alerts:', error);
      throw error;
    }
  }
}
