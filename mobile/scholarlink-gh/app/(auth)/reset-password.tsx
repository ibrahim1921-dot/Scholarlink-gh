import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppTextInput } from "../../components/AppTextInput";
import { authService } from "../../services/authService";

const dsColors = {
  background: "#f9f9fe",
  primary: "#001e40",
  primaryContainer: "#003366",
  surfaceContainerHighest: "#e2e2e7",
  outlineVariant: "#c3c6d1",
  outline: "#737780",
  onSurface: "#1a1c1f",
  onSurfaceVariant: "#43474f",
  error: "#ba1a1a",
  onTertiaryContainer: "#d8885c",
  secondary: "#1b6d24",
  surfaceContainerLowest: "#ffffff",
};

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token?: string }>();
  
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Same regex as backend
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/;

  const getPasswordStrength = () => {
    if (password.length === 0) return { label: "WEAK", color: dsColors.error, width: "0%" };
    if (password.length < 8) return { label: "WEAK", color: dsColors.error, width: "25%" };
    if (!passwordRegex.test(password)) return { label: "MEDIUM", color: dsColors.onTertiaryContainer, width: "60%" };
    return { label: "STRONG", color: dsColors.secondary, width: "100%" };
  };

  const strength = getPasswordStrength();

  const submit = async () => {
    if (!token) {
      Alert.alert("Missing Token", "Reset token is missing from the link.");
      return;
    }
    if (!password || !confirmPassword) {
      Alert.alert("Missing Fields", "Please enter and confirm your new password.");
      return;
    }
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Weak Password",
        "Password must be 8-72 characters long, containing at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords Mismatch", "The new passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (e: any) {
      Alert.alert(
        "Reset Failed",
        e.message || "Failed to reset password. The link might be expired."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingHorizontal: 20 }]}>
        <View style={styles.introContainer}>
          <Text style={styles.title}>Invalid Link</Text>
          <Text style={styles.subtitle}>
            The password reset link is missing or invalid. Please request a new one.
          </Text>
        </View>
        <Pressable style={styles.button} onPress={() => router.replace("/(auth)/forgot-password")}>
          <Text style={styles.buttonText}>Go to Forgot Password</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top, height: 48 + insets.top }]}>
        <Text style={styles.headerTitle}>ScholarLink GH</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.introContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below.
          </Text>
        </View>

        {success ? (
          <View style={styles.successContainer}>
            <MaterialIcons name="check-circle-outline" size={64} color={dsColors.primaryContainer} />
            <Text style={styles.successText}>
              Your password has been reset successfully. You can now log in with your new password.
            </Text>
            <View style={styles.actionContainer}>
              <Pressable style={styles.button} onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.buttonText}>Log In Now</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            
            {/* New Password */}
            <View style={styles.fieldContainer}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>NEW PASSWORD</Text>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
              <AppTextInput
                leftIcon={<MaterialIcons name="lock-outline" size={20} color={dsColors.outline} />}
                rightIcon={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={dsColors.outline} />
                  </Pressable>
                }
                style={[styles.input, styles.passwordInput, passwordFocused && styles.inputFocused]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={dsColors.outline}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <View style={styles.strengthBarBg}>
                <View style={[styles.strengthBarFill, { width: strength.width as any, backgroundColor: strength.color }]} />
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <AppTextInput
                leftIcon={<MaterialIcons name="lock-outline" size={20} color={dsColors.outline} />}
                rightIcon={
                  <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={dsColors.outline} />
                  </Pressable>
                }
                style={[styles.input, styles.passwordInput, confirmFocused && styles.inputFocused]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholder="••••••••"
                placeholderTextColor={dsColors.outline}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
              />
            </View>

            <View style={styles.actionContainer}>
              <Pressable style={styles.button} onPress={submit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Reset Password</Text>
                    <MaterialIcons name="lock-reset" size={20} color="#ffffff" />
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.row}>
              <Text style={styles.text}>Didn't request this? </Text>
              <Link href="/(auth)/login" style={styles.link}>
                Go Back
              </Link>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dsColors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, backgroundColor: "rgba(249, 249, 254, 0.8)",
  },
  headerTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: dsColors.primary },
  content: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 64 },
  introContainer: { marginBottom: 32, marginTop: 32 },
  title: {
    fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 32, color: dsColors.primary,
    marginBottom: 8, lineHeight: 40, letterSpacing: -0.6,
  },
  subtitle: { fontFamily: "BeVietnamPro_400Regular", fontSize: 16, color: dsColors.onSurfaceVariant, lineHeight: 24 },
  formContainer: { gap: 24 },
  successContainer: { alignItems: "center", gap: 16, marginTop: 16 },
  successText: { fontFamily: "BeVietnamPro_400Regular", fontSize: 16, color: dsColors.onSurface, textAlign: "center", lineHeight: 24 },
  fieldContainer: { gap: 8 },
  label: { fontFamily: "BeVietnamPro_600SemiBold", fontSize: 12, color: dsColors.onSurface, letterSpacing: 0.6, textTransform: "uppercase" },
  input: {
    width: "100%", height: 48, backgroundColor: dsColors.surfaceContainerLowest,
    borderBottomWidth: 2, borderBottomColor: dsColors.outlineVariant,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingLeft: 48, paddingRight: 48, fontSize: 14,
    fontFamily: "BeVietnamPro_400Regular", color: dsColors.onSurface,
  },
  passwordInput: { paddingRight: 48 },
  inputFocused: { borderBottomColor: dsColors.primaryContainer },
  passwordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  strengthLabel: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 10 },
  strengthBarBg: { height: 4, backgroundColor: dsColors.surfaceContainerHighest, borderRadius: 2, overflow: "hidden", marginTop: 8 },
  strengthBarFill: { height: "100%" },
  actionContainer: { marginTop: 8, width: "100%" },
  button: {
    width: "100%", height: 56, backgroundColor: dsColors.primaryContainer,
    borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  buttonText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: "#ffffff" },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "center", marginTop: 4 },
  text: { color: dsColors.onSurfaceVariant, fontSize: 14, fontFamily: "BeVietnamPro_400Regular" },
  link: { color: dsColors.primary, fontSize: 14, fontFamily: "PlusJakartaSans_600SemiBold" },
});
