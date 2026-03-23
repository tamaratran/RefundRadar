import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../data/models';

export default function SettingsScreen() {
  const { budget, setBudget, expenses, streak } = useApp();
  const [editingBudget, setEditingBudget] = useState(false);
  const [daily, setDaily] = useState(budget.daily.toString());
  const [weekly, setWeekly] = useState(budget.weekly.toString());
  const [monthly, setMonthly] = useState(budget.monthly.toString());

  const handleSaveBudget = () => {
    const d = parseFloat(daily);
    const w = parseFloat(weekly);
    const m = parseFloat(monthly);

    if (isNaN(d) || d <= 0 || isNaN(w) || w <= 0 || isNaN(m) || m <= 0) {
      Alert.alert('Invalid Budget', 'Please enter valid amounts greater than 0.');
      return;
    }

    setBudget({ daily: d, weekly: w, monthly: m });
    setEditingBudget(false);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your expenses, budget goals, and streak data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'bt_expenses',
                'bt_budget',
                'bt_streak',
                'bt_onboarding',
              ]);
              Alert.alert('Data Reset', 'All data has been cleared. Please restart the app.');
            } catch (e) {
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const totalExpenses = expenses.length;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* Stats Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalExpenses}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{streak.bestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>
      </View>

      {/* Budget Goals */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Budget Goals</Text>
          {!editingBudget && (
            <TouchableOpacity onPress={() => setEditingBudget(true)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editingBudget ? (
          <View>
            <View style={styles.budgetInputRow}>
              <Text style={styles.budgetLabel}>Daily</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={daily}
                  onChangeText={setDaily}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.budgetInputRow}>
              <Text style={styles.budgetLabel}>Weekly</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={weekly}
                  onChangeText={setWeekly}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.budgetInputRow}>
              <Text style={styles.budgetLabel}>Monthly</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={monthly}
                  onChangeText={setMonthly}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setEditingBudget(false);
                setDaily(budget.daily.toString());
                setWeekly(budget.weekly.toString());
                setMonthly(budget.monthly.toString());
              }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBudget}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetRowLabel}>Daily</Text>
              <Text style={styles.budgetRowValue}>{formatCurrency(budget.daily)}</Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetRowLabel}>Weekly</Text>
              <Text style={styles.budgetRowValue}>{formatCurrency(budget.weekly)}</Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetRowLabel}>Monthly</Text>
              <Text style={styles.budgetRowValue}>{formatCurrency(budget.monthly)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Data Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleResetData}>
          <Ionicons name="trash-outline" size={18} color={Colors.urgency} />
          <Text style={styles.dangerText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App</Text>
          <Text style={styles.infoValue}>RefundRadar - Budget Tracker</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>2.0.0</Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.darkText, marginBottom: 20 },

  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.darkText, marginBottom: 16 },
  editBtn: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
  statLabel: { fontSize: 12, color: Colors.subText, marginTop: 4 },

  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  budgetRowLabel: { fontSize: 15, color: Colors.subText },
  budgetRowValue: { fontSize: 15, fontWeight: '600', color: Colors.darkText },

  budgetInputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  budgetLabel: { fontSize: 15, color: Colors.subText },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  inputPrefix: { fontSize: 16, color: Colors.subText, marginRight: 2 },
  budgetInput: { fontSize: 16, color: Colors.darkText, fontWeight: '600', minWidth: 80, textAlign: 'right' },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: Colors.subText, fontWeight: '500' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnText: { fontSize: 15, color: Colors.white, fontWeight: '600' },

  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  dangerText: { fontSize: 15, color: Colors.urgency, fontWeight: '500' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14, color: Colors.subText },
  infoValue: { fontSize: 14, color: Colors.darkText },
});
