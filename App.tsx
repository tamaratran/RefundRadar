import React, { ReactNode } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider, useApp } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { SUPERWALL_API_KEY } from './src/config/superwall';

function AppContent() {
  const { hasCompletedOnboarding } = useApp();

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return <AppNavigator />;
}

function PaywallWrapper({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  // expo-superwall is native-only; import dynamically to avoid web crashes
  const { SuperwallProvider } = require('expo-superwall');
  return (
    <SuperwallProvider apiKeys={{ ios: SUPERWALL_API_KEY }}>
      {children}
    </SuperwallProvider>
  );
}

export default function App() {
  return (
    <PaywallWrapper>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppContent />
        </NavigationContainer>
      </AppProvider>
    </PaywallWrapper>
  );
}
