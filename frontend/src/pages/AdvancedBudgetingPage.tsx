import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/ui/loaders';
import { Tooltip, HelpIcon } from '../components/ui/tooltip';

interface EnvelopeStatus {
  categoryId: number;
  categoryName: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
}

interface BudgetAlert {
  categoryId: number;
  categoryName: string;
  spent: number;
  budgeted: number;
  percentageUsed: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

interface BudgetRecommendation {
  categoryId: number;
  categoryName: string;
  recommendedBudget: number;
  historicalAverage: number;
  peakSpending: number;
  confidence: number;
}

interface AdherenceRecord {
  period: string;
  transactionCount: number;
  averageTransaction: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

const AdvancedBudgetingPage: React.FC = () => {
  const { error: showError } = useToast();
  const [envelopes, setEnvelopes] = useState<EnvelopeStatus[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);
  const [adherence, setAdherence] = useState<AdherenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [adherenceMonths, setAdherenceMonths] = useState(3);

  useEffect(() => {
    loadBudgetingData();
  }, [selectedMonth, selectedYear, adherenceMonths]);

  const loadBudgetingData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [envelopesRes, alertsRes, recsRes, adherenceRes] = await Promise.all([
        apiClient.get(`/budgeting/envelopes/${selectedYear}/${selectedMonth}`),
        apiClient.get(`/budgeting/alerts/${selectedYear}/${selectedMonth}`),
        apiClient.get('/budgeting/recommendations'),
        apiClient.get(`/budgeting/adherence?months=${adherenceMonths}`),
      ]);

      setEnvelopes(envelopesRes.data || []);
      setAlerts(alertsRes.data || []);
      setRecommendations(recsRes.data || []);
      setAdherence(adherenceRes.data || []);
    } catch (err: any) {
      console.error('Failed to load budgeting data:', err);
      const errorMsg = 'Failed to load budgeting data';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (percentageUsed: number) => {
    if (percentageUsed > 100) return 'bg-red-600';
    if (percentageUsed > 85) return 'bg-yellow-600';
    if (percentageUsed > 75) return 'bg-orange-600';
    return 'bg-green-600';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SkeletonCard count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Budgeting</h1>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded">{error}</div>}

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Budget Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.categoryId} className="border-l-4 border-red-600 bg-red-50 dark:bg-red-900 p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                      <h3 className="font-bold text-gray-900 dark:text-white">{alert.categoryName}</h3>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">{Math.round(alert.percentageUsed)}%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ${Number(alert.spent).toFixed(2)} / ${Number(alert.budgeted).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Envelope Budgeting (Zero-Based) */}
      {envelopes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Envelopes (Zero-Based Budget)</h2>
            <HelpIcon text="Allocate every dollar to a specific category. When an envelope is empty, you've spent all that category's budget." position="top" />
          </div>
          <div className="space-y-4">
            {envelopes.map((envelope) => (
              <div key={envelope.categoryId} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{envelope.categoryName}</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ${Number(envelope.spent).toFixed(2)} / ${Number(envelope.allocated).toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 rounded-full ${getStatusColor(envelope.percentageUsed)}`}
                    style={{ width: `${Math.min(envelope.percentageUsed, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{Math.round(envelope.percentageUsed)}% used</span>
                  <span className={`text-sm font-bold ${envelope.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {envelope.remaining >= 0 ? '+' : ''}${Number(envelope.remaining).toFixed(2)} remaining
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Budget Recommendations</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Based on your spending history, here are recommended budget amounts for next month.</p>
          <div className="space-y-4">
            {recommendations
              .sort((a, b) => b.recommendedBudget - a.recommendedBudget)
              .map((rec) => (
                <div key={rec.categoryId} className="border border-gray-200 dark:border-gray-700 rounded p-4 bg-blue-50 dark:bg-blue-900">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">{rec.categoryName}</h3>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">${Number(rec.recommendedBudget).toFixed(2)}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Recommended</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">6-Month Average</div>
                      <div className="font-bold text-gray-900 dark:text-white">${Number(rec.historicalAverage).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">Peak Spending</div>
                      <div className="font-bold text-gray-900 dark:text-white">${Number(rec.peakSpending).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-gray-300 dark:bg-gray-600 rounded h-2">
                      <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded" style={{ width: `${rec.confidence}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{rec.confidence.toFixed(0)}% confidence</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Budget Adherence */}
      {adherence.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Adherence History</h2>
            <div className="flex gap-2">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setAdherenceMonths(m)}
                  className={`px-4 py-2 rounded ${
                    adherenceMonths === m ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left py-2 text-gray-900 dark:text-white">Period</th>
                  <th className="text-right py-2 text-gray-900 dark:text-white">Income</th>
                  <th className="text-right py-2 text-gray-900 dark:text-white">Expenses</th>
                  <th className="text-right py-2 text-gray-900 dark:text-white">Net Cash Flow</th>
                  <th className="text-right py-2 text-gray-900 dark:text-white">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {adherence.map((record) => (
                  <tr key={record.period} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 font-bold text-gray-900 dark:text-white">{record.period}</td>
                    <td className="text-right text-green-600 dark:text-green-400">${Number(record.totalIncome).toFixed(2)}</td>
                    <td className="text-right text-red-600 dark:text-red-400">${Number(record.totalExpenses).toFixed(2)}</td>
                    <td className={`text-right font-bold ${record.netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${Number(record.netCashFlow).toFixed(2)}
                    </td>
                    <td className="text-right text-gray-600 dark:text-gray-400">{record.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {envelopes.length === 0 && alerts.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">No budget data available. Set up budget targets to get started.</div>
      )}
    </div>
  );
};

export default AdvancedBudgetingPage;
