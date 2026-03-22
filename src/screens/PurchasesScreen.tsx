import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { CATEGORY_COLORS, CATEGORY_ICONS, PurchaseCategory, formatCurrency, daysAgo } from '../data/models';

const FILTER_TABS = ['All', 'Price Drops', 'Electronics', 'Clothing', 'Other'];

export default function PurchasesScreen() {
  const navigation = useNavigation<any>();
  const { purchases } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredPurchases = purchases.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Price Drops') return p.priceDropDetected;
    if (activeFilter === 'Other') return ![PurchaseCategory.Electronics, PurchaseCategory.Clothing].includes(p.category);
    return p.category === activeFilter;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Purchases</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddPurchase')}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          {purchases.length} items tracked
        </Text>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Purchase List */}
        {filteredPurchases.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.subText} />
            <Text style={styles.emptyTitle}>No purchases yet</Text>
            <Text style={styles.emptySubtext}>Add your recent purchases to start tracking price drops</Text>
          </View>
        ) : (
          filteredPurchases.map(purchase => (
            <TouchableOpacity
              key={purchase.id}
              style={styles.purchaseCard}
              onPress={() => navigation.navigate('PurchaseDetail', { purchase })}
              activeOpacity={0.8}
            >
              <View style={[styles.purchaseIcon, { backgroundColor: (CATEGORY_COLORS[purchase.category] || Colors.subText) + '20' }]}>
                <Ionicons
                  name={(CATEGORY_ICONS[purchase.category] || 'ellipsis-horizontal') as any}
                  size={22}
                  color={CATEGORY_COLORS[purchase.category] || Colors.subText}
                />
              </View>
              <View style={styles.purchaseInfo}>
                <Text style={styles.purchaseName} numberOfLines={1}>{purchase.name}</Text>
                <Text style={styles.purchaseRetailer}>{purchase.retailer} · {daysAgo(purchase.purchaseDate)}d ago</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.purchasePrice}>{formatCurrency(purchase.purchasePrice)}</Text>
                  {purchase.priceDropDetected && purchase.currentPrice !== null && (
                    <>
                      <Ionicons name="arrow-forward" size={12} color={Colors.subText} />
                      <Text style={styles.currentPrice}>{formatCurrency(purchase.currentPrice)}</Text>
                    </>
                  )}
                </View>
              </View>
              {purchase.priceDropDetected ? (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>-{formatCurrency(purchase.savingsAmount)}</Text>
                </View>
              ) : (
                <View style={styles.stableBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.subText} />
                  <Text style={styles.stableBadgeText}>Stable</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },
  header: { paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.darkText, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, color: Colors.subText, marginTop: 4 },
  addButton: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  filterContainer: { marginTop: 16, marginBottom: 8 },
  filterContent: { gap: 10 },
  filterTab: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  filterTabText: { fontSize: 14, fontWeight: '600', color: Colors.subText },
  filterTabTextActive: { color: Colors.primary },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.darkText },
  emptySubtext: { fontSize: 14, color: Colors.subText, textAlign: 'center' },

  purchaseCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, marginTop: 10, borderWidth: 1, borderColor: Colors.border,
  },
  purchaseIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  purchaseInfo: { flex: 1, marginLeft: 12 },
  purchaseName: { fontSize: 15, fontWeight: '600', color: Colors.darkText },
  purchaseRetailer: { fontSize: 12, color: Colors.subText, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  purchasePrice: { fontSize: 14, fontWeight: '700', color: Colors.darkText },
  currentPrice: { fontSize: 14, fontWeight: '700', color: Colors.success },
  savingsBadge: {
    backgroundColor: Colors.success + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginLeft: 8,
  },
  savingsBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.success },
  stableBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8,
  },
  stableBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.subText },
});
