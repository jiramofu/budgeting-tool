import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { Budget } from '../../types';
import { Colors } from '../../constants/colors';
import ProgressBar from '../../components/ProgressBar';
import EmptyState from '../../components/EmptyState';
import FAB from '../../components/FAB';

const BudgetsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [totals, setTotals] = useState({ budgeted: 0, spent: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const now = new Date();
    try {
      const res = await apiClient.get(`/budgets/${now.getFullYear()}/${now.getMonth() + 1}`);
      const d = res.data;
      const categories: Budget[] = (d.categories || []).map((b: any) => ({
        id: b.id, category_id: b.category_id, category_name: b.category_name,
        target_amount: b.target_amount, spent: b.spent,
        percentage: b.target_amount > 0 ? (b.spent / b.target_amount) * 100 : 0,
      }));
      setBudgets(categories);
      setTotals({
        budgeted: categories.reduce((s, b) => s + b.target_amount, 0),
        spent: categories.reduce((s, b) => s + b.spent, 0),
      });
    } catch { } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const overallPct = totals.budgeted > 0 ? (totals.spent / totals.budgeted) * 100 : 0;

  const Header = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryMonth}>
        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>
      <View style={styles.summaryRow}>
        <SummaryPill label="Budgeted" value={`$${totals.budgeted.toFixed(0)}`} color={Colors.accent} />
        <SummaryPill label="Spent" value={`$${totals.spent.toFixed(0)}`} color={Colors.expense} />
        <SummaryPill
          label={totals.budgeted - totals.spent >= 0 ? 'Left' : 'Over'}
          value={`$${Math.abs(totals.budgeted - totals.spent).toFixed(0)}`}
          color={totals.budgeted - totals.spent >= 0 ? Colors.income : Colors.expense}
        />
      </View>
      <ProgressBar value={overallPct} height={8} />
      <Text style={styles.overallPct}>{overallPct.toFixed(0)}% of total budget used</Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: Budget; index: number }) => {
    const color = Colors.categoryColors[index % Colors.categoryColors.length];
    const isOver = item.percentage > 100;
    const remaining = item.target_amount - item.spent;
    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{item.category_name}</Text>
            <View style={[styles.pctBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
              <Text style={[styles.pctText, { color }]}>{item.percentage.toFixed(0)}%</Text>
            </View>
          </View>
          <ProgressBar value={item.percentage} height={6} color={isOver ? Colors.expense : color} />
          <View style={styles.cardFooter}>
            <Text style={styles.cardSpent}>
              <Text style={{ color }}>${item.spent.toFixed(2)}</Text>
              <Text style={styles.cardOf}> / ${item.target_amount.toFixed(2)}</Text>
            </Text>
            <Text style={[styles.cardRemaining, { color: remaining >= 0 ? Colors.income : Colors.expense }]}>
              {remaining >= 0 ? `$${remaining.toFixed(2)} left` : `$${Math.abs(remaining).toFixed(2)} over`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.screen}>
        <FlatList
          data={budgets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={budgets.length > 0 ? <Header /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={!loading ? (
            <EmptyState icon="📊" title="No budgets yet" subtitle="Tap + to set your first budget category" actionLabel="Add Budget" onAction={() => navigation.navigate('AddBudget')} />
          ) : null}
        />
        <FAB onPress={() => navigation.navigate('AddBudget')} />
      </View>
    </>
  );
};

const SummaryPill = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <View style={[styles.pill, { borderColor: color + '44', backgroundColor: color + '11' }]}>
    <Text style={[styles.pillValue, { color }]}>{value}</Text>
    <Text style={styles.pillLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: 16, paddingBottom: 96 },
  summaryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginBottom: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  summaryMonth: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  pill: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  pillValue: { fontSize: 18, fontWeight: '800' },
  pillLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  overallPct: { fontSize: 12, color: Colors.textSecondary, marginTop: 8 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  pctBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  pctText: { fontSize: 12, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cardSpent: { fontSize: 13, fontWeight: '600', color: Colors.text },
  cardOf: { color: Colors.textMuted, fontWeight: '400' },
  cardRemaining: { fontSize: 12, fontWeight: '600' },
});

export default BudgetsScreen;
