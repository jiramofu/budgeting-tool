import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
  title: string;
  subtitle?: string;
  colors?: string[];
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  data,
  title,
  subtitle,
  colors = [
    '#10b981',
    '#f59e0b',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#f97316',
    '#14b8a6',
    '#6366f1',
  ],
}) => {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm flex items-center justify-center h-96">
        <p className="text-slate-400">No category data available</p>
      </div>
    );
  }

  // Sort by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const pieData = sortedData.slice(0, 8); // Limit to top 8 for pie chart clarity

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-50 mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>

      {/* Pie Chart */}
      <div className="mb-8">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f8fafc' }}
              formatter={(value: any) => [
                `$${value.toFixed(2)}`,
                'Amount',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        {sortedData.map((category, index) => (
          <div
            key={category.name}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/50"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-50">
                  {category.name}
                </p>
                <p className="text-xs text-slate-400">
                  {category.percentage.toFixed(1)}% of total
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-50">
                ${category.value.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Legend note for additional categories */}
      {sortedData.length > 8 && (
        <p className="mt-4 text-xs text-slate-400">
          + {sortedData.length - 8} more categor{sortedData.length - 8 === 1 ? 'y' : 'ies'}
        </p>
      )}
    </div>
  );
};

export default CategoryBreakdown;
