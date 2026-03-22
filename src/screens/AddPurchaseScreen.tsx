import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { PurchaseCategory, CATEGORY_COLORS, CATEGORY_ICONS, getToday } from '../data/models';

const categories = Object.values(PurchaseCategory);

export default function AddPurchaseScreen() {
  const navigation = useNavigation<any>();
  const { addPurchase } = useApp();
  const [name, setName] = useState('');
  const [retailer, setRetailer] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<PurchaseCategory>(PurchaseCategory.Electronics);

  const handleSubmit = () => {
    if (!name.trim() || !retailer.trim() || !price.trim()) return;

    const purchase = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      retailer: retailer.trim(),
      category,
      purchasePrice: parseFloat(price),
      currentPrice: null,
      purchaseDate: getToday(),
      priceDropDetected: false,
      savingsAmount: 0,
    };

    addPurchase(purchase);
    navigation.goBack();
  };

  const isValid = name.trim() && retailer.trim() && price.trim() && parseFloat(price) > 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors.darkText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Purchase</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. AirPods Pro 2"
              placeholderTextColor={Colors.sectionLabel}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Retailer</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Amazon, Target, Best Buy"
              placeholderTextColor={Colors.sectionLabel}
              value={retailer}
              onChangeText={setRetailer}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Purchase Price</Text>
            <View style={styles.priceInputWrap}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor={Colors.sectionLabel}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Ionicons
                    name={(CATEGORY_ICONS[cat] || 'ellipsis-horizontal') as any}
                    size={16}
                    color={category === cat ? Colors.primary : Colors.subText}
                  />
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>Add & Start Tracking</Text>
          <Ionicons name="radar-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingBottom: 20,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.darkText },

  form: { gap: 20 },
  inputGroup: {},
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.darkText, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.darkText, borderWidth: 1, borderColor: Colors.border,
  },
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16,
  },
  dollarSign: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
  priceInput: { flex: 1, paddingVertical: 14, fontSize: 20, fontWeight: '700', color: Colors.darkText, marginLeft: 4 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  categoryChipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: Colors.subText },
  categoryChipTextActive: { color: Colors.primary },

  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 16, marginTop: 32,
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
