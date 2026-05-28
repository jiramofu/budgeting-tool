import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface CategoryAnalytics {
  categoryId: number;
  categoryName: string;
  totalSpent: number;
  budgetTarget: number;
  percentageOfBudget: number;
  transactionCount: number;
  averageTransaction: number;
  trend: 'up' | 'stable' | 'down';
  trendPercentage: number;
}

interface MonthlyAnalytics {
  year: number;
  month: number;
  monthName: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  categories: CategoryAnalytics[];
  savingsRate: number;
  averageDailySpend: number;
}

interface AnalyticsSummary {
  currentMonth: MonthlyAnalytics;
  lastMonth: MonthlyAnalytics;
  yearToDate: MonthlyAnalytics;
  lastYear: MonthlyAnalytics;
  monthlyTrend: MonthlyAnalytics[];
  topCategories: CategoryAnalytics[];
  budgetComplianceRate: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'categories'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/phase4/analytics/summary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  const monthlyTrendData = summary.monthlyTrend.map((m) => ({
    month: m.monthName,
    income: m.totalIncome,
    expenses: m.totalExpenses,
    netCashFlow: m.netCashFlow,
  }));

  const categoryChartData = summary.topCategories.map((c) => ({
    name: c.categoryName,
    value: c.totalSpent,
  }));

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') {
      return <TrendingUp size={16} className="text-red-600" />;
    } else if (trend === 'down') {
      return <TrendingDown size={16} className="text-green-600" />;
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Spending Analytics</h1>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Current Month Income</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary.currentMonth.totalIncome)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Current Month Expenses</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(summary.currentMonth.totalExpenses)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Savings Rate</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.currentMonth.savingsRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Budget Compliance</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.budgetComplianceRate.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {(['overview', 'trends', 'categories'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Monthly Comparison */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Month Comparison</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Current Month', data: summary.currentMonth },
                    { label: 'Last Month', data: summary.lastMonth },
                    { label: 'Year-to-Date', data: summary.yearToDate },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 dark:text-white mb-3">{item.label}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Income:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(item.data.totalIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Expenses:</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {formatCurrency(item.data.totalExpenses)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-400">Net Cash Flow:</span>
                          <span
                            className={`font-medium ${
                              item.data.netCashFlow >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {formatCurrency(item.data.netCashFlow)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Categories Pie Chart */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Spending Categories
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends (Last 12 Months)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  <Bar dataKey="netCashFlow" fill="#3b82f6" name="Net Cash Flow" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Spent</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Budget</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">% of Budget</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.currentMonth.categories.map((category) => (
                      <tr key={category.categoryId} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{category.categoryName}</td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(category.totalSpent)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {category.budgetTarget > 0 ? formatCurrency(category.budgetTarget) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  category.percentageOfBudget > 100
                                    ? 'bg-red-600'
                                    : category.percentageOfBudget > 80
                                    ? 'bg-yellow-600'
                                    : 'bg-green-600'
                                }`}
                                style={{ width: `${Math.min(category.percentageOfBudget, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
                              {category.percentageOfBudget.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {getTrendIcon(category.trend, category.trendPercentage)}
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {category.trendPercentage > 0 ? '+' : ''}
                              {category.trendPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
