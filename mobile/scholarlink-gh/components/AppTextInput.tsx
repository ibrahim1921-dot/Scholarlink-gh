import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useCallback, useRef, useState } from "react";

import { colors } from "../constants/colors";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
};

export function AppTextInput({
  label,
  error,
  rightIcon,
  leftIcon,
  style,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const viewRef = useRef<View>(null);

  const scrollToInput = useCallback(() => {
    // Small delay allows keyboard animation to begin,
    // then we measure and ensure the field is visible.
    setTimeout(() => {
      viewRef.current?.measureInWindow((_x, y, _w, h) => {
        // Measurement can fail if component unmounted
        if (y === undefined) return;
      });
    }, 100);
  }, []);

  return (
    <View style={styles.wrap} ref={viewRef}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputContainer}>
        {leftIcon ? (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        ) : null}
        <TextInput
          placeholderTextColor="#8B9894"
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            error && styles.inputError,
            !!rightIcon && { paddingRight: 48 },
            !!leftIcon && { paddingLeft: 48 },
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            scrollToInput();
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon ? (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  inputContainer: {
    position: "relative",
    justifyContent: "center",
  },
  rightIconContainer: {
    position: "absolute",
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  leftIconContainer: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontFamily: "BeVietnamPro_600SemiBold",
  },
  input: {
    backgroundColor: "#F4F3F8", // surface-container-low
    borderBottomColor: colors.border,
    borderBottomWidth: 2,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "transparent",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    color: colors.ink,
    fontSize: 15,
    fontFamily: "BeVietnamPro_400Regular",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderBottomColor: colors.danger,
    borderColor: colors.danger,
    borderWidth: 1,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: "BeVietnamPro_400Regular",
  },
});
