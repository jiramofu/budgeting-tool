import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { apiClient } from '../../services/api';

interface CategorySpending {
  category_name: string;
  amount: number;
  percentage: number;
}

interface MonthlySummary {
  month: string;
  spent: number;
  budgeted: number;
}

interface AnalyticsData {
  categoryBreakdown: CategorySpending[];
  monthlyTrends: MonthlySummary[];
  totalSpent: number;
  averageMonthly: number;
}

const AnalyticsScreen: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/analytics');
      const data = response.data;

      setAnalyticsData({
        categoryBreakdown: data.categoryBreakdown || [],
        monthlyTrends: data.monthlyTrends || [],
        totalSpent: data.totalSpent || 0,
        averageMonthly: data.averageMonthly || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const topCategories = analyticsData?.categoryBreakdown.slice(0, 5) || [];
  const monthlyData = analyticsData?.monthlyTrends || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {analyticsData && (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={styles.summaryAmount}>${analyticsData.totalSpent.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Monthly Avg</Text>
              <Text style={styles.summaryAmount}>${analyticsData.averageMonthly.toFixed(2)}</Text>
            </View>
          </View>

          {/* Top Spending Categories */}
          {topCategories.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Top Spending Categories</Text>
              {topCategories.map((category, index) => (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.category_name}</Text>
                    <View style={styles.categoryBar}>
                      <View
                        style={[
                          styles.categoryBarFill,
                          {
                            width: `${Math.min(category.percentage, 100)}%`,
                            backgroundColor: getCategoryColor(index),
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={styles.categoryAmountText}>${category.amount.toFixed(2)}</Text>
                    <Text style={styles.categoryPercentageText}>{category.percentage.toFixed(0)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Monthly Trends */}
          {monthlyData.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Monthly Spending Trends</Text>
              {monthlyData.slice(-6).map((month, index) => (
                <View key={index} style={styles.monthRow}>
                  <Text style={styles.monthLabel}>{month.month}</Text>
                  <View style={styles.monthBars}>
                    <View style={styles.monthBar}>
                      <View
                        style={[
                          styles.monthBarFill,
                          {
                            flex: month.spent,
                            backgroundColor: '#ef4444',
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.monthBar}>
                      <View
                        style={[
                          styles.monthBarFill,
                          {
                            flex: month.budgeted - month.spent,
                            backgroundColor: '#d1d5db',
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.monthAmount}>${month.spent.toFixed(0)}</Text>
                </View>
              ))}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendLabel}>Spent</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#d1d5db' }]} />
                  <Text style={styles.legendLabel}>Remaining</Text>
                </View>
              </View>
            </View>
          )}

          {/* Insights */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Financial Insights</Text>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>💡 Tip</Text>
              <Text style={styles.insightText}>
                Your spending has been consistent. Keep monitoring your top categories.
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

function getCategoryColor(index: number): string {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  return colors[index % colors.length];
}

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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
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
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 6,
  },
  categoryBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryPercentageText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  monthLabel: {
    width: 40,
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  monthBars: {
    flex: 1,
    flexDirection: 'row',
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  monthBar: {
    height: '100%',
  },
  monthBarFill: {
    height: '100%',
  },
  monthAmount: {
    width: 50,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  insightItem: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
});

export default AnalyticsScreen;
