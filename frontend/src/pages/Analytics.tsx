import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  type: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

interface MonthlyTrend {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

interface SpendingAnalysis {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  categoryBreakdown: CategoryBreakdown[];
  topCategories: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  averageDailySpend: number;
  savingsRate: number;
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

const Analytics: React.FC = () => {
  const [analysis, setAnalysis] = useState<SpendingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadAnalytics();
  }, [viewType, selectedDate]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError('');

      let analysisData: SpendingAnalysis;
      if (viewType === 'monthly') {
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();
        const res = await apiClient.get(`/api/analytics/monthly/${year}/${month}`);
        analysisData = res.data;
      } else {
        const year = selectedDate.getFullYear();
        const res = await apiClient.get(`/api/analytics/yearly/${year}`);
        analysisData = res.data;
      }

      setAnalysis(analysisData);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousPeriod = () => {
    const newDate = new Date(selectedDate);
    if (viewType === 'monthly') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(selectedDate);
    if (viewType === 'monthly') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setSelectedDate(newDate);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>;
  }

  if (!analysis) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Spending Analytics</h1>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handlePreviousPeriod}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
          >
            ← Previous
          </button>

          <div className="flex-1">
            <span className="text-lg font-semibold">{analysis.period}</span>
          </div>

          <button
            onClick={handleNextPeriod}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
          >
            Next →
          </button>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                viewType === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType('yearly')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                viewType === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm font-medium">Total Income</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            ${Number(analysis.totalIncome).toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm font-medium">Total Expenses</div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            ${Number(analysis.totalExpenses).toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm font-medium">Net Cash Flow</div>
          <div className={`text-2xl font-bold mt-2 ${Number(analysis.netCashFlow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Number(analysis.netCashFlow).toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm font-medium">Savings Rate</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{Number(analysis.savingsRate).toFixed(1)}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Monthly Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analysis.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="totalIncome" stroke="#10b981" name="Income" />
              <Line type="monotone" dataKey="totalExpenses" stroke="#ef4444" name="Expenses" />
              <Line type="monotone" dataKey="netCashFlow" stroke="#3b82f6" name="Net Cash Flow" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysis.topCategories}
                dataKey="amount"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {analysis.topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Categories Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Top Spending Categories</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Category</th>
                <th className="text-right px-4 py-2 font-semibold">Amount</th>
                <th className="text-right px-4 py-2 font-semibold">% of Total</th>
                <th className="text-right px-4 py-2 font-semibold">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {analysis.topCategories.map((category, index) => (
                <tr key={category.categoryId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">{category.categoryName}</td>
                  <td className="text-right px-4 py-3 font-semibold">${Number(category.amount).toFixed(2)}</td>
                  <td className="text-right px-4 py-3">{Number(category.percentage).toFixed(1)}%</td>
                  <td className="text-right px-4 py-3 text-gray-600">{category.transactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Categories */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">All Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.categoryBreakdown.map((category) => (
            <div key={category.categoryId} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold">{category.categoryName}</div>
                  <div className="text-sm text-gray-500 capitalize">{category.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${Number(category.amount).toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{Number(category.percentage).toFixed(1)}%</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(category.percentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-2">{category.transactionCount} transactions</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
