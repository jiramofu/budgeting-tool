export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_name: string;
  category_id: number;
}

export interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  target_amount: number;
  spent: number;
  percentage: number;
}

export interface Category {
  id: number;
  name: string;
  color?: string;
  icon?: string;
}

export interface BudgetSummary {
  total_budgeted: number;
  total_spent: number;
  categories_count: number;
  health_score: number;
  categories: Budget[];
}

export interface UserSettings {
  theme: 'light' | 'dark';
  currency: string;
  dateFormat: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
}

// Navigation param lists
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Budgets: undefined;
  Transactions: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  AddTransaction: { onSuccess?: () => void } | undefined;
  AddBudget: { onSuccess?: () => void } | undefined;
};
