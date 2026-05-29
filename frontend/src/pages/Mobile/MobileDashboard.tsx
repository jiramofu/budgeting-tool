/**
 * Mobile Dashboard Page
 * Optimized dashboard layout for mobile devices (375px width)
 * Fetches real data from the backend API
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BudgetProgressChart } from '../../components/Charts/BudgetProgressChart';
import { CategoryBreakdownChart } from '../../components/Charts/CategoryBreakdownChart';
import {
  FoodIcon,
  TransportationIcon,
  UtilitiesIcon,
  EntertainmentIcon,
  ShoppingIcon,
} from '../../assets/icons/categories';
import { MobileHeader } from '../../components/Mobile/MobileHeader';
import { MobileNavigation } from '../../components/Mobile/MobileNavigation';
import { useCurrency } from '../../context/CurrencyContext';
import { apiClient } from '../../services/api';

// Category to Icon mapping
const getCategoryIcon = (
  categoryName: string
): React.ComponentType<{ size?: number; color?: string }> => {
  const name = categoryName.toLowerCase();

  if (name.includes('food') || name.includes('grocery') || name.includes('restaurant') || name.includes('dining')) {
    return FoodIcon;
  }
  if (name.includes('transport') || name.includes('gas') || name.includes('car') || name.includes('taxi') || name.includes('uber')) {
    return TransportationIcon;
  }
  if (name.includes('utility') || name.includes('electric') || name.includes('water') || name.includes('internet') || name.includes('phone')) {
    return UtilitiesIcon;
  }
  if (name.includes('entertainment') || name.includes('movie') || name.includes('gaming') || name.includes('music') || name.includes('concert')) {
    return EntertainmentIcon;
  }
  if (name.includes('shopping') || name.includes('clothes') || name.includes('retail') || name.includes('store')) {
    return ShoppingIcon;
  }

  // Default to Shopping for general categories
  return ShoppingIcon;
};

/**
 * Stat Card for mobile - compact version
 */
const StatCard: React.FC<{
  label: string;
  value: string;
  change?: number;
}> = ({ label, value, change }) => (
  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700/50">
    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{label}</p>
    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    {change !== undefined && (
      <p
        className={`text-xs mt-1 font-semibold ${
          change >= 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
        }`}
      >
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
      </p>
    )}
  </div>
);

interface MobileDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  activeTab = 'dashboard',
  onTabChange,
}) => {
  const location = useLocation();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);

  // Use activeTab from props if provided, otherwise determine from URL
  const currentTab = activeTab === 'dashboard' && location.pathname.includes('/dashboard') ? 'dashboard' : activeTab;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current budget
        const budgetRes = await apiClient.getCurrentBudget();
        const budgetData = budgetRes.data;
        setBudget(budgetData);

        // Fetch categories with spent amounts
        const categoriesRes = await apiClient.getCategories();
        setCategoryStats(categoriesRes.data);

        // Fetch recent transactions
        const transactionsRes = await apiClient.getTransactions(budgetData.id);
        setTransactions(transactionsRes.data.slice(0, 3)); // Last 3 transactions
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <MobileHeader />
        <div className="px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <MobileNavigation activeTab={currentTab} onTabChange={onTabChange} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <MobileHeader />
        <div className="px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
        <MobileNavigation activeTab={currentTab} onTabChange={onTabChange} />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <MobileHeader />
        <div className="px-4 py-8">
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <p className="text-amber-600 dark:text-amber-400 text-sm">No budget data available. Please create a budget first.</p>
          </div>
        </div>
        <MobileNavigation activeTab={currentTab} onTabChange={onTabChange} />
      </div>
    );
  }

  // Calculate spending statistics
  const monthlySpending = budget.totalSpent || 0;
  const monthlyBudget = budget.totalTarget || 5000;
  const previousMonthSpending = monthlySpending * 0.95; // Placeholder

  // Build category data for charts
  const categoryData = categoryStats
    .filter((cat: any) => cat.type !== 'income')
    .slice(0, 5)
    .map((cat: any) => ({
      name: cat.name,
      amount: cat.spent || 0,
      color: cat.color || '#6c5ce7',
    }));

  const categories = categoryStats
    .filter((cat: any) => cat.type !== 'income')
    .slice(0, 4)
    .map((cat: any) => ({
      name: cat.name,
      spent: cat.spent || 0,
      budget: cat.target || 1000,
      icon: getCategoryIcon(cat.name),
      color: cat.color || '#6c5ce7',
    }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <MobileHeader />

      <div className="px-4 py-4 space-y-4">
        {/* Quick Stats - 2 columns for mobile */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Spending"
            value={formatCurrency(monthlySpending)}
            change={Math.round(
              ((monthlySpending - previousMonthSpending) / previousMonthSpending) *
                100
            )}
          />
          <StatCard
            label="Remaining"
            value={formatCurrency(Math.max(0, monthlyBudget - monthlySpending))}
            change={monthlySpending > monthlyBudget ? 1 : -5}
          />
          <StatCard
            label="Budget Used"
            value={`${Math.round(
              (monthlySpending / monthlyBudget) * 100
            )}%`}
          />
          <StatCard
            label="Categories"
            value={`${categoryStats.filter((c: any) => c.type !== 'income').length}`}
          />
        </div>

        {/* Overall Budget Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Overall Budget
          </h3>
          <div className="flex justify-center mb-4">
            <BudgetProgressChart
              spent={monthlySpending}
              budget={monthlyBudget}
              label="Monthly"
              color="#2563eb"
              size={100}
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {budget.month}/{budget.year} • {formatCurrency(monthlyBudget)} monthly budget
            </p>
          </div>
        </div>

        {/* Spending by Category */}
        {categoryData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Spending by Category
            </h3>
            <CategoryBreakdownChart
              data={categoryData}
              donutMode={true}
              showLegend={true}
              showPercentage={true}
            />
          </div>
        )}

        {/* Category Breakdown Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Categories
          </h3>
          {categories.length > 0 ? (
            categories.map((cat) => {
              const percentage = (cat.spent / cat.budget) * 100;
              return (
                <div
                  key={cat.name}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                      {formatCurrency(cat.spent)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor:
                          percentage > 100
                            ? '#ef4444'
                            : percentage > 80
                              ? '#f59e0b'
                              : '#10b981',
                      }}
                    />
                  </div>
                  <p
                    className={`text-xs font-semibold ${
                      percentage > 100
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {Math.round(percentage)}% of {formatCurrency(cat.budget)}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No categories yet</p>
          )}
        </div>

        {/* Recent Transactions Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent
            </h3>
            <button className="text-xs text-blue-500 hover:text-blue-600">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {transactions.length > 0 ? (
              transactions.map((tx, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tx.description}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {new Date(tx.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`font-semibold ${
                    tx.amount > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {tx.amount > 0 ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default MobileDashboard;
