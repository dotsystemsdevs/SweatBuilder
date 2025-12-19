import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import {
  TodayCard,
  CompletedCard,
  SkippedCard,
  MissedCard,
  RestCard,
} from "../components/Cards/index";

export default function SummaryView() {
  useStatusBar(theme.colors.background);

  return (
    <DynamicSafeAreaView
      style={styles.screen}
      backgroundColor={theme.colors.background}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Summary View</Text>
          <Text style={styles.headerSubtitle}>Compare all card types</Text>
        </View>

        {/* Pending Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pending (Today)</Text>
          <View style={styles.card}>
            <TodayCard
              status="pending"
              title="Push Day"
              subtitle="6 exercises · Moderate tempo"
              purpose="Build upper body strength"
              targetEffort={7}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Active Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Active</Text>
          <View style={styles.card}>
            <TodayCard
              status="active"
              title="Push Day"
              subtitle="3/6 exercises · 22 min"
              purpose="Build upper body strength"
              targetEffort={7}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Completed Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Completed</Text>
          <View style={styles.card}>
            <CompletedCard
              title="Push Day"
              purpose="Build upper body strength"
              date="Yesterday"
              reflection={{
                effort: 8,
                tags: ["Felt strong", "New PR"],
                notes: "Hit a new PR on bench press!",
              }}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Skipped Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Skipped</Text>
          <View style={styles.card}>
            <SkippedCard
              title="Upper Body"
              purpose="Build muscle endurance"
              date="2 days ago"
              reflection={{
                tags: ["Needed rest"],
                notes: "Felt too tired after bad sleep.",
              }}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Missed Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Missed</Text>
          <View style={styles.card}>
            <MissedCard
              title="Leg Day"
              purpose="Build lower body power"
              date="3 days ago"
              reflection={{
                notes: "Got stuck in traffic.",
              }}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Rest Day Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rest Day</Text>
          <View style={styles.card}>
            <RestCard
              date="Sunday"
              purpose="Recovery is part of the plan"
            />
          </View>
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
  content: {
    paddingTop: theme.spacing.xxl + theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
  },
  header: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: theme.colors.textTitle,
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.textMuted,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.screenPadding,
    includeFontPadding: false,
  },
  card: {
    marginHorizontal: theme.spacing.screenPadding,
  },
});
