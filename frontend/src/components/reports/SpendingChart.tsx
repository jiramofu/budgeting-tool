import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  date: string;
  spending: number;
  budget?: number;
  income?: number;
}

interface SpendingChartProps {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  chartType?: 'line' | 'bar';
  showBudget?: boolean;
  showIncome?: boolean;
  height?: number;
}

const SpendingChart: React.FC<SpendingChartProps> = ({
  data,
  title,
  subtitle,
  chartType = 'line',
  showBudget = false,
  showIncome = false,
  height = 300,
}) => {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm flex items-center justify-center h-80">
        <p className="text-slate-400">No data available for this period</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-50 mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f8fafc' }}
              formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="spending"
              stroke="#ef4444"
              dot={false}
              strokeWidth={2}
              name="Spending"
            />
            {showBudget && (
              <Line
                type="monotone"
                dataKey="budget"
                stroke="#2563eb"
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Budget"
              />
            )}
            {showIncome && (
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                dot={false}
                strokeWidth={2}
                name="Income"
              />
            )}
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f8fafc' }}
              formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`}
            />
            <Legend />
            <Bar dataKey="spending" fill="#ef4444" name="Spending" />
            {showBudget && <Bar dataKey="budget" fill="#2563eb" name="Budget" />}
            {showIncome && <Bar dataKey="income" fill="#10b981" name="Income" />}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingChart;
