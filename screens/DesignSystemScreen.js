import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

// Menu Item Component
const MenuItem = ({ icon, title, subtitle, count, color, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconBox, { backgroundColor: (color || theme.colors.textTitle) + "15" }]}>
      <Feather name={icon} size={22} color={color || theme.colors.textTitle} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.menuRight}>
      {count && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
    </View>
  </TouchableOpacity>
);

const menuItems = [
  {
    id: "workoutCards",
    icon: "layers",
    title: "Workout Cards",
    subtitle: "All workout card components",
    count: "9",
    color: theme.colors.accentYellow,
    route: "WorkoutCards",
  },
  {
    id: "theme",
    icon: "droplet",
    title: "Theme",
    subtitle: "Colors, typography, spacing",
    color: theme.colors.accentBlue,
    route: "Theme",
  },
];

export default function DesignSystemScreen() {
  useStatusBar(theme.colors.screenBackground);
  const navigation = useNavigation();

  return (
    <DynamicSafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textTitle} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Design System</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Feather name="box" size={32} color={theme.colors.textTitle} />
          </View>
          <Text style={styles.heroTitle}>SheetFit</Text>
          <Text style={styles.heroSubtitle}>Design System v1.0</Text>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Components</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <MenuItem
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.subtitle}
                  count={item.count}
                  color={item.color}
                  onPress={() => navigation.navigate(item.route)}
                />
                {index < menuItems.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionLabel}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>9</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>32</Text>
              <Text style={styles.statLabel}>Colors</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Icons</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Buttons</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>
            Built with React Native + Expo
          </Text>
        </View>
      </ScrollView>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.screenBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.textTitle,
  },
  content: {
    paddingBottom: theme.spacing.xxl * 2,
  },
  hero: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.lg,
  },
  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.textTitle,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  menuSection: {
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  menuCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  countBadge: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textBody,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginLeft: 44 + theme.spacing.lg + theme.spacing.md,
  },
  statsSection: {
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.textTitle,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.accentYellow,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});
