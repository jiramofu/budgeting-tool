import React, { useState, useMemo } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter';
import { useUserSettings } from '../hooks/useUserSettings';
import {
  ReportTabs,
  ReportType,
  TimeSelector,
  TimePeriod,
  SpendingChart,
  CategoryBreakdown,
} from '../components/reports';
import { useToast } from '../hooks/useToast';
import { Tooltip, HelpIcon } from '../components/ui/tooltip';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

interface ChartDataPoint {
  date: string;
  spending: number;
  budget: number;
  income: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

const ReportsPage: React.FC = () => {
  const { success, error: showError } = useToast();
  const { currency } = useUserSettings();
  const [activeReport, setActiveReport] = useState<ReportType>('spending-trend');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Mock transactions
  const mockTransactions: Transaction[] = [
    { id: 1, date: '2026-05-28', amount: -85.32, category: 'Groceries', type: 'expense' },
    { id: 2, date: '2026-05-28', amount: 5000, category: 'Salary', type: 'income' },
    { id: 3, date: '2026-05-27', amount: -14.50, category: 'Dining', type: 'expense' },
    { id: 4, date: '2026-05-27', amount: -12.75, category: 'Transportation', type: 'expense' },
    { id: 5, date: '2026-05-26', amount: -15.99, category: 'Entertainment', type: 'expense' },
    { id: 6, date: '2026-05-26', amount: -32.45, category: 'Healthcare', type: 'expense' },
    { id: 7, date: '2026-05-25', amount: -52.00, category: 'Transportation', type: 'expense' },
    { id: 8, date: '2026-05-25', amount: -67.89, category: 'Shopping', type: 'expense' },
    { id: 9, date: '2026-05-24', amount: -5.75, category: 'Dining', type: 'expense' },
    { id: 10, date: '2026-05-24', amount: -42.99, category: 'Shopping', type: 'expense' },
    { id: 11, date: '2026-05-23', amount: -28.50, category: 'Groceries', type: 'expense' },
    { id: 12, date: '2026-05-23', amount: -8.99, category: 'Entertainment', type: 'expense' },
    { id: 13, date: '2026-05-22', amount: -125.00, category: 'Utilities', type: 'expense' },
    { id: 14, date: '2026-05-22', amount: -45.30, category: 'Dining', type: 'expense' },
    { id: 15, date: '2026-05-21', amount: -200.00, category: 'Healthcare', type: 'expense' },
    { id: 16, date: '2026-05-20', amount: -89.99, category: 'Shopping', type: 'expense' },
    { id: 17, date: '2026-05-19', amount: -55.00, category: 'Groceries', type: 'expense' },
    { id: 18, date: '2026-05-19', amount: -18.75, category: 'Dining', type: 'expense' },
    { id: 19, date: '2026-05-18', amount: -95.50, category: 'Transportation', type: 'expense' },
    { id: 20, date: '2026-05-17', amount: -150.00, category: 'Entertainment', type: 'expense' },
  ];

  const getDateRange = (
    period: TimePeriod
  ): { start: Date; end: Date } => {
    const today = new Date();
    const end = new Date(today);
    let start = new Date(today);

    switch (period) {
      case 'week':
        start.setDate(today.getDate() - today.getDay());
        break;
      case 'month':
        start.setDate(1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        break;
      case 'year':
        start.setMonth(0, 1);
        break;
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : today,
          end: customEndDate ? new Date(customEndDate) : today,
        };
    }

    return { start, end };
  };

  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    return mockTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }, [selectedPeriod, customStartDate, customEndDate]);

  const spendingChartData = useMemo((): ChartDataPoint[] => {
    const dailyData: Record<string, { spending: number; income: number }> = {};

    filteredTransactions.forEach((t) => {
      if (!dailyData[t.date]) {
        dailyData[t.date] = { spending: 0, income: 0 };
      }

      if (t.type === 'expense') {
        dailyData[t.date].spending += Math.abs(t.amount);
      } else {
        dailyData[t.date].income += t.amount;
      }
    });

    return Object.entries(dailyData)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        spending: Math.round(data.spending * 100) / 100,
        income: Math.round(data.income * 100) / 100,
        budget: 150,
      }));
  }, [filteredTransactions]);

  const categoryData = useMemo((): CategoryData[] => {
    const categoryTotals: Record<string, number> = {};
    let totalSpending = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'expense') {
        if (!categoryTotals[t.category]) {
          categoryTotals[t.category] = 0;
        }
        categoryTotals[t.category] += Math.abs(t.amount);
        totalSpending += Math.abs(t.amount);
      }
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        percentage: totalSpending > 0 ? (value / totalSpending) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyComparison = useMemo((): ChartDataPoint[] => {
    const monthlyData: Record<string, { spending: number; income: number }> = {};

    mockTransactions.forEach((t) => {
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { spending: 0, income: 0 };
      }

      if (t.type === 'expense') {
        monthlyData[month].spending += Math.abs(t.amount);
      } else {
        monthlyData[month].income += t.amount;
      }
    });

    return Object.entries(monthlyData)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => ({
        date: new Date(date + '-01').toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        spending: Math.round(data.spending * 100) / 100,
        income: Math.round(data.income * 100) / 100,
        budget: 5000,
      }));
  }, []);

  const totalSpending = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const averageDailySpending =
    spendingChartData.length > 0
      ? totalSpending / spendingChartData.length
      : 0;

  const handleExportPDF = () => {
    try {
      const content = `
Spending Report
Period: ${selectedPeriod}

Summary:
- Total Spending: ${formatCurrency(totalSpending, currency)}
- Total Income: ${formatCurrency(totalIncome, currency)}
- Net: ${formatCurrency(totalIncome - totalSpending, currency)}
- Average Daily Spending: ${formatCurrency(averageDailySpending, currency)}

Categories:
${categoryData.map((cat) => `- ${cat.name}: ${formatCurrency(cat.value, currency)} (${cat.percentage.toFixed(1)}%)`).join('\n')}
    `.trim();

      const element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
      );
      element.setAttribute('download', `report-${selectedPeriod}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      success('Report exported successfully');
    } catch (err) {
      showError('Failed to export report');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-50 mb-1">Reports</h1>
        <p className="text-slate-400">Financial analysis and insights</p>
      </div>

      {/* Export button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-50 font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Time period selector */}
      <TimeSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
      />

      {/* Report type tabs */}
      <ReportTabs activeReport={activeReport} onReportChange={setActiveReport} />

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Tooltip content="All expenses in the selected period" position="bottom">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
            <p className="text-slate-400 text-sm font-medium mb-2">Total Spending</p>
            <p className="text-3xl font-bold text-red-400 mb-1">
              {formatCurrency(totalSpending, currency)}
            </p>
            <p className="text-xs text-slate-500">{filteredTransactions.filter(t => t.type === 'expense').length} transactions</p>
          </div>
        </Tooltip>

        <Tooltip content="All income received in the selected period" position="bottom">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
            <p className="text-slate-400 text-sm font-medium mb-2">Total Income</p>
            <p className="text-3xl font-bold text-green-400 mb-1">
              {formatCurrency(totalIncome, currency)}
            </p>
            <p className="text-xs text-slate-500">{filteredTransactions.filter(t => t.type === 'income').length} transactions</p>
          </div>
        </Tooltip>

        <Tooltip content="Total income minus total expenses for the period" position="bottom">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
            <p className="text-slate-400 text-sm font-medium mb-2">Net Change</p>
            <p className={`text-3xl font-bold mb-1 ${
              totalIncome - totalSpending >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(totalIncome - totalSpending, currency)}
            </p>
            <p className="text-xs text-slate-500">Income - Expenses</p>
          </div>
        </Tooltip>

        <Tooltip content="Average daily spending across the selected period" position="bottom">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
            <p className="text-slate-400 text-sm font-medium mb-2">Daily Average</p>
            <p className="text-3xl font-bold text-slate-50 mb-1">
              {formatCurrency(averageDailySpending, currency)}
            </p>
            <p className="text-xs text-slate-500">Per day</p>
          </div>
        </Tooltip>
      </div>

      {/* Report content */}
      {activeReport === 'spending-trend' && (
        <SpendingChart
          data={spendingChartData}
          title="Daily Spending Trend"
          subtitle="Your spending over time"
          chartType="line"
          showBudget={true}
          showIncome={true}
          height={350}
        />
      )}

      {activeReport === 'category-breakdown' && (
        <CategoryBreakdown
          data={categoryData}
          title="Spending by Category"
          subtitle="Where your money goes"
        />
      )}

      {activeReport === 'monthly-comparison' && (
        <SpendingChart
          data={monthlyComparison}
          title="Monthly Comparison"
          subtitle="Month-over-month spending trends"
          chartType="bar"
          showBudget={true}
          height={350}
        />
      )}

      {activeReport === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown
              data={categoryData.slice(0, 5)}
              title="Top 5 Categories"
              subtitle="Your biggest spending areas"
            />

            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-50 mb-4">Key Insights</h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                  <p className="text-sm font-medium text-slate-50 mb-1">Highest Category</p>
                  <p className="text-sm text-slate-400">
                    {categoryData.length > 0
                      ? `${categoryData[0].name} at ${formatCurrency(categoryData[0].value, currency)}`
                      : 'No data'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                  <p className="text-sm font-medium text-slate-50 mb-1">Average Transaction</p>
                  <p className="text-sm text-slate-400">
                    {filteredTransactions.filter(t => t.type === 'expense').length > 0
                      ? formatCurrency(totalSpending / filteredTransactions.filter(t => t.type === 'expense').length, currency)
                      : formatCurrency(0, currency)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                  <p className="text-sm font-medium text-slate-50 mb-1">Categories</p>
                  <p className="text-sm text-slate-400">
                    {categoryData.length} spending categor{categoryData.length === 1 ? 'y' : 'ies'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                  <p className="text-sm font-medium text-slate-50 mb-1">Savings Rate</p>
                  <p className="text-sm text-slate-400">
                    {totalIncome > 0
                      ? (((totalIncome - totalSpending) / totalIncome) * 100).toFixed(1)
                      : '0'}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          <SpendingChart
            data={monthlyComparison}
            title="6-Month Trend"
            subtitle="Historical spending patterns"
            chartType="bar"
            showBudget={true}
            height={300}
          />
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
