import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/ui/loaders';
import { HelpIcon } from '../components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface NetWorthSnapshot {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  trend: number;
  date: string;
}

interface DebtPayoffPlan {
  categoryId: number;
  categoryName: string;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  payoffMonths: number;
  totalInterestPaid: number;
  payoffDate: string;
  strategy: string;
}

interface TaxInsight {
  category: string;
  amount: number;
  estimatedTaxBenefit: number;
  recommendation: string;
}

interface SavingsRateAnalysis {
  totalIncome: number;
  totalExpenses: number;
  savingsAmount: number;
  savingsRate: number;
  savingsGoal: number;
  onTrack: boolean;
  recommendation: string;
}

const WellnessPage: React.FC = () => {
  const { error: showError } = useToast();
  const [netWorth, setNetWorth] = useState<NetWorthSnapshot | null>(null);
  const [debtPlans, setDebtPlans] = useState<DebtPayoffPlan[]>([]);
  const [taxInsights, setTaxInsights] = useState<TaxInsight[]>([]);
  const [savingsAnalysis, setSavingsAnalysis] = useState<SavingsRateAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [months, setMonths] = useState(6);

  useEffect(() => {
    loadWellnessData();
  }, [months]);

  const loadWellnessData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [netWorthRes, debtRes, taxRes, savingsRes] = await Promise.all([
        apiClient.get('/wellness/net-worth'),
        apiClient.get('/wellness/debt-payoff-plans'),
        apiClient.get('/wellness/tax-insights'),
        apiClient.get(`/wellness/savings-rate?months=${months}`),
      ]);

      setNetWorth(netWorthRes.data);
      setDebtPlans(debtRes.data || []);
      setTaxInsights(taxRes.data || []);
      setSavingsAnalysis(savingsRes.data);
    } catch (err: any) {
      console.error('Failed to load wellness data:', err);
      const errorMsg = 'Failed to load wellness data';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Wellness</h1>

      {error && <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded">{error}</div>}

      {/* Net Worth Overview */}
      {netWorth && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Net Worth Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Assets</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">${Number(netWorth.totalAssets).toFixed(2)}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Liabilities</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">${Number(netWorth.totalLiabilities).toFixed(2)}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Net Worth</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">${Number(netWorth.netWorth).toFixed(2)}</div>
            </div>
            <div className={`p-4 rounded ${netWorth.trend > 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
              <div className="text-sm text-gray-600 dark:text-gray-400">Trend (vs last)</div>
              <div className={`text-2xl font-bold ${netWorth.trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {netWorth.trend > 0 ? '+' : ''}${Number(netWorth.trend).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Savings Rate Analysis */}
      {savingsAnalysis && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Savings Rate Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">${Number(savingsAnalysis.totalIncome).toFixed(2)}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Expenses</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">${Number(savingsAnalysis.totalExpenses).toFixed(2)}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 dark:from-blue-900 to-green-50 dark:to-green-900 p-4 rounded mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Number(savingsAnalysis.savingsRate).toFixed(1)}%</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">Goal: {savingsAnalysis.savingsGoal}%</div>
            <div className={`text-sm mt-2 ${savingsAnalysis.onTrack ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {savingsAnalysis.onTrack ? '✓ On track!' : '⚠️ Below target'}
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300">{savingsAnalysis.recommendation}</p>
          <div className="mt-4 flex gap-2">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-4 py-2 rounded ${months === m ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'}`}
              >
                Last {m} months
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Debt Payoff Plans */}
      {debtPlans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Debt Payoff Plans</h2>
          <div className="space-y-4">
            {debtPlans.map((plan) => (
              <div key={plan.categoryId} className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{plan.categoryName}</h3>
                  <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">{plan.strategy}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Current Balance</div>
                    <div className="font-bold text-gray-900 dark:text-white">${Number(plan.currentBalance).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Monthly Payment</div>
                    <div className="font-bold text-gray-900 dark:text-white">${Number(plan.monthlyPayment).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Payoff Timeline</div>
                    <div className="font-bold text-gray-900 dark:text-white">{plan.payoffMonths} months</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Interest Cost</div>
                    <div className="font-bold text-red-600 dark:text-red-400">${Number(plan.totalInterestPaid).toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Payoff Date: {new Date(plan.payoffDate).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Insights */}
      {taxInsights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Tax Deduction Opportunities</h2>
          <div className="space-y-4">
            {taxInsights.map((insight) => (
              <div key={insight.category} className="border border-gray-200 dark:border-gray-700 rounded p-4 bg-yellow-50 dark:bg-yellow-900">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{insight.category}</h3>
                  <span className="text-green-600 dark:text-green-400 font-bold">Saves ~${Number(insight.estimatedTaxBenefit).toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Total amount: ${Number(insight.amount).toFixed(2)}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{insight.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {debtPlans.length === 0 && taxInsights.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">No financial wellness data available. Add transactions to get started.</div>
      )}
    </div>
  );
};

export default WellnessPage;
