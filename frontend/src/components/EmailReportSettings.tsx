import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Mail, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';

interface EmailReport {
  id: number;
  reportType: 'weekly_summary' | 'monthly_summary' | 'spending_analysis';
  recipientEmail: string;
  frequency: 'weekly' | 'monthly' | 'custom';
  scheduledDayOfWeek?: number;
  scheduledDayOfMonth?: number;
  scheduledTime: string;
  isActive: boolean;
  lastSentAt?: string;
  nextSendAt?: string;
}

interface EmailPreference {
  id: number;
  weeklySummaryEnabled: boolean;
  monthlySummaryEnabled: boolean;
  spendingAnalysisEnabled: boolean;
  includeBudgetProgress: boolean;
  includeSpendingByCategory: boolean;
  includeSavingsRate: boolean;
  includeGoalsProgress: boolean;
  includeBillReminders: boolean;
}

const EmailReportSettings: React.FC = () => {
  const [reports, setReports] = useState<EmailReport[]>([]);
  const [preferences, setPreferences] = useState<EmailPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    reportType: 'weekly_summary' as 'weekly_summary' | 'monthly_summary' | 'spending_analysis',
    recipientEmail: '',
    frequency: 'weekly' as 'weekly' | 'monthly',
    scheduledDayOfWeek: 0,
    scheduledDayOfMonth: 1,
    scheduledTime: '09:00',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const reportsRes = await apiClient.get('/email-reports');
      setReports(reportsRes.data.reports || []);

      const prefsRes = await apiClient.get('/email-reports/preferences');
      setPreferences(prefsRes.data.preferences);
    } catch (err: any) {
      setError('Failed to load email report settings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/email-reports', {
        ...formData,
        scheduledDayOfWeek: formData.frequency === 'weekly' ? formData.scheduledDayOfWeek : undefined,
        scheduledDayOfMonth: formData.frequency === 'monthly' ? formData.scheduledDayOfMonth : undefined,
      });

      setSuccessMessage('Email report scheduled successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowNewReportForm(false);
      setFormData({
        reportType: 'weekly_summary',
        recipientEmail: '',
        frequency: 'weekly',
        scheduledDayOfWeek: 0,
        scheduledDayOfMonth: 1,
        scheduledTime: '09:00',
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create email report');
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('Delete this email report schedule?')) return;

    try {
      await apiClient.delete(`/email-reports/${reportId}`);
      setSuccessMessage('Email report deleted');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (err) {
      setError('Failed to delete email report');
    }
  };

  const handleUpdatePreferences = async () => {
    if (!preferences) return;

    try {
      await apiClient.put('/email-reports/preferences', {
        weeklySummaryEnabled: preferences.weeklySummaryEnabled,
        monthlySummaryEnabled: preferences.monthlySummaryEnabled,
        spendingAnalysisEnabled: preferences.spendingAnalysisEnabled,
        includeBudgetProgress: preferences.includeBudgetProgress,
        includeSpendingByCategory: preferences.includeSpendingByCategory,
        includeSavingsRate: preferences.includeSavingsRate,
        includeGoalsProgress: preferences.includeGoalsProgress,
        includeBillReminders: preferences.includeBillReminders,
      });

      setSuccessMessage('Email preferences updated');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update email preferences');
    }
  };

  const getDayOfWeekLabel = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      weekly_summary: 'Weekly Summary',
      monthly_summary: 'Monthly Summary',
      spending_analysis: 'Spending Analysis',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Reports
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Receive automated budget summaries and spending analysis via email
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMessage}
        </div>
      )}

      {/* Email Preferences */}
      {preferences && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Report Content Preferences
          </h4>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.weeklySummaryEnabled}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    weeklySummaryEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Receive weekly summaries
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.monthlySummaryEnabled}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    monthlySummaryEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Receive monthly summaries
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.spendingAnalysisEnabled}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    spendingAnalysisEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Receive spending analysis reports
              </span>
            </label>

            <hr className="my-3 border-gray-300 dark:border-gray-600" />

            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Include in Reports:
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.includeBudgetProgress}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      includeBudgetProgress: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Budget Progress
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.includeSpendingByCategory}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      includeSpendingByCategory: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Spending by Category
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.includeSavingsRate}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      includeSavingsRate: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Savings Rate
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.includeGoalsProgress}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      includeGoalsProgress: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Goals Progress
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.includeBillReminders}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      includeBillReminders: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Bill Reminders
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleUpdatePreferences}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Save Preferences
          </button>
        </div>
      )}

      {/* Report Schedules */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Scheduled Reports
          </h4>
          {!showNewReportForm && (
            <button
              onClick={() => setShowNewReportForm(true)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Report
            </button>
          )}
        </div>

        {/* New Report Form */}
        {showNewReportForm && (
          <form
            onSubmit={handleCreateReport}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Report Type
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reportType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="weekly_summary">Weekly Summary</option>
                  <option value="monthly_summary">Monthly Summary</option>
                  <option value="spending_analysis">Spending Analysis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.recipientEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientEmail: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formData.scheduledDayOfWeek}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDayOfWeek: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <option key={day} value={day}>
                        {getDayOfWeekLabel(day)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.scheduledDayOfMonth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDayOfMonth: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time (HH:MM)
                </label>
                <input
                  type="time"
                  required
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduledTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Schedule Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewReportForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
            No email reports scheduled yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getReportTypeLabel(report.reportType)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      To: {report.recipientEmail}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {report.frequency === 'weekly'
                        ? `Every ${getDayOfWeekLabel(report.scheduledDayOfWeek || 0)} at ${report.scheduledTime}`
                        : `Monthly on day ${report.scheduledDayOfMonth} at ${report.scheduledTime}`}
                    </p>
                    {report.nextSendAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Next send: {new Date(report.nextSendAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailReportSettings;
