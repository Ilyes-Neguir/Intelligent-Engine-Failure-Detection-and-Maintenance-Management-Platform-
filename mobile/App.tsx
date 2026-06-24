import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

// Import global styles or theme if needed
import './src/utils/theme'; // This will import our CSS-like theme if we had one

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />
    </SafeAreaProvider>
  );
}
