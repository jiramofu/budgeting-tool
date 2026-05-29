import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { Colors } from '../../constants/colors';
import ProgressBar from '../../components/ProgressBar';
import EmptyState from '../../components/EmptyState';

interface CategorySpend { category_name: string; amount: number; percentage: number }
interface MonthTrend { month: string; spent: number; budgeted: number }

const AnalyticsScreen: React.FC = () => {
  const [data, setData] = useState<{
    categoryBreakdown: CategorySpend[];
    monthlyTrends: MonthTrend[];
    totalSpent: number;
    averageMonthly: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiClient.get('/analytics');
      setData({
        categoryBreakdown: res.data.categoryBreakdown || [],
        monthlyTrends: res.data.monthlyTrends || [],
        totalSpent: res.data.totalSpent || 0,
        averageMonthly: res.data.averageMonthly || 0,
      });
    } catch {
      setData({ categoryBreakdown: [], monthlyTrends: [], totalSpent: 0, averageMonthly: 0 });
    } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const top5 = data?.categoryBreakdown.slice(0, 5) ?? [];
  const last6 = data?.monthlyTrends.slice(-6) ?? [];
  const maxSpend = last6.reduce((m, x) => Math.max(m, x.spent), 1);

  const insightMsg = (() => {
    if (!data || data.totalSpent === 0) return "Add transactions to see spending insights.";
    if (data.totalSpent > data.averageMonthly * 1.2) return "You're spending more than usual this period — review your top categories.";
    if (data.totalSpent < data.averageMonthly * 0.8) return "Great job! You're spending below your monthly average.";
    return "Your spending is on track with your monthly average. Keep it up!";
  })();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard label="Total Spent" value={`$${(data?.totalSpent ?? 0).toFixed(2)}`} color={Colors.expense} icon="💸" />
          <StatCard label="Monthly Avg" value={`$${(data?.averageMonthly ?? 0).toFixed(2)}`} color={Colors.income} icon="📅" />
        </View>

        {/* Category breakdown */}
        {top5.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending by Category</Text>
            {top5.map((cat, idx) => {
              const color = Colors.categoryColors[idx % Colors.categoryColors.length];
              return (
                <View key={idx} style={styles.catRow}>
                  <View style={styles.catHeader}>
                    <View style={[styles.catDot, { backgroundColor: color }]} />
                    <Text style={styles.catName} numberOfLines={1}>{cat.category_name}</Text>
                    <Text style={[styles.catPct, { color }]}>{cat.percentage.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.catBarRow}>
                    <View style={styles.catBarWrap}>
                      <ProgressBar value={cat.percentage} height={6} color={color} />
                    </View>
                    <Text style={styles.catAmt}>${cat.amount.toFixed(0)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Monthly bar chart */}
        {last6.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last 6 Months</Text>
            {last6.map((m, idx) => {
              const pct = (m.spent / maxSpend) * 100;
              const over = m.budgeted > 0 && m.spent > m.budgeted;
              const barColor = over ? Colors.expense : Colors.accent;
              return (
                <View key={idx} style={styles.monthRow}>
                  <Text style={styles.monthLabel}>{m.month.slice(0, 3)}</Text>
                  <View style={styles.monthTrack}>
                    <View style={[styles.monthFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                    {m.budgeted > 0 && (
                      <View style={[styles.budgetMark, { left: `${Math.min((m.budgeted / maxSpend) * 100, 98)}%` }]} />
                    )}
                  </View>
                  <Text style={[styles.monthAmt, over && { color: Colors.expense }]}>
                    ${m.spent.toFixed(0)}
                  </Text>
                </View>
              );
            })}
            <View style={styles.legend}>
              <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: Colors.accent }]} /><Text style={styles.legendTxt}>Spent</Text></View>
              <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: Colors.expense }]} /><Text style={styles.legendTxt}>Over budget</Text></View>
              <View style={styles.legendRow}><View style={styles.budgetMarkLegend} /><Text style={styles.legendTxt}>Limit</Text></View>
            </View>
          </View>
        )}

        {/* Insight */}
        <View style={[styles.card, styles.insightCard]}>
          <View style={styles.insightRow}>
            <Text style={styles.insightEmoji}>💡</Text>
            <Text style={styles.insightText}>{insightMsg}</Text>
          </View>
        </View>

        {!data && !loading && (
          <EmptyState icon="📈" title="No data yet" subtitle="Add transactions to see your analytics" />
        )}
      </ScrollView>
    </>
  );
};

const StatCard = ({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) => (
  <View style={[styles.statCard, { borderColor: color + '44' }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  statIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statLabel: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  catRow: { marginBottom: 14 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  catName: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text },
  catPct: { fontSize: 12, fontWeight: '700' },
  catBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catBarWrap: { flex: 1 },
  catAmt: { width: 52, textAlign: 'right', fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  monthLabel: { width: 30, fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  monthTrack: {
    flex: 1, height: 20, backgroundColor: '#ffffff10',
    borderRadius: 6, overflow: 'hidden', position: 'relative',
  },
  monthFill: { height: '100%', borderRadius: 6 },
  budgetMark: {
    position: 'absolute', top: 0, bottom: 0, width: 2,
    backgroundColor: Colors.textMuted + 'aa',
  },
  monthAmt: { width: 50, textAlign: 'right', fontSize: 12, fontWeight: '700', color: Colors.text },
  legend: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  budgetMarkLegend: { width: 8, height: 8, backgroundColor: Colors.textMuted + 'aa', borderRadius: 1 },
  legendTxt: { fontSize: 11, color: Colors.textMuted },
  insightCard: {
    borderColor: Colors.accentGlow,
    backgroundColor: Colors.accentSubtle,
  },
  insightRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  insightEmoji: { fontSize: 22 },
  insightText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});

export default AnalyticsScreen;
