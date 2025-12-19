import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Section = ({ title, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, []);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.colors.textMuted}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.sectionContent}>{children}</View>
      )}
    </View>
  );
};

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case "active":
    case "completed":
      return theme.colors.green;
    case "pending":
      return theme.colors.yellow;
    case "skipped":
    case "missed":
      return theme.colors.textMuted;
    case "rest":
      return theme.colors.blue;
    default:
      return theme.colors.yellow;
  }
};

// Get RPE color based on value
const getRpeColor = (value) => {
  if (!value) return theme.colors.textSecondary;
  if (value <= 3) return theme.colors.green;
  if (value <= 5) return theme.colors.yellow;
  if (value <= 7) return theme.colors.orange;
  return theme.colors.red;
};

// Get soft background color for icon
const getIconBgColor = (color) => {
  if (color === theme.colors.green) return theme.colors.greenSoft;
  if (color === theme.colors.yellow) return theme.colors.yellowSoft;
  if (color === theme.colors.red) return theme.colors.redSoft;
  if (color === theme.colors.blue) return theme.colors.blueSoft;
  if (color === theme.colors.orange) return theme.colors.orangeSoft;
  return theme.colors.surfaceHover;
};

// Status Badge Component - small circle with icon in corner (only for completed, skipped, missed)
const StatusBadge = ({ type }) => {
  const configs = {
    completed: { icon: "checkmark", bg: theme.colors.green, iconColor: theme.colors.surface },
    skipped: { icon: "close", bg: theme.colors.textMuted, iconColor: theme.colors.surface },
    missed: { icon: "alert", bg: theme.colors.textMuted, iconColor: theme.colors.surface },
  };

  const config = configs[type];
  if (!config) return null;

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={8} color={config.iconColor} />
    </View>
  );
};

// Get badge type for status (only for completed, skipped, missed)
const getBadgeType = (status) => {
  if (status === "completed") return "completed";
  if (status === "skipped") return "skipped";
  if (status === "missed") return "missed";
  return null;
};

const WorkoutCard = ({
  status = "pending",
  title,
  purpose,
  subtitle,
  date = "Today",
  reflection,
  icon = "barbell-outline",
}) => {
  const isActive = status === "active";
  const isCompleted = status === "completed";
  const isSkipped = status === "skipped";
  const isMissed = status === "missed";
  const isRest = status === "rest";

  const iconColor = getStatusColor(status);
  const iconBgColor = getIconBgColor(iconColor);
  const badgeType = getBadgeType(status);

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
          {badgeType && <StatusBadge type={badgeType} />}
        </View>
        <View style={styles.headerText}>
          <Text style={[
            styles.cardTitle,
            (isSkipped || isMissed) && styles.cardTitleMuted
          ]}>{title}</Text>
          {purpose && (
            <Text style={[
              styles.purposeText,
              (isSkipped || isMissed) && styles.purposeTextMuted
            ]}>{purpose}</Text>
          )}
        </View>
        <Text style={styles.cardDateRight}>{date}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Content based on status */}
      <View style={styles.pillsContainer}>
        {/* RPE pill - show for completed or as target for pending/active */}
        {isCompleted && reflection?.effort ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>RPE </Text>
            <Text style={[styles.pillText, { color: getRpeColor(reflection.effort) }]}>{reflection.effort}</Text>
          </View>
        ) : !isRest && !isCompleted && !isSkipped && !isMissed && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Target RPE </Text>
            <Text style={[styles.pillText, { color: getRpeColor(7) }]}>7</Text>
          </View>
        )}

        {/* Tag pills */}
        {reflection?.tags?.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.pill}>
            <Text style={styles.pillText}>{tag}</Text>
          </View>
        ))}

        {/* Subtitle as pill for pending/active */}
        {!isCompleted && !isSkipped && !isMissed && !isRest && subtitle && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{subtitle}</Text>
          </View>
        )}

        {/* Rest day message */}
        {isRest && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Recovery time</Text>
          </View>
        )}

        {/* Missed message */}
        {isMissed && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>No reflection recorded</Text>
          </View>
        )}
      </View>

      {/* Notes - separate row below tags */}
      {reflection?.notes && (
        <View style={styles.notesRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText} numberOfLines={1}>{reflection.notes}</Text>
          </View>
        </View>
      )}

      {/* View details - centered at bottom */}
      <TouchableOpacity style={styles.detailsLink} activeOpacity={0.7}>
        <Text style={styles.detailsLinkText}>View details</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function WorkoutCardsScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();

  return (
    <DynamicSafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Cards</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TODAY */}
        <Section title="Today">
          <WorkoutCard
            status="pending"
            title="Push Day"
            purpose="Build chest and shoulder strength"
            subtitle="Chest, Shoulders · 18 sets"
            date="Today"
            icon="barbell-outline"
          />
        </Section>

        {/* UPCOMING */}
        <Section title="Upcoming">
          <WorkoutCard
            status="pending"
            title="Pull Day"
            purpose="Strengthen back and biceps"
            subtitle="Back, Biceps · 16 sets"
            date="Tomorrow"
            icon="barbell-outline"
          />
        </Section>

        {/* COMPLETED */}
        <Section title="Completed">
          <WorkoutCard
            status="completed"
            title="Push Day"
            purpose="Build chest and shoulder strength"
            date="Yesterday"
            icon="barbell-outline"
            reflection={{
              effort: 7,
              tags: ["Felt strong", "Good form"],
              notes: "Great session, hit a new PR on bench press!",
            }}
          />
        </Section>

        {/* SKIPPED */}
        <Section title="Skipped">
          <WorkoutCard
            status="skipped"
            title="Leg Day"
            purpose="Build lower body power"
            date="2 days ago"
            icon="fitness-outline"
            reflection={{ tags: ["Tired", "Low energy"], notes: "Need to rest up" }}
          />
        </Section>

        {/* MISSED */}
        <Section title="Missed">
          <WorkoutCard
            status="missed"
            title="Cardio"
            purpose="Improve cardiovascular endurance"
            date="3 days ago"
            icon="walk-outline"
          />
        </Section>

        {/* REST */}
        <Section title="Rest">
          <WorkoutCard
            status="rest"
            title="Rest Day"
            purpose="Recovery is part of the plan"
            date="Sunday"
            icon="moon-outline"
          />
        </Section>
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
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingHorizontal: theme.spacing.screenPadding,
    gap: theme.spacing.sm,
  },

  // Card base
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardActive: {
    borderColor: theme.colors.yellow,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardTitleMuted: {
    color: theme.colors.textMuted,
  },
  purposeText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  purposeTextMuted: {
    color: theme.colors.textMuted,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  cardDateRight: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },

  // Pills container
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  pill: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },

  // Notes row - separate from tags
  notesRow: {
    marginTop: theme.spacing.xs,
  },

  // Details link - centered
  detailsLink: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  detailsLinkText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});
