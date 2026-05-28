import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Mail, AlertCircle, CheckCircle, Trash2, Plus } from 'lucide-react';

interface EmailPreferences {
  id?: number;
  userId?: number;
  enabled: boolean;
  weeklyReportEnabled: boolean;
  monthlyReportEnabled: boolean;
  alertEmailsEnabled: boolean;
  weeklyReportDay: number; // 0-6 (Sunday-Saturday)
  weeklyReportTime: string; // HH:mm format
  monthlyReportDay: number; // 1-31
  monthlyReportTime: string; // HH:mm format
  notificationEmail: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailReport {
  id: number;
  userId: number;
  reportType: 'spending' | 'budget' | 'alert' | 'summary';
  recipientEmail: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  scheduledDayOfWeek?: number;
  scheduledDayOfMonth?: number;
  scheduledTime: string;
  enabled: boolean;
  createdAt: string;
}

const EmailPreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [reports, setReports] = useState<EmailReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);

  // Form state for new report
  const [newReport, setNewReport] = useState<{
    reportType: 'spending' | 'budget' | 'alert' | 'summary';
    recipientEmail: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    scheduledDayOfWeek: number;
    scheduledDayOfMonth: number;
    scheduledTime: string;
  }>({
    reportType: 'spending',
    recipientEmail: '',
    frequency: 'weekly',
    scheduledDayOfWeek: 1,
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

      // Load email preferences
      const prefsRes = await apiClient.get('/email-reports/preferences');
      setPreferences(prefsRes.data.preferences || {
        enabled: true,
        weeklyReportEnabled: true,
        monthlyReportEnabled: true,
        alertEmailsEnabled: true,
        weeklyReportDay: 1,
        weeklyReportTime: '09:00',
        monthlyReportDay: 1,
        monthlyReportTime: '09:00',
        notificationEmail: '',
      });

      // Load email reports
      const reportsRes = await apiClient.get('/email-reports');
      setReports(reportsRes.data.reports || []);
    } catch (err: any) {
      console.error('Error loading email data:', err);
      setError('Failed to load email preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      await apiClient.put('/email-reports/preferences', preferences);
      setSuccessMessage('Email preferences updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditingPreferences(false);
    } catch (err: any) {
      setError('Failed to update email preferences');
    }
  };

  const handleCreateReport = async () => {
    try {
      // Validate required fields
      if (!newReport.recipientEmail || !newReport.reportType) {
        setError('Please fill in all required fields');
        return;
      }

      await apiClient.post('/email-reports', {
        reportType: newReport.reportType,
        recipientEmail: newReport.recipientEmail,
        frequency: newReport.frequency,
        scheduledDayOfWeek: newReport.frequency === 'weekly' ? newReport.scheduledDayOfWeek : undefined,
        scheduledDayOfMonth: newReport.frequency === 'monthly' ? newReport.scheduledDayOfMonth : undefined,
        scheduledTime: newReport.scheduledTime,
      });

      setSuccessMessage('Email report created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsCreatingReport(false);
      setNewReport({
        reportType: 'spending',
        recipientEmail: '',
        frequency: 'weekly',
        scheduledDayOfWeek: 1,
        scheduledDayOfMonth: 1,
        scheduledTime: '09:00',
      });
      loadData();
    } catch (err: any) {
      setError('Failed to create email report');
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this email report?')) {
      return;
    }

    try {
      await apiClient.delete(`/email-reports/${reportId}`);
      setSuccessMessage('Email report deleted');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (err: any) {
      setError('Failed to delete email report');
    }
  };

  const handleSendTestEmail = async () => {
    try {
      if (!preferences?.notificationEmail) {
        setError('Please set a notification email first');
        return;
      }

      await apiClient.post('/email-reports/test', {
        recipientEmail: preferences.notificationEmail,
      });

      setTestEmailSent(true);
      setSuccessMessage('Test email sent! Check your inbox.');
      setTimeout(() => {
        setTestEmailSent(false);
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      setError('Failed to send test email');
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  const getFrequencyDisplay = (report: EmailReport) => {
    if (report.frequency === 'daily') return 'Every day';
    if (report.frequency === 'weekly')
      return `Every ${getDayName(report.scheduledDayOfWeek || 0)} at ${report.scheduledTime}`;
    if (report.frequency === 'monthly')
      return `Day ${report.scheduledDayOfMonth} of every month at ${report.scheduledTime}`;
    return report.frequency;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-700 dark:text-gray-300">
        Loading email preferences...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-8 h-8" />
            Email Preferences
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your email settings and report schedules
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

      {/* Email Preferences */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Global Email Settings</h2>
          <button
            onClick={() => setIsEditingPreferences(!isEditingPreferences)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {isEditingPreferences ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditingPreferences && preferences ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notification Email Address
              </label>
              <input
                type="email"
                value={preferences.notificationEmail}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notificationEmail: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Email Notifications</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.alertEmailsEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        alertEmailsEnabled: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Send alert emails when spending exceeds threshold
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.weeklyReportEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        weeklyReportEnabled: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Send weekly spending report on{' '}
                    <select
                      value={preferences.weeklyReportDay}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          weeklyReportDay: parseInt(e.target.value),
                        })
                      }
                      className="inline-block px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                        (day, idx) => (
                          <option key={idx} value={idx}>
                            {day}
                          </option>
                        )
                      )}
                    </select>
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.monthlyReportEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        monthlyReportEnabled: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Send monthly spending report on day{' '}
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={preferences.monthlyReportDay}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          monthlyReportDay: parseInt(e.target.value),
                        })
                      }
                      className="inline-block w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleUpdatePreferences}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save Preferences
              </button>
              <button
                onClick={handleSendTestEmail}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 font-medium"
              >
                {testEmailSent ? 'Email Sent ✓' : 'Send Test Email'}
              </button>
            </div>
          </div>
        ) : preferences ? (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Notification Email</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {preferences.notificationEmail || 'Not set'}
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Email Notifications</span>
              <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>{preferences.alertEmailsEnabled ? '✓' : '✗'} Alert emails</li>
                <li>
                  {preferences.weeklyReportEnabled ? '✓' : '✗'} Weekly report on{' '}
                  {getDayName(preferences.weeklyReportDay)}
                </li>
                <li>
                  {preferences.monthlyReportEnabled ? '✓' : '✗'} Monthly report on day{' '}
                  {preferences.monthlyReportDay}
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {/* Email Reports */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Custom Email Reports ({reports.length})
          </h2>
          <button
            onClick={() => setIsCreatingReport(!isCreatingReport)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>

        {isCreatingReport && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Report Type *
                </label>
                <select
                  value={newReport.reportType}
                  onChange={(e) =>
                    setNewReport({
                      ...newReport,
                      reportType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="spending">Spending Report</option>
                  <option value="budget">Budget Report</option>
                  <option value="alert">Alert Report</option>
                  <option value="summary">Summary Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={newReport.recipientEmail}
                  onChange={(e) =>
                    setNewReport({
                      ...newReport,
                      recipientEmail: e.target.value,
                    })
                  }
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency *
                </label>
                <select
                  value={newReport.frequency}
                  onChange={(e) =>
                    setNewReport({
                      ...newReport,
                      frequency: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {newReport.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={newReport.scheduledDayOfWeek}
                    onChange={(e) =>
                      setNewReport({
                        ...newReport,
                        scheduledDayOfWeek: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                      (day, idx) => (
                        <option key={idx} value={idx}>
                          {day}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {newReport.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newReport.scheduledDayOfMonth}
                    onChange={(e) =>
                      setNewReport({
                        ...newReport,
                        scheduledDayOfMonth: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  value={newReport.scheduledTime}
                  onChange={(e) =>
                    setNewReport({
                      ...newReport,
                      scheduledTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateReport}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Create Report
                </button>
                <button
                  onClick={() => setIsCreatingReport(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
            No custom email reports configured. Create one to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {report.reportType} Report
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {report.frequency}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      To: <span className="font-medium">{report.recipientEmail}</span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {getFrequencyDisplay(report)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="ml-4 px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded font-medium text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
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

export default EmailPreferencesPage;
