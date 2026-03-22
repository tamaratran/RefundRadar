import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { formatCurrency, daysAgo } from '../data/models';

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return Colors.warning;
    case 'submitted': return Colors.info;
    case 'approved': return Colors.success;
    case 'paid': return Colors.primary;
    case 'denied': return Colors.urgency;
    default: return Colors.subText;
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending': return 'time-outline';
    case 'submitted': return 'paper-plane-outline';
    case 'approved': return 'checkmark-circle-outline';
    case 'paid': return 'cash-outline';
    case 'denied': return 'close-circle-outline';
    default: return 'help-circle-outline';
  }
}

export default function ClaimsScreen() {
  const { claims } = useApp();

  const activeClaims = claims.filter(c => c.status === 'pending' || c.status === 'submitted');
  const resolvedClaims = claims.filter(c => c.status === 'approved' || c.status === 'paid' || c.status === 'denied');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Claims</Text>
          <Text style={styles.headerSubtitle}>
            {claims.length} total claims filed
          </Text>
        </View>

        {claims.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.subText} />
            <Text style={styles.emptyTitle}>No claims yet</Text>
            <Text style={styles.emptySubtext}>
              When you spot a price drop, file a claim and track it here
            </Text>
          </View>
        ) : (
          <>
            {activeClaims.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active</Text>
                {activeClaims.map(claim => (
                  <View key={claim.id} style={styles.claimCard}>
                    <View style={[styles.statusIcon, { backgroundColor: getStatusColor(claim.status) + '20' }]}>
                      <Ionicons name={getStatusIcon(claim.status) as any} size={22} color={getStatusColor(claim.status)} />
                    </View>
                    <View style={styles.claimInfo}>
                      <Text style={styles.claimItem} numberOfLines={1}>{claim.itemName}</Text>
                      <Text style={styles.claimRetailer}>{claim.retailer}</Text>
                      <View style={styles.claimPriceRow}>
                        <Text style={styles.claimOldPrice}>{formatCurrency(claim.originalPrice)}</Text>
                        <Ionicons name="arrow-forward" size={10} color={Colors.subText} />
                        <Text style={styles.claimNewPrice}>{formatCurrency(claim.newPrice)}</Text>
                      </View>
                    </View>
                    <View style={styles.claimRight}>
                      <Text style={styles.claimRefund}>{formatCurrency(claim.refundAmount)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(claim.status) }]}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {resolvedClaims.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resolved</Text>
                {resolvedClaims.map(claim => (
                  <View key={claim.id} style={[styles.claimCard, styles.claimCardResolved]}>
                    <View style={[styles.statusIcon, { backgroundColor: getStatusColor(claim.status) + '20' }]}>
                      <Ionicons name={getStatusIcon(claim.status) as any} size={22} color={getStatusColor(claim.status)} />
                    </View>
                    <View style={styles.claimInfo}>
                      <Text style={styles.claimItem} numberOfLines={1}>{claim.itemName}</Text>
                      <Text style={styles.claimRetailer}>{claim.retailer}</Text>
                    </View>
                    <View style={styles.claimRight}>
                      <Text style={[styles.claimRefund, claim.status === 'denied' && { color: Colors.urgency }]}>
                        {claim.status === 'denied' ? 'Denied' : formatCurrency(claim.refundAmount)}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(claim.status) }]}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },
  header: { paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.darkText, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, color: Colors.subText, marginTop: 4 },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.darkText },
  emptySubtext: { fontSize: 14, color: Colors.subText, textAlign: 'center', paddingHorizontal: 20 },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.darkText, marginBottom: 12 },

  claimCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  claimCardResolved: { opacity: 0.7 },
  statusIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  claimInfo: { flex: 1, marginLeft: 12 },
  claimItem: { fontSize: 15, fontWeight: '600', color: Colors.darkText },
  claimRetailer: { fontSize: 12, color: Colors.subText, marginTop: 2 },
  claimPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  claimOldPrice: { fontSize: 12, color: Colors.subText, textDecorationLine: 'line-through' },
  claimNewPrice: { fontSize: 12, fontWeight: '600', color: Colors.success },
  claimRight: { alignItems: 'flex-end', marginLeft: 8, gap: 6 },
  claimRefund: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
});
