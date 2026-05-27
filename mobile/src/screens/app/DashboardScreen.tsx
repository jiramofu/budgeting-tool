import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface BudgetData {
  totalBudgeted: number;
  totalSpent: number;
  categoriesCount: number;
  budgetHealth: number;
}

const DashboardScreen: React.FC = () => {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Fetch budget data
      const response = await apiClient.get(`/budgets/${year}/${month}`);
      const budgetInfo = response.data;

      setBudgetData({
        totalBudgeted: budgetInfo.total_budgeted || 0,
        totalSpent: budgetInfo.total_spent || 0,
        categoriesCount: budgetInfo.categories_count || 0,
        budgetHealth: budgetInfo.health_score || 85,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const getHealthColor = (health: number): string => {
    if (health >= 80) return '#10b981';
    if (health >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const spentPercentage = budgetData
    ? (budgetData.totalSpent / budgetData.totalBudgeted) * 100
    : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>👋 Hello, {user?.email?.split('@')[0]}</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {budgetData && (
        <>
          {/* Budget Health */}
          <View style={styles.card}>
            <View style={styles.healthHeader}>
              <Text style={styles.cardTitle}>Budget Health</Text>
              <Text style={[styles.healthScore, { color: getHealthColor(budgetData.budgetHealth) }]}>
                {budgetData.budgetHealth}%
              </Text>
            </View>
            <View style={styles.healthBar}>
              <View
                style={[
                  styles.healthBarFill,
                  {
                    width: `${budgetData.budgetHealth}%`,
                    backgroundColor: getHealthColor(budgetData.budgetHealth),
                  },
                ]}
              />
            </View>
            <Text style={styles.healthStatus}>
              {budgetData.budgetHealth >= 80
                ? '✅ On track'
                : budgetData.budgetHealth >= 60
                ? '⚠️ Needs attention'
                : '🚨 Over budget'}
            </Text>
          </View>

          {/* Budget Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Month</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Budgeted</Text>
                <Text style={styles.summaryAmount}>${budgetData.totalBudgeted.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Spent</Text>
                <Text style={styles.summaryAmount}>${budgetData.totalSpent.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text
                  style={[
                    styles.summaryAmount,
                    {
                      color:
                        budgetData.totalBudgeted - budgetData.totalSpent >= 0
                          ? '#10b981'
                          : '#ef4444',
                    },
                  ]}
                >
                  ${(budgetData.totalBudgeted - budgetData.totalSpent).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(spentPercentage, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{spentPercentage.toFixed(0)}% spent</Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{budgetData.categoriesCount}</Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>${budgetData.totalBudgeted.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Monthly Budget</Text>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  healthBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default DashboardScreen;
