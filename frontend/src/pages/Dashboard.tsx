import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { formatCurrency } from '../utils/currencyFormatter';
import { useUserSettings } from '../hooks/useUserSettings';
import { useBudgetContext } from '../context/BudgetContext';
import { MetricCard, SpendingByCategory, RecentTransactions, UpcomingBills } from '../components/dashboard';
import { MonthSelector } from '../components/dashboard/MonthSelector';
import { DollarSign, Wallet, TrendingUp, AlertCircle, Target, TrendingDown } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/ui/loaders';
import { Tooltip, HelpIcon } from '../components/ui/tooltip';
import { useTheme } from '../context/ThemeContext';

interface Budget {
  id: number;
  month: number;
  year: number;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  transaction_date: string;
  category?: {
    id: number;
    name: string;
  };
  type?: 'income' | 'expense';
}

interface DashboardMetrics {
  totalSpending: number;
  budgetRemaining: number;
  budgetLimit: number;
  income: number;
  avgDailySpending: number;
  spendingTrend: number; // percentage change from last month
}

interface BillsSummary {
  totalUpcoming: number;
  billsDueThisMonth: number;
  overdueBills: number;
}

interface GoalsSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overallProgress: number;
}

interface UserIncomeData {
  gross_pay: number;
  net_pay: number;
  deductions: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { currency } = useUserSettings();
  const { isDark } = useTheme();
  const budgetContext = useBudgetContext();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [incomeData, setIncomeData] = useState<UserIncomeData | null>(null);
  const [billsSummary, setBillsSummary] = useState<BillsSummary | null>(null);
  const [goalsSummary, setGoalsSummary] = useState<GoalsSummary | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSpending: 0,
    budgetRemaining: 0,
    budgetLimit: 0,
    income: 0,
    avgDailySpending: 0,
    spendingTrend: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth, selectedYear]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load current budget
      let currentBudget: Budget | null = null;
      try {
        const budgetRes = await apiClient.getCurrentBudget();
        currentBudget = budgetRes.data;
        setBudget(currentBudget);
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Create budget for current month
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();
          try {
            const createRes = await apiClient.createBudget(month, year);
            currentBudget = createRes.data;
            setBudget(currentBudget);
          } catch (createErr) {
            console.error('Failed to create budget:', createErr);
          }
        }
      }

      // Load transactions
      const txnRes = await apiClient.getTransactions();
      const allTransactions = txnRes.data || [];
      setTransactions(allTransactions);

      // Load income data for selected month
      try {
        const incomeRes = await apiClient.getIncomeByMonth(selectedMonth, selectedYear);
        setIncomeData(incomeRes.data);
      } catch (incomeErr: any) {
        if (incomeErr.response?.status === 404) {
          setIncomeData(null);
        } else {
          console.error('Error loading income:', incomeErr);
        }
      }

      // Load bills summary
      try {
        const billsRes = await apiClient.getBillSummary();
        setBillsSummary(billsRes.data);
      } catch (billsErr) {
        console.error('Error loading bills:', billsErr);
      }

      // Load goals summary
      try {
        const goalsRes = await apiClient.getGoalSummary();
        setGoalsSummary(goalsRes.data);
      } catch (goalsErr) {
        console.error('Error loading goals:', goalsErr);
      }

      // Calculate metrics
      calculateMetrics(allTransactions, currentBudget);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      const errorMsg = 'Failed to load dashboard data. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (txns: Transaction[], currentBudget: Budget | null) => {
    // Filter transactions for selected month
    const selectedMonthTxns = txns.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate.getMonth() + 1 === selectedMonth && txDate.getFullYear() === selectedYear;
    });

    // Calculate spending and income
    const totalSpending = selectedMonthTxns
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const totalIncome = selectedMonthTxns
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate average daily spending
    const now = new Date();
    const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysElapsed = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth;
    const avgDailySpending = daysElapsed > 0 ? totalSpending / daysElapsed : 0;

    // Budget limit: Use income data if available, otherwise use context income, else default to 5000
    const budgetLimit = incomeData?.net_pay || budgetContext.incomeData?.availableForBudget || 5000;
    const budgetRemaining = Math.max(0, budgetLimit - totalSpending);

    // Calculate spending trend (compare to previous month)
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const prevMonthStart = new Date(prevYear, prevMonth - 1, 1);
    const prevMonthEnd = new Date(prevYear, prevMonth, 0);
    const prevMonthTxns = txns.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= prevMonthStart && txDate <= prevMonthEnd;
    });
    const prevMonthSpending = prevMonthTxns
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const spendingTrend = prevMonthSpending > 0
      ? Math.round(((totalSpending - prevMonthSpending) / prevMonthSpending) * 100)
      : 0;

    setMetrics({
      totalSpending: Number(totalSpending) || 0,
      budgetRemaining: Number(budgetRemaining) || 0,
      budgetLimit: Number(budgetLimit) || 0,
      income: Number(totalIncome) || 0,
      avgDailySpending: Number(avgDailySpending) || 0,
      spendingTrend: Number(spendingTrend) || 0,
    });
  };

  const handleViewAllTransactions = () => {
    navigate('/search');
  };

  const formatMonth = (month: number, year: number) => {
    return new Date(year, month - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary p-4 md:p-8">
        <div className="mb-8 space-y-4">
          <SkeletonCard count={1} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard count={4} />
          </div>
        </div>
      </div>
    );
  }

  const budgetPercentage = Math.round((metrics.totalSpending / metrics.budgetLimit) * 100);
  const budgetProgressColor =
    budgetPercentage >= 100
      ? 'bg-red-600'
      : budgetPercentage >= 80
      ? 'bg-amber-600'
      : 'bg-emerald-600';

  return (
    <div className="min-h-screen bg-primary p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-50 mb-3">Dashboard</h1>
            <MonthSelector
              month={selectedMonth}
              year={selectedYear}
              onMonthChange={(month, year) => {
                setSelectedMonth(month);
                setSelectedYear(year);
              }}
              isDark={isDark}
            />
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            <div className="text-2xl font-bold text-slate-50">
              {formatCurrency(metrics.totalSpending, currency)}
            </div>
            <p className="text-sm text-slate-400">of {formatCurrency(metrics.budgetLimit, currency)} budget</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Budget progress bar */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Budget Progress</span>
            <span className="text-sm font-semibold text-slate-50">{budgetPercentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${budgetProgressColor} transition-all duration-300`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          {budgetPercentage >= 100 && (
            <p className="text-xs text-red-400 mt-2">Budget exceeded by {formatCurrency(metrics.totalSpending - metrics.budgetLimit, currency)}</p>
          )}
        </div>
      </div>

      {/* Metrics Grid - Row 1: Income & Spending */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Tooltip content="Total gross income for the selected month" position="bottom">
          <MetricCard
            title="Gross Income"
            value={incomeData ? formatCurrency(incomeData.gross_pay, currency) : '—'}
            subtitle={incomeData ? `Net: ${formatCurrency(incomeData.net_pay, currency)}` : 'No data'}
            icon={<DollarSign className="w-5 h-5" />}
            variant="success"
          />
        </Tooltip>

        <Tooltip content="Deductions from gross income (taxes, etc.)" position="bottom">
          <MetricCard
            title="Deductions"
            value={incomeData ? formatCurrency(incomeData.deductions, currency) : '—'}
            subtitle={incomeData ? `${((incomeData.deductions / incomeData.gross_pay) * 100).toFixed(1)}% of gross` : 'No data'}
            icon={<TrendingDown className="w-5 h-5" />}
            variant="default"
          />
        </Tooltip>

        <Tooltip content="Total expenses for the selected month" position="bottom">
          <MetricCard
            title="Total Spending"
            value={formatCurrency(metrics.totalSpending, currency)}
            subtitle={`of ${formatCurrency(metrics.budgetLimit, currency)}`}
            icon={<DollarSign className="w-5 h-5" />}
            trend={{
              direction: metrics.spendingTrend > 0 ? 'up' : 'down',
              percent: Math.abs(metrics.spendingTrend),
              label: 'vs prev month',
            }}
            variant={budgetPercentage >= 100 ? 'danger' : budgetPercentage >= 80 ? 'warning' : 'default'}
          />
        </Tooltip>

        <Tooltip content="How much budget you have left" position="bottom">
          <MetricCard
            title="Budget Remaining"
            value={formatCurrency(metrics.budgetRemaining, currency)}
            subtitle={metrics.budgetRemaining > 0 ? 'On track' : 'Over budget'}
            icon={<Wallet className="w-5 h-5" />}
            variant={metrics.budgetRemaining > 0 ? 'success' : 'danger'}
          />
        </Tooltip>
      </div>

      {/* Metrics Grid - Row 2: Financial Health & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Tooltip content="Percentage of income spent this month" position="bottom">
          <MetricCard
            title="Budget Status"
            value={`${budgetPercentage}%`}
            subtitle={budgetPercentage > 100 ? 'Over budget' : 'Within budget'}
            icon={<Wallet className="w-5 h-5" />}
            variant={budgetPercentage > 100 ? 'danger' : budgetPercentage > 80 ? 'warning' : 'success'}
          />
        </Tooltip>

        <Tooltip content="(Income - Spending) / Income * 100" position="bottom">
          <MetricCard
            title="Savings Rate"
            value={incomeData ? `${Math.max(0, ((incomeData.net_pay - metrics.totalSpending) / incomeData.net_pay) * 100).toFixed(1)}%` : '—'}
            subtitle={incomeData && incomeData.net_pay > metrics.totalSpending ? 'Good savings' : 'Review spending'}
            icon={<TrendingUp className="w-5 h-5" />}
            variant={incomeData && incomeData.net_pay > metrics.totalSpending ? 'success' : 'warning'}
          />
        </Tooltip>

        <Tooltip content="Active financial goals in progress" position="bottom">
          <MetricCard
            title="Active Goals"
            value={goalsSummary?.activeGoals ?? '0'}
            subtitle={goalsSummary ? `${goalsSummary.completedGoals} completed` : 'Loading...'}
            icon={<Target className="w-5 h-5" />}
            variant="default"
          />
        </Tooltip>

        <Tooltip content="Overall progress toward all financial goals" position="bottom">
          <MetricCard
            title="Goals Progress"
            value={goalsSummary ? `${goalsSummary.overallProgress.toFixed(1)}%` : '—'}
            subtitle={goalsSummary ? `of ${goalsSummary.totalGoals} goals` : 'No data'}
            icon={<Target className="w-5 h-5" />}
            variant="success"
          />
        </Tooltip>
      </div>

      {/* Metrics Grid - Row 3: Bills & Daily Average */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Tooltip content="Bills due this month" position="bottom">
          <MetricCard
            title="Bills Due This Month"
            value={formatCurrency(billsSummary?.billsDueThisMonth ?? 0, currency)}
            subtitle={`${billsSummary?.overdueBills ?? 0} overdue`}
            icon={<DollarSign className="w-5 h-5" />}
            variant={billsSummary && billsSummary.overdueBills > 0 ? 'danger' : 'default'}
          />
        </Tooltip>

        <Tooltip content="Total upcoming bills in next 30 days" position="bottom">
          <MetricCard
            title="Total Upcoming"
            value={formatCurrency(billsSummary?.totalUpcoming ?? 0, currency)}
            subtitle="Next 30 days"
            icon={<AlertCircle className="w-5 h-5" />}
            variant="default"
          />
        </Tooltip>

        <Tooltip content="Average spending per day this month" position="bottom">
          <MetricCard
            title="Average Daily"
            value={formatCurrency(metrics.avgDailySpending, currency)}
            subtitle="Per day (selected month)"
            icon={<TrendingUp className="w-5 h-5" />}
            variant="default"
          />
        </Tooltip>

        <Tooltip content="Cumulative income for selected month" position="bottom">
          <MetricCard
            title="Net Income"
            value={incomeData ? formatCurrency(incomeData.net_pay, currency) : formatCurrency(metrics.income, currency)}
            subtitle="Selected month"
            icon={<DollarSign className="w-5 h-5" />}
            variant="success"
          />
        </Tooltip>
      </div>

      {/* Charts and details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Spending by category - spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          {budget && <SpendingByCategory budgetId={budget.id} currency={currency} />}
        </div>

        {/* Upcoming bills */}
        <div>
          <UpcomingBills maxItems={4} />
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <RecentTransactions
          transactions={transactions}
          maxItems={6}
          onViewAll={handleViewAllTransactions}
          currency={currency}
        />
      </div>
    </div>
  );
};

export default Dashboard;
