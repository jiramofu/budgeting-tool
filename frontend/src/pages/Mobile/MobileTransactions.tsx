/**
 * Mobile Transactions Page
 * View and manage transactions on mobile devices
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

interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  isIncome: boolean;
}

interface TransactionGroup {
  date: string;
  transactions: Transaction[];
}

const TransactionItem: React.FC<Transaction & { onDelete?: () => void }> = ({
  id,
  date,
  description,
  category,
  amount,
  icon: Icon,
  color,
  isIncome,
  onDelete,
}) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group">
    <Icon size={20} color={color} />
    <div className="flex-1 min-w-0">
      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
        {description}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{category}</p>
    </div>
    <div className="text-right flex-shrink-0">
      <p
        className={`font-semibold text-sm ${
          isIncome
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-900 dark:text-white'
        }`}
      >
        {isIncome ? '+' : '-'}${Math.abs(amount).toFixed(2)}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{date}</p>
    </div>
    {onDelete && (
      <button
        onClick={onDelete}
        className="ml-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        title="Delete transaction"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    )}
  </div>
);

interface MobileTransactionsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

interface Category {
  id: number;
  name: string;
  color?: string;
}

export const MobileTransactions: React.FC<MobileTransactionsProps> = ({
  activeTab = 'transactions',
  onTabChange,
}) => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [allTransactions, setAllTransactions] = React.useState<Transaction[]>([]);
  const [budget, setBudget] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Use activeTab from props if provided, otherwise determine from URL
  const currentTab = activeTab === 'transactions' && location.pathname.includes('/transactions') ? 'transactions' : activeTab;

  // Form state
  const [formData, setFormData] = React.useState({
    description: '',
    amount: '',
    categoryId: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  // Fetch transactions and categories on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current budget first
        const budgetRes = await apiClient.getCurrentBudget();
        const budgetData = budgetRes.data;
        setBudget(budgetData);

        // Fetch categories
        const categoriesRes = await apiClient.getCategories();
        setCategories(categoriesRes.data);

        // Fetch all transactions for this budget
        const transactionsRes = await apiClient.getTransactions(budgetData.id);
        const txData = transactionsRes.data.map((tx: any) => ({
          id: tx.id,
          date: new Date(tx.transactionDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          description: tx.description,
          category: tx.categoryName || 'Uncategorized',
          amount: tx.amount,
          icon: getCategoryIcon(tx.categoryName || 'Shopping'),
          color: '#6c5ce7',
          isIncome: tx.amount > 0,
        }));

        setAllTransactions(txData);
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(err.response?.data?.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleAddTransaction = async () => {
    try {
      setAddLoading(true);
      setAddError(null);

      const amount = parseFloat(formData.amount);
      if (!formData.description || !amount || !formData.categoryId || !formData.transactionDate) {
        setAddError('Please fill in all fields');
        return;
      }

      await apiClient.createTransaction(
        parseInt(formData.categoryId),
        amount,
        formData.transactionDate,
        budget.id,
        formData.description
      );

      // Reset form and refresh transactions
      setFormData({
        description: '',
        amount: '',
        categoryId: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
      setShowAddModal(false);

      // Refresh transactions
      const budgetRes = await apiClient.getCurrentBudget();
      const transactionsRes = await apiClient.getTransactions(budgetRes.data.id);
      const txData = transactionsRes.data.map((tx: any) => ({
        id: tx.id,
        date: new Date(tx.transactionDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        description: tx.description,
        category: tx.categoryName || 'Uncategorized',
        amount: tx.amount,
        icon: FoodIcon,
        color: '#6c5ce7',
        isIncome: tx.amount > 0,
      }));
      setAllTransactions(txData);
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      setAddError(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    try {
      setDeleting(true);
      await apiClient.deleteTransaction(transactionId);
      setAllTransactions(allTransactions.filter(tx => tx.id !== transactionId));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      setError(err.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  // Group transactions by date
  const groupedTransactions = React.useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    allTransactions.forEach((tx) => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    return Object.entries(groups)
      .map(([date, txs]) => ({
        date,
        transactions: txs,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions]);

  // Filter transactions based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchTerm) return groupedTransactions;

    const filtered = groupedTransactions.map((group) => ({
      ...group,
      transactions: group.transactions.filter(
        (tx) =>
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }));

    return filtered.filter((group) => group.transactions.length > 0);
  }, [searchTerm, groupedTransactions]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <MobileHeader />

      <div className="px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 px-3 pl-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button className="py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors">
            Filter
          </button>
        </div>

        {/* Transactions by Date */}
        <div className="space-y-4">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div
                key={group.date}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Date Header */}
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {group.date}
                  </p>
                </div>

                {/* Transactions */}
                <div className="px-4 divide-y divide-gray-100 dark:divide-gray-700">
                  {group.transactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      {...tx}
                      onDelete={() => setDeleteConfirm(tx.id)}
                    />
                  ))}
                </div>

                {/* Date Total */}
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Daily Total
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      -$
                      {group.transactions
                        .filter((tx) => !tx.isIncome)
                        .reduce((sum, tx) => sum + tx.amount, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No transactions match your search' : 'No transactions yet'}
              </p>
            </div>
          )}
        </div>

        {/* Add Transaction Button - Floating */}
        <div className="fixed bottom-24 right-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex items-center justify-center transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full rounded-t-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Transaction</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{addError}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Grocery shopping"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTransaction}
                  disabled={addLoading}
                  className="flex-1 py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium transition-colors"
                >
                  {addLoading ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Transaction?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTransaction(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-medium transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default MobileTransactions;
