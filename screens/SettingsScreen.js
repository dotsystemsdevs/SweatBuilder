import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import { useOnboardingStore } from "../store/onboardingStore";

const SettingRow = ({ icon, label, value, color, onPress, showArrow = true, rightElement }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, color && { backgroundColor: color + "20" }]}>
          <Feather name={icon} size={18} color={color || theme.colors.textMuted} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {rightElement}
        {showArrow && !rightElement && <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />}
      </View>
    </TouchableOpacity>
  );
};

const Divider = () => <View style={styles.divider} />;

export default function SettingsScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const { resetOnboarding } = useOnboardingStore();

  // Settings state (would be persisted in a real app)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [useKg, setUseKg] = useState(true);

  const handleRestartOnboarding = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Restart Onboarding",
      "This will reset your profile and start the setup process again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart",
          onPress: async () => {
            await resetOnboarding();
            navigation.reset({
              index: 0,
              routes: [{ name: "Onboarding" }],
            });
          },
        },
      ]
    );
  };

  const handleToggleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleToggleReminder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReminderEnabled(!reminderEnabled);
  };

  const handleToggleUnits = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUseKg(!useKg);
  };

  const handleExportData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Export Data", "Your workout data will be exported as JSON.", [
      { text: "Cancel", style: "cancel" },
      { text: "Export", onPress: () => {} },
    ]);
  };

  const handleDeleteData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your workout history and reflections. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {} },
      ]
    );
  };

  return (
    <DynamicSafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon="user"
              label="Name"
              value="Diana"
              color={theme.colors.blue}
              onPress={() => {}}
            />
            <Divider />
            <SettingRow
              icon="target"
              label="Goal"
              value="Build strength"
              color={theme.colors.green}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon="bell"
              label="Notifications"
              color={theme.colors.orange}
              showArrow={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: theme.colors.border, true: theme.colors.green }}
                  thumbColor={theme.colors.white}
                />
              }
            />
            <Divider />
            <SettingRow
              icon="clock"
              label="Daily Reminder"
              value={reminderEnabled ? "9:00 AM" : "Off"}
              color={theme.colors.yellow}
              showArrow={false}
              rightElement={
                <Switch
                  value={reminderEnabled}
                  onValueChange={handleToggleReminder}
                  trackColor={{ false: theme.colors.border, true: theme.colors.green }}
                  thumbColor={theme.colors.white}
                />
              }
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon="activity"
              label="Weight Unit"
              value={useKg ? "kg" : "lbs"}
              color={theme.colors.purple}
              onPress={handleToggleUnits}
              showArrow={false}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon="download"
              label="Export Data"
              color={theme.colors.blue}
              onPress={handleExportData}
            />
            <Divider />
            <SettingRow
              icon="trash-2"
              label="Delete All Data"
              color={theme.colors.red}
              onPress={handleDeleteData}
            />
          </View>
        </View>

        {/* Developer Section - hidden in production */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon="play-circle"
              label="Restart Onboarding"
              color={theme.colors.purple}
              onPress={handleRestartOnboarding}
            />
            <Divider />
            <SettingRow
              icon="droplet"
              label="Theme Tokens"
              color={theme.colors.yellow}
              onPress={() => navigation.navigate("Theme")}
            />
            <Divider />
            <SettingRow
              icon="layers"
              label="Workout Cards"
              color={theme.colors.green}
              onPress={() => navigation.navigate("WorkoutCards")}
            />
            <Divider />
            <SettingRow
              icon="sliders"
              label="Workout UI"
              color={theme.colors.purple}
              onPress={() => navigation.navigate("WorkoutUI")}
            />
            <Divider />
            <SettingRow
              icon="grid"
              label="Design System"
              color={theme.colors.textMuted}
              onPress={() => navigation.navigate("DesignSystem")}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon="info"
              label="Version"
              value="1.0.0"
              color={theme.colors.textMuted}
              showArrow={false}
            />
            <Divider />
            <SettingRow
              icon="heart"
              label="Rate App"
              color={theme.colors.red}
              onPress={() => {}}
            />
            <Divider />
            <SettingRow
              icon="message-circle"
              label="Send Feedback"
              color={theme.colors.blue}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>SheetFit</Text>
        </View>
      </ScrollView>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  content: {
    paddingBottom: theme.spacing.xxl * 2,
  },
  section: {
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.xl + 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md + 2,
  },
  sectionContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md + 2,
    minHeight: 56,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  rowValue: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 36 + theme.spacing.lg + theme.spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.yellow,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});
