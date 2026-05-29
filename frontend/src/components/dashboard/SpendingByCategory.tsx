import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { apiClient } from '../../services/api';
import { formatCurrency } from '../../utils/currencyFormatter';

interface CategorySpending {
  category_id: number;
  category_name: string;
  total_amount: number;
  percentage: number;
}

interface SpendingByCategoryProps {
  budgetId?: number;
  currency?: string;
}

const COLORS = [
  '#2563eb', // Blue 600
  '#16a766', // Emerald 600
  '#0891b2', // Cyan 600
  '#d97706', // Amber 600
  '#dc2626', // Red 600
  '#8b5cf6', // Violet 600
  '#ec4899', // Pink 600
  '#06b6d4', // Cyan 500
];

const SpendingByCategory: React.FC<SpendingByCategoryProps> = ({ budgetId, currency = 'USD' }) => {
  const [data, setData] = useState<CategorySpending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (budgetId) {
      loadCategorySpending();
    }
  }, [budgetId]);

  const loadCategorySpending = async () => {
    try {
      setIsLoading(true);
      setError('');

      // This would call your backend endpoint to get category spending
      // For now, we'll fetch transactions and calculate
      const response = await apiClient.getTransactions();

      if (response.data && Array.isArray(response.data)) {
        // Group by category
        const categoryMap = new Map<string, number>();
        let total = 0;

        response.data.forEach((tx: any) => {
          const categoryName = tx.category?.name || 'Uncategorized';
          const amount = Math.abs(tx.amount);
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + amount);
          total += amount;
        });

        // Convert to chart format
        const chartData = Array.from(categoryMap.entries())
          .map(([name, amount]) => ({
            category_id: 0,
            category_name: name,
            total_amount: amount,
            percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
          }))
          .sort((a, b) => b.total_amount - a.total_amount)
          .slice(0, 8); // Top 8 categories

        setData(chartData);
      }
    } catch (err) {
      console.error('Failed to load category spending:', err);
      setError('Failed to load category data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-primary bg-secondary p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-primary mb-4">Spending by Category</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="rounded-lg border border-primary bg-secondary p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-primary mb-4">Spending by Category</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-secondary">No spending data available</p>
        </div>
      </div>
    );
  }

  // Prepare data for pie chart
  const chartData = data.map(item => ({
    name: item.category_name,
    value: item.total_amount,
  }));

  return (
    <div className="rounded-lg border border-primary bg-secondary p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-primary mb-4">Spending by Category</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => `${name}: ${formatCurrency(value, currency, 0)} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value, currency)}
            contentStyle={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--color-text-primary)' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Category breakdown table */}
      <div className="mt-6 space-y-2">
        <h4 className="text-sm font-semibold text-secondary mb-3">Category Breakdown</h4>
        {data.map((item, idx) => (
          <div key={item.category_id || idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-sm text-secondary">{item.category_name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-primary">{formatCurrency(item.total_amount, currency)}</p>
              <p className="text-xs text-secondary">{item.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingByCategory;
