import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Syncs user settings from the API with the global context providers
 * This ensures that when a user logs in, their saved preferences are applied globally
 *
 * IMPORTANT: This only syncs ONCE on initial authentication to avoid overwriting
 * user changes that haven't been saved yet. The SettingsPage handles its own saves.
 */
export const useSyncUserSettings = () => {
  const { isAuthenticated } = useAuth();
  const { setTheme } = useTheme();
  const { setCurrency } = useCurrency();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[SettingsSync] User not authenticated, skipping sync');
      hasSyncedRef.current = false; // Reset flag on logout
      return;
    }

    // Only sync once per authentication session
    if (hasSyncedRef.current) {
      console.log('[SettingsSync] Already synced this session, skipping');
      return;
    }

    console.log('[SettingsSync] Starting user settings sync (first time after authentication)');

    const syncSettings = async () => {
      try {
        const response = await apiClient.get('/user/settings');
        const settings = response.data;

        console.log('[SettingsSync] Fetched settings from API:', {
          theme: settings.theme,
          currency: settings.currency,
          language: settings.language,
        });

        // Sync theme with context
        if (settings.theme) {
          console.log('[SettingsSync] Calling setTheme with:', settings.theme);
          setTheme(settings.theme as 'light' | 'dark' | 'system');
        }

        // Sync currency with context
        if (settings.currency) {
          console.log('[SettingsSync] Calling setCurrency with:', settings.currency);
          setCurrency(settings.currency);
        }

        // Save to localStorage for offline access
        localStorage.setItem('userSettings', JSON.stringify({
          currency: settings.currency || 'USD',
          theme: settings.theme || 'light',
          language: settings.language || 'en',
        }));

        console.log('[SettingsSync] Settings synced successfully');
        hasSyncedRef.current = true; // Mark as synced
      } catch (error) {
        console.error('[SettingsSync] Failed to sync user settings:', error);
      }
    };

    syncSettings();
  }, [isAuthenticated, setTheme, setCurrency]);
};
