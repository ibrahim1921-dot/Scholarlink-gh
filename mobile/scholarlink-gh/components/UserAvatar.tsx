import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, StyleProp } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const AVATAR_COLORS = [
  '#003366', // Primary
  '#1b6d24', // Success
  '#d8885c', // Warning
  '#3a5f94', // Info
  '#ba1a1a', // Danger
  '#001e40', // Primary Dark
];

interface UserAvatarProps {
  size?: number;
  imageUrl?: string | null;
  style?: StyleProp<ViewStyle>;
}

export function UserAvatar({ size = 40, imageUrl, style }: UserAvatarProps) {
  const { user } = useAuth();
  
  const finalImageUrl = imageUrl || user?.profilePictureUrl;

  if (finalImageUrl) {
    return (
      <Image 
        source={{ uri: finalImageUrl }} 
        style={[{ width: size, height: size, borderRadius: size / 2 }, style as any]} 
      />
    );
  }

  const nameToUse = user?.username || '?';
  const parts = nameToUse.split(/[\s._-]/).filter(Boolean);
  
  let initials = '?';
  if (parts.length >= 2) {
    initials = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  } else if (parts.length === 1) {
    initials = parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }

  // Consistent color based on name
  const charCodeSum = nameToUse.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bgColor = AVATAR_COLORS[charCodeSum % AVATAR_COLORS.length];

  return (
    <View style={[
      styles.container, 
      { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      style
    ]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_700Bold',
  }
});
