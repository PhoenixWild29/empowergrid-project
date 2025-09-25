import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Contexts
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Navigation
import AppNavigator from './navigation/AppNavigator';

function AppContent() {
  const { theme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <WalletProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </WalletProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}