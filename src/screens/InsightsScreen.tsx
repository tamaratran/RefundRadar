import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { CATEGORY_META, ExpenseCategory, formatCurrency, getLast7Days, getShortDayLabel, getDateString, getMonthKey } from '../data/models';

type TimePeriod = '7d' | '30d' | 'all';

export default function InsightsScreen() {
  const { expenses, budget } = useApp();
  const [period, setPeriod] = useState<TimePeriod>('30d');

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    if (period === '7d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = getDateString(cutoff);
      return expenses.filter(e => e.date >= cutoffStr);
    }
    if (period === '30d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = getDateString(cutoff);
      return expenses.filter(e => e.date >= cutoffStr);
    }
    return expenses;
  }, [expenses, period]);

  const totalSpent = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const avgPerDay = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : Math.max(1, new Set(expenses.map(e => e.date)).size);
    return totalSpent / days;
  }, [totalSpent, period, expenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return (Object.entries(map) as [ExpenseCategory, number][])
      .sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // Daily spending for bar chart (last 7 days)
  const last7 = getLast7Days();
  const dailyTotals = useMemo(() => {
    return last7.map(day => expenses.filter(e => e.date === day).reduce((s, e) => s + e.amount, 0));
  }, [expenses, last7]);
  const maxDaily = Math.max(...dailyTotals, 1);

  // Weekly trend (last 4 weeks)
  const weeklyTotals = useMemo(() => {
    const weeks: { label: string; total: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      const startStr = getDateString(weekStart);
      const endStr = getDateString(weekEnd);
      const total = expenses
        .filter(e => e.date >= startStr && e.date <= endStr)
        .reduce((s, e) => s + e.amount, 0);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      weeks.push({
        label: `${months[weekStart.getMonth()]} ${weekStart.getDate()}`,
        total,
      });
    }
    return weeks;
  }, [expenses]);
  const maxWeekly = Math.max(...weeklyTotals.map(w => w.total), 1);

  const expenseCount = filteredExpenses.length;

  // Actual current month total (independent of period selector)
  const monthlySpent = useMemo(() => {
    const monthKey = getMonthKey();
    return expenses.filter(e => e.date.startsWith(monthKey)).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(['7d', '30d', 'all'] as TimePeriod[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Daily Avg</Text>
          <Text style={styles.statValue}>{formatCurrency(avgPerDay)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statValue}>{expenseCount}</Text>
        </View>
      </View>

      {/* Daily Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily Spending</Text>
        <View style={styles.barRow}>
          {last7.map((day, i) => (
            <View key={day} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max((dailyTotals[i] / maxDaily) * 100, 2)}%`,
                      backgroundColor: dailyTotals[i] > budget.daily ? Colors.urgency : Colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{getShortDayLabel(day)}</Text>
              <Text style={styles.barAmount}>${dailyTotals[i].toFixed(0)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.budgetLine}>
          <View style={styles.budgetDash} />
          <Text style={styles.budgetLineLabel}>Daily budget: {formatCurrency(budget.daily)}</Text>
        </View>
      </View>

      {/* Weekly Trend */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Trend</Text>
        <View style={styles.barRow}>
          {weeklyTotals.map((week, i) => (
            <View key={i} style={[styles.barCol, { flex: 1 }]}>
              <View style={[styles.barTrack, { height: 80 }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max((week.total / maxWeekly) * 100, 2)}%`,
                      backgroundColor: Colors.primaryLight,
                      width: 28,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{week.label}</Text>
              <Text style={styles.barAmount}>${week.total.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Spending by Category</Text>
        {categoryBreakdown.length === 0 ? (
          <Text style={styles.emptyText}>No expenses in this period</Text>
        ) : (
          categoryBreakdown.map(([cat, amount]) => {
            const meta = CATEGORY_META[cat];
            const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
            return (
              <View key={cat} style={styles.catRow}>
                <View style={[styles.catIcon, { backgroundColor: meta.color + '20' }]}>
                  <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                </View>
                <View style={styles.catInfo}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{meta.label}</Text>
                    <View style={styles.catRight}>
                      <Text style={styles.catPct}>{pct.toFixed(1)}%</Text>
                      <Text style={styles.catAmount}>{formatCurrency(amount)}</Text>
                    </View>
                  </View>
                  <View style={styles.catTrack}>
                    <View style={[styles.catFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Budget Comparison */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Budget Status</Text>
        {[
          { label: 'Daily', spent: dailyTotals[dailyTotals.length - 1], limit: budget.daily },
          { label: 'Weekly', spent: weeklyTotals[weeklyTotals.length - 1]?.total || 0, limit: budget.weekly },
          { label: 'Monthly', spent: monthlySpent, limit: budget.monthly },
        ].map(item => {
          const pct = item.limit > 0 ? Math.min((item.spent / item.limit) * 100, 100) : 0;
          const over = item.spent > item.limit;
          return (
            <View key={item.label} style={styles.budgetRow}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>{item.label}</Text>
                <Text style={[styles.budgetStatus, over && { color: Colors.urgency }]}>
                  {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                </Text>
              </View>
              <View style={styles.budgetTrack}>
                <View
                  style={[
                    styles.budgetFill,
                    { width: `${pct}%`, backgroundColor: over ? Colors.urgency : Colors.primary },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.darkText, marginBottom: 20 },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center' },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodText: { fontSize: 14, color: Colors.subText, fontWeight: '500' },
  periodTextActive: { color: Colors.white },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, alignItems: 'center' },
  statLabel: { fontSize: 12, color: Colors.subText },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.darkText, marginTop: 4 },

  chartCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: Colors.darkText, marginBottom: 16 },

  barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barCol: { alignItems: 'center' },
  barTrack: { width: 20, height: 100, justifyContent: 'flex-end', borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.border },
  bar: { width: 20, borderRadius: 10, minHeight: 4 },
  barLabel: { fontSize: 11, color: Colors.subText, marginTop: 4 },
  barAmount: { fontSize: 10, color: Colors.subText, marginTop: 1 },

  budgetLine: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  budgetDash: { width: 20, height: 2, backgroundColor: Colors.warning, marginRight: 8 },
  budgetLineLabel: { fontSize: 12, color: Colors.subText },

  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  catIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  catInfo: { flex: 1, marginLeft: 12 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, color: Colors.darkText, fontWeight: '500' },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catPct: { fontSize: 12, color: Colors.subText },
  catAmount: { fontSize: 14, color: Colors.darkText, fontWeight: '600' },
  catTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3 },
  catFill: { height: 6, borderRadius: 3 },

  budgetRow: { marginBottom: 16 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetLabel: { fontSize: 14, fontWeight: '500', color: Colors.darkText },
  budgetStatus: { fontSize: 13, color: Colors.subText },
  budgetTrack: { height: 8, backgroundColor: Colors.border, borderRadius: 4 },
  budgetFill: { height: 8, borderRadius: 4 },

  emptyText: { fontSize: 14, color: Colors.subText, textAlign: 'center', paddingVertical: 20 },
});
