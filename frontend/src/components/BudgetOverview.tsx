import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BudgetOverviewProps {
  budgetId: number;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budgetId }) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Placeholder data - will be replaced with actual API calls
    setChartData([
      { name: 'Fixed', value: 1500, fill: '#3b82f6' },
      { name: 'Variable', value: 800, fill: '#ef4444' },
      { name: 'Recurring', value: 400, fill: '#10b981' },
    ]);
  }, [budgetId]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Budget Overview</h2>

      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {chartData.map((item) => (
          <div key={item.name} className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.fill }}
              ></div>
              <span className="text-gray-700">{item.name}</span>
            </div>
            <div>
              <span className="font-semibold">${item.value}</span>
              <span className="text-gray-500 text-sm ml-2">
                ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">Total Budget</span>
          <span className="text-2xl font-bold text-primary">${total}</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetOverview;
