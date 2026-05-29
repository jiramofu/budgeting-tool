import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export interface UserSettings {
  currency: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export const useUserSettings = (): UserSettings => {
  const [settings, setSettings] = useState<UserSettings>({
    currency: 'USD',
    theme: 'light',
    language: 'en',
  });

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        // First try to load from API
        const response = await apiClient.get('/user/settings');
        const apiSettings = response.data;

        const newSettings: UserSettings = {
          currency: apiSettings.currency || 'USD',
          theme: apiSettings.theme || 'light',
          language: apiSettings.language || 'en',
        };

        // Update state with API settings
        setSettings(newSettings);

        // Save to localStorage for offline access
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
      } catch (e) {
        // If API fails, try localStorage as fallback
        console.warn('Failed to load settings from API, trying localStorage:', e);
        const userSettings = localStorage.getItem('userSettings');
        if (userSettings) {
          try {
            const parsed = JSON.parse(userSettings);
            setSettings({
              currency: parsed.currency || 'USD',
              theme: parsed.theme || 'light',
              language: parsed.language || 'en',
            });
          } catch (parseError) {
            console.error('Failed to parse user settings from localStorage:', parseError);
          }
        }
      }
    };

    loadUserSettings();
  }, []);

  return settings;
};
