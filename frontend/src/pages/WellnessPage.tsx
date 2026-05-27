import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
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
      setError('Failed to load wellness data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading wellness data...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Financial Wellness</h1>

      {error && <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      {/* Net Worth Overview */}
      {netWorth && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Net Worth Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-gray-600">Total Assets</div>
              <div className="text-2xl font-bold text-blue-600">${Number(netWorth.totalAssets).toFixed(2)}</div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-sm text-gray-600">Total Liabilities</div>
              <div className="text-2xl font-bold text-red-600">${Number(netWorth.totalLiabilities).toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-sm text-gray-600">Net Worth</div>
              <div className="text-2xl font-bold text-green-600">${Number(netWorth.netWorth).toFixed(2)}</div>
            </div>
            <div className={`p-4 rounded ${netWorth.trend > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-sm text-gray-600">Trend (vs last)</div>
              <div className={`text-2xl font-bold ${netWorth.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netWorth.trend > 0 ? '+' : ''}${Number(netWorth.trend).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Savings Rate Analysis */}
      {savingsAnalysis && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Savings Rate Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-gray-600">Monthly Income</div>
              <div className="text-2xl font-bold text-blue-600">${Number(savingsAnalysis.totalIncome).toFixed(2)}</div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-sm text-gray-600">Monthly Expenses</div>
              <div className="text-2xl font-bold text-red-600">${Number(savingsAnalysis.totalExpenses).toFixed(2)}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded mb-4">
            <div className="text-sm text-gray-600">Savings Rate</div>
            <div className="text-3xl font-bold text-blue-600">{Number(savingsAnalysis.savingsRate).toFixed(1)}%</div>
            <div className="text-sm text-gray-700 mt-2">Goal: {savingsAnalysis.savingsGoal}%</div>
            <div className={`text-sm mt-2 ${savingsAnalysis.onTrack ? 'text-green-600' : 'text-orange-600'}`}>
              {savingsAnalysis.onTrack ? '✓ On track!' : '⚠️ Below target'}
            </div>
          </div>
          <p className="text-gray-700">{savingsAnalysis.recommendation}</p>
          <div className="mt-4 flex gap-2">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-4 py-2 rounded ${months === m ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Last {m} months
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Debt Payoff Plans */}
      {debtPlans.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Debt Payoff Plans</h2>
          <div className="space-y-4">
            {debtPlans.map((plan) => (
              <div key={plan.categoryId} className="border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{plan.categoryName}</h3>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{plan.strategy}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-600">Current Balance</div>
                    <div className="font-bold">${Number(plan.currentBalance).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Monthly Payment</div>
                    <div className="font-bold">${Number(plan.monthlyPayment).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Payoff Timeline</div>
                    <div className="font-bold">{plan.payoffMonths} months</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Interest Cost</div>
                    <div className="font-bold text-red-600">${Number(plan.totalInterestPaid).toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600">Payoff Date: {new Date(plan.payoffDate).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Insights */}
      {taxInsights.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Tax Deduction Opportunities</h2>
          <div className="space-y-4">
            {taxInsights.map((insight) => (
              <div key={insight.category} className="border border-gray-200 rounded p-4 bg-yellow-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{insight.category}</h3>
                  <span className="text-green-600 font-bold">Saves ~${Number(insight.estimatedTaxBenefit).toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-700 mb-2">Total amount: ${Number(insight.amount).toFixed(2)}</div>
                <p className="text-sm text-gray-600">{insight.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {debtPlans.length === 0 && taxInsights.length === 0 && (
        <div className="text-center py-8 text-gray-600">No financial wellness data available. Add transactions to get started.</div>
      )}
    </div>
  );
};

export default WellnessPage;
