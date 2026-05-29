import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

interface Organization {
  id: number;
  name: string;
  type: 'personal' | 'team' | 'enterprise';
  created_at: string;
  owner_id: number;
}

interface RateLimits {
  tier: string;
  globalLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstAllowance: number;
  };
  currentStatus: {
    limited: boolean;
    remaining: number;
  };
  todayUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export const OrganizationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orgResponse, limitsResponse] = await Promise.all([
        apiClient.get('/admin/dashboard/summary'),
        apiClient.get('/admin/dashboard/rate-limits'),
      ]);

      setOrganization(orgResponse.data.organization);
      setNewName(orgResponse.data.organization.name);
      setRateLimits(limitsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load organization settings');
      console.error('Error loading org settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!newName.trim()) {
      setError('Organization name cannot be empty');
      return;
    }

    try {
      // This would need a PUT endpoint for organization updates
      // For now, just update the UI
      setEditingName(false);
      // await api.put(`/organizations/${organization?.id}`, { name: newName });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update organization');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your organization details and API limits</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Organization Info Card */}
        {organization && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization Name
                </label>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleNameUpdate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setNewName(organization.name);
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white">{organization.name}</span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization Type
                  </label>
                  <p className="text-gray-900 dark:text-white capitalize">{organization.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rate Limits Card */}
        {rateLimits && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">API Rate Limits</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tier</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {rateLimits.tier}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Per Minute</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rateLimits.globalLimits.requestsPerMinute}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">requests per minute</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Per Hour</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rateLimits.globalLimits.requestsPerHour}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">requests per hour</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Per Day</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rateLimits.globalLimits.requestsPerDay}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">requests per day</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Burst Allowance</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rateLimits.globalLimits.burstAllowance}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">extra requests allowed</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Today's Usage</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white">
                  {rateLimits.todayUsage.used} / {rateLimits.todayUsage.limit} requests
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {rateLimits.todayUsage.percentage}%
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    rateLimits.todayUsage.percentage > 80 ? 'bg-red-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(rateLimits.todayUsage.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate('/admin/members')}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400"
          >
            Manage Members
          </button>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400"
          >
            View Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettingsPage;
