import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/ui/loaders';
import { Tooltip, HelpIcon } from '../components/ui/tooltip';
import { Edit2, X, Save, Plus } from 'lucide-react';

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
  const { error: showError, success: showSuccess } = useToast();
  const [envelopes, setEnvelopes] = useState<EnvelopeStatus[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);
  const [adherence, setAdherence] = useState<AdherenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [adherenceMonths, setAdherenceMonths] = useState(3);
  const [editingEnvelopeId, setEditingEnvelopeId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'fixed' | 'variable' | 'recurring'>('variable');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

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

  const handleEditEnvelope = (envelope: EnvelopeStatus) => {
    setEditingEnvelopeId(envelope.categoryId);
    setEditAmount(envelope.allocated.toString());
  };

  const handleSaveEnvelopeEdit = async () => {
    if (!editAmount || isNaN(parseFloat(editAmount))) {
      showError('Please enter a valid amount');
      return;
    }

    try {
      setIsSavingEdit(true);
      const amount = parseFloat(editAmount);

      // Call API to update budget target
      await apiClient.put(`/budgets/targets/${editingEnvelopeId}`, {
        targetAmount: amount,
      });

      // Update local state
      setEnvelopes(
        envelopes.map((env) =>
          env.categoryId === editingEnvelopeId
            ? { ...env, allocated: amount, remaining: amount - env.spent, percentageUsed: (env.spent / amount) * 100 }
            : env
        )
      );

      setEditingEnvelopeId(null);
      setEditAmount('');
      showSuccess?.('Budget target updated successfully');
    } catch (error: any) {
      console.error('Failed to update budget target:', error);
      showError('Failed to update budget target');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEnvelopeId(null);
    setEditAmount('');
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showError('Please enter a category name');
      return;
    }

    if (!newCategoryAmount || isNaN(parseFloat(newCategoryAmount))) {
      showError('Please enter a valid budget amount');
      return;
    }

    try {
      setIsSavingCategory(true);

      // Create the category
      const categoryRes = await apiClient.post('/categories', {
        name: newCategoryName.trim(),
        type: newCategoryType,
      });

      const categoryId = categoryRes.data.id;

      // Create budget target for current month
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const budgetRes = await apiClient.get('/budgets/current');
      const budgetId = budgetRes.data.id;

      await apiClient.post(`/budgets/${budgetId}/targets`, {
        categoryId,
        targetAmount: parseFloat(newCategoryAmount),
      });

      // Add the new envelope to the list
      const newEnvelope: EnvelopeStatus = {
        categoryId,
        categoryName: newCategoryName.trim(),
        allocated: parseFloat(newCategoryAmount),
        spent: 0,
        remaining: parseFloat(newCategoryAmount),
        percentageUsed: 0,
      };

      setEnvelopes([...envelopes, newEnvelope].sort((a, b) => a.categoryName.localeCompare(b.categoryName)));

      // Reset form
      setNewCategoryName('');
      setNewCategoryType('variable');
      setNewCategoryAmount('');
      setShowAddCategory(false);
      showSuccess?.('Category created successfully');
    } catch (error: any) {
      console.error('Failed to add category:', error);
      showError('Failed to create category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleCancelAddCategory = () => {
    setShowAddCategory(false);
    setNewCategoryName('');
    setNewCategoryType('variable');
    setNewCategoryAmount('');
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Envelopes (Zero-Based Budget)</h2>
              <HelpIcon text="Allocate every dollar to a specific category. When an envelope is empty, you've spent all that category's budget." position="top" />
            </div>
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Add Category
            </button>
          </div>
          <div className="space-y-4">
            {envelopes.map((envelope) => (
              <div key={envelope.categoryId} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{envelope.categoryName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ${Number(envelope.spent).toFixed(2)} / ${Number(envelope.allocated).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleEditEnvelope(envelope)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Edit budget target"
                    >
                      <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
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

      {/* Edit Envelope Modal */}
      {editingEnvelopeId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Budget Target
              </h3>
              <button
                onClick={handleCancelEdit}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Budget Amount
              </label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                step="0.01"
                min="0"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={isSavingEdit}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEnvelopeEdit}
                disabled={isSavingEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {isSavingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Add New Category
              </h3>
              <button
                onClick={handleCancelAddCategory}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Transportation, Insurance"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Type
                </label>
                <select
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value as 'fixed' | 'variable' | 'recurring')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="fixed">Fixed (same every month)</option>
                  <option value="variable">Variable (changes each month)</option>
                  <option value="recurring">Recurring (occasional expenses)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Amount
                </label>
                <input
                  type="number"
                  value={newCategoryAmount}
                  onChange={(e) => setNewCategoryAmount(e.target.value)}
                  placeholder="Enter budget amount"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelAddCategory}
                disabled={isSavingCategory}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={isSavingCategory}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {isSavingCategory ? 'Creating...' : 'Create'}
              </button>
            </div>
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
