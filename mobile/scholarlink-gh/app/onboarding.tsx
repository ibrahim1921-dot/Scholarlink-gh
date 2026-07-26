import { Link, router, Stack } from "expo-router";
import { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../constants/colors";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Find Scholarships",
    description: "Unlock your future with AI-matched scholarships tailored for Ghanaian students.",
    image: require("../assets/images/onboarding_student.png"),
  },
  {
    id: "2",
    title: "Get AI Matches",
    description: "Our assistant finds the best fits for your profile.",
    image: require("../assets/images/onboarding_ai_robot.png"),
  },
  {
    id: "3",
    title: "Never Miss Deadlines",
    description: "Stay on track with smart alerts and trackers.",
    image: require("../assets/images/onboarding_calendar.png"),
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  const handleSkip = () => {
    router.push("/(auth)/register");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Skip Button */}
      {activeIndex < 2 && (
        <Pressable
          style={[styles.skipButton, { top: insets.top + 24 }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.logoRow}>
          <Image
            source={require("../assets/images/logo-full.png")}
            style={styles.logo}
          />
          <Text style={styles.logoText}>ScholarLink GH</Text>
        </View>
        <Text style={styles.subtitle}>Find scholarships you actually qualify for</Text>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {slides.map((slide) => {
            const isFirst = slide.id === "1";
            return (
              <View key={slide.id} style={styles.slide}>
                <View
                  style={[
                    styles.imageContainer,
                    isFirst && styles.firstImageContainer,
                  ]}
                >
                  <Image
                    source={slide.image}
                    style={[styles.image, isFirst && styles.firstImage]}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{slide.title}</Text>
                  <Text style={styles.description}>{slide.description}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>
        
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </Pressable>
        
        <Text style={styles.footerTagline}>BRIDGING DREAMS & OPPORTUNITY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  logoText: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 20,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  slide: {
    width: width,
    alignItems: "center",
    paddingHorizontal: 20,
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    maxWidth: 320,
    height: 340,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: colors.surfaceMuted,
  },
  firstImageContainer: {
    width: width,
    maxWidth: width,
    height: 380,
    borderRadius: 0,
  },
  image: {
    width: "100%",
    height: "140%",
    marginTop: -25,
  },
  firstImage: {
    width: "100%",
    height: "155%",
    marginTop: -45,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 24,
    color: colors.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  skipButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: "#ffffff",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: colors.success,
  },
  footerTagline: {
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    letterSpacing: 1.2,
    marginTop: 8,
    opacity: 0.7,
  },
});
