import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { apiClient } from '../../services/api';

interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  target_amount: number;
  spent: number;
  percentage: number;
}

const BudgetsScreen: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const response = await apiClient.get(`/budgets/${year}/${month}`);
      const budgetList = response.data.categories || [];

      setBudgets(
        budgetList.map((b: any) => ({
          id: b.id,
          category_id: b.category_id,
          category_name: b.category_name,
          target_amount: b.target_amount,
          spent: b.spent,
          percentage: (b.spent / b.target_amount) * 100,
        }))
      );
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage <= 75) return '#10b981';
    if (percentage <= 90) return '#f59e0b';
    return '#ef4444';
  };

  const renderBudgetItem = ({ item }: { item: Budget }) => (
    <View style={styles.budgetCard}>
      <View style={styles.budgetHeader}>
        <Text style={styles.categoryName}>{item.category_name}</Text>
        <Text style={[styles.percentage, { color: getStatusColor(item.percentage) }]}>
          {item.percentage.toFixed(0)}%
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(item.percentage, 100)}%`,
              backgroundColor: getStatusColor(item.percentage),
            },
          ]}
        />
      </View>
      <View style={styles.budgetFooter}>
        <Text style={styles.spent}>${item.spent.toFixed(2)} spent</Text>
        <Text style={styles.budget}>of ${item.target_amount.toFixed(2)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={budgets}
      renderItem={renderBudgetItem}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No budgets set up yet</Text>
          <Text style={styles.emptySubtext}>Create your first budget to get started</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 16,
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  budget: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default BudgetsScreen;
