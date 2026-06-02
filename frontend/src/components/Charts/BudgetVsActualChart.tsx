import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { apiClient } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useUserSettings } from '../../hooks/useUserSettings';
import { BarChart3 } from 'lucide-react';

interface ChartData {
  category: string;
  Budgeted: number;
  Actual: number;
  Variance: number;
}

const BudgetVsActualChart: React.FC = () => {
  const { isDark } = useTheme();
  const { currency } = useUserSettings();
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBudgetVsActual();
  }, []);

  const loadBudgetVsActual = async () => {
    try {
      setIsLoading(true);
      setError('');

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Fetch monthly analytics for current month
      const analyticsRes = await apiClient.getAnalyticsForMonth(
        currentYear,
        currentMonth
      );
      const monthAnalytics = analyticsRes.data;

      // Get budget for current month
      const budgetRes = await apiClient.getCurrentBudget();
      const budget = budgetRes.data;

      if (!budget) {
        setError('No budget found for current month');
        setIsLoading(false);
        return;
      }

      // Fetch budget targets for all categories
      const categoriesRes = await apiClient.getCategories();
      const categories = categoriesRes.data || [];

      // Build chart data
      const chartData: ChartData[] = [];

      for (const category of categories) {
        // Get budgeted amount
        const budgetTarget = monthAnalytics?.categoryAnalytics?.find(
          (ca: any) => ca.categoryId === category.id
        );
        const budgeted = budgetTarget?.budget || 0;
        const actual = Math.abs(budgetTarget?.totalSpend || 0);
        const variance = actual - budgeted;

        if (budgeted > 0 || actual > 0) {
          chartData.push({
            category: category.name,
            Budgeted: Math.round(budgeted * 100) / 100,
            Actual: Math.round(actual * 100) / 100,
            Variance: Math.round(variance * 100) / 100,
          });
        }
      }

      // Sort by budgeted amount descending
      chartData.sort((a, b) => b.Budgeted - a.Budgeted);

      // Limit to top 8 categories for readability
      setData(chartData.slice(0, 8));
    } catch (err: any) {
      console.error('Error loading budget vs actual:', err);
      setError('Failed to load budget comparison data');
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOverBudget = data.Actual > data.Budgeted;
      return (
        <div
          className={`p-3 rounded-lg border ${
            isDark
              ? 'bg-slate-900 border-slate-700'
              : 'bg-white border-slate-300'
          }`}
        >
          <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>
            {data.category}
          </p>
          <p className="text-sm text-blue-400">
            Budgeted: ${data.Budgeted.toFixed(2)}
          </p>
          <p className={`text-sm ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
            Actual: ${data.Actual.toFixed(2)}
          </p>
          <p className={`text-sm font-semibold ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
            {isOverBudget ? '+' : ''}${data.Variance.toFixed(2)} {isOverBudget ? 'over' : 'under'}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm h-96 flex items-center justify-center">
        <p className="text-slate-400">Loading budget vs actual data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm h-96 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-slate-50">Budget vs Actual</h3>
        <p className="text-xs text-slate-400 ml-auto">(Current month, top categories)</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#334155' : '#cbd5e1'}
            opacity={0.5}
          />
          <XAxis
            type="number"
            stroke={isDark ? '#94a3b8' : '#475569'}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            dataKey="category"
            type="category"
            stroke={isDark ? '#94a3b8' : '#475569'}
            style={{ fontSize: '11px' }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="Budgeted" fill="#3b82f6" />
          <Bar dataKey="Actual" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BudgetVsActualChart;
