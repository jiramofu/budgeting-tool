import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { Transaction } from '../../types';
import { Colors } from '../../constants/colors';
import EmptyState from '../../components/EmptyState';
import FAB from '../../components/FAB';

type Filter = 'all' | 'expense' | 'income';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'income', label: 'Income' },
];

const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = async () => {
    try {
      const res = await apiClient.get('/transactions');
      setTransactions(res.data.transactions || res.data || []);
    } catch { } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const visible = transactions.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'expense' && t.amount < 0) || (filter === 'income' && t.amount >= 0);
    return matchSearch && matchFilter;
  });

  const totalFiltered = visible.reduce((s, t) => s + t.amount, 0);

  const renderItem = ({ item }: { item: Transaction }) => {
    const isExpense = item.amount < 0;
    const dateStr = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return (
      <View style={styles.row}>
        <View style={[styles.typeCircle, { backgroundColor: isExpense ? Colors.expenseLight : Colors.incomeLight }]}>
          <Text style={{ fontSize: 16, color: isExpense ? Colors.expense : Colors.income }}>
            {isExpense ? '↓' : '↑'}
          </Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.rowMeta}>{item.category_name} · {dateStr}</Text>
        </View>
        <Text style={[styles.rowAmt, { color: isExpense ? Colors.expense : Colors.income }]}>
          {isExpense ? '-' : '+'}${Math.abs(item.amount).toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.screen}>
        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter chips + total */}
        <View style={styles.toolRow}>
          <View style={styles.filters}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, filter === f.key && styles.chipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {visible.length > 0 && (
            <Text style={[styles.netTotal, { color: totalFiltered >= 0 ? Colors.income : Colors.expense }]}>
              {totalFiltered >= 0 ? '+' : '-'}${Math.abs(totalFiltered).toFixed(2)}
            </Text>
          )}
        </View>

        <FlatList
          data={visible}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon="💳"
                title={search ? 'No results' : 'No transactions'}
                subtitle={search ? 'Try a different search term' : 'Tap + to add your first transaction'}
                actionLabel={!search ? 'Add Transaction' : undefined}
                onAction={!search ? () => navigation.navigate('AddTransaction') : undefined}
              />
            ) : null
          }
        />
        <FAB onPress={() => navigation.navigate('AddTransaction')} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15, paddingVertical: 13 },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  filters: { flexDirection: 'row', gap: 8, flex: 1 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.accent },
  netTotal: { fontSize: 15, fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingBottom: 96 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    marginBottom: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: { flex: 1 },
  rowDesc: { fontSize: 14, fontWeight: '600', color: Colors.text },
  rowMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  rowAmt: { fontSize: 15, fontWeight: '800' },
});

export default TransactionsScreen;
