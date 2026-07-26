import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppButton } from "../../components/AppButton";
import { AppTextInput } from "../../components/AppTextInput";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/apiClient";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Login Failed", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.cardContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={require("../../assets/images/logo-full.png")} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>
          <SectionHeader
            title="Welcome Back"
            subtitle="Continue your journey to academic and professional excellence."
          />
        </View>
        <View style={styles.formContainer}>
          <AppTextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder=" "
          />
          <AppTextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder=" "
            rightIcon={
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#737780" />
              </Pressable>
            }
          />
          <View style={styles.forgotPasswordContainer}>
            <Link href="/(auth)/forgot-password" style={styles.forgotPasswordLink}>
              Forgot Password?
            </Link>
          </View>
        </View>
        <View style={styles.actionContainer}>
          <AppButton 
            title="Login" 
            onPress={submit} 
            loading={loading} 
            style={styles.loginButton}
          />
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to ScholarLink? </Text>
            <Link href="/(auth)/register" style={styles.footerLink}>
              Register
            </Link>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    maxWidth: 448,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: "rgba(195, 198, 209, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    alignSelf: "center",
  },
  headerContainer: { 
    marginBottom: 32,
    alignItems: "center",
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d5e3ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logo: {
    width: 64,
    height: 64,
  },
  formContainer: { gap: 16 },
  forgotPasswordContainer: {
    alignItems: "flex-end",
  },
  forgotPasswordLink: {
    color: "#003366",
    fontSize: 12,
    fontFamily: "BeVietnamPro_600SemiBold",
  },
  actionContainer: { marginTop: 16, gap: 16 },
  loginButton: {
    backgroundColor: "#003366",
    borderRadius: 12,
  },
  footer: { 
    alignItems: "center", 
    flexDirection: "row", 
    justifyContent: "center",
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(195, 198, 209, 0.3)",
  },
  footerText: {
    color: "#43474f",
    fontSize: 14,
    fontFamily: "BeVietnamPro_400Regular",
  },
  footerLink: {
    color: "#001e40",
    fontSize: 18,
    fontFamily: "PlusJakartaSans_600SemiBold",
    marginLeft: 4,
  },
});
