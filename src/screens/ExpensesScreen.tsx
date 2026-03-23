import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { CATEGORY_META, ExpenseCategory, ALL_CATEGORIES, formatCurrency, formatDateShort, Expense } from '../data/models';

export default function ExpensesScreen({ navigation }: { navigation: any }) {
  const { expenses, deleteExpense } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<ExpenseCategory | 'all'>('all');

  const filtered = useMemo(() => {
    let list = expenses;
    if (filterCat !== 'all') {
      list = list.filter(e => e.category === filterCat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.note.toLowerCase().includes(q) ||
        CATEGORY_META[e.category].label.toLowerCase().includes(q) ||
        e.amount.toString().includes(q)
      );
    }
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [expenses, filterCat, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    filtered.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
    ]);
  };

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.subText} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search expenses..."
          placeholderTextColor={Colors.disabledText}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.subText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['all' as const, ...ALL_CATEGORIES]}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        keyExtractor={item => item}
        renderItem={({ item }) => {
          const selected = filterCat === item;
          const label = item === 'all' ? 'All' : CATEGORY_META[item].label;
          return (
            <TouchableOpacity
              style={[styles.filterChip, selected && styles.filterChipActive]}
              onPress={() => setFilterCat(item)}
            >
              <Text style={[styles.filterText, selected && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>{filtered.length} expense{filtered.length !== 1 ? 's' : ''}</Text>
        <Text style={styles.summaryTotal}>{formatCurrency(totalFiltered)}</Text>
      </View>

      {/* Expense List */}
      {grouped.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={Colors.disabledText} />
          <Text style={styles.emptyText}>No expenses yet</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Text style={styles.emptyBtnText}>Add Your First Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={([date]) => date}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item: [date, items] }) => (
            <View>
              <Text style={styles.dateHeader}>{formatDateShort(date)}</Text>
              {items.map(exp => {
                const meta = CATEGORY_META[exp.category];
                return (
                  <TouchableOpacity
                    key={exp.id}
                    style={styles.expRow}
                    onPress={() => navigation.navigate('AddExpense', { editId: exp.id })}
                    onLongPress={() => handleDelete(exp.id)}
                  >
                    <View style={[styles.expIcon, { backgroundColor: meta.color + '20' }]}>
                      <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                    </View>
                    <View style={styles.expInfo}>
                      <Text style={styles.expNote}>{exp.note || meta.label}</Text>
                      <Text style={styles.expCat}>{meta.label}</Text>
                    </View>
                    <Text style={styles.expAmount}>-{formatCurrency(exp.amount)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.darkText },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: Colors.darkText },

  filterList: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.subText, fontWeight: '500' },
  filterTextActive: { color: Colors.white },

  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  summaryCount: { fontSize: 13, color: Colors.subText },
  summaryTotal: { fontSize: 13, color: Colors.darkText, fontWeight: '600' },

  dateHeader: { fontSize: 13, fontWeight: '600', color: Colors.subText, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  expRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  expIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  expInfo: { flex: 1, marginLeft: 12 },
  expNote: { fontSize: 15, color: Colors.darkText, fontWeight: '500' },
  expCat: { fontSize: 12, color: Colors.subText, marginTop: 2 },
  expAmount: { fontSize: 15, color: Colors.urgency, fontWeight: '600' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { fontSize: 16, color: Colors.subText, marginTop: 12 },
  emptyBtn: { marginTop: 16, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: Colors.white, fontWeight: '600' },
});
