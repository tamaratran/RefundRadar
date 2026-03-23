import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SuperwallProvider } from 'expo-superwall';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SUPERWALL_API_KEYS } from './src/config/superwall';

export default function App() {
  return (
    <SuperwallProvider apiKeys={SUPERWALL_API_KEYS}>
      <AppProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AppProvider>
    </SuperwallProvider>
  );
}
