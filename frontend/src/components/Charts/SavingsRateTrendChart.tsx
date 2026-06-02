import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp } from 'lucide-react';

interface SavingsRateData {
  month: string;
  year: number;
  rate: number;
}

interface ChartData {
  month: string;
  'Savings Rate (%)': number;
}

const SavingsRateTrendChart: React.FC = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSavingsRateTrend();
  }, []);

  const loadSavingsRateTrend = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get current year
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();

      // Fetch yearly analytics to get spending trends
      const analyticsRes = await apiClient.getAnalyticsForYear(currentYear);
      const analytics = analyticsRes.data;

      // Fetch income data for all months
      const incomePromises = [];
      for (let month = 1; month <= 12; month++) {
        incomePromises.push(
          apiClient.getIncomeByMonth(month, currentYear).catch(() => null)
        );
      }
      const incomeResults = await Promise.all(incomePromises);

      // Calculate savings rate for each month
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      const chartData: ChartData[] = monthNames.map((month, index) => {
        const monthNum = index + 1;

        // Get income data
        const incomeData = incomeResults[index]?.data;
        const netIncome = incomeData?.net_pay || 0;

        // Get spending from analytics
        const monthAnalytics = analytics?.monthlyAnalytics?.[monthNum];
        const totalSpending = monthAnalytics?.totalExpenses || 0;

        // Calculate savings rate: (Net Income - Spending) / Net Income * 100
        const savingsRate =
          netIncome > 0
            ? Math.max(0, ((netIncome - totalSpending) / netIncome) * 100)
            : 0;

        return {
          month,
          'Savings Rate (%)': Math.round(savingsRate * 10) / 10, // Round to 1 decimal
        };
      });

      setData(chartData);
    } catch (err: any) {
      console.error('Error loading savings rate trend:', err);
      setError('Failed to load savings rate data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm h-96 flex items-center justify-center">
        <p className="text-slate-400">Loading savings rate data...</p>
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
        <TrendingUp className="w-5 h-5 text-teal-400" />
        <h3 className="text-lg font-semibold text-slate-50">Savings Rate Trend</h3>
        <p className="text-xs text-slate-400 ml-auto">(Last 12 months)</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
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
            label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
              borderRadius: '8px',
              color: isDark ? '#e2e8f0' : '#1e293b',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Savings Rate']}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="Savings Rate (%)"
            stroke="#14b8a6"
            dot={{ fill: '#14b8a6', r: 4 }}
            activeDot={{ r: 6 }}
            strokeWidth={2}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SavingsRateTrendChart;
