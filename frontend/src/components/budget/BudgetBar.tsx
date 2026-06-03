import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

interface BudgetBarProps {
  categoryName: string;
  spent: number;
  budget: number;
  icon?: string;
  onClick?: () => void;
  isExpanded?: boolean;
  currency?: string;
  categoryId?: number;
  onQuickAddSpending?: (categoryId: number, amount: string) => Promise<void>;
  quickAddValue?: string;
  onQuickAddChange?: (value: string) => void;
  isSubmitting?: boolean;
}

const BudgetBar: React.FC<BudgetBarProps> = ({
  categoryName,
  spent,
  budget,
  icon,
  onClick,
  isExpanded = false,
  currency = 'USD',
  categoryId,
  onQuickAddSpending,
  quickAddValue = '',
  onQuickAddChange,
  isSubmitting = false,
}) => {
  const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const isOverBudget = spent > budget;
  const isNearLimit = percentage >= 80 && percentage < 100;

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-600';
    if (isNearLimit) return 'bg-amber-600';
    return 'bg-emerald-600';
  };

  const getTextColor = () => {
    if (isOverBudget) return 'text-red-400';
    if (isNearLimit) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const remaining = budget - spent;
  const remainingText = isOverBudget
    ? `Over by ${formatCurrency(Math.abs(remaining), currency)}`
    : `${formatCurrency(remaining, currency)} left`;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-sm transition-all ${
        onClick ? 'cursor-pointer hover:bg-slate-800 hover:border-slate-600' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && <span className="text-xl">{icon}</span>}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-50 truncate">
              {categoryName}
            </h4>
          </div>
        </div>
        {onClick && (
          <ChevronRight
            className={`w-5 h-5 text-slate-500 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">
            {formatCurrency(spent, currency)}
          </span>
          <span className="text-xs text-slate-600">/</span>
          <span className="text-xs font-medium text-slate-50">
            {formatCurrency(budget, currency)}
          </span>
        </div>
        <div className="text-right">
          <p className={`text-xs font-semibold ${getTextColor()}`}>
            {percentage}%
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{remainingText}</p>
        </div>
      </div>

      {/* Warning message */}
      {isOverBudget && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <p className="text-xs text-red-400 font-medium">Budget exceeded</p>
        </div>
      )}

      {/* Quick add spending input */}
      {onQuickAddSpending && categoryId !== undefined && (
        <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="Add amount"
            value={quickAddValue}
            onChange={(e) => onQuickAddChange?.(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 rounded bg-slate-700/50 border border-slate-600 text-sm text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={() => onQuickAddSpending(categoryId, quickAddValue)}
            disabled={isSubmitting || !quickAddValue}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors text-sm whitespace-nowrap"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetBar;
