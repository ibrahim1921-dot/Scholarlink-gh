import { StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  const isDarkTone =
    tone === "success" || tone === "warning" || tone === "danger";
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.text, isDarkTone && styles.lightText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  neutral: { backgroundColor: colors.surfaceMuted },
  success: { backgroundColor: colors.success },
  warning: { backgroundColor: colors.warning },
  danger: { backgroundColor: colors.danger },
  info: { backgroundColor: "#d5e3ff" }, // primary-fixed
  text: {
    color: colors.ink,
    fontSize: 12,
    fontFamily: "BeVietnamPro_600SemiBold",
  },
  lightText: { color: "#ffffff" },
});
