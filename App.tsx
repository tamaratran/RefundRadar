import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SuperwallProvider } from 'expo-superwall';
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

export default function App() {
  return (
    <SuperwallProvider apiKeys={{ ios: SUPERWALL_API_KEY }}>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppContent />
        </NavigationContainer>
      </AppProvider>
    </SuperwallProvider>
  );
}
