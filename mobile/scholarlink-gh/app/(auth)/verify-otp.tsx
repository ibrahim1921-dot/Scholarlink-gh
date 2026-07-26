import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/apiClient";

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp, resendOtp } = useAuth();

  const [codes, setCodes] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const next = [...codes];
    next[index] = text;
    setCodes(next);
    if (text && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handleKey = (key: string, index: number) => {
    if (key === "Backspace" && !codes[index] && index > 0)
      refs.current[index - 1]?.focus();
  };

  const submit = async () => {
    const otp = codes.join("");
    if (otp.length < OTP_LENGTH) {
      Alert.alert("Incomplete", "Please enter the full code.");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email!, otp);
      router.replace("/profile-setup");
    } catch (e) {
      Alert.alert("Invalid Code", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email!);
      Alert.alert("Sent", "A new code was sent to your email.");
    } catch (e) {
      Alert.alert("Error", getErrorMessage(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen>
      <SectionHeader
        title="Verify Email"
        subtitle={`Enter the 6-digit code sent to ${email}`}
      />

      <View style={styles.codeRow}>
        {codes.map((c, i) => (
          <TextInput
            key={i}
            ref={(r: any) => (refs.current[i] = r)}
            style={[styles.codeBox, c ? styles.codeBoxFilled : null]}
            value={c}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={({ nativeEvent }) => handleKey(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>

      <AppButton title="Verify" onPress={submit} loading={loading} />
      <AppButton
        title={resending ? "Sending…" : "Resend Code"}
        onPress={handleResend}
        variant="ghost"
        loading={resending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginVertical: 16,
  },
  codeBox: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    height: 52,
    width: 44,
  },
  codeBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceMuted,
  },
});
