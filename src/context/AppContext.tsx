import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Purchase, RefundClaim, PriceAlert, PurchaseCategory, getToday } from '../data/models';
import { samplePurchases } from '../data/purchases';
import { sampleAlerts } from '../data/alerts';

interface AppState {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;

  // Purchases
  purchases: Purchase[];
  addPurchase: (purchase: Purchase) => void;
  deletePurchase: (id: string) => void;
  getPurchasesWithDrops: () => Purchase[];
  totalSavingsAvailable: () => number;
  totalSavingsClaimed: () => number;

  // Claims
  claims: RefundClaim[];
  addClaim: (claim: RefundClaim) => void;
  updateClaimStatus: (id: string, status: RefundClaim['status']) => void;
  getClaimsForPurchase: (purchaseId: string) => RefundClaim[];

  // Alerts
  alerts: PriceAlert[];
  markAlertRead: (id: string) => void;
  unreadAlertCount: () => number;

  // Stats
  appStreak: number;
  totalRefunded: number;
}

const AppContext = createContext<AppState>({} as AppState);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setOnboarding] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [claims, setClaims] = useState<RefundClaim[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [appStreak, setAppStreak] = useState(1);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const [onb, purchasesData, claimsData, alertsData, streakData, refundedData] = await Promise.all([
          AsyncStorage.getItem('rr_onboarding'),
          AsyncStorage.getItem('rr_purchases'),
          AsyncStorage.getItem('rr_claims'),
          AsyncStorage.getItem('rr_alerts'),
          AsyncStorage.getItem('rr_app_streak'),
          AsyncStorage.getItem('rr_total_refunded'),
        ]);
        if (onb === 'true') {
          setOnboarding(true);
          // Load saved data
          if (purchasesData) setPurchases(JSON.parse(purchasesData));
          else setPurchases(samplePurchases); // Default sample data
          if (claimsData) setClaims(JSON.parse(claimsData));
          if (alertsData) setAlerts(JSON.parse(alertsData));
          else setAlerts(sampleAlerts);
          if (refundedData) setTotalRefunded(JSON.parse(refundedData));
        }
        if (streakData) {
          const s = JSON.parse(streakData);
          const today = getToday();
          const yesterday = (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })();
          if (s.lastDate === today) {
            setAppStreak(s.count);
          } else if (s.lastDate === yesterday) {
            setAppStreak(s.count + 1);
            AsyncStorage.setItem('rr_app_streak', JSON.stringify({ count: s.count + 1, lastDate: today }));
          } else {
            setAppStreak(1);
            AsyncStorage.setItem('rr_app_streak', JSON.stringify({ count: 1, lastDate: today }));
          }
        } else {
          AsyncStorage.setItem('rr_app_streak', JSON.stringify({ count: 1, lastDate: getToday() }));
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const setHasCompletedOnboarding = useCallback((v: boolean) => {
    setOnboarding(v);
    AsyncStorage.setItem('rr_onboarding', v ? 'true' : 'false');
    if (v) {
      // Load sample data on first launch
      setPurchases(samplePurchases);
      setAlerts(sampleAlerts);
      AsyncStorage.setItem('rr_purchases', JSON.stringify(samplePurchases));
      AsyncStorage.setItem('rr_alerts', JSON.stringify(sampleAlerts));
    }
  }, []);

  const addPurchase = useCallback((purchase: Purchase) => {
    setPurchases(prev => {
      const next = [purchase, ...prev];
      AsyncStorage.setItem('rr_purchases', JSON.stringify(next));
      return next;
    });
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => {
      const next = prev.filter(p => p.id !== id);
      AsyncStorage.setItem('rr_purchases', JSON.stringify(next));
      return next;
    });
  }, []);

  const getPurchasesWithDrops = useCallback(() => {
    return purchases.filter(p => p.priceDropDetected && p.savingsAmount > 0);
  }, [purchases]);

  const totalSavingsAvailable = useCallback(() => {
    return purchases
      .filter(p => p.priceDropDetected)
      .reduce((sum, p) => sum + p.savingsAmount, 0);
  }, [purchases]);

  const totalSavingsClaimed = useCallback(() => {
    return claims
      .filter(c => c.status === 'approved' || c.status === 'paid')
      .reduce((sum, c) => sum + c.refundAmount, 0);
  }, [claims]);

  const addClaim = useCallback((claim: RefundClaim) => {
    setClaims(prev => {
      const next = [claim, ...prev];
      AsyncStorage.setItem('rr_claims', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateClaimStatus = useCallback((id: string, status: RefundClaim['status']) => {
    setClaims(prev => {
      const next = prev.map(c => c.id === id ? { ...c, status, resolvedDate: status === 'approved' || status === 'denied' || status === 'paid' ? getToday() : c.resolvedDate } : c);
      AsyncStorage.setItem('rr_claims', JSON.stringify(next));
      if (status === 'paid') {
        const claim = next.find(c => c.id === id);
        if (claim) {
          setTotalRefunded(prev => {
            const newTotal = prev + claim.refundAmount;
            AsyncStorage.setItem('rr_total_refunded', JSON.stringify(newTotal));
            return newTotal;
          });
        }
      }
      return next;
    });
  }, []);

  const getClaimsForPurchase = useCallback((purchaseId: string) => {
    return claims.filter(c => c.purchaseId === purchaseId);
  }, [claims]);

  const markAlertRead = useCallback((id: string) => {
    setAlerts(prev => {
      const next = prev.map(a => a.id === id ? { ...a, isRead: true } : a);
      AsyncStorage.setItem('rr_alerts', JSON.stringify(next));
      return next;
    });
  }, []);

  const unreadAlertCount = useCallback(() => {
    return alerts.filter(a => !a.isRead).length;
  }, [alerts]);

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        purchases,
        addPurchase,
        deletePurchase,
        getPurchasesWithDrops,
        totalSavingsAvailable,
        totalSavingsClaimed,
        claims,
        addClaim,
        updateClaimStatus,
        getClaimsForPurchase,
        alerts,
        markAlertRead,
        unreadAlertCount,
        appStreak,
        totalRefunded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
