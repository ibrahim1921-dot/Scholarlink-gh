import { StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    letterSpacing: -0.64,
    lineHeight: 40,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    fontFamily: "BeVietnamPro_400Regular",
    lineHeight: 24,
  },
});
