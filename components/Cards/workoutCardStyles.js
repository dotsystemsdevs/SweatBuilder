import { StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
import theme from "../../theme";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Shared styles for all workout cards
 * Clean, minimal design with consistent structure:
 * [Icon Container] [Content: Title + Subtitle] [Action/Badge]
 */

// Constants
export const NOTES_EXPANSION_THRESHOLD = 150;
export const ANIMATION_DURATION = 250;
export const SKIP_REASON_MAX_LENGTH = 15;

// Status colors
export const STATUS_COLORS = {
  completed: { color: "#FFFFFF", bgColor: "rgba(255, 255, 255, 0.15)" },
  skipped: { color: "#9CA3AF", bgColor: "rgba(255, 255, 255, 0.1)" },
  upcoming: { color: "rgba(255, 255, 255, 0.9)", bgColor: "rgba(255, 255, 255, 0.1)" },
  restDay: { color: "#D1D5DB", bgColor: "rgba(255, 255, 255, 0.1)" },
  missed: { color: "#9CA3AF", bgColor: "rgba(255, 255, 255, 0.08)" },
};

// Layout animation config
export const configureLayoutAnimation = () => {
  LayoutAnimation.configureNext({
    duration: ANIMATION_DURATION,
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
  });
};

// Mood config helper
export const getMoodConfig = (mood) => {
  const moodMap = {
    great: { emoji: "😊", color: "#FFFFFF", bgColor: "rgba(255, 255, 255, 0.15)" },
    good: { emoji: "🙂", color: "#E5E7EB", bgColor: "rgba(255, 255, 255, 0.12)" },
    ok: { emoji: "😐", color: "#9CA3AF", bgColor: "rgba(255, 255, 255, 0.1)" },
    tough: { emoji: "😓", color: "#6B7280", bgColor: "rgba(255, 255, 255, 0.08)" },
    hard: { emoji: "😤", color: "#4B5563", bgColor: "rgba(255, 255, 255, 0.08)" },
  };
  return moodMap[mood?.toLowerCase()] || { emoji: "😊", color: "#FFFFFF", bgColor: "rgba(255, 255, 255, 0.15)" };
};

// Helper: Format date relative to today
export const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Alias for backwards compatibility
export const formatScheduledDate = formatDate;

// Helper: Get workout icon based on title
export const getWorkoutIcon = (title) => {
  const t = (title || "").toLowerCase();

  if (t.includes("run") || t.includes("jogg") || t.includes("cardio") ||
      t.includes("bike") || t.includes("cycl") || t.includes("walk") ||
      t.includes("hiit")) {
    return { icon: "activity", library: "feather" };
  }
  if (t.includes("swim")) {
    return { icon: "droplet", library: "feather" };
  }
  if (t.includes("yoga") || t.includes("stretch") || t.includes("mobility")) {
    return { icon: "wind", library: "feather" };
  }
  return { icon: "dumbbell", library: "material" };
};

// Shared styles
export const styles = StyleSheet.create({
  // Base card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Card variants
  cardMuted: {
    opacity: 0.5,
  },
  cardCompleted: {
    borderColor: theme.colors.green + "40",
  },
  cardActive: {
    borderColor: theme.colors.yellow,
    borderWidth: 2,
  },
  cardPending: {
    borderColor: theme.colors.yellow + "50",
  },
  cardMissed: {
    borderColor: theme.colors.orange + "40",
  },
  cardRest: {
    borderColor: theme.colors.blue + "30",
  },

  // Icon container (44x44 box)
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGreen: {
    backgroundColor: theme.colors.green + "15",
  },
  iconYellow: {
    backgroundColor: theme.colors.yellow + "15",
  },
  iconOrange: {
    backgroundColor: theme.colors.orange + "15",
  },
  iconBlue: {
    backgroundColor: theme.colors.blue + "15",
  },
  iconMuted: {
    backgroundColor: theme.colors.surfaceHover,
  },

  // Content area
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  titleMuted: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.textMuted,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  subtitleGreen: {
    fontSize: 14,
    color: theme.colors.green,
    marginTop: 2,
    fontWeight: "500",
  },
  subtitleYellow: {
    fontSize: 14,
    color: theme.colors.yellow,
    marginTop: 2,
    fontWeight: "500",
  },
  subtitleOrange: {
    fontSize: 14,
    color: theme.colors.orange,
    marginTop: 2,
    fontWeight: "500",
  },

  // Badges
  effortBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    marginRight: 8,
  },
  effortValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  effortLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceHover,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },

  // Primary button (yellow)
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.yellow,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.black,
  },

  // Secondary button (outlined)
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },

  // Circle play button
  btnPlay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty state
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },

  // Legacy styles for SharedCardComponents
  cardMoodSection: {
    gap: 8,
  },
  cardMoodTitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 15,
    color: "#F9FBFF",
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  moodEmoji: {
    fontSize: 18,
  },
  cardNotes: {
    paddingTop: 8,
  },
  cardNotesText: {
    fontSize: 15,
    color: "#D6DCE9",
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  cardNotesToggle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  cardNotesToggleButton: {
    marginTop: 4,
  },
  exercisesContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    overflow: "hidden",
    marginHorizontal: 20,
  },
  exercisesToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  exercisesToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exercisesToggleText: {
    fontSize: 15,
    color: "#F4F6FB",
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  exercisesToggleRest: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    minHeight: 56,
  },
  exercisesToggleTextRest: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  exercisesList: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  exerciseItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    gap: 4,
  },
  exerciseItemFirst: {
    borderTopWidth: 0,
  },
  exerciseName: {
    color: "#FDFEFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  exerciseDetails: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: -0.08,
  },
});
