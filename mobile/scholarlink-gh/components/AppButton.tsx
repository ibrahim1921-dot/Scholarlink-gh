import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  StyleProp,
} from "react-native";

import { colors } from "../constants/colors";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
};

export function AppButton({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  style,
  icon,
}: Props) {
  const textStyles = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    ghost: styles.ghostText,
    danger: styles.dangerText,
  };

  return (
    <Pressable
      disabled={loading || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        (loading || disabled) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#fff" : colors.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, textStyles[variant], icon ? { marginLeft: 8 } : undefined]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: colors.danger },
  text: { fontSize: 15, fontFamily: "PlusJakartaSans_600SemiBold" },
  primaryText: { color: "#fff" },
  secondaryText: { color: colors.primary },
  ghostText: { color: colors.primary },
  dangerText: { color: "#fff" },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.6 },
});
