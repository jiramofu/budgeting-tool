/**
 * Mobile Budgets Page
 * View and manage budgets on mobile devices
 * Fetches real data from the backend API
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FoodIcon,
  TransportationIcon,
  UtilitiesIcon,
  EntertainmentIcon,
  ShoppingIcon,
} from '../../assets/icons/categories';
import { MobileHeader } from '../../components/Mobile/MobileHeader';
import { MobileNavigation } from '../../components/Mobile/MobileNavigation';
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

interface BudgetItem {
  id: number; // Category ID
  name: string;
  spent: number;
  budget: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}

interface BudgetCardProps extends BudgetItem {
  onEdit?: (item: BudgetItem) => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({
  id,
  name,
  spent,
  budget,
  icon: Icon,
  color,
  onEdit,
}) => {
  const percentage = (spent / budget) * 100;
  const isOver = percentage > 100;
  const isWarning = percentage > 80;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              {name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ${spent.toFixed(0)} / ${budget.toFixed(0)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-bold ${
              isOver
                ? 'text-red-600 dark:text-red-400'
                : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-green-600 dark:text-green-400'
            }`}
          >
            {Math.round(percentage)}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full transition-all"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
        {isOver && (
          <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
            Over budget by ${(spent - budget).toFixed(0)}
          </p>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => onEdit?.({ id, name, spent, budget, icon: Icon, color })}
        className="w-full py-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium text-sm transition-colors"
      >
        Edit Budget
      </button>
    </div>
  );
};

interface MobileBudgetsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const MobileBudgets: React.FC<MobileBudgetsProps> = ({
  activeTab = 'budgets',
  onTabChange,
}) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<any>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<BudgetItem[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<BudgetItem | null>(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Use activeTab from props if provided, otherwise determine from URL
  const currentTab = activeTab === 'budgets' && location.pathname.includes('/budgets') ? 'budgets' : activeTab;

  const fetchBudgetData = async (month?: number, year?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch budget for specified month/year or current
      let budgetRes;
      if (month && year) {
        // For specific month - first try to fetch it
        // API might need adjustment if you want to fetch past/future budgets
        budgetRes = await apiClient.getCurrentBudget();
      } else {
        budgetRes = await apiClient.getCurrentBudget();
      }

      const budgetData = budgetRes.data;
      setBudget(budgetData);
      setSelectedMonth(budgetData.month);
      setSelectedYear(budgetData.year);

      // Fetch categories with budget targets
      const categoriesRes = await apiClient.getCategories();
      const categoryData = categoriesRes.data
        .filter((cat: any) => cat.type !== 'income')
        .map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          spent: cat.spent || 0,
          budget: cat.target || 1000,
          icon: getCategoryIcon(cat.name),
          color: cat.color || '#6c5ce7',
        }));

      setCategoryBudgets(categoryData);
    } catch (err: any) {
      console.error('Error fetching budget data:', err);
      setError(err.response?.data?.message || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const handlePreviousMonth = () => {
    if (!selectedMonth || !selectedYear) return;

    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    fetchBudgetData(newMonth, newYear);
  };

  const handleNextMonth = () => {
    if (!selectedMonth || !selectedYear) return;

    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    fetchBudgetData(newMonth, newYear);
  };

  const handleEditBudget = (budgetItem: BudgetItem) => {
    setEditingCategory(budgetItem);
    setNewBudgetAmount(budgetItem.budget.toString());
    setShowEditModal(true);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);
      setEditError(null);

      const newAmount = parseFloat(newBudgetAmount);
      if (isNaN(newAmount) || newAmount < 0) {
        setEditError('Please enter a valid amount');
        return;
      }

      if (!editingCategory || !budget) {
        setEditError('Category or budget information missing');
        return;
      }

      // Call backend API to persist the budget target
      await apiClient.put(`/budgets/${budget.id}/targets/${editingCategory.id}`, {
        targetAmount: newAmount,
      });

      // Update local state with the new amount
      setCategoryBudgets(
        categoryBudgets.map((item) =>
          item.id === editingCategory.id
            ? { ...item, budget: newAmount }
            : item
        )
      );

      setShowEditModal(false);
      setEditingCategory(null);
      setNewBudgetAmount('');
    } catch (err: any) {
      console.error('Error saving budget:', err);
      setEditError(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setEditLoading(false);
    }
  };

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

  const totalSpent = categoryBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalBudget = categoryBudgets.reduce((sum, b) => sum + b.budget, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <MobileHeader />

      <div className="px-4 py-4 space-y-4">
        {/* Month Selector and Navigation */}
        <div className="flex gap-2 items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="py-2 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Previous month"
          >
            ←
          </button>
          <div className="flex-1 text-center">
            <button className="w-full py-2 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white">
              {selectedMonth && selectedYear
                ? `${String(selectedMonth).padStart(2, '0')}/${selectedYear}`
                : 'Loading...'}
            </button>
          </div>
          <button
            onClick={handleNextMonth}
            className="py-2 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Next month"
          >
            →
          </button>
        </div>

        {/* Overall Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            Total Budget Health
          </p>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(overallPercentage)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                ${totalSpent.toFixed(0)} / ${totalBudget.toFixed(0)}
              </p>
            </div>
            <div
              className={`text-xs font-semibold ${
                overallPercentage > 100
                  ? 'text-red-600 dark:text-red-400'
                  : overallPercentage > 80
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-green-600 dark:text-green-400'
              }`}
            >
              {overallPercentage > 100
                ? 'Over Budget'
                : overallPercentage > 80
                  ? 'Warning'
                  : 'On Track'}
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="w-full bg-blue-200 dark:bg-blue-700/50 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(overallPercentage, 100)}%`,
                backgroundColor:
                  overallPercentage > 100
                    ? '#ef4444'
                    : overallPercentage > 80
                      ? '#f59e0b'
                      : '#10b981',
              }}
            />
          </div>
        </div>

        {/* Budget Categories */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Categories
          </h3>
          <div className="space-y-3">
            {categoryBudgets.length > 0 ? (
              categoryBudgets.map((budgetItem) => (
                <BudgetCard
                  key={budgetItem.name}
                  {...budgetItem}
                  onEdit={handleEditBudget}
                />
              ))
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No budget categories yet</p>
            )}
          </div>
        </div>

        {/* Budget Templates Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Templates
          </h3>
          <button className="w-full py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
            Browse Budget Templates
          </button>
        </div>
      </div>

      {/* Edit Budget Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Budget - {editingCategory.name}
            </h3>

            {editError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{editError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Current Spending: ${editingCategory.spent.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Current Budget: ${editingCategory.budget.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                    setEditError(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="flex-1 py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium text-sm transition-colors"
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default MobileBudgets;
