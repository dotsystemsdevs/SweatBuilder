import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import theme from "../theme";
import { useOnboardingStore } from "../store/onboardingStore";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { completeOnboarding } = useOnboardingStore();

  const handleStart = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Mark onboarding as started (AI will guide the actual setup)
    await completeOnboarding({
      startedAt: new Date().toISOString(),
      onboardingMode: "ai_guided",
    });

    // Navigate to AI Coach for guided setup
    navigation.reset({
      index: 0,
      routes: [
        { name: "Tabs", params: { screen: "AI" } },
      ],
    });
  }, [completeOnboarding, navigation]);

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent animated />
      <DynamicSafeAreaView style={styles.screen} backgroundColor={theme.colors.background}>
        {/* Content */}
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="dumbbell" size={48} color={theme.colors.yellow} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome to SheetFit</Text>
          <Text style={styles.subtitle}>
            Your AI-powered personal trainer that creates custom workout plans just for you
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="robot-outline" size={20} color={theme.colors.purple} />
              </View>
              <Text style={styles.featureText}>AI Coach creates your personalized plan</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="calendar-check" size={20} color={theme.colors.green} />
              </View>
              <Text style={styles.featureText}>Track workouts and log reflections</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="chart-line" size={20} color={theme.colors.orange} />
              </View>
              <Text style={styles.featureText}>Adapt and improve over time</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="robot-outline" size={22} color={theme.colors.white} />
            <Text style={styles.startButtonText}>Start with AI Coach</Text>
          </TouchableOpacity>

          <Text style={styles.footerHint}>
            Your AI Coach will ask a few questions to create your plan
          </Text>
        </View>
      </DynamicSafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenPadding,
    justifyContent: "center",
  },

  // Logo
  logoContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.yellowSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  // Title
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.md,
    lineHeight: 24,
    paddingHorizontal: theme.spacing.lg,
  },

  // Features
  features: {
    marginTop: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: "500",
  },

  // Footer
  footer: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.xxl,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.white,
  },
  footerHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
