import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { CATEGORY_COLORS, CATEGORY_ICONS, PurchaseCategory, formatCurrency } from '../data/models';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const {
    purchases,
    claims,
    alerts,
    getPurchasesWithDrops,
    totalSavingsAvailable,
    totalSavingsClaimed,
    totalRefunded,
    appStreak,
    unreadAlertCount,
  } = useApp();

  const dropsAvailable = getPurchasesWithDrops();
  const savingsAvailable = totalSavingsAvailable();
  const savingsClaimed = totalSavingsClaimed();
  const unreadCount = unreadAlertCount();

  // Activity dots for past 7 days
  const activityDots = (() => {
    const dots: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hadActivity = purchases.some(p => p.purchaseDate === dateStr) || claims.some(c => c.submittedDate === dateStr);
      dots.push(hadActivity);
    }
    return dots;
  })();

  const orderedDayLabels = (() => {
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.getDay();
      labels.push(['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]);
    }
    return labels;
  })();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>RefundRadar</Text>
            <Text style={styles.headerSubtitle}>Your money, tracked</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={32} color={Colors.darkText} />
          </TouchableOpacity>
        </View>

        {/* Hero Savings Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Available Refunds</Text>
              <Text style={styles.heroAmount}>{formatCurrency(savingsAvailable)}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="trending-down" size={20} color={Colors.primary} />
              <Text style={styles.heroBadgeText}>{dropsAvailable.length} drops</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{formatCurrency(totalRefunded)}</Text>
              <Text style={styles.heroStatLabel}>Total Refunded</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{claims.length}</Text>
              <Text style={styles.heroStatLabel}>Claims Filed</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{purchases.length}</Text>
              <Text style={styles.heroStatLabel}>Tracked Items</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('AddPurchase')}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primarySoft }]}>
              <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Add Purchase</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('MainTabs', { screen: 'Alerts' })}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.accentSoft }]}>
              <Ionicons name="notifications-outline" size={24} color={Colors.accent} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.quickActionText}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('MainTabs', { screen: 'Retailers' })}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8EAF6' }]}>
              <Ionicons name="storefront-outline" size={24} color="#5C6BC0" />
            </View>
            <Text style={styles.quickActionText}>Policies</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Price Drops */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Price Drops</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Alerts' })}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {dropsAvailable.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={36} color={Colors.subText} />
              <Text style={styles.emptyText}>No price drops detected yet</Text>
              <Text style={styles.emptySubtext}>Add purchases to start tracking</Text>
            </View>
          ) : (
            dropsAvailable.slice(0, 4).map(purchase => (
              <TouchableOpacity
                key={purchase.id}
                style={styles.dropRow}
                onPress={() => navigation.navigate('PurchaseDetail', { purchase })}
              >
                <View style={[styles.dropIcon, { backgroundColor: (CATEGORY_COLORS[purchase.category] || Colors.subText) + '20' }]}>
                  <Ionicons
                    name={(CATEGORY_ICONS[purchase.category] || 'ellipsis-horizontal') as any}
                    size={18}
                    color={CATEGORY_COLORS[purchase.category] || Colors.subText}
                  />
                </View>
                <View style={styles.dropInfo}>
                  <Text style={styles.dropName} numberOfLines={1}>{purchase.name}</Text>
                  <Text style={styles.dropRetailer}>{purchase.retailer}</Text>
                </View>
                <View style={styles.dropSavings}>
                  <Text style={styles.dropSavingsAmount}>-{formatCurrency(purchase.savingsAmount)}</Text>
                  <Text style={styles.dropSavingsLabel}>save</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Streak Card */}
        <View style={styles.card}>
          <View style={styles.streakHeader}>
            <View style={styles.streakTitleRow}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakNumber}>{appStreak}</Text>
              <Text style={styles.streakDayLabel}>day streak</Text>
            </View>
            <Text style={styles.streakMessage}>Keep tracking!</Text>
          </View>
          <View style={styles.dotGrid}>
            {activityDots.map((active, i) => (
              <View key={i} style={styles.dotColumn}>
                <View style={[styles.actDot, active ? { backgroundColor: Colors.success } : { backgroundColor: Colors.surfaceLight }]} />
                <Text style={styles.dotLabel}>{orderedDayLabels[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.darkText },
  headerSubtitle: { fontSize: 14, color: Colors.subText, marginTop: 2 },
  profileButton: { padding: 4 },

  heroCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 24, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroLabel: { fontSize: 14, fontWeight: '600', color: Colors.subText },
  heroAmount: { fontSize: 40, fontWeight: '900', color: Colors.primary, marginTop: 4, letterSpacing: -1 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primarySoft,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  heroBadgeText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  heroStats: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 18, fontWeight: '800', color: Colors.darkText },
  heroStatLabel: { fontSize: 11, color: Colors.subText, marginTop: 4, fontWeight: '500' },
  heroDivider: { width: 1, height: 36, backgroundColor: Colors.border },

  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  quickAction: { flex: 1, alignItems: 'center', gap: 8 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  },
  quickActionText: { fontSize: 12, fontWeight: '600', color: Colors.subText },
  badge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: Colors.urgency,
    width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  card: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.darkText },
  viewAllLink: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.subText, fontWeight: '500' },
  emptySubtext: { fontSize: 12, color: Colors.sectionLabel },

  dropRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dropInfo: { flex: 1, marginLeft: 12 },
  dropName: { fontSize: 14, fontWeight: '600', color: Colors.darkText },
  dropRetailer: { fontSize: 12, color: Colors.subText, marginTop: 2 },
  dropSavings: { alignItems: 'flex-end' },
  dropSavingsAmount: { fontSize: 15, fontWeight: '700', color: Colors.success },
  dropSavingsLabel: { fontSize: 10, color: Colors.subText, marginTop: 2 },

  streakHeader: { marginBottom: 16 },
  streakTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  streakFire: { fontSize: 24 },
  streakNumber: { fontSize: 32, fontWeight: '900', color: Colors.darkText },
  streakDayLabel: { fontSize: 16, color: Colors.subText, fontWeight: '600' },
  streakMessage: { fontSize: 14, color: Colors.success, fontWeight: '600', marginTop: 4 },
  dotGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  dotColumn: { alignItems: 'center', gap: 6 },
  actDot: { width: 28, height: 28, borderRadius: 14 },
  dotLabel: { fontSize: 11, color: Colors.subText, fontWeight: '600' },
});
