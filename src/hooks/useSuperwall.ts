import { useCallback } from 'react';
import { usePlacement } from 'expo-superwall';
import { PLACEMENTS } from '../config/superwall';

export function usePaywall() {
  const { registerPlacement, state } = usePlacement({
    onPresent: (info) => console.log('Paywall presented:', info.name),
    onDismiss: (_info, result) => console.log('Paywall dismissed:', result.type),
    onSkip: (reason) => console.log('Paywall skipped:', reason),
    onError: (error) => console.error('Paywall error:', error),
  });

  const showPaywall = useCallback(
    async (placement: string, feature?: () => void) => {
      await registerPlacement({
        placement,
        feature,
      });
    },
    [registerPlacement],
  );

  const showClaimPaywall = useCallback(
    (onAllowed: () => void) => {
      return showPaywall(PLACEMENTS.fileClaim, onAllowed);
    },
    [showPaywall],
  );

  const showProPaywall = useCallback(
    (onAllowed?: () => void) => {
      return showPaywall(PLACEMENTS.unlockPro, onAllowed);
    },
    [showPaywall],
  );

  return {
    showPaywall,
    showClaimPaywall,
    showProPaywall,
    paywallState: state,
  };
}
