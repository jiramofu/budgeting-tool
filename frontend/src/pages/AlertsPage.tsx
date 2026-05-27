import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Bell, AlertCircle, CheckCircle, Trash2, Settings } from 'lucide-react';

interface SpendingAlert {
  id: number;
  categoryId: number;
  categoryName: string;
  currentSpending: number;
  budgetTarget: number;
  percentageOfBudget: number;
  severity: 'warning' | 'critical';
  message: string;
  isActive: boolean;
  triggeredAt: string;
}

interface AlertPreference {
  id: number;
  categoryId: number;
  categoryName: string;
  alertThresholdPercentage: number;
  criticalThresholdPercentage: number;
  enableEmailAlerts: boolean;
  enableAppAlerts: boolean;
}

interface Category {
  id: number;
  name: string;
}

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [preferences, setPreferences] = useState<Map<number, AlertPreference>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [editingPreference, setEditingPreference] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load all alerts
      const alertsRes = await apiClient.get('/alerts/all');
      setAlerts(alertsRes.data.alerts || []);

      // Load categories
      const categoriesRes = await apiClient.getCategories();
      setCategories(categoriesRes.data || []);

      // Load alert preferences for all categories
      const prefMap = new Map<number, AlertPreference>();
      for (const category of categoriesRes.data || []) {
        try {
          const prefRes = await apiClient.get(
            `/alerts/preferences/${category.id}`
          );
          if (prefRes.data.preferences) {
            prefMap.set(category.id, {
              ...prefRes.data.preferences,
              categoryName: category.name,
            });
          }
        } catch (err) {
          // Category preferences may not exist yet
        }
      }
      setPreferences(prefMap);
    } catch (err: any) {
      setError('Failed to load alerts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      await apiClient.put(`/alerts/${alertId}/resolve`, {});
      setSuccessMessage('Alert resolved');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (err) {
      setError('Failed to resolve alert');
    }
  };

  const handleUpdatePreference = async (categoryId: number) => {
    try {
      const pref = preferences.get(categoryId);
      if (!pref) return;

      await apiClient.put(`/alerts/preferences/${categoryId}`, {
        alertThresholdPercentage: pref.alertThresholdPercentage,
        criticalThresholdPercentage: pref.criticalThresholdPercentage,
        enableEmailAlerts: pref.enableEmailAlerts,
        enableAppAlerts: pref.enableAppAlerts,
      });

      setSuccessMessage('Alert preferences updated');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingPreference(null);
    } catch (err) {
      setError('Failed to update alert preferences');
    }
  };

  const activeAlerts = alerts.filter((a) => a.isActive);
  const resolvedAlerts = alerts.filter((a) => !a.isActive);

  const getSeverityStyles = (severity: 'warning' | 'critical') => {
    if (severity === 'critical') {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-900 dark:text-red-200',
        badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100',
      };
    } else {
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-900 dark:text-amber-200',
        badge: 'bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-100',
      };
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-700 dark:text-gray-300">
        Loading alerts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Spending Alerts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your budget limits and manage alert preferences
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Active Alerts */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Active Alerts ({activeAlerts.length})
        </h2>

        {activeAlerts.length === 0 ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
            ✨ Great job! You're within budget on all categories.
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const styles = getSeverityStyles(alert.severity);
              return (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${styles.bg} ${styles.border}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold text-lg ${styles.text}`}>
                          {alert.categoryName}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${styles.badge}`}
                        >
                          {alert.severity === 'critical' ? '⛔ CRITICAL' : '⚠️ WARNING'}
                        </span>
                      </div>
                      <p className={`${styles.text} mt-1`}>{alert.message}</p>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Current Spending
                          </span>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${alert.currentSpending.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Budget Target
                          </span>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${alert.budgetTarget.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Used
                          </span>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {alert.percentageOfBudget.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="ml-4 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert Preferences */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Alert Preferences by Category
        </h2>

        <div className="space-y-2">
          {categories.map((category) => {
            const pref = preferences.get(category.id);
            const isExpanded = expandedCategory === category.id;
            const isEditing = editingPreference === category.id;

            return (
              <div
                key={category.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedCategory(
                      isExpanded ? null : category.id
                    )
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-left flex justify-between items-center"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {isEditing && pref ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Warning Threshold (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={pref.alertThresholdPercentage}
                            onChange={(e) => {
                              const updated = new Map(preferences);
                              if (updated.get(category.id)) {
                                updated.get(category.id)!.alertThresholdPercentage =
                                  parseFloat(e.target.value);
                                setPreferences(updated);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Critical Threshold (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={pref.criticalThresholdPercentage}
                            onChange={(e) => {
                              const updated = new Map(preferences);
                              if (updated.get(category.id)) {
                                updated.get(category.id)!.criticalThresholdPercentage =
                                  parseFloat(e.target.value);
                                setPreferences(updated);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="flex gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pref.enableEmailAlerts}
                              onChange={(e) => {
                                const updated = new Map(preferences);
                                if (updated.get(category.id)) {
                                  updated.get(
                                    category.id
                                  )!.enableEmailAlerts = e.target.checked;
                                  setPreferences(updated);
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Email Alerts
                            </span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pref.enableAppAlerts}
                              onChange={(e) => {
                                const updated = new Map(preferences);
                                if (updated.get(category.id)) {
                                  updated.get(
                                    category.id
                                  )!.enableAppAlerts = e.target.checked;
                                  setPreferences(updated);
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              App Alerts
                            </span>
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePreference(category.id)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPreference(null)}
                            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : pref ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Warning Threshold
                            </span>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {pref.alertThresholdPercentage.toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Critical Threshold
                            </span>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {pref.criticalThresholdPercentage.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {pref.enableEmailAlerts ? '✓' : '✗'} Email Alerts
                          </span>
                          {' | '}
                          <span>
                            {pref.enableAppAlerts ? '✓' : '✗'} App Alerts
                          </span>
                        </div>
                        <button
                          onClick={() => setEditingPreference(category.id)}
                          className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        No preferences set for this category
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Resolved Alerts ({resolvedAlerts.length})
          </h2>

          <div className="space-y-2">
            {resolvedAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.categoryName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Resolved
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
