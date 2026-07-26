import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View, Image, ScrollView, KeyboardAvoidingView, Platform, TextInput, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTextInput } from "../../components/AppTextInput";

import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/apiClient";


// Local colors matching the Tailwind design specs
const dsColors = {
  background: "#f9f9fe",
  primary: "#001e40",
  primaryContainer: "#003366",
  surfaceContainerLow: "#f4f3f8",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHighest: "#e2e2e7",
  outlineVariant: "#c3c6d1",
  outline: "#737780",
  onSurface: "#1a1c1f",
  onSurfaceVariant: "#43474f",
  error: "#ba1a1a",
  onTertiaryContainer: "#d8885c",
  secondary: "#1b6d24",
};

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNameChange = (text: string) => {
    setName(text);
    if (text.length > 0 && text.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
    } else if (text.trim() && !/^[a-zA-Z\s'-]+$/.test(text)) {
      setNameError("Name can only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setNameError("");
    }
  };

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = () => {
    if (password.length === 0) return { label: "WEAK", color: dsColors.error, width: "0%" };
    if (password.length < 6) return { label: "WEAK", color: dsColors.error, width: "25%" };
    if (password.length < 10) return { label: "MEDIUM", color: dsColors.onTertiaryContainer, width: "60%" };
    return { label: "STRONG", color: dsColors.secondary, width: "100%" };
  };

  const strength = getPasswordStrength();

  const submit = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password
    ) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    if (nameError) {
      Alert.alert("Invalid Name", nameError);
      return;
    }
    setLoading(true);
    try {
      await register({
        username: name.trim(), 
        email: email.trim(),
        phoneNumber: phone.trim(),
        password,
      });
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { email: email.trim() },
      });
    } catch (e) {
      Alert.alert("Registration Failed", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 48 + insets.top }]}>
        <Text style={styles.headerTitle}>ScholarLink GH</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {/* Intro */}
        <View style={styles.introContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the community bridging achievement and opportunity in Ghana.</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          


          <View style={styles.fieldContainer}>
            <Text style={styles.label}>FULL NAME</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person-outline" size={20} color={dsColors.outline} style={styles.inputLeftIcon} />
              <TextInput
                style={[
                  styles.input, 
                  nameFocused && styles.inputFocused,
                  nameError ? styles.inputError : null
                ]}
                value={name}
                onChangeText={handleNameChange}
                autoCapitalize="words"
                placeholder="Aba Mensah"
                placeholderTextColor={dsColors.outline}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

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

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={styles.phoneWrapper}>
              <View style={styles.countryCodeContainer}>
                <Text style={styles.countryCodeText}>🇬🇭 +233</Text>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput, phoneFocused && styles.inputFocused]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="20 123 4567"
                placeholderTextColor={dsColors.outline}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>PASSWORD</Text>
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
            {/* Strength Indicator */}
            <View style={styles.strengthBarBg}>
              <View style={[styles.strengthBarFill, { width: strength.width as any, backgroundColor: strength.color }]} />
            </View>
          </View>

          <View style={styles.actionContainer}>
            <Pressable style={styles.registerButton} onPress={submit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Register</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.row}>
            <Text style={styles.text}>Already have an account? </Text>
            <Link href="/(auth)/login" style={styles.link}>
              Log In
            </Link>
          </View>

        </View>

        {/* Visual Anchor / Decorative */}
        <View style={styles.decorativeContainer}>
          <Image 
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnb3-6m4QRJBmZVwHd0imeKPhDVsH8j9u4T4WCirbBaJhWmS88A4WXxr-CAbFsMp_RXJCsrpK9jwZNFftqzKQ1Dya4EJpY24Muf7nWbVULpNoDkfCl4v6EZbCMc6hIG5zw0bPtHGJnJ5_FeJnU6kgEoQHUNg-qGCCIWCDzAXpxTTk8dDRAd8ZpKR3Bd8yBalLKuWDP2c0TYtn_I1cbpyB-MAYQQF4PVvib5u5WT4578MzvAlZMYFqcwmm5FL4kOk7HKBMJtJqZD1Ss" }}
            style={styles.decorativeImage}
            resizeMode="cover"
          />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dsColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 48,
    backgroundColor: "rgba(249, 249, 254, 0.8)",
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: dsColors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 128,
  },
  introContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 32,
    color: dsColors.primary,
    marginBottom: 8,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 16,
    color: dsColors.onSurfaceVariant,
    lineHeight: 24,
  },
  formContainer: { 
    gap: 24,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: dsColors.onSurface,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  inputLeftIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  inputRightIcon: {
    position: "absolute",
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  input: {
    width: "100%",
    height: 48,
    backgroundColor: dsColors.surfaceContainerLowest,
    borderBottomWidth: 2,
    borderBottomColor: dsColors.outlineVariant,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 14,
    fontFamily: "BeVietnamPro_400Regular",
    color: dsColors.onSurface,
  },
  passwordInput: {
    paddingRight: 48,
  },
  phoneWrapper: {
    flexDirection: "row",
    gap: 8,
  },
  countryCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: dsColors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(195, 198, 209, 0.3)",
  },
  countryCodeText: {
    fontSize: 14,
    fontFamily: "BeVietnamPro_600SemiBold",
    color: dsColors.onSurface,
  },
  phoneInput: {
    flex: 1,
    paddingLeft: 16,
  },
  inputFocused: {
    borderBottomColor: dsColors.primaryContainer,
  },
  inputError: {
    borderBottomColor: dsColors.error,
  },
  errorText: {
    color: dsColors.error,
    fontSize: 12,
    fontFamily: "BeVietnamPro_400Regular",
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  strengthLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 10,
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: dsColors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
  },
  strengthBarFill: {
    height: "100%",
  },
  actionContainer: { 
    marginTop: 16,
  },
  registerButton: {
    width: "100%",
    height: 56,
    backgroundColor: dsColors.primaryContainer,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: "#ffffff",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
  },
  text: { 
    color: dsColors.onSurfaceVariant, 
    fontSize: 14,
    fontFamily: "BeVietnamPro_400Regular",
  },
  link: { 
    color: dsColors.primary, 
    fontSize: 14, 
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  decorativeContainer: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 32,
    position: "relative",
    opacity: 0.5,
  },
  decorativeImage: {
    width: "100%",
    height: "100%",
  },
});
