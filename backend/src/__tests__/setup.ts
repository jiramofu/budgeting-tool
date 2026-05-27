import { pool } from "../config/database";

export const setupTestDB = async () => {
  try {
    const client = await pool.connect();
    
    await client.query("BEGIN");
    
    const tables = [
      "notifications",
      "household_budgets",
      "household_invitations",
      "household_members",
      "households",
      "budget_rules",
      "financial_snapshots",
      "subscriptions",
      "investments",
      "user_settings",
      "bank_connections",
      "budget_targets",
      "transactions",
      "budgets",
      "categories",
      "users",
    ];
    
    for (const table of tables) {
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
    
    await client.query("COMMIT");
    client.release();
  } catch (error) {
    console.error("Error setting up test database:", error);
    throw error;
  }
};

export const teardownTestDB = async () => {
  await pool.end();
};

export const createTestUser = async (
  email: string = "test@example.com",
  password: string = "password123"
) => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, created_at)
     VALUES ($1, $2, NOW())
     RETURNING id, email`,
    [email, password]
  );
  return result.rows[0];
};

export const createTestBudget = async (
  userId: number,
  month: number = 5,
  year: number = 2026
) => {
  const result = await pool.query(
    `INSERT INTO budgets (user_id, month, year, total_budgeted, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id`,
    [userId, month, year, 5000]
  );
  return result.rows[0];
};

export const createTestCategory = async (
  userId: number,
  name: string = "Groceries"
) => {
  const result = await pool.query(
    `INSERT INTO categories (user_id, name, type, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING id`,
    [userId, name, "variable"]
  );
  return result.rows[0];
};

export const createTestTransaction = async (
  userId: number,
  categoryId: number,
  amount: number = -50,
  description: string = "Test transaction"
) => {
  const result = await pool.query(
    `INSERT INTO transactions (user_id, date, amount, description, category_id, source, created_at)
     VALUES ($1, NOW(), $2, $3, $4, $5, NOW())
     RETURNING id`,
    [userId, amount, description, categoryId, "manual"]
  );
  return result.rows[0];
};
