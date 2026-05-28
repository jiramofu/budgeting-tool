import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BudgetBarProps {
  categoryName: string;
  spent: number;
  budget: number;
  icon?: string;
  onClick?: () => void;
  isExpanded?: boolean;
}

const BudgetBar: React.FC<BudgetBarProps> = ({
  categoryName,
  spent,
  budget,
  icon,
  onClick,
  isExpanded = false,
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
    ? `Over by $${Math.abs(remaining).toFixed(2)}`
    : `$${remaining.toFixed(2)} left`;

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
            ${spent.toFixed(2)}
          </span>
          <span className="text-xs text-slate-600">/</span>
          <span className="text-xs font-medium text-slate-50">
            ${budget.toFixed(2)}
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
    </div>
  );
};

export default BudgetBar;
