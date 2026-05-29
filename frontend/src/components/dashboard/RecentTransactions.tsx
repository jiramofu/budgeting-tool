import React from 'react';
import { ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  transaction_date: string;
  category?: {
    name: string;
  };
  type?: 'income' | 'expense';
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  maxItems?: number;
  onViewAll?: () => void;
  currency?: string;
}

const categoryColors: { [key: string]: string } = {
  'Groceries': 'bg-emerald-900/20 text-emerald-400',
  'Dining': 'bg-amber-900/20 text-amber-400',
  'Transportation': 'bg-blue-900/20 text-blue-400',
  'Entertainment': 'bg-violet-900/20 text-violet-400',
  'Utilities': 'bg-cyan-900/20 text-cyan-400',
  'Shopping': 'bg-pink-900/20 text-pink-400',
  'default': 'bg-slate-700/20 text-slate-400',
};

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  maxItems = 5,
  onViewAll,
  currency = 'USD',
}) => {
  const displayTransactions = transactions.slice(0, maxItems);
  const hasMore = transactions.length > maxItems;

  const getCategoryColor = (categoryName?: string) => {
    if (!categoryName) return categoryColors.default;
    return categoryColors[categoryName] || categoryColors.default;
  };

  const isIncome = (amount: number) => amount > 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (displayTransactions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-50">Recent Transactions</h3>
        </div>
        <p className="text-slate-400 text-center py-8">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-50">Recent Transactions</h3>
        {hasMore && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Transaction list */}
      <div className="space-y-3">
        {displayTransactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/50"
          >
            {/* Left side: icon, description, category */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className={`p-2 rounded-lg ${isIncome(tx.amount) ? 'bg-emerald-500/20' : 'bg-slate-600/40'}`}>
                {isIncome(tx.amount) ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-slate-400" />
                )}
              </div>

              {/* Description and category */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-50 truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {tx.category && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(tx.category.name)}`}
                    >
                      {tx.category.name}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{formatDate(tx.transaction_date)}</span>
                </div>
              </div>
            </div>

            {/* Right side: amount */}
            <div className="text-right ml-2 flex-shrink-0">
              <p className={`text-sm font-semibold ${isIncome(tx.amount) ? 'text-emerald-400' : 'text-slate-50'}`}>
                {isIncome(tx.amount) ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with view all button */}
      {hasMore && (
        <button
          onClick={onViewAll}
          className="mt-4 w-full py-2 text-center text-sm font-medium text-blue-500 hover:text-blue-400 hover:bg-slate-700/30 rounded-lg transition-colors"
        >
          View all {transactions.length} transactions
        </button>
      )}
    </div>
  );
};

export default RecentTransactions;
