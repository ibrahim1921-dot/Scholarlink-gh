import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View, KeyboardAvoidingView, Platform, TextInput, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authService } from "../../services/authService";

const dsColors = {
  background: "#f9f9fe",
  primary: "#001e40",
  primaryContainer: "#003366",
  surfaceContainerLowest: "#ffffff",
  outlineVariant: "#c3c6d1",
  outline: "#737780",
  onSurface: "#1a1c1f",
  onSurfaceVariant: "#43474f",
  error: "#ba1a1a",
};

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSuccess(true);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to request password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top, height: 48 + insets.top }]}>
        <Text style={styles.headerTitle}>ScholarLink GH</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.introContainer}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address to receive a password reset link.
          </Text>
        </View>

        {success ? (
          <View style={styles.successContainer}>
            <MaterialIcons name="check-circle-outline" size={64} color={dsColors.primaryContainer} />
            <Text style={styles.successText}>
              If an account with that email exists, a password reset link has been sent.
            </Text>
            <View style={styles.actionContainer}>
              <Pressable style={styles.button} onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.buttonText}>Back to Login</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="mail-outline" size={20} color={dsColors.outline} style={styles.inputLeftIcon} />
                <TextInput
                  style={[styles.input, emailFocused && styles.inputFocused]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  placeholderTextColor={dsColors.outline}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            <View style={styles.actionContainer}>
              <Pressable style={styles.button} onPress={submit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.row}>
              <Text style={styles.text}>Remembered your password? </Text>
              <Link href="/(auth)/login" style={styles.link}>
                Log In
              </Link>
            </View>
          </View>
        )}
      </View>
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
  content: { paddingHorizontal: 20, paddingTop: 32 },
  introContainer: { marginBottom: 32 },
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
  inputWrapper: { position: "relative", justifyContent: "center" },
  inputLeftIcon: { position: "absolute", left: 16, zIndex: 1 },
  input: {
    width: "100%", height: 48, backgroundColor: dsColors.surfaceContainerLowest,
    borderBottomWidth: 2, borderBottomColor: dsColors.outlineVariant,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingLeft: 48, paddingRight: 16, fontSize: 14,
    fontFamily: "BeVietnamPro_400Regular", color: dsColors.onSurface,
  },
  inputFocused: { borderBottomColor: dsColors.primaryContainer },
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
