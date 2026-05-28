import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';

interface TransactionRowProps {
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

const TransactionRow: React.FC<TransactionRowProps> = ({
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
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const getCategoryColor = (cat: string) => {
    const colorMap: Record<string, string> = {
      'Groceries': 'text-emerald-500',
      'Dining': 'text-amber-500',
      'Entertainment': 'text-blue-500',
      'Transportation': 'text-purple-500',
      'Utilities': 'text-cyan-500',
      'Shopping': 'text-pink-500',
      'Healthcare': 'text-red-500',
      'Salary': 'text-green-500',
      'Bonus': 'text-green-500',
      'Investment': 'text-indigo-500',
    };
    return colorMap[cat] || 'text-slate-400';
  };

  return (
    <tr className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
      {/* Checkbox */}
      <td className="px-4 py-3 w-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect?.(id, e.target.checked)}
          className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
        />
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">
        {formattedDate}
      </td>

      {/* Description & Category */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryIcon}</span>
          <div>
            <p className="text-sm font-medium text-slate-50">{description}</p>
            <p className={`text-xs ${getCategoryColor(category)}`}>{category}</p>
          </div>
        </div>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {isIncome ? (
            <ArrowUpRight className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDownLeft className="w-4 h-4 text-red-500" />
          )}
          <span
            className={`font-semibold text-sm ${
              isIncome ? 'text-green-400' : 'text-slate-50'
            }`}
          >
            {isIncome ? '+' : '-'}${displayAmount.toFixed(2)}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onDelete?.(id)}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete transaction"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

export default TransactionRow;
