/**
 * Budget Progress Chart - Circular Progress Visualization
 * Shows spending vs budget target for a category or overall
 */

import React from 'react';

interface BudgetProgressChartProps {
  spent: number;
  budget: number;
  label?: string;
  color?: string;
  size?: number;
}

export const BudgetProgressChart: React.FC<BudgetProgressChartProps> = ({
  spent,
  budget,
  label = 'Budget',
  color = '#2563eb',
  size = 120,
}) => {
  const percentage = Math.min((spent / budget) * 100, 100);
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on spending percentage
  let statusColor = color;
  if (percentage > 100) statusColor = '#ef4444'; // Red for over budget
  else if (percentage > 80) statusColor = '#f59e0b'; // Amber for warning
  else statusColor = '#10b981'; // Green for good

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.1"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke={statusColor}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {Math.round(percentage)}%
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
      </div>
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          ${spent.toFixed(2)} / ${budget.toFixed(2)}
        </div>
        {percentage > 100 && (
          <div className="text-sm font-semibold text-red-500">
            Over by ${(spent - budget).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Multi-Category Budget Chart - Horizontal bar chart
 */
interface CategoryBudgetItem {
  name: string;
  spent: number;
  budget: number;
  color: string;
}

interface MultiCategoryChartProps {
  categories: CategoryBudgetItem[];
  maxWidth?: number;
}

export const MultiCategoryBudgetChart: React.FC<MultiCategoryChartProps> = ({
  categories,
  maxWidth = 400,
}) => {
  const maxBudget = Math.max(...categories.map(c => c.budget));

  return (
    <div className="space-y-4 p-4">
      {categories.map((category) => {
        const percentage = (category.spent / category.budget) * 100;
        const isOverBudget = percentage > 100;

        return (
          <div key={category.name}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {category.name}
              </span>
              <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                ${category.spent.toFixed(2)} / ${category.budget.toFixed(2)}
              </span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverBudget ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min((category.spent / category.budget) * 100, 100)}%`,
                  backgroundColor: category.color,
                }}
              />
              {isOverBudget && (
                <div
                  className="absolute top-0 h-full border-r-2 border-red-500"
                  style={{
                    left: `${(category.budget / (maxBudget * 1.2)) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BudgetProgressChart;
