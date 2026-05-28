// Mock database for testing (PostgreSQL not available in test environment)
const mockDatabase: Record<string, any[]> = {
  users: [],
  budgets: [],
  categories: [],
  transactions: [],
  households: [],
  household_members: [],
  household_invitations: [],
  budget_targets: [],
  bank_connections: [],
  user_settings: [],
  investments: [],
  subscriptions: [],
  financial_snapshots: [],
  budget_rules: [],
  notifications: [],
};

let nextIds: Record<string, number> = {
  users: 1,
  budgets: 1,
  categories: 1,
  transactions: 1,
  households: 1,
};

export const setupTestDB = async () => {
  // Reset mock database
  Object.keys(mockDatabase).forEach(key => {
    mockDatabase[key] = [];
  });
  Object.keys(nextIds).forEach(key => {
    nextIds[key] = 1;
  });
};

export const teardownTestDB = async () => {
  // Cleanup mock database
  Object.keys(mockDatabase).forEach(key => {
    mockDatabase[key] = [];
  });
};

export const createTestUser = async (
  email: string = "test@example.com",
  password: string = "password123"
) => {
  const id = nextIds.users++;
  const user = {
    id,
    email,
    password_hash: password,
    created_at: new Date(),
    updated_at: new Date(),
  };
  mockDatabase.users.push(user);
  return { id, email };
};

export const createTestBudget = async (
  userId: number,
  month: number = 5,
  year: number = 2026
) => {
  const id = nextIds.budgets++;
  const budget = {
    id,
    user_id: userId,
    month,
    year,
    total_budgeted: 5000,
    created_at: new Date(),
    updated_at: new Date(),
  };
  mockDatabase.budgets.push(budget);
  return { id };
};

export const createTestCategory = async (
  userId: number,
  name: string = "Groceries"
) => {
  const id = nextIds.categories++;
  const category = {
    id,
    user_id: userId,
    name,
    type: "variable",
    created_at: new Date(),
    updated_at: new Date(),
  };
  mockDatabase.categories.push(category);
  return { id };
};

export const createTestTransaction = async (
  userId: number,
  categoryId: number,
  amount: number = -50,
  description: string = "Test transaction"
) => {
  const id = nextIds.transactions++;
  const transaction = {
    id,
    user_id: userId,
    date: new Date(),
    amount,
    description,
    category_id: categoryId,
    source: "manual",
    created_at: new Date(),
    updated_at: new Date(),
  };
  mockDatabase.transactions.push(transaction);
  return { id };
};
