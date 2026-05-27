import { pool } from "../config/database";

interface HouseholdInvitation {
  id: number;
  household_id: number;
  email: string;
  status: string;
  created_at: string;
}

interface HouseholdMember {
  id: number;
  email: string;
  role: string;
  joined_at: string;
}

class HouseholdService {
  static async createHousehold(
    userId: number,
    householdName: string,
    currency: string = "USD"
  ): Promise<number> {
    try {
      const result = await pool.query(
        `INSERT INTO households (name, currency, owner_id, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id`,
        [householdName, currency, userId]
      );

      const householdId = result.rows[0].id;

      await pool.query(
        `INSERT INTO household_members (household_id, user_id, role, joined_at)
         VALUES ($1, $2, $3, NOW())`,
        [householdId, userId, "owner"]
      );

      return householdId;
    } catch (error) {
      console.error("Error creating household:", error);
      throw new Error("Failed to create household");
    }
  }

  static async inviteUserToHousehold(
    householdId: number,
    email: string,
    invitedBy: number
  ): Promise<number> {
    try {
      const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      }

      const invitedUserId = userResult.rows[0].id;

      const existingResult = await pool.query(
        "SELECT id FROM household_members WHERE household_id = $1 AND user_id = $2",
        [householdId, invitedUserId]
      );

      if (existingResult.rows.length > 0) {
        throw new Error("User is already a member of this household");
      }

      const result = await pool.query(
        `INSERT INTO household_invitations (household_id, user_id, email, status, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [householdId, invitedUserId, email, "pending", invitedBy]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error("Error inviting user to household:", error);
      throw error;
    }
  }

  static async acceptInvitation(invitationId: number): Promise<void> {
    try {
      const result = await pool.query(
        "SELECT household_id, user_id FROM household_invitations WHERE id = $1",
        [invitationId]
      );

      if (result.rows.length === 0) {
        throw new Error("Invitation not found");
      }

      const { household_id, user_id } = result.rows[0];

      await pool.query(
        `INSERT INTO household_members (household_id, user_id, role, joined_at)
         VALUES ($1, $2, $3, NOW())`,
        [household_id, user_id, "member"]
      );

      await pool.query("UPDATE household_invitations SET status = $1 WHERE id = $2", ["accepted", invitationId]);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  }

  static async getHouseholdMembers(householdId: number): Promise<HouseholdMember[]> {
    try {
      const result = await pool.query(
        `SELECT hm.user_id as id, u.email, hm.role, hm.joined_at
         FROM household_members hm
         JOIN users u ON hm.user_id = u.id
         WHERE hm.household_id = $1
         ORDER BY hm.joined_at DESC`,
        [householdId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching household members:", error);
      throw error;
    }
  }

  static async getHouseholdInvitations(householdId: number): Promise<HouseholdInvitation[]> {
    try {
      const result = await pool.query(
        `SELECT id, household_id, email, status, created_at
         FROM household_invitations
         WHERE household_id = $1 AND status = $2
         ORDER BY created_at DESC`,
        [householdId, "pending"]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching invitations:", error);
      throw error;
    }
  }

  static async getUserHouseholds(userId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT h.id, h.name, h.currency, h.owner_id, hm.role
         FROM households h
         JOIN household_members hm ON h.id = hm.household_id
         WHERE hm.user_id = $1
         ORDER BY h.created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching user households:", error);
      throw error;
    }
  }

  static async removeMember(householdId: number, userId: number, removedBy: number): Promise<void> {
    try {
      const household = await pool.query("SELECT owner_id FROM households WHERE id = $1", [householdId]);

      if (household.rows.length === 0) {
        throw new Error("Household not found");
      }

      if (household.rows[0].owner_id !== removedBy) {
        throw new Error("Only household owner can remove members");
      }

      if (household.rows[0].owner_id === userId) {
        throw new Error("Cannot remove household owner");
      }

      await pool.query(
        "DELETE FROM household_members WHERE household_id = $1 AND user_id = $2",
        [householdId, userId]
      );
    } catch (error) {
      console.error("Error removing member:", error);
      throw error;
    }
  }

  static async shareHouseholdBudget(
    householdId: number,
    budgetId: number,
    shared: boolean
  ): Promise<void> {
    try {
      await pool.query(
        "UPDATE household_budgets SET is_shared = $1 WHERE household_id = $2 AND budget_id = $3",
        [shared, householdId, budgetId]
      );
    } catch (error) {
      console.error("Error sharing budget:", error);
      throw error;
    }
  }

  static async getHouseholdBudgets(householdId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT b.id, b.month, b.year, b.total_budgeted, u.email as created_by
         FROM household_budgets hb
         JOIN budgets b ON hb.budget_id = b.id
         JOIN users u ON b.user_id = u.id
         WHERE hb.household_id = $1 AND hb.is_shared = true
         ORDER BY b.year DESC, b.month DESC`,
        [householdId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching household budgets:", error);
      throw error;
    }
  }

  static async getHouseholdSpendingSummary(
    householdId: number,
    month: number,
    year: number
  ): Promise<any> {
    try {
      const membersResult = await pool.query(
        "SELECT user_id FROM household_members WHERE household_id = $1",
        [householdId]
      );

      const memberIds = membersResult.rows.map((r) => r.user_id);

      if (memberIds.length === 0) {
        return null;
      }

      const result = await pool.query(
        `SELECT 
          u.email,
          SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as spent,
          SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
          COUNT(*) as transaction_count
         FROM transactions t
         JOIN users u ON t.user_id = u.id
         WHERE t.user_id = ANY($1)
         AND EXTRACT(MONTH FROM t.date) = $2
         AND EXTRACT(YEAR FROM t.date) = $3
         GROUP BY u.id, u.email`,
        [memberIds, month, year]
      );

      return {
        month,
        year,
        members: result.rows,
        totalSpent: result.rows.reduce((sum, r) => sum + (r.spent || 0), 0),
        totalIncome: result.rows.reduce((sum, r) => sum + (r.income || 0), 0),
      };
    } catch (error) {
      console.error("Error fetching household spending summary:", error);
      throw error;
    }
  }
}

export default HouseholdService;
