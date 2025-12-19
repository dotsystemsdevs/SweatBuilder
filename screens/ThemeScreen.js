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

// Section Component
const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// Color Swatch Component
const ColorSwatch = ({ name, color, description }) => (
  <View style={styles.colorSwatch}>
    <View style={[styles.colorBox, { backgroundColor: color }]}>
      <Text style={[
        styles.colorHex,
        { color: isLightColor(color) ? theme.colors.black : theme.colors.white }
      ]}>
        {color}
      </Text>
    </View>
    <Text style={styles.colorName}>{name}</Text>
    {description && <Text style={styles.colorDesc}>{description}</Text>}
  </View>
);

// Check if color is light
const isLightColor = (hex) => {
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 128;
};

// Usage Example Component
const UsageExample = ({ icon, label, color }) => (
  <View style={styles.usageItem}>
    <View style={[styles.usageIcon, { backgroundColor: color }]}>
      <Feather name={icon} size={16} color={theme.colors.black} />
    </View>
    <Text style={styles.usageLabel}>{label}</Text>
  </View>
);

// Sport Icon Component (using Feather icons to match workout cards)
const SportIcon = ({ name, icon, color = theme.colors.yellow }) => (
  <View style={styles.sportItem}>
    <Feather name={icon} size={22} color={color} />
    <Text style={styles.sportLabel}>{name}</Text>
  </View>
);

// Workout type icons (matching getWorkoutIcon in WorkoutCardsScreen)
const WORKOUT_ICONS = [
  // Cardio
  { name: "Running", icon: "navigation", color: theme.colors.green },
  { name: "Cycling", icon: "disc", color: theme.colors.blue },
  { name: "Swimming", icon: "droplet", color: theme.colors.blue },
  { name: "Walking", icon: "map-pin", color: theme.colors.green },
  { name: "Cardio", icon: "activity", color: theme.colors.orange },
  { name: "HIIT", icon: "zap", color: theme.colors.red },
  // Strength
  { name: "Push", icon: "chevrons-up", color: theme.colors.yellow },
  { name: "Pull", icon: "chevrons-down", color: theme.colors.yellow },
  { name: "Legs", icon: "trending-up", color: theme.colors.yellow },
  { name: "Upper", icon: "triangle", color: theme.colors.yellow },
  { name: "Back", icon: "columns", color: theme.colors.yellow },
  { name: "Chest", icon: "square", color: theme.colors.yellow },
  { name: "Core", icon: "target", color: theme.colors.orange },
  { name: "Full Body", icon: "maximize", color: theme.colors.yellow },
  { name: "Gym", icon: "grid", color: theme.colors.yellow },
  // Sports
  { name: "Yoga", icon: "wind", color: theme.colors.purple },
  { name: "Boxing", icon: "hexagon", color: theme.colors.red },
  { name: "Dance", icon: "music", color: theme.colors.purple },
  { name: "Martial Arts", icon: "shield", color: theme.colors.red },
  { name: "Tennis", icon: "circle", color: theme.colors.green },
  { name: "Golf", icon: "flag", color: theme.colors.green },
  { name: "Skiing", icon: "cloud-snow", color: theme.colors.blue },
  { name: "Rowing", icon: "minus", color: theme.colors.blue },
  { name: "Rest", icon: "moon", color: theme.colors.blue },
];

export default function ThemeScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();

  // Color structure
  const backgroundColors = [
    { name: "background", color: theme.colors.background, description: "Screens" },
    { name: "surface", color: theme.colors.surface, description: "Cards" },
    { name: "surfaceHover", color: theme.colors.surfaceHover, description: "Buttons" },
    { name: "border", color: theme.colors.border, description: "Borders" },
  ];

  const textColors = [
    { name: "text", color: theme.colors.text, description: "Titles" },
    { name: "textSecondary", color: theme.colors.textSecondary, description: "Body" },
    { name: "textMuted", color: theme.colors.textMuted, description: "Hints" },
  ];

  const accentColors = [
    { name: "yellow", color: theme.colors.yellow, description: "Today" },
    { name: "green", color: theme.colors.green, description: "Success" },
    { name: "blue", color: theme.colors.blue, description: "Info" },
    { name: "orange", color: theme.colors.orange, description: "Streak" },
    { name: "purple", color: theme.colors.purple, description: "AI" },
    { name: "red", color: theme.colors.red, description: "Danger" },
  ];

  const softColors = [
    { name: "yellowSoft", color: theme.colors.yellowSoft },
    { name: "greenSoft", color: theme.colors.greenSoft },
    { name: "blueSoft", color: theme.colors.blueSoft },
    { name: "orangeSoft", color: theme.colors.orangeSoft },
    { name: "purpleSoft", color: theme.colors.purpleSoft },
    { name: "redSoft", color: theme.colors.redSoft },
  ];

  return (
    <DynamicSafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theme Tokens</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Reference */}
        <Section title="Quick Reference">
          <View style={styles.rulesContainer}>
            <View style={styles.ruleRow}>
              <Feather name="check" size={14} color={theme.colors.green} />
              <Text style={styles.ruleText}>Cards: surface + border + radius.lg</Text>
            </View>
            <View style={styles.ruleRow}>
              <Feather name="check" size={14} color={theme.colors.green} />
              <Text style={styles.ruleText}>Icons on accents: always black</Text>
            </View>
            <View style={styles.ruleRow}>
              <Feather name="check" size={14} color={theme.colors.green} />
              <Text style={styles.ruleText}>Status: green=done, yellow=today, red=error</Text>
            </View>
          </View>
        </Section>

        {/* Background Colors */}
        <Section title="Backgrounds">
          <View style={styles.colorGrid}>
            {backgroundColors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </View>
        </Section>

        {/* Text Colors */}
        <Section title="Text">
          <View style={styles.colorGrid}>
            {textColors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </View>
        </Section>

        {/* Accent Colors */}
        <Section title="Accents">
          <View style={styles.colorGrid}>
            {accentColors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </View>
        </Section>

        {/* Accent Usage */}
        <Section title="Accent Usage">
          <View style={styles.usageGrid}>
            <UsageExample icon="calendar" label="Today" color={theme.colors.yellow} />
            <UsageExample icon="check" label="Done" color={theme.colors.green} />
            <UsageExample icon="info" label="Info" color={theme.colors.blue} />
            <UsageExample icon="flame" label="Streak" color={theme.colors.orange} />
            <UsageExample icon="message-circle" label="Coach" color={theme.colors.purple} />
            <UsageExample icon="trash-2" label="Delete" color={theme.colors.red} />
          </View>
        </Section>

        {/* Workout Icons */}
        <Section title="Workout Icons">
          <View style={styles.sportsGrid}>
            {WORKOUT_ICONS.map((item) => (
              <SportIcon key={item.name} {...item} />
            ))}
          </View>
        </Section>

        {/* Soft Variants */}
        <Section title="Soft Variants">
          <Text style={styles.softNote}>For tinted icon backgrounds</Text>
          <View style={styles.colorGrid}>
            {softColors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </View>
        </Section>

        {/* Spacing */}
        <Section title="Spacing">
          <View style={styles.spacingContainer}>
            {Object.entries(theme.spacing).map(([key, value]) => {
              if (typeof value !== "number") return null;
              return (
                <View key={key} style={styles.spacingRow}>
                  <Text style={styles.spacingLabel}>{key}</Text>
                  <View
                    style={[
                      styles.spacingBar,
                      { width: value, backgroundColor: theme.colors.yellow },
                    ]}
                  />
                  <Text style={styles.spacingValue}>{value}px</Text>
                </View>
              );
            })}
          </View>
        </Section>

        {/* Border Radius */}
        <Section title="Radius">
          <View style={styles.radiusContainer}>
            {Object.entries(theme.radius).map(([key, value]) => (
              <View key={key} style={styles.radiusItem}>
                <View
                  style={[
                    styles.radiusBox,
                    { borderRadius: value > 50 ? 25 : value },
                  ]}
                />
                <Text style={styles.radiusLabel}>{key}</Text>
                <Text style={styles.radiusValue}>{value}px</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <View style={styles.typographyContainer}>
            <View style={styles.typeRow}>
              <Text style={styles.typeLabel}>hero</Text>
              <Text style={{ ...theme.typography.hero, fontSize: 32 }}>72px</Text>
            </View>
            <View style={styles.typeRow}>
              <Text style={styles.typeLabel}>h1</Text>
              <Text style={theme.typography.h1}>Screen Title</Text>
            </View>
            <View style={styles.typeRow}>
              <Text style={styles.typeLabel}>h2</Text>
              <Text style={theme.typography.h2}>Section Title</Text>
            </View>
            <View style={styles.typeRow}>
              <Text style={styles.typeLabel}>h3</Text>
              <Text style={theme.typography.h3}>Card Title</Text>
            </View>
            <View style={styles.typeRow}>
              <Text style={styles.typeLabel}>body</Text>
              <Text style={theme.typography.body}>Body text content</Text>
            </View>
            <View style={styles.typeRow}>
              <Text style={styles.typeLabel}>label</Text>
              <Text style={theme.typography.label}>SECTION LABEL</Text>
            </View>
            <View style={styles.typeRow}>
              <Text style={styles.typeLabel}>caption</Text>
              <Text style={theme.typography.caption}>Small caption text</Text>
            </View>
          </View>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={theme.buttons.primary}>
              <Text style={theme.buttons.primaryText}>Primary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={theme.buttons.secondary}>
              <Text style={theme.buttons.secondaryText}>Secondary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={theme.buttons.danger}>
              <Text style={theme.buttons.dangerText}>Danger</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Card Example */}
        <Section title="Card">
          <View style={theme.cards.base}>
            <View style={styles.cardExample}>
              <Feather name="box" size={20} color={theme.colors.text} />
              <Text style={styles.cardExampleText}>Base Card Style</Text>
            </View>
          </View>
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBadge}>
            <Text style={styles.footerBadgeText}>SheetFit</Text>
          </View>
          <Text style={styles.footerTitle}>Design System</Text>
          <Text style={styles.footerVersion}>v2.0</Text>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
  },
  content: {
    paddingBottom: theme.spacing.xxl * 2,
  },
  section: {
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  sectionContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Rules
  rulesContainer: {
    gap: theme.spacing.sm,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  ruleText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  // Color Grid
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  colorSwatch: {
    alignItems: "center",
    width: 70,
  },
  colorBox: {
    width: 60,
    height: 48,
    borderRadius: theme.radius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
  },
  colorHex: {
    fontSize: 8,
    fontWeight: "600",
  },
  colorName: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
  },
  colorDesc: {
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: "center",
  },

  // Usage Grid
  usageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },
  usageItem: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  usageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  usageLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },

  // Sports Grid
  sportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  sportItem: {
    alignItems: "center",
    gap: theme.spacing.xs,
    width: 60,
  },
  sportLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: "center",
  },

  // Soft Note
  softNote: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },

  // Spacing
  spacingContainer: {
    gap: theme.spacing.sm,
  },
  spacingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  spacingLabel: {
    width: 100,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  spacingBar: {
    height: 16,
    borderRadius: 4,
  },
  spacingValue: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  // Radius
  radiusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },
  radiusItem: {
    alignItems: "center",
  },
  radiusBox: {
    width: 50,
    height: 50,
    backgroundColor: theme.colors.yellow,
    marginBottom: theme.spacing.xs,
  },
  radiusLabel: {
    fontSize: 11,
    color: theme.colors.text,
    fontWeight: "500",
  },
  radiusValue: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  // Typography
  typographyContainer: {
    gap: theme.spacing.md,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.spacing.md,
  },
  typeLabel: {
    width: 60,
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },

  // Buttons
  buttonsContainer: {
    gap: theme.spacing.md,
  },

  // Card Example
  cardExample: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  cardExampleText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.text,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.xs,
  },
  footerBadge: {
    backgroundColor: theme.colors.yellow,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.xs,
  },
  footerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.black,
    letterSpacing: 1,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  footerVersion: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
