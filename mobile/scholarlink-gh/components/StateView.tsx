import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';
import { AppButton } from './AppButton';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Could not load this</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? <AppButton title="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  title: { color: colors.ink, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  text: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
