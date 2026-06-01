import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Clock, Activity } from 'lucide-react';
import { apiClient } from '../services/api';

interface ErrorLog {
  id: number;
  action: string;
  resource_type: string;
  description: string;
  error_message: string;
  user_id: number | null;
  ip_address: string;
  created_at: string;
}

interface SignupStat {
  date: string;
  successes: number;
  failures: number;
}

interface ErrorByType {
  resource_type: string;
  count: number;
  failures: number;
}

const AdminErrorDashboard: React.FC = () => {
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [signupStats, setSignupStats] = useState<SignupStat[]>([]);
  const [errorsByType, setErrorsByType] = useState<ErrorByType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [errorsRes, statsRes, typesRes] = await Promise.all([
        apiClient.get('/errors/recent-errors'),
        apiClient.get('/errors/signup-stats'),
        apiClient.get('/errors/errors-by-type'),
      ]);

      setRecentErrors(errorsRes.data.errors);
      setSignupStats(statsRes.data.stats);
      setErrorsByType(typesRes.data.errorsByType);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch error data:', error);
    }
  };

  const totalSignups = signupStats.reduce((sum, stat) => sum + stat.successes + stat.failures, 0);
  const totalErrors = recentErrors.length;
  const successRate = totalSignups > 0 ? ((totalSignups - totalErrors) / totalSignups * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading error dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">📊 Error Monitoring Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-3xl font-bold">{successRate}%</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Errors</p>
              <p className="text-3xl font-bold">{totalErrors}</p>
            </div>
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Signups</p>
              <p className="text-3xl font-bold">{totalSignups}</p>
            </div>
            <Activity className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Last Updated</p>
              <p className="text-lg font-bold">Just now</p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>

      {/* Errors by Type */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold mb-4">Errors by Type</h2>
        <div className="space-y-2">
          {errorsByType.length > 0 ? (
            errorsByType.map((item) => (
              <div key={item.resource_type} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="font-medium">{item.resource_type}</span>
                <div className="text-right">
                  <span className="text-red-400 mr-4">{item.failures} failures</span>
                  <span className="text-gray-400">{item.count} total</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No errors in the last 24 hours</p>
          )}
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Recent Errors</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left p-3">Timestamp</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Error Message</th>
                <th className="text-left p-3">User ID</th>
                <th className="text-left p-3">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {recentErrors.length > 0 ? (
                recentErrors.map((error) => (
                  <tr key={error.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="p-3 text-gray-400">
                      {new Date(error.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="bg-red-900 text-red-200 px-2 py-1 rounded text-xs">
                        {error.resource_type}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate text-gray-300">{error.error_message}</td>
                    <td className="p-3 text-gray-400">{error.user_id || 'N/A'}</td>
                    <td className="p-3 text-gray-400">{error.ip_address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-400">
                    No recent errors
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signup Trends */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mt-8">
        <h2 className="text-2xl font-bold mb-4">Signup Trends (Last 30 Days)</h2>
        <div className="space-y-2">
          {signupStats.map((stat) => (
            <div key={stat.date} className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <span>{stat.date}</span>
              <div className="flex gap-4">
                <span className="text-green-400">✓ {stat.successes} success</span>
                <span className="text-red-400">✗ {stat.failures} failed</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminErrorDashboard;
