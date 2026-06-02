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
} from 'recharts';
import { apiClient } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useUserSettings } from '../../hooks/useUserSettings';
import { DollarSign } from 'lucide-react';

interface ChartData {
  month: string;
  Income: number;
  Spending: number;
  Surplus: number;
}

const IncomeVsSpendingChart: React.FC = () => {
  const { isDark } = useTheme();
  const { currency } = useUserSettings();
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadIncomeVsSpending();
  }, []);

  const loadIncomeVsSpending = async () => {
    try {
      setIsLoading(true);
      setError('');

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();

      // Fetch yearly analytics for spending
      const analyticsRes = await apiClient.getAnalyticsForYear(currentYear);
      const analytics = analyticsRes.data || {};

      // Fetch income data for all months
      const incomePromises = [];
      for (let month = 1; month <= 12; month++) {
        incomePromises.push(
          apiClient.getIncomeByMonth(month, currentYear).catch(() => null)
        );
      }
      const incomeResults = await Promise.all(incomePromises);

      // Build chart data
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      const chartData: ChartData[] = monthNames.map((month, index) => {
        const monthNum = index + 1;

        // Get income
        const incomeData = incomeResults[index]?.data;
        const income = incomeData?.net_pay || 0;

        // Get spending
        const monthAnalytics = analytics?.monthlyAnalytics?.[monthNum];
        const spending = Math.abs(monthAnalytics?.totalExpenses || 0);

        // Calculate surplus/deficit
        const surplus = income - spending;

        return {
          month,
          Income: Math.round(income * 100) / 100,
          Spending: Math.round(spending * 100) / 100,
          Surplus: Math.round(surplus * 100) / 100,
        };
      });

      setData(chartData);
    } catch (err: any) {
      console.error('Error loading income vs spending:', err);
      setError('Failed to load income and spending data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm h-96 flex items-center justify-center">
        <p className="text-slate-400">Loading income vs spending data...</p>
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
        <DollarSign className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-slate-50">Income vs Spending</h3>
        <p className="text-xs text-slate-400 ml-auto">(Last 12 months)</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#334155' : '#cbd5e1'}
            opacity={0.5}
          />
          <XAxis
            dataKey="month"
            stroke={isDark ? '#94a3b8' : '#475569'}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={isDark ? '#94a3b8' : '#475569'}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
              borderRadius: '8px',
              color: isDark ? '#e2e8f0' : '#1e293b',
            }}
            formatter={(value: number) => `$${value.toFixed(2)}`}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="Income" fill="#10b981" />
          <Bar dataKey="Spending" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeVsSpendingChart;
