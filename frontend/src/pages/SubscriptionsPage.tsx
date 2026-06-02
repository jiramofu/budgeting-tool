import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../context/ThemeContext';
import { useUserSettings } from '../hooks/useUserSettings';
import { SkeletonCard } from '../components/ui/loaders';
import { HelpIcon } from '../components/ui/tooltip';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter';

interface Subscription {
  id: number;
  name: string;
  amount: number;
  billingCycle: string;
  nextBillingDate: string;
}

interface SubscriptionSummary {
  monthlyCommitment: number;
  yearlyCommitment: number;
  activeCount: number;
  cancellationOpportunities: { name: string; amount: number; priority: string }[];
  subscriptions: Subscription[];
}

const SubscriptionsPage: React.FC = () => {
  const { success, error: showError } = useToast();
  const { isDark } = useTheme();
  const { currency } = useUserSettings();
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    nextBillingDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    notes: '',
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiClient.get('/subscriptions/summary');
      setSummary(response.data);
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
      const errorMsg = 'Failed to load subscriptions';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/subscriptions', {
        name: formData.name,
        amount: parseFloat(formData.amount),
        billingCycle: formData.billingCycle,
        nextBillingDate: formData.nextBillingDate,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        notes: formData.notes || undefined,
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
      });

      setFormData({
        name: '',
        amount: '',
        billingCycle: 'monthly',
        nextBillingDate: new Date().toISOString().split('T')[0],
        categoryId: '',
        notes: '',
      });
      success('Subscription added successfully');
      setShowForm(false);
      await loadSubscriptions();
    } catch (err: any) {
      console.error('Failed to add subscription:', err);
      const errorMsg = 'Failed to add subscription';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await apiClient.put(`/subscriptions/${id}/cancel`, {});
        success('Subscription cancelled successfully');
        await loadSubscriptions();
      } catch (err: any) {
        console.error('Failed to cancel subscription:', err);
        const errorMsg = 'Failed to cancel subscription';
        setError(errorMsg);
        showError(errorMsg);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary p-4 md:p-8">
        <SkeletonCard count={3} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-4 md:p-8">
      <div className="mb-8">
        <div className="flex flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold text-slate-50">Subscriptions & Memberships</h1>
            <HelpIcon text="Track all your recurring subscriptions and memberships in one place" position="right" />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              showForm
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-50'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="w-5 h-5" />
            {showForm ? 'Cancel' : 'Add Subscription'}
          </button>
        </div>

        {error && (
          <div className={`mt-6 p-4 rounded-lg border flex items-center gap-3 ${
            isDark
              ? 'bg-red-900/20 border-red-700/50 text-red-300'
              : 'bg-red-100 border-red-300 text-red-700'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

      {/* Add Subscription Form */}
      {showForm && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-50">Add New Subscription</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Service Name (e.g., Netflix)"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                required
                className="px-4 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <select
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleInputChange}
                className="px-4 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-slate-50 focus:outline-none focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                type="date"
                name="nextBillingDate"
                value={formData.nextBillingDate}
                onChange={handleInputChange}
                className="px-4 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-slate-50 focus:outline-none focus:border-blue-500"
              />
            </div>
            <textarea
              name="notes"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              rows={3}
            ></textarea>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Add Subscription
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      </div>

      {summary && (
        <div className="space-y-8">
          {/* Monthly & Yearly Commitment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-sm text-slate-400 mb-2">Monthly Commitment</div>
              <div className="text-3xl font-bold text-blue-400 mb-3">
                {formatCurrency(Number(summary.monthlyCommitment), currency)}
              </div>
              <div className="text-sm text-slate-400">{summary.activeCount} active subscriptions</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-sm text-slate-400 mb-2">Yearly Commitment</div>
              <div className="text-3xl font-bold text-purple-400 mb-3">
                {formatCurrency(Number(summary.yearlyCommitment), currency)}
              </div>
              <div className="text-sm text-slate-400">Per year total</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-sm text-slate-400 mb-2">Savings Opportunity</div>
              <div className="text-3xl font-bold text-amber-400 mb-3">
                {formatCurrency(Number(summary.monthlyCommitment) * 12 * 0.1, currency)}
              </div>
              <div className="text-sm text-slate-400">By eliminating unused</div>
            </div>
          </div>

          {/* Cancellation Opportunities */}
          {summary.cancellationOpportunities.length > 0 && (
            <div className="bg-slate-800/50 border-l-4 border-amber-500 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-2 text-slate-50">💰 Potential Savings</h2>
              <p className="text-slate-400 mb-4">
                These subscriptions might be forgotten or underutilized. Consider canceling to save money.
              </p>
              <div className="space-y-3">
                {summary.cancellationOpportunities.map((opp) => (
                  <div key={opp.name} className="flex justify-between items-center bg-amber-900/20 border border-amber-700/50 p-4 rounded-lg">
                    <div>
                      <div className="font-bold text-slate-50">{opp.name}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        {formatCurrency(Number(opp.amount), currency)}/month
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-amber-400 font-medium">
                        Potential: {formatCurrency(Number(opp.amount) * 12, currency)}/year
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Subscriptions */}
          {summary.subscriptions.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-4 text-slate-50">Active Subscriptions</h2>
              <div className="space-y-3">
                {summary.subscriptions.map((sub) => {
                  const nextDate = new Date(sub.nextBillingDate);
                  const today = new Date();
                  const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={sub.id}
                      className="border border-slate-700 rounded-lg p-4 flex justify-between items-center bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-50">{sub.name}</h3>
                        <div className="text-sm text-slate-400 mt-1">
                          <span className="capitalize mr-4">{sub.billingCycle}</span>
                          <span>Next: {nextDate.toLocaleDateString()} ({daysUntil} days)</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-blue-400">
                          {formatCurrency(Number(sub.amount), currency)}
                        </div>
                        <button
                          onClick={() => handleCancel(sub.id!)}
                          className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300 mt-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!summary || (summary.subscriptions.length === 0 && !showForm) ? (
        <div className="text-center py-16">
          <div className="text-slate-400 mb-4">No subscriptions tracked yet</div>
          <p className="text-slate-500 mb-6">Add your subscriptions to monitor costs and find savings opportunities.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Subscription
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default SubscriptionsPage;
