import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

interface AuditEvent {
  id: number;
  action: string;
  resourceType: string;
  resourceId: number | null;
  userId: number;
  ipAddress: string | null;
  changes: Record<string, any> | null;
  status: 'success' | 'failure';
  errorMessage: string | null;
  created_at: string;
}

interface AuditSummary {
  period: {
    days: number;
    startDate: string;
  };
  totals: {
    totalEvents: number;
    successCount: number;
    failureCount: number;
    successRate: number;
  };
  byAction: Array<{
    action: string;
    count: number;
    successCount: number;
    failureCount: number;
  }>;
  byResource: Array<{
    resourceType: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: number;
    eventCount: number;
  }>;
}

export const AuditLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [auditData, setAuditData] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [filterAction, setFilterAction] = useState<string | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [selectedDays]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/dashboard/audit-summary?days=${selectedDays}`);
      setAuditData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'success'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View organization activity and compliance history</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {[7, 14, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedDays === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>

        {auditData && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total Events</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {auditData.totals.totalEvents.toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Success</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {auditData.totals.successCount.toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Failures</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {auditData.totals.failureCount.toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {auditData.totals.successRate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* By Action */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity by Action</h2>
                <div className="space-y-3">
                  {auditData.byAction.slice(0, 10).map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                      onClick={() => setFilterAction(action.action)}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{action.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {action.successCount} success, {action.failureCount} failed
                        </p>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{action.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Resource */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity by Resource</h2>
                <div className="space-y-3">
                  {auditData.byResource.slice(0, 10).map((resource, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{resource.resourceType}</p>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{resource.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Users */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Active Users</h2>
              <div className="space-y-2">
                {auditData.topUsers.slice(0, 5).map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">User #{user.userId}</p>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{user.eventCount}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/admin/organization')}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400"
          >
            Back to Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
