import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/api';
import { useUserSettings } from '../hooks/useUserSettings';
import { COUNTRIES_SORTED } from '../utils/countries';
import { Settings, Save, LogOut, ArrowLeft, Trash2, Edit2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userSettings = useUserSettings();
  const { currency: contextCurrency, setCurrency: setContextCurrency } = useCurrency();
  const { setTheme: setContextTheme } = useTheme();
  const [currency, setCurrency] = useState<string>(contextCurrency || userSettings.currency);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(userSettings.theme);
  const [language, setLanguage] = useState<string>(userSettings.language);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Income Management state
  const [incomeMonth, setIncomeMonth] = useState(new Date().getMonth() + 1);
  const [incomeYear, setIncomeYear] = useState(new Date().getFullYear());
  const [grossPay, setGrossPay] = useState('');
  const [netPay, setNetPay] = useState('');
  const [deductions, setDeductions] = useState('');
  const [notes, setNotes] = useState('');
  const [incomeEntries, setIncomeEntries] = useState<any[]>([]);
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  const [savingIncome, setSavingIncome] = useState(false);

  useEffect(() => {
    // Sync loaded theme with ThemeContext
    setContextTheme(theme as 'light' | 'dark' | 'system');
  }, [theme, setContextTheme]);

  useEffect(() => {
    // Load profile picture from user settings
    const loadProfilePicture = async () => {
      try {
        const response = await apiClient.getUserSettings();
        if (response.data.profilePicture) {
          setProfilePicture(response.data.profilePicture);
        }
      } catch (err) {
        console.error('Error loading profile picture:', err);
      }
    };
    loadProfilePicture();
  }, []);

  // Load income entries
  useEffect(() => {
    const loadIncomeEntries = async () => {
      try {
        const response = await apiClient.getIncome();
        setIncomeEntries(response.data || []);
      } catch (err) {
        console.error('Error loading income entries:', err);
      }
    };
    loadIncomeEntries();
  }, []);

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingPicture(true);
      setErrorMessage('');

      const response = await apiClient.uploadProfilePicture(file);
      setProfilePicture(response.data.profilePictureUrl);
      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setErrorMessage('Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await apiClient.post('/user/settings', {
        currency,
        theme,
        language,
      });

      // Save settings to localStorage for instant UI updates
      localStorage.setItem('userSettings', JSON.stringify({
        currency,
        theme,
        language,
      }));

      // Update the global currency context
      if (currency !== contextCurrency) {
        setContextCurrency(currency);
      }

      // Update the global theme context
      setContextTheme(theme as 'light' | 'dark' | 'system');

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveIncome = async () => {
    if (!grossPay || !netPay || !deductions) {
      setErrorMessage('Please fill in all required income fields');
      return;
    }

    setSavingIncome(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingIncomeId) {
        // Update existing income
        await apiClient.updateIncome(editingIncomeId, {
          gross_pay: parseFloat(grossPay),
          net_pay: parseFloat(netPay),
          deductions: parseFloat(deductions),
          notes,
        });
        setSuccessMessage(`Income updated for ${getMonthName(incomeMonth)} ${incomeYear}!`);
        setEditingIncomeId(null);
      } else {
        // Create new income
        await apiClient.createIncome(
          parseFloat(grossPay),
          parseFloat(netPay),
          parseFloat(deductions),
          incomeMonth,
          incomeYear,
          notes
        );
        setSuccessMessage(`Income saved for ${getMonthName(incomeMonth)} ${incomeYear}!`);
      }

      // Reset form
      setGrossPay('');
      setNetPay('');
      setDeductions('');
      setNotes('');

      // Reload income entries
      const response = await apiClient.getIncome();
      setIncomeEntries(response.data || []);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to save income');
    } finally {
      setSavingIncome(false);
    }
  };

  const handleEditIncome = (entry: any) => {
    setEditingIncomeId(entry.id);
    setIncomeMonth(entry.month);
    setIncomeYear(entry.year);
    setGrossPay(entry.gross_pay.toString());
    setNetPay(entry.net_pay.toString());
    setDeductions(entry.deductions.toString());
    setNotes(entry.notes || '');
  };

  const handleDeleteIncome = async (incomeId: number) => {
    if (!confirm('Are you sure you want to delete this income entry?')) {
      return;
    }

    try {
      await apiClient.deleteIncome(incomeId);
      setSuccessMessage('Income entry deleted successfully!');

      // Reload income entries
      const response = await apiClient.getIncome();
      setIncomeEntries(response.data || []);

      if (editingIncomeId === incomeId) {
        setEditingIncomeId(null);
        setGrossPay('');
        setNetPay('');
        setDeductions('');
        setNotes('');
      }

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to delete income entry');
    }
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Settings size={32} className="text-primary" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Go back to previous page"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>

          {user && (
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Logged in as:</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.email}</p>
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Profile Picture</p>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden border-4 border-gray-200 dark:border-gray-600">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={uploadingPicture}
                  className="absolute inset-0 w-full h-full rounded-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadingPicture ? 'Uploading...' : 'Click the photo to upload a new one'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Max size: 5MB • Supported: JPG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="mb-6 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {COUNTRIES_SORTED.map((country) => (
                  <option key={country.code} value={country.currency}>
                    {country.name} ({country.currency}) {country.currencySymbol}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your default currency for budgets and transactions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Light</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Dark</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
              </select>
            </div>

            {/* Income Management Section */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income Management</h3>

              <div className="space-y-4">
                {/* Month and Year Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Month
                    </label>
                    <select
                      value={incomeMonth}
                      onChange={(e) => setIncomeMonth(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>{getMonthName(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      value={incomeYear}
                      onChange={(e) => setIncomeYear(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Income Input Fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gross Pay
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={grossPay}
                      onChange={(e) => setGrossPay(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="5000.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Net Pay
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={netPay}
                      onChange={(e) => setNetPay(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="4000.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Deductions
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="1000.00"
                    />
                  </div>
                </div>

                {/* Notes Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Add any notes about this income..."
                    rows={2}
                  />
                </div>

                {/* Save Income Button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveIncome}
                    disabled={savingIncome}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {savingIncome ? 'Saving...' : editingIncomeId ? 'Update Income' : 'Save Income'}
                  </button>
                  {editingIncomeId && (
                    <button
                      onClick={() => {
                        setEditingIncomeId(null);
                        setGrossPay('');
                        setNetPay('');
                        setDeductions('');
                        setNotes('');
                      }}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Recent Income Entries */}
              {incomeEntries.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Income Entries</h4>
                  <div className="space-y-2">
                    {incomeEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getMonthName(entry.month)} {entry.year}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Gross: {parseFloat(entry.gross_pay).toFixed(2)} | Net: {parseFloat(entry.net_pay).toFixed(2)} | Deductions: {parseFloat(entry.deductions).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditIncome(entry)}
                            className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                            title="Edit income"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteIncome(entry.id)}
                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                            title="Delete income"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save size={18} />
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
