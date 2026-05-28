import React, { useState, useEffect } from 'react';
import { Download, Trash2, Plus, AlertCircle } from 'lucide-react';
import {
  TransactionRow,
  TransactionCard,
  FilterBar,
  FilterState,
  SortControls,
  SortField,
  SortDirection,
} from '../components/transactions';
import { apiClient } from '../services/api';

interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  categoryIcon?: string;
  amount: number;
  type: 'income' | 'expense';
}

const TransactionPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(
    new Set()
  );
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    type: 'all',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Mock data - in production this would come from the API
  const mockTransactions: Transaction[] = [
    {
      id: 1,
      date: '2026-05-28',
      description: 'Whole Foods Market',
      category: 'Groceries',
      categoryIcon: '🛒',
      amount: -85.32,
      type: 'expense',
    },
    {
      id: 2,
      date: '2026-05-28',
      description: 'Monthly Salary',
      category: 'Salary',
      categoryIcon: '💰',
      amount: 5000,
      type: 'income',
    },
    {
      id: 3,
      date: '2026-05-27',
      description: 'Chipotle',
      category: 'Dining',
      categoryIcon: '🍽️',
      amount: -14.50,
      type: 'expense',
    },
    {
      id: 4,
      date: '2026-05-27',
      description: 'Uber',
      category: 'Transportation',
      categoryIcon: '🚗',
      amount: -12.75,
      type: 'expense',
    },
    {
      id: 5,
      date: '2026-05-26',
      description: 'Netflix Subscription',
      category: 'Entertainment',
      categoryIcon: '🎬',
      amount: -15.99,
      type: 'expense',
    },
    {
      id: 6,
      date: '2026-05-26',
      description: 'CVS Pharmacy',
      category: 'Healthcare',
      categoryIcon: '💊',
      amount: -32.45,
      type: 'expense',
    },
    {
      id: 7,
      date: '2026-05-25',
      description: 'Shell Gas Station',
      category: 'Transportation',
      categoryIcon: '⛽',
      amount: -52.00,
      type: 'expense',
    },
    {
      id: 8,
      date: '2026-05-25',
      description: 'Target',
      category: 'Shopping',
      categoryIcon: '🛍️',
      amount: -67.89,
      type: 'expense',
    },
    {
      id: 9,
      date: '2026-05-24',
      description: 'Starbucks',
      category: 'Dining',
      categoryIcon: '☕',
      amount: -5.75,
      type: 'expense',
    },
    {
      id: 10,
      date: '2026-05-24',
      description: 'Amazon Purchase',
      category: 'Shopping',
      categoryIcon: '📦',
      amount: -42.99,
      type: 'expense',
    },
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError('');
      // const res = await apiClient.get('/transactions');
      // setTransactions(res.data);
      setTransactions(mockTransactions);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredAndSortedTransactions = () => {
    let filtered = [...transactions];

    // Apply filters
    if (filters.type !== 'all') {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter((t) =>
        filters.categories.includes(t.category)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.date) >= new Date(filters.dateFrom!)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (t) => new Date(t.date) <= new Date(filters.dateTo!)
      );
    }

    if (filters.amountMin !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) >= filters.amountMin!);
    }

    if (filters.amountMax !== undefined) {
      filtered = filtered.filter((t) => Math.abs(t.amount) <= filters.amountMax!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareA: any = a[sortField];
      let compareB: any = b[sortField];

      if (sortField === 'amount') {
        compareA = Math.abs(a.amount);
        compareB = Math.abs(b.amount);
      }

      if (compareA < compareB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (compareA > compareB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  };

  const getUniqueCategories = (): string[] => {
    const cats = new Set(transactions.map((t) => t.category));
    return Array.from(cats).sort();
  };

  const handleSelectTransaction = (id: number, selected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const filteredIds = getFilteredAndSortedTransactions().map((t) => t.id);
      setSelectedTransactions(new Set(filteredIds));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      // In production: await apiClient.delete(`/transactions/${id}`);
      console.log(`Deleted transaction ${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      selectedTransactions.delete(id);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTransactions.size === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedTransactions.size} transaction(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      for (const id of selectedTransactions) {
        // In production: await apiClient.delete(`/transactions/${id}`);
        console.log(`Deleted transaction ${id}`);
      }
      setTransactions((prev) =>
        prev.filter((t) => !selectedTransactions.has(t.id))
      );
      setSelectedTransactions(new Set());
    } catch (err) {
      console.error('Failed to delete transactions:', err);
    }
  };

  const handleExport = () => {
    const filtered = getFilteredAndSortedTransactions();
    const csv = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'].join(','),
      ...filtered.map((t) =>
        [
          t.date,
          `"${t.description}"`,
          t.category,
          t.type,
          `$${Math.abs(t.amount).toFixed(2)}`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredTransactions = getFilteredAndSortedTransactions();
  const isAllSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((t) => selectedTransactions.has(t.id));

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-48"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
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
        <h1 className="text-4xl font-bold text-slate-50 mb-1">Transactions</h1>
        <p className="text-slate-400">
          {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-stretch md:items-center">
        <button className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>

        <div className="flex-1" />

        {selectedTransactions.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-900/20 hover:bg-red-900/30 text-red-400 font-medium transition-colors border border-red-700/50"
          >
            <Trash2 className="w-4 h-4" />
            Delete ({selectedTransactions.size})
          </button>
        )}

        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-50 font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        categories={getUniqueCategories()}
        onFilterChange={setFilters}
        onReset={() =>
          setFilters({ categories: [], type: 'all' })
        }
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
      />

      {/* Sort controls */}
      {filteredTransactions.length > 0 && (
        <div className="mb-6">
          <SortControls
            currentSort={sortField}
            currentDirection={sortDirection}
            onSortChange={(field, direction) => {
              setSortField(field);
              setSortDirection(direction);
            }}
          />
        </div>
      )}

      {/* Desktop table view */}
      {filteredTransactions.length > 0 ? (
        <div className="hidden md:block rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  {...transaction}
                  onDelete={handleDeleteTransaction}
                  onSelect={handleSelectTransaction}
                  isSelected={selectedTransactions.has(transaction.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center backdrop-blur-sm">
          <p className="text-slate-400 mb-4">No transactions found</p>
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
            Add Transaction
          </button>
        </div>
      )}

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              {...transaction}
              onDelete={handleDeleteTransaction}
              onSelect={handleSelectTransaction}
              isSelected={selectedTransactions.has(transaction.id)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center backdrop-blur-sm">
            <p className="text-slate-400 mb-4">No transactions found</p>
            <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
              Add Transaction
            </button>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {filteredTransactions.length > 0 && (
        <div className="mt-8 p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-slate-50">
                {filteredTransactions.length}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-red-400">
                $
                {filteredTransactions
                  .filter((t) => t.type === 'expense')
                  .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-400">
                $
                {filteredTransactions
                  .filter((t) => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Net Change</p>
              <p className={`text-2xl font-bold ${
                filteredTransactions.reduce((sum, t) => sum + t.amount, 0) >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                $
                {filteredTransactions
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;
