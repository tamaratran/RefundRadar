import Constants from 'expo-constants';

export const SUPERWALL_API_KEY =
  (Constants.expoConfig?.extra?.superwallApiKey as string) ?? 'pk_998f871166b40ce898061ef60ab66eefa11e9c2b0d5c42ca';

export const PLACEMENTS = {
  viewInsights: 'view_insights',
  unlockPro: 'unlock_pro',
} as const;
