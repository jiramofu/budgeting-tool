import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface DashboardInsight {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

export const AdvancedDashboardWidget: React.FC = () => {
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      const [budgets, transactions, goals] = await Promise.all([
        (apiClient as any).getCurrentBudget(),
        (apiClient as any).getTransactions(),
        (apiClient as any).getGoalSummary?.(),
      ]);

      const currentBudget = budgets.data;
      const totalTransactions = transactions.data.length;
      const averageTransaction = totalTransactions > 0
        ? transactions.data.reduce((sum: number, t: any) => sum + t.amount, 0) / totalTransactions
        : 0;

      setInsights([
        {
          title: 'Monthly Budget',
          value: `$${(currentBudget?.totalBudget || 0).toFixed(2)}`,
          change: -5,
          trend: 'down',
          icon: '💰',
          color: 'blue',
        },
        {
          title: 'Spent This Month',
          value: `$${(currentBudget?.totalSpent || 0).toFixed(2)}`,
          change: 8,
          trend: 'up',
          icon: '💳',
          color: 'red',
        },
        {
          title: 'Average Transaction',
          value: `$${Math.abs(averageTransaction).toFixed(2)}`,
          change: 3,
          trend: 'up',
          icon: '📊',
          color: 'purple',
        },
        {
          title: 'Budget Health',
          value: currentBudget ? `${Math.round((currentBudget.totalSpent / currentBudget.totalBudget) * 100)}%` : '0%',
          change: 2,
          trend: 'neutral',
          icon: '📈',
          color: 'green',
        },
      ]);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {insights.map((insight, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">{insight.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{insight.value}</p>
            </div>
            <span className="text-2xl">{insight.icon}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${
              insight.trend === 'up' ? 'text-red-600' :
              insight.trend === 'down' ? 'text-green-600' :
              'text-gray-600'
            }`}>
              {insight.trend === 'up' ? '↑' : insight.trend === 'down' ? '↓' : '→'} {Math.abs(insight.change)}%
            </span>
            <span className="text-gray-500 text-xs">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdvancedDashboardWidget;
