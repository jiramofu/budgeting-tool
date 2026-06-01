import React, { createContext, useContext, ReactNode } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Category {
  id: number;
  name: string;
  icon?: string;
  spent: number;
  budget: number;
  children?: Category[];
}

export interface BudgetMetrics {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
  categoriesOverBudget: number;
}

export interface IncomeData {
  id?: number;
  budgetId: number;
  grossAmount: number;
  netAmount: number;
  taxesDeductions?: number;
  titheAmount?: number;
  availableForBudget?: number;
  tithePercentage?: number;
}

export interface BudgetContextType {
  // Current Budget Selection
  currentBudgetId: number | null;
  currentBudgetMonth: number;
  currentBudgetYear: number;

  // Income Data
  incomeData: IncomeData | null;

  // Categories & Budget Data
  categories: Category[];
  metrics: BudgetMetrics;

  // Loading & Error States
  isLoading: boolean;
  error: string;

  // Action Dispatchers
  setBudgetId: (budgetId: number | null) => void;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  setIncomeData: (income: IncomeData | null) => void;
  setCategories: (categories: Category[]) => void;
  setMetrics: (metrics: BudgetMetrics) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;

  // Compound Actions
  updateCategory: (categoryId: number, category: Partial<Category>) => void;
  addCategory: (category: Category) => void;
  refreshBudgetData: () => Promise<void>;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentBudgetId, setCurrentBudgetId] = React.useState<number | null>(null);
  const [currentBudgetMonth, setCurrentBudgetMonth] = React.useState(new Date().getMonth() + 1);
  const [currentBudgetYear, setCurrentBudgetYear] = React.useState(new Date().getFullYear());
  const [incomeData, setIncomeData] = React.useState<IncomeData | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [metrics, setMetrics] = React.useState<BudgetMetrics>({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    percentageUsed: 0,
    categoriesOverBudget: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const setCurrentMonth = (month: number) => setCurrentBudgetMonth(month);
  const setCurrentYear = (year: number) => setCurrentBudgetYear(year);

  const clearError = () => setError('');

  const updateCategory = (categoryId: number, updates: Partial<Category>) => {
    setCategories(cats =>
      cats.map(cat => cat.id === categoryId ? { ...cat, ...updates } : cat)
    );
  };

  const addCategory = (category: Category) => {
    setCategories(cats => [...cats, category]);
  };

  const refreshBudgetData = async () => {
    // This will be called from pages, but they'll handle the actual API calls
    // The context just manages state - the pages dispatch actions to it
  };

  const value: BudgetContextType = {
    currentBudgetId,
    currentBudgetMonth,
    currentBudgetYear,
    incomeData,
    categories,
    metrics,
    isLoading,
    error,
    setBudgetId: setCurrentBudgetId,
    setCurrentMonth,
    setCurrentYear,
    setIncomeData,
    setCategories,
    setMetrics,
    setIsLoading,
    setError,
    clearError,
    updateCategory,
    addCategory,
    refreshBudgetData,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useBudgetContext = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgetContext must be used within a BudgetProvider');
  }
  return context;
};
