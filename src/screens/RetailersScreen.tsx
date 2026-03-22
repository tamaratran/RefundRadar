import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { retailerPolicies } from '../data/retailers';

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy': return Colors.success;
    case 'medium': return Colors.warning;
    case 'hard': return Colors.urgency;
    default: return Colors.subText;
  }
}

export default function RetailersScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Retailer Policies</Text>
          <Text style={styles.headerSubtitle}>
            Know your rights — {retailerPolicies.length} stores tracked
          </Text>
        </View>

        {retailerPolicies.map(policy => (
          <View key={policy.id} style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <View style={styles.policyIconWrap}>
                <Ionicons name={policy.icon as any} size={24} color={Colors.primary} />
              </View>
              <View style={styles.policyInfo}>
                <Text style={styles.policyName}>{policy.name}</Text>
                <View style={styles.policyMeta}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(policy.difficulty) + '20' }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(policy.difficulty) }]}>
                      {policy.difficulty.charAt(0).toUpperCase() + policy.difficulty.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.successRate}>{policy.successRate}% success</Text>
                </View>
              </View>
              <View style={styles.windowBadge}>
                <Text style={styles.windowDays}>{policy.priceMatchWindow}</Text>
                <Text style={styles.windowLabel}>days</Text>
              </View>
            </View>

            <View style={styles.policyDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={14} color={Colors.subText} />
                <Text style={styles.detailText}>{policy.refundMethod}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={14} color={Colors.subText} />
                <Text style={styles.detailText}>{policy.requirements}</Text>
              </View>
            </View>

            {/* Success rate bar */}
            <View style={styles.rateBar}>
              <View style={[styles.rateFill, { width: `${policy.successRate}%` }]} />
            </View>
          </View>
        ))}

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

  policyCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginTop: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  policyHeader: { flexDirection: 'row', alignItems: 'center' },
  policyIconWrap: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.primarySoft,
    justifyContent: 'center', alignItems: 'center',
  },
  policyInfo: { flex: 1, marginLeft: 14 },
  policyName: { fontSize: 17, fontWeight: '700', color: Colors.darkText },
  policyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  difficultyText: { fontSize: 11, fontWeight: '600' },
  successRate: { fontSize: 12, color: Colors.subText, fontWeight: '500' },
  windowBadge: {
    alignItems: 'center', backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  windowDays: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  windowLabel: { fontSize: 10, fontWeight: '600', color: Colors.primary },

  policyDetails: { marginTop: 14, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailText: { flex: 1, fontSize: 13, color: Colors.subText, lineHeight: 18 },

  rateBar: {
    height: 4, backgroundColor: Colors.surfaceLight, borderRadius: 2, overflow: 'hidden', marginTop: 14,
  },
  rateFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
});
