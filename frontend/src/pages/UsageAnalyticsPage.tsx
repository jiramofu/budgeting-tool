import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface EndpointStats {
  endpoint: string;
  count: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  successRate: number;
}

interface UsageData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRequests: number;
    successCount: number;
    errorCount: number;
    successRate: number;
    avgResponseTime: number;
    totalBytesSent: number;
    totalBytesReceived: number;
  };
  endpoints: EndpointStats[];
  trend: Array<{
    date: string;
    count: number;
  }>;
  todayUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export const UsageAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);

  useEffect(() => {
    loadUsageData();
  }, [selectedDays]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/dashboard/api-usage?days=${selectedDays}`);
      setUsageData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load usage analytics');
      console.error('Error loading usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return ((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Usage Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor API performance and usage patterns</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {[7, 14, 30].map((days) => (
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

        {usageData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {usageData.summary.totalRequests.toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Success Rate</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {usageData.summary.successRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Avg Response Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {usageData.summary.avgResponseTime.toFixed(0)}ms
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Data Transferred</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatBytes(usageData.summary.totalBytesSent + usageData.summary.totalBytesReceived)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Errors */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Successful Requests</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {usageData.summary.successCount.toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Failed Requests</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {usageData.summary.errorCount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Daily Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Requests</h2>
              <div className="space-y-3">
                {usageData.trend.slice(-7).map((day, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                      {new Date(day.date).toLocaleDateString()}
                    </p>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                      <div
                        className="bg-blue-600 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                        style={{
                          width: `${(day.count / Math.max(...usageData.trend.map((t) => t.count))) * 100}%`,
                        }}
                      >
                        {day.count > 100 && <span className="text-xs font-bold text-white">{day.count}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                      {day.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Endpoints */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Endpoints</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Endpoint</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Requests</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Success</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                        Response Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {usageData.endpoints.slice(0, 10).map((endpoint, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-mono text-xs">
                          {endpoint.endpoint}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                          {endpoint.count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-600 dark:text-green-400">
                            {endpoint.successRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                          {endpoint.avgResponseTime.toFixed(0)}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default UsageAnalyticsPage;
