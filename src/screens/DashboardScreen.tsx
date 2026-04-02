import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { formatCurrency, getLast7Days, getShortDayLabel, CATEGORY_META, ExpenseCategory } from '../data/models';

export default function DashboardScreen({ navigation }: { navigation: any }) {
  const { getTodayTotal, getWeekTotal, getMonthTotal, budget, streak, getDailyTotals, getExpensesByCategory, expenses } = useApp();

  const todayTotal = getTodayTotal();
  const weekTotal = getWeekTotal();
  const monthTotal = getMonthTotal();

  const dailyPercent = budget.daily > 0 ? Math.min(todayTotal / budget.daily, 1) : 0;
  const weeklyPercent = budget.weekly > 0 ? Math.min(weekTotal / budget.weekly, 1) : 0;
  const monthlyPercent = budget.monthly > 0 ? Math.min(monthTotal / budget.monthly, 1) : 0;

  const last7 = getLast7Days();
  const dailyTotals = getDailyTotals(last7);
  const maxDaily = Math.max(...dailyTotals, 1);

  const categoryTotals = getExpensesByCategory();
  const sortedCategories = (Object.entries(categoryTotals) as [ExpenseCategory, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalCategorySpend = sortedCategories.reduce((s, [, v]) => s + v, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()}</Text>
          <Text style={styles.subtitle}>Here&apos;s your spending today</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Today's Spending Card */}
      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>Today&apos;s Spending</Text>
        <Text style={[styles.todayAmount, todayTotal > budget.daily ? styles.overBudget : null]}>
          {formatCurrency(todayTotal)}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${dailyPercent * 100}%`, backgroundColor: todayTotal > budget.daily ? Colors.urgency : Colors.primary }]} />
        </View>
        <Text style={styles.budgetLabel}>
          {formatCurrency(Math.max(budget.daily - todayTotal, 0))} remaining of {formatCurrency(budget.daily)} daily budget
        </Text>
      </View>

      {/* Streak */}
      <View style={styles.streakCard}>
        <View style={styles.streakLeft}>
          <Ionicons name="flame" size={28} color={streak.count > 0 ? '#FF6D00' : Colors.disabledText} />
          <View style={styles.streakText}>
            <Text style={styles.streakCount}>{streak.count} day streak</Text>
            <Text style={styles.streakBest}>Best: {streak.bestStreak} days</Text>
          </View>
        </View>
        <Text style={styles.streakHint}>Stay under daily budget!</Text>
      </View>

      {/* Weekly / Monthly Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Week</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(weekTotal)}</Text>
          <View style={styles.miniTrack}>
            <View style={[styles.miniFill, { width: `${weeklyPercent * 100}%`, backgroundColor: weekTotal > budget.weekly ? Colors.urgency : Colors.primaryLight }]} />
          </View>
          <Text style={styles.summaryBudget}>of {formatCurrency(budget.weekly)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(monthTotal)}</Text>
          <View style={styles.miniTrack}>
            <View style={[styles.miniFill, { width: `${monthlyPercent * 100}%`, backgroundColor: monthTotal > budget.monthly ? Colors.urgency : Colors.primaryLight }]} />
          </View>
          <Text style={styles.summaryBudget}>of {formatCurrency(budget.monthly)}</Text>
        </View>
      </View>

      {/* 7-Day Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Last 7 Days</Text>
        <View style={styles.barRow}>
          {last7.map((day, i) => (
            <View key={day} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(dailyTotals[i] / maxDaily) * 100}%`,
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
      </View>

      {/* Top Categories */}
      {sortedCategories.length > 0 && (
        <View style={styles.catCard}>
          <Text style={styles.chartTitle}>Top Categories This Month</Text>
          {sortedCategories.map(([cat, amount]) => {
            const meta = CATEGORY_META[cat];
            const pct = totalCategorySpend > 0 ? amount / totalCategorySpend : 0;
            return (
              <View key={cat} style={styles.catRow}>
                <View style={[styles.catIcon, { backgroundColor: meta.color + '20' }]}>
                  <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                </View>
                <View style={styles.catInfo}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{meta.label}</Text>
                    <Text style={styles.catAmount}>{formatCurrency(amount)}</Text>
                  </View>
                  <View style={styles.catTrack}>
                    <View style={[styles.catFill, { width: `${pct * 100}%`, backgroundColor: meta.color }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Recent Expenses */}
      {expenses.length > 0 && (
        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.chartTitle}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExpensesTab')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {expenses.slice(0, 5).map(exp => {
            const meta = CATEGORY_META[exp.category];
            return (
              <View key={exp.id} style={styles.expenseRow}>
                <View style={[styles.expIcon, { backgroundColor: meta.color + '20' }]}>
                  <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                </View>
                <View style={styles.expInfo}>
                  <Text style={styles.expNote}>{exp.note || meta.label}</Text>
                  <Text style={styles.expDate}>{exp.date}</Text>
                </View>
                <Text style={styles.expAmount}>-{formatCurrency(exp.amount)}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '700', color: Colors.darkText },
  subtitle: { fontSize: 15, color: Colors.subText, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },

  todayCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 12 },
  todayLabel: { fontSize: 14, color: Colors.subText, marginBottom: 4 },
  todayAmount: { fontSize: 36, fontWeight: '700', color: Colors.darkText },
  overBudget: { color: Colors.urgency },
  progressTrack: { height: 8, backgroundColor: Colors.border, borderRadius: 4, marginTop: 12 },
  progressFill: { height: 8, borderRadius: 4 },
  budgetLabel: { fontSize: 13, color: Colors.subText, marginTop: 8 },

  streakCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  streakLeft: { flexDirection: 'row', alignItems: 'center' },
  streakText: { marginLeft: 10 },
  streakCount: { fontSize: 16, fontWeight: '600', color: Colors.darkText },
  streakBest: { fontSize: 12, color: Colors.subText },
  streakHint: { fontSize: 12, color: Colors.subText },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16 },
  summaryLabel: { fontSize: 13, color: Colors.subText },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: Colors.darkText, marginTop: 4 },
  miniTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginTop: 8 },
  miniFill: { height: 6, borderRadius: 3 },
  summaryBudget: { fontSize: 12, color: Colors.subText, marginTop: 6 },

  chartCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 12 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: Colors.darkText, marginBottom: 16 },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barCol: { alignItems: 'center', flex: 1 },
  barTrack: { width: 20, height: 100, justifyContent: 'flex-end', borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.border },
  bar: { width: 20, borderRadius: 10, minHeight: 4 },
  barLabel: { fontSize: 11, color: Colors.subText, marginTop: 4 },
  barAmount: { fontSize: 10, color: Colors.subText, marginTop: 1 },

  catCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  catIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  catInfo: { flex: 1, marginLeft: 12 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, color: Colors.darkText, fontWeight: '500' },
  catAmount: { fontSize: 14, color: Colors.darkText, fontWeight: '600' },
  catTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3 },
  catFill: { height: 6, borderRadius: 3 },

  recentCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 12 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAll: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  expIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  expInfo: { flex: 1, marginLeft: 10 },
  expNote: { fontSize: 14, color: Colors.darkText, fontWeight: '500' },
  expDate: { fontSize: 12, color: Colors.subText, marginTop: 1 },
  expAmount: { fontSize: 14, color: Colors.urgency, fontWeight: '600' },
});
