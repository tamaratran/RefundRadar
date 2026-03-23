import { usePlacement } from 'expo-superwall';
import { useCallback } from 'react';

/**
 * Lightweight wrapper around expo-superwall's usePlacement hook
 * for triggering paywalls from placement names.
 */
export function usePaywall() {
  const { registerPlacement } = usePlacement();

  const triggerPaywall = useCallback(
    async (placement: string, onFeature?: () => void) => {
      try {
        await registerPlacement({
          placement,
          feature: onFeature,
        });
      } catch {
        console.log(`Superwall placement "${placement}" failed or dismissed`);
      }
    },
    [registerPlacement]
  );

  return { triggerPaywall };
}
