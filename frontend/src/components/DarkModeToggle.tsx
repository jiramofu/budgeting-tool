import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const DarkModeToggle: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🌓 Appearance
      </h3>

      <div className="space-y-4">
        {/* System (Auto) Option */}
        <label className="flex items-center p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setTheme('system')}>
          <input
            type="radio"
            name="theme"
            value="system"
            checked={theme === 'system'}
            onChange={() => setTheme('system')}
            className="w-4 h-4 text-blue-600"
          />
          <div className="ml-3 flex-1">
            <p className="font-medium text-gray-900 dark:text-white">System</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use your device's theme preference
            </p>
          </div>
          <span className="text-2xl">🔄</span>
        </label>

        {/* Light Option */}
        <label className="flex items-center p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setTheme('light')}>
          <input
            type="radio"
            name="theme"
            value="light"
            checked={theme === 'light'}
            onChange={() => setTheme('light')}
            className="w-4 h-4 text-blue-600"
          />
          <div className="ml-3 flex-1">
            <p className="font-medium text-gray-900 dark:text-white">Light</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bright, clean interface
            </p>
          </div>
          <span className="text-2xl">☀️</span>
        </label>

        {/* Dark Option */}
        <label className="flex items-center p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setTheme('dark')}>
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={theme === 'dark'}
            onChange={() => setTheme('dark')}
            className="w-4 h-4 text-blue-600"
          />
          <div className="ml-3 flex-1">
            <p className="font-medium text-gray-900 dark:text-white">Dark</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Easy on the eyes at night
            </p>
          </div>
          <span className="text-2xl">🌙</span>
        </label>
      </div>

      {/* Current Status */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Currently in <span className="font-semibold">{isDark ? 'dark' : 'light'}</span> mode
        </p>
      </div>
    </div>
  );
};

export default DarkModeToggle;
