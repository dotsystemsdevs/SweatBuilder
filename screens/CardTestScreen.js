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

// Import card components
import {
  TodayCard,
  CompletedCard,
  SkippedCard,
  MissedCard,
  RestCard,
} from "../components/Cards/index";

// Mock workout data - base with sections
// Mock reflection data
const mockReflection = {
  effort: 7,
  tags: ["good_focus", "sore", "low_sleep"],
  notes: "@BenchPress Felt heavy on last set, need to work on form",
  timestamp: new Date().toISOString(),
};

const baseWorkout = {
  id: "test-1",
  title: "Tempo Ride",
  subtitle: "Focus on chest and shoulders",
  type: "Strength",
  duration: "45 min",
  distance: "25 km",
  tempo: "Zone 3",
  scheduledDate: new Date(),
  aim: "Build VO2 max and threshold power",
  sections: [
    {
      title: "Warm-up",
      exercises: [
        { id: 1, name: "Light spin", sets: 1, reps: "5 min" },
        { id: 2, name: "Dynamic stretches", sets: 1, reps: "5 min" },
      ],
    },
    {
      title: "Main Set",
      exercises: [
        { id: 3, name: "Tempo intervals", sets: 4, reps: "5 min" },
        { id: 4, name: "Recovery spin", sets: 4, reps: "2 min" },
        { id: 5, name: "Hard effort", sets: 2, reps: "8 min" },
      ],
    },
    {
      title: "Cool Down",
      exercises: [
        { id: 6, name: "Easy spin", sets: 1, reps: "5 min" },
        { id: 7, name: "Stretching", sets: 1, reps: "5 min" },
      ],
    },
  ],
  // Keep exercises flat array for backward compatibility
  exercises: [
    { id: 1, name: "Light spin", sets: 1, reps: "5 min" },
    { id: 2, name: "Dynamic stretches", sets: 1, reps: "5 min" },
    { id: 3, name: "Tempo intervals", sets: 4, reps: "5 min" },
    { id: 4, name: "Recovery spin", sets: 4, reps: "2 min" },
    { id: 5, name: "Hard effort", sets: 2, reps: "8 min" },
    { id: 6, name: "Easy spin", sets: 1, reps: "5 min" },
    { id: 7, name: "Stretching", sets: 1, reps: "5 min" },
  ],
  mood: "good",
  notes: "Felt strong today. Increased weight on bench press by 2.5kg.",
};

// Variant: Minimal (no subtitle, few exercises)
const minimalWorkout = {
  ...baseWorkout,
  id: "minimal",
  title: "Quick HIIT",
  subtitle: null,
  exercises: [
    { name: "Burpees", sets: 3, reps: "10" },
    { name: "Mountain Climbers", sets: 3, reps: "30s" },
  ],
  mood: null,
  notes: null,
};

// Variant: Full (long notes, many exercises)
const fullWorkout = {
  ...baseWorkout,
  id: "full",
  title: "Full Body Power",
  subtitle: "Week 8 - Peak strength phase",
  exercises: [
    { name: "Deadlift", sets: 5, reps: "5", weight: "140kg" },
    { name: "Squat", sets: 4, reps: "6", weight: "120kg" },
    { name: "Bench Press", sets: 4, reps: "6", weight: "90kg" },
    { name: "Barbell Row", sets: 4, reps: "8", weight: "80kg" },
    { name: "Overhead Press", sets: 3, reps: "8", weight: "50kg" },
    { name: "Pull-ups", sets: 3, reps: "10", weight: "BW" },
    { name: "Dips", sets: 3, reps: "12", weight: "BW" },
  ],
  mood: "great",
  notes: "Absolutely crushed it today! New PR on deadlift. Recovery was on point this week - 8 hours sleep every night. Need to remember to foam roll quads after heavy squat sessions.",
};

// Skipped variants
const skippedWorkout = {
  ...baseWorkout,
  id: "skipped-1",
  skipReason: "Too tired",
  notes: "Decided to skip today due to fatigue.",
};

const skippedWorkoutLongReason = {
  ...baseWorkout,
  id: "skipped-2",
  title: "Morning Run",
  subtitle: "Easy 5km recovery",
  skipReason: "Injury - knee pain",
};

const skippedWorkoutMinimal = {
  ...minimalWorkout,
  id: "skipped-3",
  skipReason: "Sick",
};

// Missed variant
const missedWorkout = {
  ...baseWorkout,
  id: "missed-1",
  title: "Evening Run",
};

export default function CardTestScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };


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
        >
          <Feather name="chevron-left" size={24} color={theme.colors.textTitle} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cards</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending Card */}
        <Text style={styles.cardLabel}>Pending (Today)</Text>
        <View style={styles.cardPreview}>
          <TodayCard
            status="pending"
            title={baseWorkout.title}
            subtitle={baseWorkout.subtitle}
            date="Today"
            icon="bicycle-outline"
            onStart={handleStart}
          />
        </View>

        {/* Active Card */}
        <Text style={styles.cardLabel}>Active (In Progress)</Text>
        <View style={styles.cardPreview}>
          <TodayCard
            status="active"
            title={baseWorkout.title}
            subtitle="6/18 sets done"
            date="Today"
            icon="bicycle-outline"
            onContinue={handleStart}
          />
        </View>

        {/* Upcoming Card */}
        <Text style={styles.cardLabel}>Upcoming</Text>
        <View style={styles.cardPreview}>
          <TodayCard
            status="pending"
            title="Pull Day"
            subtitle="Back, Biceps · 16 sets"
            date="Tomorrow"
            icon="barbell-outline"
            showActions={false}
          />
        </View>

        {/* Completed Card */}
        <Text style={styles.cardLabel}>Completed</Text>
        <View style={styles.cardPreview}>
          <CompletedCard
            title={baseWorkout.title}
            date="Yesterday"
            icon="bicycle-outline"
            reflection={mockReflection}
          />
        </View>

        {/* Skipped Card */}
        <Text style={styles.cardLabel}>Skipped</Text>
        <View style={styles.cardPreview}>
          <SkippedCard
            title={skippedWorkout.title}
            date="2 days ago"
            icon="barbell-outline"
            reflection={{ tags: ["Tired", "Low energy"], notes: "Need to rest up" }}
          />
        </View>

        {/* Missed Card */}
        <Text style={styles.cardLabel}>Missed</Text>
        <View style={styles.cardPreview}>
          <MissedCard
            title={missedWorkout.title}
            date="3 days ago"
            icon="walk-outline"
          />
        </View>

        {/* Rest Card */}
        <Text style={styles.cardLabel}>Rest Day</Text>
        <View style={styles.cardPreview}>
          <RestCard date="Sunday" />
        </View>
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
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.textTitle,
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl * 2,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  cardPreview: {
    marginBottom: theme.spacing.lg,
  },
});
