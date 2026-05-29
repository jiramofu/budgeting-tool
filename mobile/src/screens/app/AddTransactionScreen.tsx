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

const today = () => new Date().toISOString().split('T')[0];

const AddTransactionScreen: React.FC<any> = ({ navigation, route }) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today());
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
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
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) e.amount = 'Enter a valid amount';
    if (!description.trim()) e.description = 'Description is required';
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) e.date = 'Format: YYYY-MM-DD';
    if (!selectedCategoryId) e.category = 'Select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const signed = type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
      await apiClient.post('/transactions', { description: description.trim(), amount: signed, date, category_id: selectedCategoryId });
      route.params?.onSuccess?.();
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save transaction');
    } finally { setSaving(false); }
  };

  const isExpense = type === 'expense';
  const typeColor = isExpense ? Colors.expense : Colors.income;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Type toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, isExpense && { backgroundColor: Colors.expenseLight, borderColor: Colors.expense + '55' }]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.typeBtnText, isExpense && { color: Colors.expense }]}>↓ Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, !isExpense && { backgroundColor: Colors.incomeLight, borderColor: Colors.income + '55' }]}
              onPress={() => setType('income')}
            >
              <Text style={[styles.typeBtnText, !isExpense && { color: Colors.income }]}>↑ Income</Text>
            </TouchableOpacity>
          </View>

          {/* Amount hero */}
          <View style={[styles.amountHero, { borderColor: typeColor + '44' }]}>
            <Text style={[styles.amountSign, { color: typeColor }]}>{isExpense ? '−' : '+'}</Text>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: typeColor }]}
              error={errors.amount}
            />
          </View>

          <Input label="Description" value={description} onChangeText={setDescription} placeholder="e.g. Coffee, Groceries, Salary" error={errors.description} />
          <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-05-29" error={errors.date} />

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
            <Button label="Save" onPress={handleSave} loading={saving} style={styles.actionBtn} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, flexGrow: 1 },
  typeToggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  amountHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  amountSign: { fontSize: 32, fontWeight: '800', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '800', paddingVertical: 18, borderWidth: 0, backgroundColor: 'transparent' },
  catLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  catError: { fontSize: 12, color: Colors.expense, marginBottom: 6 },
  loader: { marginVertical: 16 },
  chips: { marginBottom: 24 },
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

export default AddTransactionScreen;
