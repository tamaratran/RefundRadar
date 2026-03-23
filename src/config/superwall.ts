// Superwall Configuration
// Superwall dashboard: https://superwall.com/applications/40880/settings/keys
// API key is stored in app.json extra.superwallIosKey
import Constants from 'expo-constants';

const superwallIosKey = (Constants.expoConfig?.extra?.superwallIosKey as string) ?? '';

export const SUPERWALL_API_KEYS = {
  ios: superwallIosKey,
};

// Placement names configured in Superwall dashboard
export const PLACEMENTS = {
  campaignTrigger: 'campaign_trigger',
  fileClaim: 'file_claim',
  viewAlerts: 'view_alerts',
  unlockPro: 'unlock_pro',
} as const;
