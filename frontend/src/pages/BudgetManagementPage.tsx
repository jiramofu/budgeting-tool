import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { formatCurrency } from '../utils/currencyFormatter';
import { useUserSettings } from '../hooks/useUserSettings';
import {
  BudgetBar,
  BudgetInput,
  BudgetCategoryTree,
  MonthlyHistory,
} from '../components/budget';
import { AlertCircle, TrendingDown, Calendar } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon?: string;
  spent: number;
  budget: number;
  children?: Category[];
}

interface BudgetMetrics {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
  categoriesOverBudget: number;
}

const BudgetManagementPage: React.FC = () => {
  const { currency } = useUserSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [metrics, setMetrics] = useState<BudgetMetrics>({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    percentageUsed: 0,
    categoriesOverBudget: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadBudgetData();
  }, [selectedMonth, selectedYear]);

  const loadBudgetData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch categories and budget data
      const categoriesRes = await apiClient.get('/categories');
      const budgetsRes = await apiClient.get('/budgets');

      // Mock data - in production this would come from the API
      const mockCategories: Category[] = [
        {
          id: 1,
          name: 'Housing',
          icon: '🏠',
          budget: 1500,
          spent: 1500,
          children: [
            { id: 11, name: 'Rent', icon: '🔑', budget: 1200, spent: 1200 },
            { id: 12, name: 'Utilities', icon: '💡', budget: 300, spent: 280 },
          ],
        },
        {
          id: 2,
          name: 'Groceries',
          icon: '🛒',
          budget: 400,
          spent: 385,
        },
        {
          id: 3,
          name: 'Transportation',
          icon: '🚗',
          budget: 300,
          spent: 320,
          children: [
            { id: 31, name: 'Gas', icon: '⛽', budget: 200, spent: 220 },
            { id: 32, name: 'Parking', icon: '🅿️', budget: 100, spent: 100 },
          ],
        },
        {
          id: 4,
          name: 'Entertainment',
          icon: '🎬',
          budget: 250,
          spent: 180,
        },
        {
          id: 5,
          name: 'Dining',
          icon: '🍽️',
          budget: 300,
          spent: 445,
        },
        {
          id: 6,
          name: 'Personal',
          icon: '💄',
          budget: 150,
          spent: 92,
        },
      ];

      setCategories(mockCategories);
      calculateMetrics(mockCategories);
    } catch (err: any) {
      console.error('Failed to load budget data:', err);
      setError('Failed to load budget data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (cats: Category[]) => {
    let totalBudget = 0;
    let totalSpent = 0;
    let categoriesOverBudget = 0;

    const calculateCategory = (category: Category) => {
      totalBudget += category.budget;
      totalSpent += category.spent;

      if (category.spent > category.budget) {
        categoriesOverBudget += 1;
      }

      if (category.children) {
        category.children.forEach(calculateCategory);
      }
    };

    cats.forEach(calculateCategory);

    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    setMetrics({
      totalBudget,
      totalSpent,
      totalRemaining,
      percentageUsed: Math.round(percentageUsed),
      categoriesOverBudget,
    });
  };

  const handleBudgetUpdate = async (categoryId: number, amount: number) => {
    try {
      // In production: await apiClient.patch(`/categories/${categoryId}`, { budget: amount });
      console.log(`Updated category ${categoryId} budget to ${amount}`);
      loadBudgetData();
    } catch (err) {
      throw new Error('Failed to update budget');
    }
  };

  const formatMonth = (month: number, year: number) => {
    return new Date(year, month - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getProgressColor = () => {
    if (metrics.percentageUsed >= 100) return 'bg-red-600';
    if (metrics.percentageUsed >= 80) return 'bg-amber-600';
    return 'bg-emerald-600';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-48"></div>
          <div className="h-32 bg-slate-700 rounded"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-50 mb-1">Budget Management</h1>
        <p className="text-slate-400">{formatMonth(selectedMonth, selectedYear)}</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overall Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Budget */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
          <p className="text-slate-400 text-sm font-medium mb-2">Total Budget</p>
          <p className="text-3xl font-bold text-slate-50 mb-1">
            {formatCurrency(metrics.totalBudget, currency)}
          </p>
          <p className="text-xs text-slate-500">All categories</p>
        </div>

        {/* Total Spent */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
          <p className="text-slate-400 text-sm font-medium mb-2">Total Spent</p>
          <p className="text-3xl font-bold text-slate-50 mb-1">
            {formatCurrency(metrics.totalSpent, currency)}
          </p>
          <p className="text-xs text-slate-500">{metrics.percentageUsed}% used</p>
        </div>

        {/* Remaining */}
        <div className={`rounded-lg border p-6 backdrop-blur-sm ${
          metrics.totalRemaining > 0
            ? 'bg-emerald-900/20 border-emerald-700/50'
            : 'bg-red-900/20 border-red-700/50'
        }`}>
          <p className={`text-sm font-medium mb-2 ${
            metrics.totalRemaining > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            Remaining
          </p>
          <p className={`text-3xl font-bold mb-1 ${
            metrics.totalRemaining > 0 ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {formatCurrency(metrics.totalRemaining, currency)}
          </p>
          <p className="text-xs text-slate-500">
            {metrics.totalRemaining > 0 ? 'Under budget' : 'Over budget'}
          </p>
        </div>

        {/* Categories Over Budget */}
        {metrics.categoriesOverBudget > 0 && (
          <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-6 backdrop-blur-sm">
            <p className="text-red-400 text-sm font-medium mb-2">Over Budget</p>
            <p className="text-3xl font-bold text-red-300 mb-1">
              {metrics.categoriesOverBudget}
            </p>
            <p className="text-xs text-slate-500">
              {metrics.categoriesOverBudget === 1 ? 'category' : 'categories'}
            </p>
          </div>
        )}
      </div>

      {/* Budget Progress Bar */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Overall Budget Progress</span>
          <span className="text-sm font-semibold text-slate-50">{metrics.percentageUsed}%</span>
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${Math.min(metrics.percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Category Tree and History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Budget Categories */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-50 mb-2">Categories</h2>
            <p className="text-slate-400 text-sm">Manage budgets by category</p>
          </div>
          <BudgetCategoryTree
            categories={categories}
            onBudgetUpdate={handleBudgetUpdate}
            isLoading={isLoading}
          />
        </div>

        {/* Monthly History */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-50 mb-2">History</h2>
            <p className="text-slate-400 text-sm">6-month trend</p>
          </div>
          <MonthlyHistory categoryName="Overall" months={6} />
        </div>
      </div>

      {/* Tips and Recommendations */}
      {metrics.categoriesOverBudget > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-amber-300 mb-2">Budget Alert</h3>
              <p className="text-amber-200 text-sm mb-3">
                You have {metrics.categoriesOverBudget} {metrics.categoriesOverBudget === 1 ? 'category' : 'categories'} over budget this month. Consider adjusting your spending or increasing the budget limits.
              </p>
              <ul className="text-sm text-amber-200 space-y-1 ml-4">
                <li>• Review spending in over-budget categories</li>
                <li>• Adjust budget limits if needed</li>
                <li>• Set spending alerts in app settings</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagementPage;
