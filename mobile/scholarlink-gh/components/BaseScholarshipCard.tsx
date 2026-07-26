import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/colors";

const PLACEHOLDER_IMAGE = require("../assets/images/header-scholarships.jpg");

type Props = {
  title: string;
  provider: string;
  deadline?: string;
  country?: string;
  field?: string;
  imageUrl?: string | null;
  applicationUrl?: string | null;
  countdownLabel?: string | null;
  matchScore?: number | null;
  onPress?: () => void;
  statusBadge?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "default" | "compact";
};

export function BaseScholarshipCard({
  title,
  provider,
  deadline,
  country,
  field,
  imageUrl,
  applicationUrl,
  countdownLabel,
  matchScore,
  onPress,
  statusBadge,
  children,
  variant = "default",
}: Props) {
  const imageSource = imageUrl ? { uri: imageUrl } : PLACEHOLDER_IMAGE;
  const isCompact = variant === "compact";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}
    >
      <View style={[styles.imageContainer, isCompact && styles.imageContainerCompact]}>
        <Image source={imageSource} style={styles.headerImage} resizeMode="cover" />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={styles.imageGradient} />

        {matchScore != null && (
          <View style={styles.matchScoreBadge}>
            <Ionicons name="sparkles" size={13} color="#005312" style={{ marginRight: 4 }} />
            <Text style={styles.matchScoreText}>{matchScore}% AI Match</Text>
          </View>
        )}

        {countdownLabel && (
          <View style={styles.countdownBadge}>
            <Ionicons name="time-outline" size={13} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.countdownText}>{countdownLabel}</Text>
          </View>
        )}

        <Text style={styles.overlaidTitle} numberOfLines={2}>
          {title}
        </Text>
        {applicationUrl && (
          <View style={styles.externalLinkBadge}>
            <Ionicons name="open-outline" size={14} color="#ffffff" />
          </View>
        )}
      </View>

      <View style={[styles.body, isCompact && styles.bodyCompact]}>
        <Text style={styles.providerText} numberOfLines={1}>
          {provider}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <View style={styles.metaLabelRow}>
              <Ionicons name="location-outline" size={14} color={colors.muted} />
              <Text style={styles.metaLabel}>Country</Text>
            </View>
            <Text style={styles.metaValue} numberOfLines={1}>
              {country || "N/A"}
            </Text>
          </View>

          <View style={styles.metaCol}>
            <View style={styles.metaLabelRow}>
              <MaterialCommunityIcons name="school-outline" size={14} color={colors.muted} />
              <Text style={styles.metaLabel}>Field</Text>
            </View>
            <Text style={styles.metaValue} numberOfLines={1}>
              {field || "All Fields"}
            </Text>
          </View>
          
          {applicationUrl && (
            <View style={styles.metaCol}>
              <View style={styles.metaLabelRow}>
                <Ionicons name="open-outline" size={14} color={colors.muted} />
                <Text style={styles.metaLabel}>Apply</Text>
              </View>
              <Text style={styles.metaValue} numberOfLines={1}>
                External
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View style={styles.deadlinePill}>
            <Text style={styles.deadlinePillText}>
              Deadline: {deadline || "N/A"}
            </Text>
          </View>
          {statusBadge && <View>{statusBadge}</View>}
        </View>
      </View>

      {children && <View style={styles.childrenContainer}>{children}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(195, 198, 209, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  imageContainer: {
    height: 180,
    position: "relative",
    overflow: "hidden",
  },
  imageContainerCompact: {
    height: 140,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  matchScoreBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#a0f399",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  matchScoreText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 11,
    color: "#005312",
  },
  countdownBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countdownText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 11,
    color: "#ffffff",
  },
  overlaidTitle: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 60,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#ffffff",
    lineHeight: 24,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  externalLinkBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  bodyCompact: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  providerText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 13,
    color: colors.info,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaCol: {
    flex: 1,
  },
  metaLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  metaLabel: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deadlinePill: {
    backgroundColor: "rgba(167, 200, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  deadlinePillText: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 11,
    color: colors.info,
  },
  childrenContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
