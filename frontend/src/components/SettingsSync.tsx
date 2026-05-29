import React from 'react';
import { useSyncUserSettings } from '../hooks/useSyncUserSettings';

/**
 * Component that syncs user settings from the API with global contexts
 * This should be placed high in the component tree, after AuthProvider
 */
export const SettingsSync: React.FC = () => {
  // This hook handles all the syncing logic
  useSyncUserSettings();

  // This component doesn't render anything, it just handles side effects
  return null;
};

export default SettingsSync;
