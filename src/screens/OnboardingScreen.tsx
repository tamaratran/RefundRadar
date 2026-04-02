import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';

export default function OnboardingScreen() {
  const { setHasCompletedOnboarding, setBudget } = useApp();
  const [step, setStep] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState('1500');

  const handleFinish = () => {
    const m = parseFloat(monthlyBudget);
    if (isNaN(m) || m <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid monthly budget.');
      return;
    }
    setBudget({
      daily: Math.round(m / 30),
      weekly: Math.round(m / 4),
      monthly: m,
    });
    setHasCompletedOnboarding(true);
  };

  if (step === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="wallet-outline" size={64} color={Colors.primary} />
        </View>
        <Text style={styles.heading}>Welcome to{'\n'}RefundRadar</Text>
        <Text style={styles.subheading}>
          Your personal budget tracker. Log expenses, set spending limits, and build streaks to stay on track.
        </Text>
        <View style={styles.features}>
          <FeatureItem icon="receipt-outline" text="Track every expense with categories" />
          <FeatureItem icon="bar-chart-outline" text="Visualize spending trends" />
          <FeatureItem icon="flame-outline" text="Build streaks by staying under budget" />
          <FeatureItem icon="shield-checkmark-outline" text="All data stays on your device" />
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="cash-outline" size={64} color={Colors.primary} />
      </View>
      <Text style={styles.heading}>Set Your{'\n'}Monthly Budget</Text>
      <Text style={styles.subheading}>
        How much do you want to spend per month? We&apos;ll calculate daily and weekly limits for you.
      </Text>

      <View style={styles.inputSection}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.budgetInput}
          value={monthlyBudget}
          onChangeText={setMonthlyBudget}
          keyboardType="decimal-pad"
          placeholder="1500"
          placeholderTextColor={Colors.disabledText}
        />
      </View>

      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Daily limit</Text>
          <Text style={styles.breakdownValue}>
            ~${(parseFloat(monthlyBudget) / 30 || 0).toFixed(0)}/day
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Weekly limit</Text>
          <Text style={styles.breakdownValue}>
            ~${(parseFloat(monthlyBudget) / 4 || 0).toFixed(0)}/week
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
        <Text style={styles.primaryBtnText}>Start Tracking</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon as any} size={22} color={Colors.primary} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 30, justifyContent: 'center' },
  iconWrap: { alignItems: 'center', marginBottom: 24 },
  heading: { fontSize: 32, fontWeight: '700', color: Colors.darkText, textAlign: 'center', lineHeight: 40 },
  subheading: { fontSize: 16, color: Colors.subText, textAlign: 'center', marginTop: 12, lineHeight: 22 },

  features: { marginTop: 32, marginBottom: 40 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featureText: { fontSize: 15, color: Colors.darkText, marginLeft: 12 },

  inputSection: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 32, marginBottom: 20 },
  dollarSign: { fontSize: 28, fontWeight: '300', color: Colors.subText, marginRight: 4 },
  budgetInput: { fontSize: 44, fontWeight: '700', color: Colors.darkText, minWidth: 120, textAlign: 'center' },

  breakdown: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 32 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakdownLabel: { fontSize: 14, color: Colors.subText },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: Colors.darkText },

  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: 17, fontWeight: '600' },

  backBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  backBtnText: { fontSize: 15, color: Colors.subText },
});
