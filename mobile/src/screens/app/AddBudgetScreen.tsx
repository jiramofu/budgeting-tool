import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { apiClient } from '../../services/api';
import { Category } from '../../types';
import { Colors } from '../../constants/colors';
import Button from '../../components/Button';
import Input from '../../components/Input';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const AddBudgetScreen: React.FC<any> = ({ navigation, route }) => {
  const now = new Date();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [targetAmount, setTargetAmount] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    apiClient.get('/categories')
      .then((res) => {
        const list: Category[] = res.data.categories || res.data || [];
        setCategories(list);
        if (list.length > 0) setSelectedCategoryId(list[0].id);
      })
      .catch(() => { })
      .finally(() => setLoadingCategories(false));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    const num = parseFloat(targetAmount);
    if (!targetAmount || isNaN(num) || num <= 0) e.amount = 'Enter a valid budget amount';
    if (!selectedCategoryId) e.category = 'Select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await apiClient.post('/budgets', {
        category_id: selectedCategoryId,
        target_amount: parseFloat(targetAmount),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      route.params?.onSuccess?.();
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save budget');
    } finally { setSaving(false); }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Month banner */}
          <View style={styles.monthBanner}>
            <Text style={styles.bannerFor}>Setting budget for</Text>
            <Text style={styles.bannerMonth}>{MONTHS[now.getMonth()]} {now.getFullYear()}</Text>
          </View>

          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Monthly Limit</Text>
            <View style={styles.amountRow}>
              <Text style={styles.dollarSign}>$</Text>
              <Input
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={styles.amountInput}
                error={errors.amount}
              />
            </View>
          </View>

          {/* Category chips */}
          <Text style={styles.catLabel}>Category</Text>
          {errors.category ? <Text style={styles.catError}>{errors.category}</Text> : null}
          {loadingCategories ? (
            <ActivityIndicator color={Colors.accent} style={styles.loader} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {categories.map((cat, idx) => {
                const sel = cat.id === selectedCategoryId;
                const c = Colors.categoryColors[idx % Colors.categoryColors.length];
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, { borderColor: c + '77' }, sel && { backgroundColor: c, borderColor: c }]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Text style={[styles.chipTxt, sel && { color: Colors.textInverse }]}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={() => navigation.goBack()} style={styles.actionBtn} />
            <View style={{ width: 12 }} />
            <Button label="Save Budget" onPress={handleSave} loading={saving} style={styles.actionBtn} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, flexGrow: 1 },
  monthBanner: {
    backgroundColor: Colors.accentSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerFor: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  bannerMonth: { fontSize: 24, fontWeight: '800', color: Colors.accent },
  amountCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 24,
  },
  amountLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 28, fontWeight: '800', color: Colors.accent, marginRight: 4 },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
  },
  catLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  catError: { fontSize: 12, color: Colors.expense, marginBottom: 6 },
  loader: { marginVertical: 16 },
  chips: { marginBottom: 28 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    backgroundColor: Colors.bgCard,
  },
  chipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  actions: { flexDirection: 'row', marginTop: 8 },
  actionBtn: { flex: 1 },
});

export default AddBudgetScreen;
