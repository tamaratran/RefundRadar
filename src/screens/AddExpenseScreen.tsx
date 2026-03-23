import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { ALL_CATEGORIES, CATEGORY_META, ExpenseCategory, getToday } from '../data/models';

export default function AddExpenseScreen({ navigation, route }: { navigation: any; route: any }) {
  const { addExpense, editExpense, expenses } = useApp();
  const editId = route?.params?.editId as string | undefined;
  const existing = editId ? expenses.find(e => e.id === editId) : undefined;

  const [amount, setAmount] = useState(existing ? existing.amount.toString() : '');
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category || 'food');
  const [note, setNote] = useState(existing?.note || '');
  const [date, setDate] = useState(existing?.date || getToday());

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (editId && existing) {
      editExpense(editId, { amount: parsed, category, note, date });
    } else {
      addExpense({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        amount: parsed,
        category,
        note,
        date,
        createdAt: Date.now(),
      });
    }
    navigation.goBack();
  };

  // Simple date adjuster
  const adjustDate = (days: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // Don't allow future dates
    if (newDate <= getToday()) {
      setDate(newDate);
    }
  };

  const formatDisplayDate = (dateStr: string): string => {
    const today = getToday();
    if (dateStr === today) return 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.darkText} />
          </TouchableOpacity>
          <Text style={styles.title}>{editId ? 'Edit Expense' : 'Add Expense'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Colors.disabledText}
            autoFocus
          />
        </View>

        {/* Date Selector */}
        <View style={styles.dateSection}>
          <TouchableOpacity onPress={() => adjustDate(-1)} style={styles.dateArrow}>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          <TouchableOpacity
            onPress={() => adjustDate(1)}
            style={styles.dateArrow}
            disabled={date >= getToday()}
          >
            <Ionicons name="chevron-forward" size={20} color={date >= getToday() ? Colors.disabledText : Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Category Picker */}
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.catGrid}>
          {ALL_CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat];
            const selected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catItem, selected && { backgroundColor: meta.color + '20', borderColor: meta.color }]}
                onPress={() => setCategory(cat)}
              >
                <Ionicons name={meta.icon as any} size={22} color={selected ? meta.color : Colors.subText} />
                <Text style={[styles.catLabel, selected && { color: meta.color }]}>{meta.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <Text style={styles.sectionLabel}>Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="e.g., Lunch with friends"
          placeholderTextColor={Colors.disabledText}
          maxLength={100}
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{editId ? 'Update Expense' : 'Add Expense'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: Colors.darkText },

  amountSection: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 20 },
  dollarSign: { fontSize: 32, fontWeight: '300', color: Colors.subText, marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '700', color: Colors.darkText, minWidth: 100, textAlign: 'center' },

  dateSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  dateArrow: { padding: 8 },
  dateText: { fontSize: 16, color: Colors.darkText, fontWeight: '500', marginHorizontal: 16 },

  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.subText, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  catItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  catLabel: { fontSize: 13, color: Colors.subText, marginLeft: 8, fontWeight: '500' },

  noteInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.darkText,
    marginBottom: 30,
  },

  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontSize: 17, fontWeight: '600' },
});
