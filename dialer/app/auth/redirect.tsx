import { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthRedirect() {
  const { isAuthenticated } = useAuth();

  // If authenticated, redirect to home screen
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // If not authenticated, redirect to login screen
  return <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
