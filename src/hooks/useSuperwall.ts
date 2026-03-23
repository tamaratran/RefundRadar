import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Lightweight wrapper for triggering Superwall paywalls.
 * expo-superwall is native-only so we no-op on web.
 */
export function usePaywall() {
  const triggerPaywall = useCallback(
    async (placement: string, onFeature?: () => void) => {
      if (Platform.OS === 'web') {
        // Superwall not available on web — just run the feature callback
        onFeature?.();
        return;
      }
      try {
        const { usePlacement } = require('expo-superwall');
        // For native, we call registerPlacement directly via the module
        const SuperwallExpoModule = require('expo-superwall').default;
        await SuperwallExpoModule.registerPlacement(placement);
        onFeature?.();
      } catch {
        console.log(`Superwall placement "${placement}" failed or dismissed`);
        onFeature?.();
      }
    },
    []
  );

  return { triggerPaywall };
}
