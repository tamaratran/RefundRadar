import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../data/models';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { purchases, claims, totalRefunded, totalSavingsAvailable, appStreak } = useApp();
  const savingsAvailable = totalSavingsAvailable();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors.darkText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.userName}>RefundRadar User</Text>
          <Text style={styles.userJoined}>Member since March 2026</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(totalRefunded)}</Text>
            <Text style={styles.statLabel}>Total Refunded</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(savingsAvailable)}</Text>
            <Text style={styles.statLabel}>Available Savings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{purchases.length}</Text>
            <Text style={styles.statLabel}>Items Tracked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{claims.length}</Text>
            <Text style={styles.statLabel}>Claims Filed</Text>
          </View>
        </View>

        {/* Streak */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakText}>{appStreak}-day streak</Text>
            <Text style={styles.streakSubtext}>Keep checking for price drops!</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color={Colors.darkText} />
            <Text style={styles.menuItemText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.subText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.darkText} />
            <Text style={styles.menuItemText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.subText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={22} color={Colors.darkText} />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.subText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="star-outline" size={22} color={Colors.darkText} />
            <Text style={styles.menuItemText}>Rate RefundRadar</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.subText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={22} color={Colors.darkText} />
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.subText} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>RefundRadar v1.0.0</Text>
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
    paddingTop: 60, paddingBottom: 20,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.darkText },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primarySoft,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
  userJoined: { fontSize: 13, color: Colors.subText, marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '48%', backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.darkText },
  statLabel: { fontSize: 12, color: Colors.subText, marginTop: 4, fontWeight: '500' },

  streakCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface,
    borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: Colors.border,
  },
  streakEmoji: { fontSize: 32 },
  streakText: { fontSize: 18, fontWeight: '700', color: Colors.darkText },
  streakSubtext: { fontSize: 13, color: Colors.subText, marginTop: 2 },

  menuSection: { gap: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuItemText: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.darkText, marginLeft: 14 },

  version: { textAlign: 'center', fontSize: 12, color: Colors.sectionLabel, marginTop: 24 },
});
