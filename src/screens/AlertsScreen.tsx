import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { formatCurrency, daysAgo } from '../data/models';

export default function AlertsScreen() {
  const navigation = useNavigation<any>();
  const { alerts, markAlertRead, purchases } = useApp();

  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.detectedDate).getTime() - new Date(a.detectedDate).getTime();
  });

  const handleAlertPress = (alertItem: typeof alerts[0]) => {
    markAlertRead(alertItem.id);
    const purchase = purchases.find(p => p.id === alertItem.purchaseId);
    if (purchase) {
      navigation.navigate('PurchaseDetail', { purchase });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Price Alerts</Text>
          <Text style={styles.headerSubtitle}>
            {alerts.filter(a => !a.isRead).length} new price drops detected
          </Text>
        </View>

        {sortedAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.subText} />
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptySubtext}>Add purchases and we'll notify you when prices drop</Text>
          </View>
        ) : (
          sortedAlerts.map(alert => (
            <TouchableOpacity
              key={alert.id}
              style={[styles.alertCard, !alert.isRead && styles.alertCardUnread]}
              onPress={() => handleAlertPress(alert)}
              activeOpacity={0.8}
            >
              <View style={styles.alertLeft}>
                <View style={[styles.alertIcon, !alert.isRead ? { backgroundColor: Colors.primarySoft } : { backgroundColor: Colors.surface }]}>
                  <Ionicons
                    name="trending-down"
                    size={22}
                    color={!alert.isRead ? Colors.primary : Colors.subText}
                  />
                </View>
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertTop}>
                  <Text style={[styles.alertItemName, !alert.isRead && styles.alertItemNameUnread]} numberOfLines={1}>
                    {alert.itemName}
                  </Text>
                  {!alert.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.alertRetailer}>{alert.retailer}</Text>
                <View style={styles.alertPriceRow}>
                  <Text style={styles.alertOldPrice}>{formatCurrency(alert.originalPrice)}</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.subText} />
                  <Text style={styles.alertNewPrice}>{formatCurrency(alert.newPrice)}</Text>
                  <View style={styles.dropBadge}>
                    <Text style={styles.dropBadgeText}>-{alert.dropPercent}%</Text>
                  </View>
                </View>
                <Text style={styles.alertDate}>{daysAgo(alert.detectedDate) === 0 ? 'Today' : `${daysAgo(alert.detectedDate)}d ago`}</Text>
              </View>
              <View style={styles.alertRight}>
                <Text style={styles.alertSaveAmount}>Save {formatCurrency(alert.originalPrice - alert.newPrice)}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.subText} />
              </View>
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
  header: { paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.darkText, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, color: Colors.subText, marginTop: 4 },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.darkText },
  emptySubtext: { fontSize: 14, color: Colors.subText, textAlign: 'center' },

  alertCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: Colors.border,
  },
  alertCardUnread: { borderColor: Colors.primary + '40', backgroundColor: Colors.primarySoft + '30' },
  alertLeft: { marginRight: 12 },
  alertIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  alertContent: { flex: 1 },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertItemName: { fontSize: 15, fontWeight: '600', color: Colors.darkText, flex: 1 },
  alertItemNameUnread: { fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  alertRetailer: { fontSize: 12, color: Colors.subText, marginTop: 2 },
  alertPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  alertOldPrice: { fontSize: 13, color: Colors.subText, textDecorationLine: 'line-through' },
  alertNewPrice: { fontSize: 13, fontWeight: '700', color: Colors.success },
  dropBadge: { backgroundColor: Colors.success + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  dropBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  alertDate: { fontSize: 11, color: Colors.sectionLabel, marginTop: 4 },
  alertRight: { alignItems: 'flex-end', marginLeft: 8, gap: 4 },
  alertSaveAmount: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});
