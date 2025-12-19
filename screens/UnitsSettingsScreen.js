import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

const SettingRow = ({ icon, label, value, options, onSelect, isLast = false }) => {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={17} color={theme.colors.textMuted} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              value === option && styles.optionButtonSelected,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option);
            }}
            activeOpacity={0.6}
          >
            <Text
              style={[
                styles.optionText,
                value === option && styles.optionTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const Section = ({ title, children }) => {
  const childrenArray = React.Children.toArray(children);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {React.Children.map(childrenArray, (child, index) => {
          const isLast = index === childrenArray.length - 1;
          return React.cloneElement(child, { isLast });
        })}
      </View>
    </View>
  );
};

export default function UnitsSettingsScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const [weightUnit, setWeightUnit] = useState("kg");
  const [distanceUnit, setDistanceUnit] = useState("km");

  return (
    <DynamicSafeAreaView
      style={styles.screen}
      backgroundColor="transparent"
      topBackgroundColor="transparent"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Units</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Measurements">
          <SettingRow
            icon="weight"
            label="Weight"
            value={weightUnit}
            options={["kg", "lbs"]}
            onSelect={setWeightUnit}
          />
          <SettingRow
            icon="map-pin"
            label="Distance"
            value={distanceUnit}
            options={["km", "miles"]}
            onSelect={setDistanceUnit}
          />
        </Section>
      </ScrollView>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
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
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -1,
  },
  content: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl * 3,
  },
  section: {
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    includeFontPadding: false,
  },
  sectionContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceHover,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.text,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
    includeFontPadding: false,
  },
  optionTextSelected: {
    color: theme.colors.white,
    fontWeight: "600",
  },
});


