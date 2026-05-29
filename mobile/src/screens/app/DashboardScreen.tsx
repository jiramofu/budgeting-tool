import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from '../../components/ProgressBar';
import { Colors } from '../../constants/colors';
import { Transaction } from '../../types';

interface Summary {
  totalBudgeted: number;
  totalSpent: number;
  budgetHealth: number;
}

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const now = new Date();
    const [budgetRes, txRes] = await Promise.allSettled([
      apiClient.get(`/budgets/${now.getFullYear()}/${now.getMonth() + 1}`),
      apiClient.get('/transactions?limit=5'),
    ]);
    if (budgetRes.status === 'fulfilled') {
      const d = budgetRes.value.data;
      setSummary({ totalBudgeted: d.total_budgeted || 0, totalSpent: d.total_spent || 0, budgetHealth: d.health_score || 0 });
    }
    if (txRes.status === 'fulfilled') {
      setRecentTx((txRes.value.data.transactions || txRes.value.data || []).slice(0, 5));
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const remaining = (summary?.totalBudgeted ?? 0) - (summary?.totalSpent ?? 0);
  const spentPct = summary ? (summary.totalSpent / (summary.totalBudgeted || 1)) * 100 : 0;
  const firstName = user?.email?.split('@')[0] ?? '';

  const healthLabel = (summary?.budgetHealth ?? 0) >= 80 ? 'On track' :
    (summary?.budgetHealth ?? 0) >= 60 ? 'Caution' : 'Over budget';
  const healthColor = (summary?.budgetHealth ?? 0) >= 80 ? Colors.income :
    (summary?.budgetHealth ?? 0) >= 60 ? Colors.warning : Colors.expense;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* Header */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.hi}>Good day, {firstName} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Hero budget card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>Monthly Budget</Text>
            <View style={[styles.healthPill, { backgroundColor: healthColor + '22', borderColor: healthColor + '55' }]}>
              <Text style={[styles.healthPillText, { color: healthColor }]}>{healthLabel}</Text>
            </View>
          </View>
          <Text style={styles.heroAmount}>
            ${(summary?.totalBudgeted ?? 0).toFixed(2)}
          </Text>
          <View style={styles.heroDivider} />
          <ProgressBar value={spentPct} height={8} />
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Spent</Text>
              <Text style={[styles.heroStatVal, { color: Colors.expense }]}>
                ${(summary?.totalSpent ?? 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>{remaining >= 0 ? 'Remaining' : 'Overspent'}</Text>
              <Text style={[styles.heroStatVal, { color: remaining >= 0 ? Colors.income : Colors.expense }]}>
                ${Math.abs(remaining).toFixed(2)}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Used</Text>
              <Text style={styles.heroStatVal}>{spentPct.toFixed(0)}%</Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          <ActionCard icon="➕" label="Add Transaction" onPress={() => navigation.navigate('AddTransaction')} color={Colors.accent} />
          <ActionCard icon="📊" label="Set Budget" onPress={() => navigation.navigate('AddBudget')} color={Colors.income} />
          <ActionCard icon="📈" label="Analytics" onPress={() => navigation.navigate('Analytics')} color={Colors.warning} />
        </View>

        {/* Recent transactions */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txCard}>
          {recentTx.length === 0 ? (
            <View style={styles.txEmpty}>
              <Text style={styles.txEmptyText}>No transactions yet</Text>
            </View>
          ) : (
            recentTx.map((tx, i) => {
              const isExpense = tx.amount < 0;
              return (
                <View key={tx.id} style={[styles.txRow, i < recentTx.length - 1 && styles.txRowBorder]}>
                  <View style={[styles.txIcon, { backgroundColor: isExpense ? Colors.expenseLight : Colors.incomeLight }]}>
                    <Text style={{ fontSize: 16 }}>{isExpense ? '↓' : '↑'}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.txMeta}>
                      {tx.category_name} · {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={[styles.txAmt, { color: isExpense ? Colors.expense : Colors.income }]}>
                    {isExpense ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </>
  );
};

const ActionCard = ({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) => (
  <TouchableOpacity style={[styles.actionCard, { borderColor: color + '44' }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIconWrap, { backgroundColor: color + '22' }]}>
      <Text style={styles.actionIcon}>{icon}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingBottom: 32 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  hi: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  date: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginBottom: 28,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  healthPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  healthPillText: { fontSize: 11, fontWeight: '700' },
  heroAmount: { fontSize: 42, fontWeight: '800', color: Colors.text, letterSpacing: -1, marginBottom: 16 },
  heroDivider: { height: 1, backgroundColor: Colors.border, marginBottom: 14 },
  heroStats: { flexDirection: 'row', marginTop: 12 },
  heroStat: { flex: 1 },
  heroStatLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroStatVal: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  seeAll: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  txCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  txEmpty: { padding: 28, alignItems: 'center' },
  txEmptyText: { fontSize: 14, color: Colors.textMuted },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '600', color: Colors.text },
  txMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: '700' },
});

export default DashboardScreen;
