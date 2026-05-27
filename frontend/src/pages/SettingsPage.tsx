import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/api';
import EmailReportSettings from '../components/EmailReportSettings';

interface UserSettings {
  userId: number;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  defaultBudgetingMethod: 'zero-based' | 'flex' | 'hybrid';
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  language: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    theme: 'light',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    defaultBudgetingMethod: 'flex',
    emailNotifications: true,
    pushNotifications: false,
    twoFactorEnabled: false,
    language: 'en',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState('appearance');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/user/settings');
      setSettings(response.data);
    } catch (error) {
      console.log('Using default settings');
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Apply theme immediately when changed
    if (key === 'theme') {
      setTheme(value as 'light' | 'dark' | 'system');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setSaveMessage('');
      await apiClient.post('/user/settings', settings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {saveMessage && (
        <div
          className={`p-4 rounded ${
            saveMessage.includes('success') ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-0">
            {[
              { id: 'appearance', label: '🎨 Appearance' },
              { id: 'notifications', label: '🔔 Notifications' },
              { id: 'email-reports', label: '📧 Email Reports' },
              { id: 'privacy', label: '🔒 Privacy & Security' },
              { id: 'account', label: '👤 Account' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium border-b-2 ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <div className="space-y-3">
                  {[
                    { value: 'light', label: '☀️ Light Mode' },
                    { value: 'dark', label: '🌙 Dark Mode' },
                    { value: 'system', label: '💻 System Default' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-3 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={theme === option.value}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900 dark:text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications || false}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">Email Notifications</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">Get notified about budget alerts, upcoming bills, and financial insights.</p>

                <label className="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications || false}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">Push Notifications</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">Receive real-time notifications on your device.</p>
              </div>
            </>
          )}

          {/* Email Reports Tab */}
          {activeTab === 'email-reports' && (
            <EmailReportSettings />
          )}

          {/* Privacy & Security Tab */}
          {activeTab === 'privacy' && (
            <>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorEnabled || false}
                    onChange={(e) => handleSettingChange('twoFactorEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">Add an extra layer of security to your account.</p>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-800">
                  <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">🔐 Data Security</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Your financial data is encrypted and secured with industry-standard security protocols. We never share your data with third
                    parties without consent.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Connected Accounts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage your connected bank accounts and integrations.</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Manage Connections
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Account Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <div className="font-medium text-gray-900 dark:text-white">{user?.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Account Created:</span>
                    <div className="font-medium text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Budgeting Preference</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Choose your default budgeting methodology:</p>
                <div className="space-y-2">
                  {[
                    { value: 'zero-based', label: 'Zero-Based Budgeting', desc: 'Every dollar has a job' },
                    { value: 'flex', label: 'Flex Budgeting', desc: 'Flexible spending categories' },
                    { value: 'hybrid', label: 'Hybrid', desc: 'Combination of both methods' },
                  ].map((method) => (
                    <label key={method.value} className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="budgetingMethod"
                        value={method.value}
                        checked={settings.defaultBudgetingMethod === method.value}
                        onChange={(e) => handleSettingChange('defaultBudgetingMethod', e.target.value)}
                        className="w-4 h-4 mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{method.label}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{method.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete Account</button>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">This action is permanent and cannot be undone.</p>
              </div>
            </>
          )}
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
          <button className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
