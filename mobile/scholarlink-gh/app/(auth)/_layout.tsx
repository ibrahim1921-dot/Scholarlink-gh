import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../hooks/useAuth';

export default function AuthLayout() {
  const { user, isBootstrapping } = useAuth();

  if (!isBootstrapping && user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
