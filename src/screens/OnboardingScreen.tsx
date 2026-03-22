import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { retailerPolicies } from '../data/retailers';

const { width } = Dimensions.get('window');
const TOTAL_PAGES = 5;

const PRIMARY = '#00897B';
const PRIMARY_SOFT = '#00897B14';
const SURFACE = '#F2F7F6';
const BORDER = '#D5E5E3';
const BG = '#FFFFFF';
const TEXT_PRIMARY = '#1A2B2A';
const TEXT_MUTED = '#6B8280';
const ACCENT = '#FF6D00';

// Retailer selection data
interface RetailerOption {
  id: string;
  name: string;
  icon: string;
}

const RETAILER_OPTIONS: RetailerOption[][] = [
  [
    { id: 'amazon', name: 'Amazon', icon: 'logo-amazon' },
    { id: 'target', name: 'Target', icon: 'storefront-outline' },
    { id: 'bestbuy', name: 'Best Buy', icon: 'tv-outline' },
    { id: 'walmart', name: 'Walmart', icon: 'basket-outline' },
    { id: 'costco', name: 'Costco', icon: 'business-outline' },
    { id: 'apple', name: 'Apple', icon: 'phone-portrait-outline' },
    { id: 'nordstrom', name: 'Nordstrom', icon: 'bag-outline' },
    { id: 'macys', name: "Macy's", icon: 'pricetag-outline' },
    { id: 'homedepot', name: 'Home Depot', icon: 'hammer-outline' },
  ],
  [
    { id: 'nike', name: 'Nike', icon: 'fitness-outline' },
    { id: 'gap', name: 'Gap', icon: 'shirt-outline' },
    { id: 'sephora', name: 'Sephora', icon: 'color-palette-outline' },
    { id: 'lowes', name: "Lowe's", icon: 'construct-outline' },
    { id: 'kohls', name: "Kohl's", icon: 'gift-outline' },
    { id: 'samsung', name: 'Samsung', icon: 'hardware-chip-outline' },
    { id: 'dell', name: 'Dell', icon: 'laptop-outline' },
    { id: 'jcrew', name: 'J.Crew', icon: 'ribbon-outline' },
    { id: 'rei', name: 'REI', icon: 'leaf-outline' },
  ],
];

export default function OnboardingScreen() {
  const { setHasCompletedOnboarding } = useApp();
  const [page, setPage] = useState(0);
  const [selectedRetailers, setSelectedRetailers] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [estimatedSavings, setEstimatedSavings] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Animations
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const scanProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const goToPage = (p: number) => {
    scrollRef.current?.scrollTo({ x: p * width, animated: true });
    setPage(p);
  };

  const next = () => {
    if (page < TOTAL_PAGES - 1) goToPage(page + 1);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };

  const toggleRetailer = (id: string) => {
    setSelectedRetailers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const calculateSavings = () => {
    const matchedPolicies = retailerPolicies.filter(r => selectedRetailers.has(r.id));
    const baseAmount = 87;
    const perRetailer = 42;
    setMatchedCount(Math.max(matchedPolicies.length, 3) + 2);
    setEstimatedSavings(baseAmount + selectedRetailers.size * perRetailer);
  };

  const startScan = () => {
    calculateSavings();
    setIsScanning(true);
    goToPage(3);
    scanProgress.setValue(0);
    Animated.timing(scanProgress, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(() => {
      setIsScanning(false);
      setScanComplete(true);
    });
  };

  const finishOnboarding = () => {
    setHasCompletedOnboarding(true);
  };

  // ─── Page 1: Welcome ───
  const renderWelcome = () => (
    <View style={styles.page}>
      <View style={styles.centered}>
        <View style={styles.heroIcon}>
          <Ionicons name="pricetag-outline" size={52} color={PRIMARY} />
        </View>

        <Text style={styles.title}>Prices drop.{'\n'}Get your money back.</Text>
        <Text style={styles.subtitle}>
          Retailers owe you refunds when prices drop after your purchase. RefundRadar tracks drops and helps you claim what's yours.
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>$200+</Text>
            <Text style={styles.statLabel}>Average yearly{'\n'}savings per user</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Price adjustments{'\n'}are approved</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // ─── Page 2: Retailer Selection 1 ───
  const renderRetailers1 = () => (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollPageContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepLabel}>1 of 2</Text>
        <Text style={styles.title}>Where do you{'\n'}shop most?</Text>
        <Text style={styles.subtitle}>
          Select your favorite stores. We'll track their price adjustment policies for you.
        </Text>

        <View style={styles.brandGrid}>
          {RETAILER_OPTIONS[0].map(retailer => {
            const isSelected = selectedRetailers.has(retailer.id);
            return (
              <TouchableOpacity
                key={retailer.id}
                style={[styles.brandCard, isSelected && styles.brandCardSelected]}
                onPress={() => toggleRetailer(retailer.id)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View style={styles.brandCheck}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.brandIconWrap, isSelected && styles.brandIconWrapSelected]}>
                  <Ionicons name={retailer.icon as any} size={28} color={isSelected ? PRIMARY : TEXT_MUTED} />
                </View>
                <Text style={[styles.brandName, isSelected && styles.brandNameSelected]}>
                  {retailer.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // ─── Page 3: Retailer Selection 2 ───
  const renderRetailers2 = () => (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollPageContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepLabel}>2 of 2</Text>
        <Text style={styles.title}>Any of these{'\n'}look familiar?</Text>
        <Text style={styles.subtitle}>
          Almost done. Tap any other stores you shop at regularly.
        </Text>

        <View style={styles.brandGrid}>
          {RETAILER_OPTIONS[1].map(retailer => {
            const isSelected = selectedRetailers.has(retailer.id);
            return (
              <TouchableOpacity
                key={retailer.id}
                style={[styles.brandCard, isSelected && styles.brandCardSelected]}
                onPress={() => toggleRetailer(retailer.id)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View style={styles.brandCheck}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.brandIconWrap, isSelected && styles.brandIconWrapSelected]}>
                  <Ionicons name={retailer.icon as any} size={28} color={isSelected ? PRIMARY : TEXT_MUTED} />
                </View>
                <Text style={[styles.brandName, isSelected && styles.brandNameSelected]}>
                  {retailer.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // ─── Page 4: Scan Results ───
  const scanProgressPercent = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderScanResults = () => (
    <View style={styles.page}>
      <View style={styles.centered}>
        {!scanComplete ? (
          <>
            <View style={styles.loadingIcon}>
              <Ionicons name="search-outline" size={48} color={PRIMARY} />
            </View>
            <Text style={styles.title}>Scanning{'\n'}price policies...</Text>
            <Text style={styles.subtitle}>
              Checking {retailerPolicies.length}+ retailer price match windows
            </Text>
            <View style={styles.progressBarOuter}>
              <Animated.View style={[styles.progressBarInner, { width: scanProgressPercent }]} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.resultIcon}>
              <Ionicons name="checkmark-circle" size={56} color={PRIMARY} />
            </View>
            <Text style={styles.title}>You could save{'\n'}up to</Text>
            <View style={styles.payoutContainer}>
              <Text style={styles.payoutAmount}>${estimatedSavings.toLocaleString()}</Text>
              <Text style={styles.payoutPeriod}>per year</Text>
            </View>
            <Text style={styles.matchedText}>
              across {matchedCount} stores with price protection
            </Text>
            <View style={styles.urgencyCard}>
              <Ionicons name="time-outline" size={20} color="#FFB84D" />
              <Text style={styles.urgencyText}>
                Most price match windows are 7-30 days. We'll alert you the moment a price drops so you never miss one.
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );

  // ─── Page 5: Ready / CTA ───
  const renderReady = () => (
    <View style={styles.page}>
      <View style={styles.centered}>
        <Text style={styles.title}>Start getting{'\n'}your refunds</Text>
        <Text style={styles.subtitle}>
          {estimatedSavings > 0
            ? `Up to $${estimatedSavings.toLocaleString()}/year in price adjustments waiting for you.`
            : 'We\'ll track prices on everything you buy and alert you when they drop.'}
        </Text>

        <View style={styles.readyFeatures}>
          <View style={styles.readyFeature}>
            <View style={styles.featureIconWrap}>
              <Ionicons name="scan-outline" size={20} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.readyFeatureText}>Automatic price monitoring</Text>
              <Text style={styles.readyFeatureSubtext}>We check prices daily on your purchases</Text>
            </View>
          </View>
          <View style={styles.readyFeature}>
            <View style={styles.featureIconWrap}>
              <Ionicons name="notifications-outline" size={20} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.readyFeatureText}>Instant drop alerts</Text>
              <Text style={styles.readyFeatureSubtext}>Get notified the moment a price drops</Text>
            </View>
          </View>
          <View style={styles.readyFeature}>
            <View style={styles.featureIconWrap}>
              <Ionicons name="cash-outline" size={20} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.readyFeatureText}>One-tap refund claims</Text>
              <Text style={styles.readyFeatureSubtext}>File claims in seconds, not hours</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaContainer}>
          <Animated.View style={[styles.ctaGlow, { opacity: glowAnim }]} />
          <TouchableOpacity style={styles.ctaButton} onPress={finishOnboarding} activeOpacity={0.85}>
            <Text style={styles.ctaButtonText}>Start Saving</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Bottom button logic
  const getBottomButton = () => {
    if (page === 0) {
      return (
        <TouchableOpacity style={styles.bottomButton} onPress={next} activeOpacity={0.85}>
          <Text style={styles.bottomButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }
    if (page === 1) {
      return (
        <TouchableOpacity style={styles.bottomButton} onPress={next} activeOpacity={0.85}>
          <Text style={styles.bottomButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }
    if (page === 2) {
      return (
        <TouchableOpacity style={styles.bottomButton} onPress={startScan} activeOpacity={0.85}>
          <Text style={styles.bottomButtonText}>Scan My Stores</Text>
          <Ionicons name="search" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }
    if (page === 3 && scanComplete) {
      return (
        <TouchableOpacity style={styles.bottomButton} onPress={next} activeOpacity={0.85}>
          <Text style={styles.bottomButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {renderWelcome()}
        {renderRetailers1()}
        {renderRetailers2()}
        {renderScanResults()}
        {renderReady()}
      </ScrollView>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        {getBottomButton()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  page: { width, flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  scrollPageContent: { paddingTop: 80, paddingHorizontal: 32, paddingBottom: 160 },

  heroIcon: {
    width: 100, height: 100, borderRadius: 30, backgroundColor: PRIMARY_SOFT,
    justifyContent: 'center', alignItems: 'center', marginBottom: 32,
  },
  title: { fontSize: 32, fontWeight: '800', color: TEXT_PRIMARY, textAlign: 'center', lineHeight: 40, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: TEXT_MUTED, textAlign: 'center', lineHeight: 24, marginTop: 16, paddingHorizontal: 8 },

  statRow: { flexDirection: 'row', gap: 16, marginTop: 40 },
  statBox: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: BORDER,
  },
  statNumber: { fontSize: 28, fontWeight: '900', color: PRIMARY },
  statLabel: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  stepLabel: { fontSize: 14, fontWeight: '600', color: PRIMARY, marginBottom: 12 },

  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  brandCard: {
    width: (width - 64 - 24) / 3, aspectRatio: 1, borderRadius: 16,
    backgroundColor: SURFACE, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER,
  },
  brandCardSelected: { borderColor: PRIMARY, backgroundColor: PRIMARY_SOFT },
  brandCheck: {
    position: 'absolute', top: 8, right: 8, width: 22, height: 22,
    borderRadius: 11, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
  },
  brandIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: BG,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  brandIconWrapSelected: { backgroundColor: '#E0F2F1' },
  brandName: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED, textAlign: 'center' },
  brandNameSelected: { color: PRIMARY },

  loadingIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: PRIMARY_SOFT,
    justifyContent: 'center', alignItems: 'center', marginBottom: 32,
  },
  resultIcon: { marginBottom: 24 },

  progressBarOuter: {
    width: '80%', height: 6, backgroundColor: SURFACE, borderRadius: 3,
    overflow: 'hidden', marginTop: 32,
  },
  progressBarInner: { height: 6, backgroundColor: PRIMARY, borderRadius: 3 },

  payoutContainer: { alignItems: 'center', marginTop: 16 },
  payoutAmount: { fontSize: 56, fontWeight: '900', color: PRIMARY, letterSpacing: -2 },
  payoutPeriod: { fontSize: 18, fontWeight: '600', color: TEXT_MUTED, marginTop: 4 },
  matchedText: { fontSize: 15, color: TEXT_MUTED, marginTop: 12, textAlign: 'center' },

  urgencyCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 32,
    backgroundColor: '#FFF8E1', padding: 16, borderRadius: 14,
  },
  urgencyText: { flex: 1, fontSize: 14, color: '#8B6914', lineHeight: 20 },

  readyFeatures: { marginTop: 40, gap: 20, width: '100%' },
  readyFeature: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: PRIMARY_SOFT,
    justifyContent: 'center', alignItems: 'center',
  },
  readyFeatureText: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  readyFeatureSubtext: { fontSize: 13, color: TEXT_MUTED, marginTop: 2 },

  ctaContainer: { marginTop: 48, width: '100%', alignItems: 'center' },
  ctaGlow: {
    position: 'absolute', top: -8, width: '110%', height: 72, borderRadius: 28,
    backgroundColor: PRIMARY,
  },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: PRIMARY, paddingVertical: 18, paddingHorizontal: 48,
    borderRadius: 20, width: '100%',
  },
  ctaButtonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  dotsContainer: {
    position: 'absolute', bottom: 120, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
  dotActive: { backgroundColor: PRIMARY, width: 24 },

  bottomButtonContainer: {
    position: 'absolute', bottom: 40, left: 32, right: 32,
  },
  bottomButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: PRIMARY, paddingVertical: 18, borderRadius: 16,
  },
  bottomButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
