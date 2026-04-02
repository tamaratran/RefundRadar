import Constants from 'expo-constants';

export const SUPERWALL_API_KEY =
  (Constants.expoConfig?.extra?.superwallApiKey as string) ?? 'pk_5e074e74d91b5cf759b2d610dea394fbda47e32f1fa36d62';

export const PLACEMENTS = {
  viewInsights: 'view_insights',
  unlockPro: 'unlock_pro',
} as const;
