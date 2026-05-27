import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

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
      setError('Failed to load subscriptions');
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
      setShowForm(false);
      await loadSubscriptions();
    } catch (err: any) {
      console.error('Failed to add subscription:', err);
      setError('Failed to add subscription');
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await apiClient.put(`/subscriptions/${id}/cancel`, {});
        await loadSubscriptions();
      } catch (err: any) {
        console.error('Failed to cancel subscription:', err);
        setError('Failed to cancel subscription');
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading subscriptions...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Subscriptions & Memberships</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Subscription'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      {/* Add Subscription Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Add New Subscription</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Service Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                required
                className="px-4 py-2 border border-gray-300 rounded"
              />
              <select name="billingCycle" value={formData.billingCycle} onChange={handleInputChange} className="px-4 py-2 border border-gray-300 rounded">
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
                className="px-4 py-2 border border-gray-300 rounded"
              />
            </div>
            <textarea
              name="notes"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              rows={3}
            ></textarea>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Add Subscription
            </button>
          </form>
        </div>
      )}

      {summary && (
        <>
          {/* Monthly & Yearly Commitment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-sm text-gray-600">Monthly Commitment</div>
              <div className="text-3xl font-bold text-blue-600">${Number(summary.monthlyCommitment).toFixed(2)}</div>
              <div className="text-xs text-gray-600 mt-2">{summary.activeCount} active subscriptions</div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-sm text-gray-600">Yearly Commitment</div>
              <div className="text-3xl font-bold text-purple-600">${Number(summary.yearlyCommitment).toFixed(2)}</div>
              <div className="text-xs text-gray-600 mt-2">Per year total</div>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <div className="text-sm text-gray-600">Savings Opportunity</div>
              <div className="text-3xl font-bold text-orange-600">${(Number(summary.monthlyCommitment) * 12 * 0.1).toFixed(2)}</div>
              <div className="text-xs text-gray-600 mt-2">By eliminating unused</div>
            </div>
          </div>

          {/* Cancellation Opportunities */}
          {summary.cancellationOpportunities.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-400">
              <h2 className="text-2xl font-bold mb-4">💰 Potential Savings</h2>
              <p className="text-gray-600 mb-4">
                These subscriptions might be forgotten or underutilized. Consider canceling to save money.
              </p>
              <div className="space-y-3">
                {summary.cancellationOpportunities.map((opp) => (
                  <div key={opp.name} className="flex justify-between items-center bg-orange-50 p-3 rounded border border-orange-200">
                    <div>
                      <div className="font-bold">{opp.name}</div>
                      <div className="text-sm text-gray-600">${Number(opp.amount).toFixed(2)}/month</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-orange-600">Potential: ${(Number(opp.amount) * 12).toFixed(2)}/year</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Subscriptions */}
          {summary.subscriptions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Active Subscriptions</h2>
              <div className="space-y-3">
                {summary.subscriptions.map((sub) => {
                  const nextDate = new Date(sub.nextBillingDate);
                  const today = new Date();
                  const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={sub.id} className="border border-gray-200 rounded p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{sub.name}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="capitalize mr-4">{sub.billingCycle}</span>
                          <span>Next billing: {nextDate.toLocaleDateString()} ({daysUntil} days)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">${Number(sub.amount).toFixed(2)}</div>
                        <button
                          onClick={() => handleCancel(sub.id)}
                          className="text-sm text-red-600 hover:text-red-700 mt-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!summary || summary.subscriptions.length === 0 && (
        <div className="text-center py-8 text-gray-600">No subscriptions tracked yet. Add your subscriptions to monitor costs.</div>
      )}
    </div>
  );
};

export default SubscriptionsPage;
