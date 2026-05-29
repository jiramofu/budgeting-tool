/**
 * Mobile Settings Page
 * Configure app preferences, theme, currency, notifications
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MobileHeader } from '../../components/Mobile/MobileHeader';
import { MobileNavigation } from '../../components/Mobile/MobileNavigation';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { apiClient } from '../../services/api';
import { COUNTRIES_SORTED } from '../../utils/countries';

interface MobileSettingsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const MobileSettings: React.FC<MobileSettingsProps> = ({
  activeTab = 'settings',
  onTabChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, isDark } = useTheme();
  const { currency: contextCurrency, setCurrency: setContextCurrency } = useCurrency();
  const [currency, setCurrency] = useState(contextCurrency);
  const [originalCurrency, setOriginalCurrency] = useState(contextCurrency);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Use activeTab from props if provided, otherwise determine from URL
  const currentTab = activeTab === 'settings' && location.pathname.includes('/settings') ? 'settings' : activeTab;
  // Store all settings from backend for partial updates
  const [allSettings, setAllSettings] = useState<any>({
    theme: 'system',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    defaultBudgetingMethod: 'flex',
    emailNotifications: true,
    pushNotifications: false,
    twoFactorEnabled: false,
    language: 'en',
  });

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getUserSettings();
        const settings = response.data;

        // Store all settings from backend
        setAllSettings(settings);

        if (settings.currency) {
          setCurrency(settings.currency);
          setOriginalCurrency(settings.currency);
        }
        if (settings.emailNotifications !== undefined) {
          setEmailNotifications(settings.emailNotifications);
        }
      } catch (err: any) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Sync theme with context when allSettings updates
  useEffect(() => {
    if (allSettings.theme) {
      setTheme(allSettings.theme);
    }
  }, [allSettings.theme, setTheme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // Update allSettings to track the change for saving
    setAllSettings({
      ...allSettings,
      theme: newTheme,
    });
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveMessage(null);

      // Send only the core settings that the backend expects
      await apiClient.post('/user/settings', {
        currency,
        theme: allSettings.theme,
        language: allSettings.language,
      });

      // Update stored settings
      setAllSettings({
        ...allSettings,
        theme: allSettings.theme,
        currency,
        language: allSettings.language,
      });
      setOriginalCurrency(currency);

      // Update the global currency context
      if (currency !== contextCurrency) {
        setContextCurrency(currency);
      }

      setSaveMessage('Settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const hasChanges =
    currency !== originalCurrency ||
    emailNotifications !== allSettings.emailNotifications ||
    theme !== allSettings.theme;

  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
  }> = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
        enabled
          ? 'bg-blue-500'
          : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <MobileHeader />
        <div className="px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <MobileNavigation activeTab={currentTab} onTabChange={onTabChange} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <MobileHeader />
      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Go back to previous page"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {saveMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <p className="text-green-600 dark:text-green-400 text-sm">{saveMessage}</p>
          </div>
        )}

        {/* Appearance Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Appearance
          </h2>

          {/* Theme Mode Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Theme
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={() => handleThemeChange('light')}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Light
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Always use light theme
                  </p>
                </div>
                {theme === 'light' && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={() => handleThemeChange('dark')}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    Dark
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Always use dark theme
                  </p>
                </div>
                {theme === 'dark' && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="theme"
                  value="system"
                  checked={theme === 'system'}
                  onChange={() => handleThemeChange('system')}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    System
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Follow device settings
                  </p>
                </div>
                {theme === 'system' && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Financial
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Currency
            </h3>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(() => {
                // Get unique currencies to avoid duplicates (e.g., multiple countries use EUR)
                const seenCurrencies = new Set<string>();
                const uniqueCurrencies = COUNTRIES_SORTED.filter(country => {
                  if (seenCurrencies.has(country.currency)) return false;
                  seenCurrencies.add(country.currency);
                  return true;
                });

                return uniqueCurrencies.map((country) => (
                  <option key={country.currency} value={country.currency}>
                    {country.currency} {country.currencySymbol} - {country.name}
                  </option>
                ));
              })()}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Current: {currency}
            </p>
            {hasChanges && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                ✓ Unsaved changes
              </p>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Notifications
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Budget Alerts
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Get notified when approaching limits
                </p>
              </div>
              <ToggleSwitch
                enabled={emailNotifications}
                onChange={setEmailNotifications}
              />
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <button
          onClick={handleSaveSettings}
          disabled={!hasChanges || saving}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
            hasChanges && !saving
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : hasChanges ? 'Save Settings' : 'No Changes'}
        </button>

        {/* About Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            About
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  App Version
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  1.0.0
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Sync Status
                </span>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Connected
                </span>
              </div>
              <button className="w-full py-2 px-3 text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-sm font-medium">
                View Privacy Policy
              </button>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Account
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <button className="w-full py-3 px-4 text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm border-b border-gray-200 dark:border-gray-700">
              Change Password
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3 px-4 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Logout?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to logout? You'll need to sign in again to access your budget.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default MobileSettings;
