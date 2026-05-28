import React from 'react';
import { ArrowDownLeft, ArrowUpRight, MoreVertical, Trash2 } from 'lucide-react';

interface TransactionCardProps {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  categoryIcon?: string;
  onDelete?: (id: number) => void;
  onSelect?: (id: number, selected: boolean) => void;
  isSelected?: boolean;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  id,
  date,
  description,
  category,
  amount,
  type,
  categoryIcon,
  onDelete,
  onSelect,
  isSelected = false,
}) => {
  const isIncome = type === 'income';
  const displayAmount = Math.abs(amount);

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (cat: string) => {
    const colorMap: Record<string, string> = {
      'Groceries': 'bg-emerald-900/20 text-emerald-400 border-emerald-700/50',
      'Dining': 'bg-amber-900/20 text-amber-400 border-amber-700/50',
      'Entertainment': 'bg-blue-900/20 text-blue-400 border-blue-700/50',
      'Transportation': 'bg-purple-900/20 text-purple-400 border-purple-700/50',
      'Utilities': 'bg-cyan-900/20 text-cyan-400 border-cyan-700/50',
      'Shopping': 'bg-pink-900/20 text-pink-400 border-pink-700/50',
      'Healthcare': 'bg-red-900/20 text-red-400 border-red-700/50',
      'Salary': 'bg-green-900/20 text-green-400 border-green-700/50',
      'Bonus': 'bg-green-900/20 text-green-400 border-green-700/50',
      'Investment': 'bg-indigo-900/20 text-indigo-400 border-indigo-700/50',
    };
    return colorMap[cat] || 'bg-slate-700/30 text-slate-400 border-slate-600/50';
  };

  return (
    <div
      className={`rounded-lg border p-4 backdrop-blur-sm transition-all ${
        isSelected
          ? 'bg-blue-900/20 border-blue-700/50'
          : 'bg-slate-800/50 border-slate-700'
      }`}
    >
      {/* Header with checkbox and menu */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(id, e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
          />
          <span className="text-sm text-slate-400">{getRelativeDate(date)}</span>
        </div>
        <button
          onClick={() => onDelete?.(id)}
          className="p-2 -mr-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Description and category */}
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-50 mb-1 flex items-center gap-2">
          <span className="text-lg">{categoryIcon}</span>
          {description}
        </p>
        <span className={`inline-block text-xs px-2 py-1 rounded border ${getCategoryColor(category)}`}>
          {category}
        </span>
      </div>

      {/* Amount */}
      <div
        className={`pt-3 border-t border-slate-700/50 flex items-center justify-between ${
          isIncome ? 'text-green-400' : 'text-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          {isIncome ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownLeft className="w-4 h-4" />
          )}
          <span className="text-sm text-slate-400">
            {isIncome ? 'Income' : 'Spent'}
          </span>
        </div>
        <span className="font-semibold">
          {isIncome ? '+' : '-'}${displayAmount.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default TransactionCard;
