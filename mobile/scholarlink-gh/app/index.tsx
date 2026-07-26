import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";

export default function IndexRoute() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: colors.background,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={user ? "/(tabs)" : "/onboarding"} />;
}
