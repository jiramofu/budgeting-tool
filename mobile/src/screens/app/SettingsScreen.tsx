import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

interface UserSettings {
  theme: 'light' | 'dark';
  currency: string;
  dateFormat: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
}

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    try {
      setSaving(true);
      await apiClient.put('/settings', updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: () => {
          logout();
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingValue}>{user?.email}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Appearance Section */}
      {settings && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Theme</Text>
                <View style={styles.themeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.themeButton,
                      settings.theme === 'light' && styles.themeButtonActive,
                    ]}
                    onPress={() => updateSetting('theme', 'light')}
                  >
                    <Text
                      style={[
                        styles.themeButtonText,
                        settings.theme === 'light' && styles.themeButtonTextActive,
                      ]}
                    >
                      Light
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.themeButton,
                      settings.theme === 'dark' && styles.themeButtonActive,
                    ]}
                    onPress={() => updateSetting('theme', 'dark')}
                  >
                    <Text
                      style={[
                        styles.themeButtonText,
                        settings.theme === 'dark' && styles.themeButtonTextActive,
                      ]}
                    >
                      Dark
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.settingRow, styles.settingDivider]}>
                <Text style={styles.settingLabel}>Currency</Text>
                <Text style={styles.settingValue}>{settings.currency}</Text>
              </View>

              <View style={[styles.settingRow, styles.settingDivider]}>
                <Text style={styles.settingLabel}>Date Format</Text>
                <Text style={styles.settingValue}>{settings.dateFormat}</Text>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingValue}>{settings.language}</Text>
              </View>
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.card}>
              <View style={[styles.settingRow, styles.settingDivider]}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Switch
                  value={settings.emailNotifications}
                  onValueChange={(value) => updateSetting('emailNotifications', value)}
                  trackColor={{ false: '#d1d5db', true: '#86efac' }}
                  thumbColor={settings.emailNotifications ? '#10b981' : '#6b7280'}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Switch
                  value={settings.pushNotifications}
                  onValueChange={(value) => updateSetting('pushNotifications', value)}
                  trackColor={{ false: '#d1d5db', true: '#86efac' }}
                  thumbColor={settings.pushNotifications ? '#10b981' : '#6b7280'}
                />
              </View>
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                <Switch
                  value={settings.twoFactorEnabled}
                  onValueChange={(value) => updateSetting('twoFactorEnabled', value)}
                  trackColor={{ false: '#d1d5db', true: '#86efac' }}
                  thumbColor={settings.twoFactorEnabled ? '#10b981' : '#6b7280'}
                />
              </View>
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
              disabled={saving}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>App Version</Text>
                <Text style={styles.aboutValue}>1.0.0</Text>
              </View>
              <View style={[styles.aboutItem, styles.settingDivider]}>
                <Text style={styles.aboutLabel}>Built with</Text>
                <Text style={styles.aboutValue}>React Native</Text>
              </View>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>© 2026 Budgeting Tool</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  themeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  themeButtonTextActive: {
    color: '#fff',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  aboutItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#1f2937',
  },
  aboutValue: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default SettingsScreen;
