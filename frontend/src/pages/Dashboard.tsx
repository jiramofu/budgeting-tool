import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { formatCurrency } from '../utils/currencyFormatter';
import { useUserSettings } from '../hooks/useUserSettings';
import { MetricCard, SpendingByCategory, RecentTransactions, UpcomingBills } from '../components/dashboard';
import { DollarSign, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/ui/loaders';
import { Tooltip, HelpIcon } from '../components/ui/tooltip';

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { currency } = useUserSettings();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
  }, []);

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
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Filter transactions for current month
    const currentMonthTxns = txns.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate.getMonth() + 1 === currentMonth && txDate.getFullYear() === currentYear;
    });

    // Calculate spending and income
    const totalSpending = currentMonthTxns
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const totalIncome = currentMonthTxns
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate average daily spending
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysElapsed = Math.max(1, now.getDate());
    const avgDailySpending = totalSpending / daysElapsed;

    // Budget remaining (assuming default limit of 5000)
    const budgetLimit = 5000;
    const budgetRemaining = Math.max(0, budgetLimit - totalSpending);

    // Calculate spending trend (compare to last month)
    const lastMonthStart = new Date(currentYear, currentMonth - 2, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0);
    const lastMonthTxns = txns.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= lastMonthStart && txDate <= lastMonthEnd;
    });
    const lastMonthSpending = lastMonthTxns
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const spendingTrend = lastMonthSpending > 0
      ? Math.round(((totalSpending - lastMonthSpending) / lastMonthSpending) * 100)
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-50 mb-1">Dashboard</h1>
            <p className="text-slate-400">
              {budget && formatMonth(budget.month, budget.year)}
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Tooltip content="Total expenses for the current month" position="bottom">
          <MetricCard
            title="Total Spending"
            value={formatCurrency(metrics.totalSpending, currency)}
            subtitle={`of ${formatCurrency(metrics.budgetLimit, currency)}`}
            icon={<DollarSign className="w-5 h-5" />}
            trend={{
              direction: metrics.spendingTrend > 0 ? 'up' : 'down',
              percent: Math.abs(metrics.spendingTrend),
              label: 'vs last month',
            }}
            variant={budgetPercentage >= 100 ? 'danger' : budgetPercentage >= 80 ? 'warning' : 'default'}
          />
        </Tooltip>

        <Tooltip content="How much budget you have left this month" position="bottom">
          <MetricCard
            title="Budget Remaining"
            value={formatCurrency(metrics.budgetRemaining, currency)}
            subtitle={metrics.budgetRemaining > 0 ? 'You\'re on track' : 'Over budget'}
            icon={<Wallet className="w-5 h-5" />}
            variant={metrics.budgetRemaining > 0 ? 'success' : 'danger'}
          />
        </Tooltip>

        <Tooltip content="Average spending per day based on days elapsed" position="bottom">
          <MetricCard
            title="Average Daily"
            value={formatCurrency(metrics.avgDailySpending, currency)}
            subtitle="This month"
            icon={<TrendingUp className="w-5 h-5" />}
            variant="default"
          />
        </Tooltip>

        <Tooltip content="Total income received this month" position="bottom">
          <MetricCard
            title="Income"
            value={formatCurrency(metrics.income, currency)}
            subtitle="This month"
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
