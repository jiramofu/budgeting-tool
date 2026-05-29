import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { UserSettings } from '../../types';
import { Colors } from '../../constants/colors';
import Button from '../../components/Button';

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await apiClient.get('/user/settings');
      setSettings(res.data);
    } catch {
      setSettings({ theme: 'light', currency: 'USD', dateFormat: 'MM/DD/YYYY', language: 'en', emailNotifications: true, pushNotifications: true, twoFactorEnabled: false });
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const update = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return;
    const prev = settings;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      setSaving(true);
      await apiClient.put('/user/settings', updated);
    } catch {
      Alert.alert('Error', 'Failed to save setting.');
      setSettings(prev);
    } finally { setSaving(false); }
  };

  const confirmLogout = () =>
    Alert.alert('Sign Out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarChar}>{(user?.email?.[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileRole}>Personal account</Text>
          </View>
          <View style={[styles.planBadge]}>
            <Text style={styles.planText}>Free</Text>
          </View>
        </View>

        {settings && (
          <>
            <SectionLabel label="Preferences" />
            <View style={styles.group}>
              <Row label="Currency" value={settings.currency} />
              <Sep />
              <Row label="Date Format" value={settings.dateFormat} />
              <Sep />
              <Row label="Language" value={settings.language.toUpperCase()} />
            </View>

            <SectionLabel label="Notifications" />
            <View style={styles.group}>
              <SwitchRow label="Email Notifications" value={settings.emailNotifications} onChange={(v) => update('emailNotifications', v)} disabled={saving} />
              <Sep />
              <SwitchRow label="Push Notifications" value={settings.pushNotifications} onChange={(v) => update('pushNotifications', v)} disabled={saving} />
            </View>

            <SectionLabel label="Security" />
            <View style={styles.group}>
              <SwitchRow label="Two-Factor Auth" value={settings.twoFactorEnabled} onChange={(v) => update('twoFactorEnabled', v)} disabled={saving} />
            </View>
          </>
        )}

        <SectionLabel label="" />
        <Button label="Sign Out" variant="danger" onPress={confirmLogout} />

        <SectionLabel label="About" />
        <View style={styles.group}>
          <Row label="App Version" value="1.0.0" />
          <Sep />
          <Row label="Built with" value="React Native" />
        </View>

        <Text style={styles.copy}>© 2026 BudgetIQ · All rights reserved</Text>
      </ScrollView>
    </>
  );
};

const SectionLabel = ({ label }: { label: string }) =>
  label ? <Text style={styles.sectionLabel}>{label}</Text> : <View style={{ height: 16 }} />;

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const SwitchRow = ({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: Colors.border, true: Colors.accentGlow }}
      thumbColor={value ? Colors.accent : Colors.textMuted}
    />
  </View>
);

const Sep = () => <View style={styles.sep} />;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginBottom: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.accentGlow,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarChar: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  profileInfo: { flex: 1 },
  profileEmail: { fontSize: 15, fontWeight: '700', color: Colors.text },
  profileRole: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  planBadge: {
    backgroundColor: Colors.accentSubtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planText: { fontSize: 12, fontWeight: '700', color: Colors.accent },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  rowValue: { fontSize: 14, color: Colors.textSecondary },
  sep: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: 16 },
  copy: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 28 },
});

export default SettingsScreen;
