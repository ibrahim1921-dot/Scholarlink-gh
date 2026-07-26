import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';

export default function TabsLayout() {
  const { user, isBootstrapping } = useAuth();
  const insets = useSafeAreaInsets();

  if (!isBootstrapping && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.iconMuted,
        tabBarStyle: { 
          position: 'absolute',
          bottom: insets.bottom + 16,
          marginHorizontal: 20,
          backgroundColor: colors.surface,
          borderRadius: 28,
          height: 64, 
          paddingBottom: 8, 
          paddingTop: 8,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 4,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconName = {
            index: focused ? 'home' : 'home-outline',
            scholarships: focused ? 'school' : 'school-outline',
            applications: focused ? 'document-text' : 'document-text-outline',
            assistant: focused ? 'chatbubbles' : 'chatbubbles-outline',
            career: focused ? 'compass' : 'compass-outline',
          }[route.name] as keyof typeof Ionicons.glyphMap;
          return <Ionicons name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="scholarships" options={{ title: 'Scholarships' }} />
      <Tabs.Screen name="applications" options={{ title: 'Applications' }} />
      <Tabs.Screen name="assistant" options={{ title: 'Assistant' }} />
      <Tabs.Screen name="career" options={{ title: 'Career' }} />
    </Tabs>
  );
}
