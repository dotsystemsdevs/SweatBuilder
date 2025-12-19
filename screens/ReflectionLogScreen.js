import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useWorkoutStore } from "../store/workoutStore";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

// Use centralized effort color function from theme
const getEffortColor = theme.getEffortColorFromValue;

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// Single reflection entry
const ReflectionEntry = ({ entry }) => {
  const { workout, reflectionData, date, status } = entry;
  const effort = reflectionData?.effort;
  const tags = reflectionData?.tags || [];
  const notes = reflectionData?.notes;

  return (
    <View style={styles.entry}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryDate}>{formatDate(date)}</Text>
        {effort && (
          <View style={[styles.effortBadge, { backgroundColor: getEffortColor(effort) }]}>
            <Text style={styles.effortBadgeText}>{effort}</Text>
          </View>
        )}
      </View>

      <Text style={styles.workoutTitle}>{workout?.title || "Workout"}</Text>

      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {notes && (
        <Text style={styles.notes}>{notes}</Text>
      )}

      {status === "skipped" && (
        <View style={styles.skippedBadge}>
          <Text style={styles.skippedText}>Missed</Text>
        </View>
      )}
    </View>
  );
};

export default function ReflectionLogScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const { workoutHistory } = useWorkoutStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter entries that have reflection data
  const allReflections = useMemo(() => {
    return workoutHistory.filter(
      (entry) => entry.reflectionData && Object.keys(entry.reflectionData).length > 0
    );
  }, [workoutHistory]);

  // Filter by search query
  const reflections = useMemo(() => {
    if (!searchQuery.trim()) return allReflections;

    const query = searchQuery.toLowerCase();
    return allReflections.filter((entry) => {
      // Search in workout title
      if (entry.workout?.title?.toLowerCase().includes(query)) return true;
      // Search in notes
      if (entry.reflectionData?.notes?.toLowerCase().includes(query)) return true;
      // Search in tags
      if (entry.reflectionData?.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
      return false;
    });
  }, [allReflections, searchQuery]);

  const handleClearSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery("");
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent animated />
      <DynamicSafeAreaView
        style={styles.screen}
        backgroundColor={theme.colors.background}
        edges={["top", "bottom"]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reflection Log</Text>
          </View>
        </View>

        {/* Search */}
        {allReflections.length > 0 && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchBox, isSearchFocused && styles.searchBoxFocused]}>
              <Feather name="search" size={16} color={theme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search notes, tags..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
                  <Feather name="x" size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery && (
              <Text style={styles.searchCount}>
                {reflections.length} of {allReflections.length}
              </Text>
            )}
          </View>
        )}

        {reflections.length === 0 && !searchQuery ? (
          <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No reflections yet</Text>
            <Text style={styles.emptyText}>
              Complete a workout and add a reflection to see it here
            </Text>
          </View>
        ) : reflections.length === 0 && searchQuery ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No results</Text>
            <Text style={styles.emptyText}>
              Try a different search term
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {reflections.map((entry) => (
              <ReflectionEntry key={entry.id} entry={entry} />
            ))}
          </ScrollView>
        )}
      </DynamicSafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  searchContainer: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchBoxFocused: {
    borderColor: theme.colors.textMuted,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  searchCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  content: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  entry: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryDate: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  effortBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  effortBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.black,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  tag: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.radius.full,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.colors.textMuted,
  },
  notes: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  skippedBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.red + "20",
    borderRadius: theme.radius.full,
  },
  skippedText: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.colors.red,
  },
});
