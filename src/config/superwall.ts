import Constants from 'expo-constants';

export const SUPERWALL_API_KEY =
  (Constants.expoConfig?.extra?.superwallApiKey as string) ?? '';

export const PLACEMENTS = {
  viewInsights: 'view_insights',
  unlockPro: 'unlock_pro',
} as const;
