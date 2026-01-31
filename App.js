/**
 * App.js
 * 
 * Main application entry point
 * Wire up all providers and navigation
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootProvider } from './src/context/RootProvider';
import { RootNavigator } from './src/navigation/RootNavigator';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </RootProvider>
    </GestureHandlerRootView>
  );
}
