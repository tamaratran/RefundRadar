import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { usePaywall } from '../hooks/useSuperwall';
import { Colors } from '../theme/colors';
import { Purchase, CATEGORY_COLORS, CATEGORY_ICONS, formatCurrency, daysAgo, getToday } from '../data/models';
import { retailerPolicies } from '../data/retailers';

export default function PurchaseDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addClaim, getClaimsForPurchase, deletePurchase } = useApp();
  const { showClaimPaywall } = usePaywall();

  const purchase: Purchase = route.params?.purchase;
  if (!purchase) return null;

  const existingClaims = getClaimsForPurchase(purchase.id);
  const hasClaim = existingClaims.length > 0;
  const retailerPolicy = retailerPolicies.find(r => r.name.toLowerCase() === purchase.retailer.toLowerCase());
  const daysSincePurchase = daysAgo(purchase.purchaseDate);
  const withinWindow = retailerPolicy ? daysSincePurchase <= retailerPolicy.priceMatchWindow : false;
  const daysLeft = retailerPolicy ? Math.max(0, retailerPolicy.priceMatchWindow - daysSincePurchase) : 0;

  const handleFileClaim = () => {
    if (!purchase.priceDropDetected || !purchase.currentPrice) return;

    const submitClaim = () => {
      const claim = {
        id: `c-${Date.now()}`,
        purchaseId: purchase.id,
        retailer: purchase.retailer,
        itemName: purchase.name,
        originalPrice: purchase.purchasePrice,
        newPrice: purchase.currentPrice ?? purchase.purchasePrice,
        refundAmount: purchase.savingsAmount,
        status: 'submitted' as const,
        submittedDate: getToday(),
      };

      addClaim(claim);
      Alert.alert(
        'Claim Filed!',
        `Your refund claim for ${formatCurrency(purchase.savingsAmount)} has been submitted to ${purchase.retailer}.`,
        [{ text: 'OK' }]
      );
    };

    showClaimPaywall(submitClaim);
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Purchase',
      `Are you sure you want to stop tracking "${purchase.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deletePurchase(purchase.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.darkText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.urgency} />
          </TouchableOpacity>
        </View>

        {/* Item Card */}
        <View style={styles.itemCard}>
          <View style={[styles.categoryIcon, { backgroundColor: (CATEGORY_COLORS[purchase.category] || Colors.subText) + '20' }]}>
            <Ionicons
              name={(CATEGORY_ICONS[purchase.category] || 'ellipsis-horizontal') as any}
              size={32}
              color={CATEGORY_COLORS[purchase.category] || Colors.subText}
            />
          </View>
          <Text style={styles.itemName}>{purchase.name}</Text>
          <Text style={styles.itemRetailer}>{purchase.retailer}</Text>
          <Text style={styles.itemDate}>Purchased {daysAgo(purchase.purchaseDate)} days ago</Text>
        </View>

        {/* Price Info */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View style={styles.priceColumn}>
              <Text style={styles.priceLabel}>Paid</Text>
              <Text style={styles.priceValue}>{formatCurrency(purchase.purchasePrice)}</Text>
            </View>
            {purchase.currentPrice !== null && (
              <>
                <Ionicons name="arrow-forward" size={20} color={Colors.subText} />
                <View style={styles.priceColumn}>
                  <Text style={styles.priceLabel}>Now</Text>
                  <Text style={[styles.priceValue, styles.priceValueNew]}>{formatCurrency(purchase.currentPrice)}</Text>
                </View>
              </>
            )}
          </View>
          {purchase.priceDropDetected && (
            <View style={styles.savingsRow}>
              <Ionicons name="trending-down" size={20} color={Colors.success} />
              <Text style={styles.savingsText}>You can save {formatCurrency(purchase.savingsAmount)}</Text>
            </View>
          )}
        </View>

        {/* Retailer Policy */}
        {retailerPolicy && (
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>{retailerPolicy.name} Price Match Policy</Text>
            <View style={styles.policyRow}>
              <View style={styles.policyItem}>
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                <Text style={styles.policyItemText}>{retailerPolicy.priceMatchWindow}-day window</Text>
              </View>
              <View style={styles.policyItem}>
                <Ionicons name="trending-up-outline" size={18} color={Colors.primary} />
                <Text style={styles.policyItemText}>{retailerPolicy.successRate}% success rate</Text>
              </View>
            </View>
            {withinWindow ? (
              <View style={styles.windowStatus}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.windowStatusText}>
                  {daysLeft} days left in price match window
                </Text>
              </View>
            ) : (
              <View style={styles.windowStatus}>
                <Ionicons name="close-circle" size={18} color={Colors.urgency} />
                <Text style={[styles.windowStatusText, { color: Colors.urgency }]}>
                  Price match window has expired
                </Text>
              </View>
            )}
            <Text style={styles.policyRequirements}>{retailerPolicy.requirements}</Text>
          </View>
        )}

        {/* Claim Status or File Button */}
        {hasClaim ? (
          <View style={styles.claimStatusCard}>
            <Ionicons name="document-text" size={24} color={Colors.primary} />
            <View style={styles.claimStatusInfo}>
              <Text style={styles.claimStatusTitle}>Claim Filed</Text>
              <Text style={styles.claimStatusText}>
                Status: {existingClaims[0].status.charAt(0).toUpperCase() + existingClaims[0].status.slice(1)}
              </Text>
              <Text style={styles.claimStatusAmount}>
                Refund amount: {formatCurrency(existingClaims[0].refundAmount)}
              </Text>
            </View>
          </View>
        ) : purchase.priceDropDetected && purchase.currentPrice !== null ? (
          <TouchableOpacity style={styles.fileClaimButton} onPress={handleFileClaim} activeOpacity={0.85}>
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
            <Text style={styles.fileClaimText}>File Refund Claim — {formatCurrency(purchase.savingsAmount)}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noDrop}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.subText} />
            <Text style={styles.noDropText}>Price is stable — no drop detected</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingBottom: 16,
  },
  backButton: { padding: 4 },
  deleteButton: { padding: 4 },

  itemCard: { alignItems: 'center', paddingVertical: 20 },
  categoryIcon: {
    width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  itemName: { fontSize: 24, fontWeight: '800', color: Colors.darkText, textAlign: 'center' },
  itemRetailer: { fontSize: 16, color: Colors.subText, marginTop: 4 },
  itemDate: { fontSize: 13, color: Colors.sectionLabel, marginTop: 4 },

  priceCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  priceColumn: { alignItems: 'center' },
  priceLabel: { fontSize: 13, color: Colors.subText, fontWeight: '500', marginBottom: 4 },
  priceValue: { fontSize: 28, fontWeight: '900', color: Colors.darkText },
  priceValueNew: { color: Colors.success },
  savingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  savingsText: { fontSize: 16, fontWeight: '700', color: Colors.success },

  policyCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  policyTitle: { fontSize: 16, fontWeight: '700', color: Colors.darkText, marginBottom: 14 },
  policyRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  policyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  policyItemText: { fontSize: 14, color: Colors.darkText, fontWeight: '500' },
  windowStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  windowStatusText: { fontSize: 14, fontWeight: '600', color: Colors.success },
  policyRequirements: { fontSize: 13, color: Colors.subText, lineHeight: 18 },

  claimStatusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.primarySoft,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  claimStatusInfo: { flex: 1 },
  claimStatusTitle: { fontSize: 16, fontWeight: '700', color: Colors.darkText },
  claimStatusText: { fontSize: 14, color: Colors.subText, marginTop: 4 },
  claimStatusAmount: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 4 },

  fileClaimButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 16,
  },
  fileClaimText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  noDrop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 20,
  },
  noDropText: { fontSize: 14, color: Colors.subText },
});
