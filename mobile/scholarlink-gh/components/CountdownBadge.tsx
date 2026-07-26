import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCountdownLabel, getCountdownColor } from '../utils/date';

type Props = {
  days: number | undefined | null;
  style?: StyleProp<ViewStyle>;
};

export function CountdownBadge({ days, style }: Props) {
  const label = getCountdownLabel(days);
  if (!label) return null;

  return (
    <View style={[styles.badge, { backgroundColor: getCountdownColor(days) }, style]}>
      <Ionicons name="time" size={14} color="#ffffff" style={{ marginRight: 4 }} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
});
