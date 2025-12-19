import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../theme";

// Get status color
export const getStatusColor = (status) => {
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

// Get soft background color for icon
const getIconBgColor = (status) => {
  switch (status) {
    case "active":
    case "completed":
      return theme.colors.greenSoft;
    case "pending":
      return theme.colors.yellowSoft;
    case "skipped":
    case "missed":
      return theme.colors.surfaceHover;
    case "rest":
      return theme.colors.blueSoft;
    default:
      return theme.colors.yellowSoft;
  }
};

// Get effort color - delegates to centralized theme function
export const getEffortColor = theme.getEffortColorFromValue;

// Get RPE color based on value (for display)
const getRpeColor = (value) => {
  if (!value) return theme.colors.textSecondary;
  if (value <= 3) return theme.colors.green;
  if (value <= 5) return theme.colors.yellow;
  if (value <= 7) return theme.colors.orange;
  return theme.colors.red;
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

// Card component for Today/Upcoming workouts
export const TodayCard = ({
  status,
  title,
  subtitle,
  purpose,
  targetEffort,
  date = "Today",
  onPress,
  icon = "barbell-outline",
  onDetailsPress,
  isActive = false,
  onSkip,
  onSwap,
}) => {
  const iconColor = getStatusColor(status);
  const iconBgColor = getIconBgColor(status);
  const handlePress = onPress || onDetailsPress;

  return (
    <View style={[styles.card, isActive && styles.cardHighlighted]}>
      {/* Header with action icons */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <TouchableOpacity
          style={styles.headerText}
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={!handlePress}
        >
          <Text style={styles.cardTitle}>{title}</Text>
          {purpose && <Text style={styles.purposeTextSmall}>{purpose}</Text>}
        </TouchableOpacity>
        {/* Action icons in header */}
        {(onSwap || onSkip) && (
          <View style={styles.headerActions}>
            {onSwap && (
              <TouchableOpacity style={styles.headerIconBtn} onPress={onSwap} activeOpacity={0.7}>
                <Ionicons name="swap-horizontal" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
            {onSkip && (
              <TouchableOpacity style={styles.headerIconBtn} onPress={onSkip} activeOpacity={0.7}>
                <Ionicons name="close" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Content as pills */}
      <View style={styles.pillsContainer}>
        {targetEffort && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Target RPE </Text>
            <Text style={[styles.pillText, { color: getRpeColor(targetEffort) }]}>{targetEffort}</Text>
          </View>
        )}
        {subtitle && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{subtitle}</Text>
          </View>
        )}
      </View>

      {/* Divider before View details */}
      <View style={styles.cardDivider} />

      {/* View details link */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} disabled={!handlePress}>
        <Text style={styles.detailsLinkCentered}>View details</Text>
      </TouchableOpacity>
    </View>
  );
};

// Card component for Completed - reflection focused
export const CompletedCard = ({
  title,
  purpose,
  date,
  reflection,
  icon = "barbell-outline",
  onPress,
  onDetailsPress,
  isActive = false,
}) => {
  const handlePress = onPress || onDetailsPress;
  const CardWrapper = handlePress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.card, isActive && styles.cardHighlighted]}
      {...(handlePress && { onPress: handlePress, activeOpacity: 0.7 })}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.greenSoft }]}>
          <Ionicons name={icon} size={18} color={theme.colors.green} />
          <StatusBadge type="completed" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>{title}</Text>
          {purpose && <Text style={styles.purposeTextSmall}>{purpose}</Text>}
        </View>
        <Text style={styles.cardDateRight}>{date}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Reflection content - pills */}
      {reflection && (
        <>
          <View style={styles.pillsContainer}>
            {/* RPE pill */}
            {reflection.effort && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>RPE </Text>
                <Text style={[styles.pillText, { color: getRpeColor(reflection.effort) }]}>{reflection.effort}</Text>
              </View>
            )}
            {/* Tag pills */}
            {reflection.tags?.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.pill}>
                <Text style={styles.pillText}>{tag}</Text>
              </View>
            ))}
          </View>
          {/* Notes - separate row */}
          {reflection.notes && (
            <View style={styles.notesRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1}>{reflection.notes}</Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* Details link - centered */}
      <View style={styles.detailsLink}>
        <Text style={styles.detailsLinkText}>View details</Text>
      </View>
    </CardWrapper>
  );
};

// Card component for Skipped - with reflection tags as reason
export const SkippedCard = ({
  title,
  purpose,
  date,
  reflection,
  icon = "barbell-outline",
  onPress,
  onDetailsPress,
  isActive = false,
}) => {
  const handlePress = onPress || onDetailsPress;
  const CardWrapper = handlePress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.card, isActive && styles.cardHighlighted]}
      {...(handlePress && { onPress: handlePress, activeOpacity: 0.7 })}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceHover }]}>
          <Ionicons name={icon} size={18} color={theme.colors.textMuted} />
          <StatusBadge type="skipped" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.cardTitle, styles.cardTitleMuted]}>{title}</Text>
          {purpose && <Text style={styles.purposeTextMuted}>{purpose}</Text>}
        </View>
        <Text style={styles.cardDateRight}>{date}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Reflection as pills */}
      {reflection && (
        <>
          <View style={styles.pillsContainer}>
            {/* Tag pills */}
            {reflection.tags?.map((tag) => (
              <View key={tag} style={styles.pill}>
                <Text style={styles.pillText}>{tag}</Text>
              </View>
            ))}
          </View>
          {/* Notes - separate row */}
          {reflection.notes && (
            <View style={styles.notesRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1}>{reflection.notes}</Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* Details link - centered */}
      <View style={styles.detailsLink}>
        <Text style={styles.detailsLinkText}>View details</Text>
      </View>
    </CardWrapper>
  );
};

// Card component for Missed - simple, no reflection
export const MissedCard = ({ title, purpose, date, icon = "barbell-outline", onDetailsPress, isActive = false }) => {
  return (
    <View style={[styles.card, isActive && styles.cardHighlighted]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceHover }]}>
          <Ionicons name={icon} size={18} color={theme.colors.textMuted} />
          <StatusBadge type="missed" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.cardTitle, styles.cardTitleMuted]}>{title}</Text>
          {purpose && <Text style={styles.purposeTextMuted}>{purpose}</Text>}
        </View>
        <Text style={styles.cardDateRight}>{date}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Content as pill */}
      <View style={styles.pillsContainer}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>No reflection recorded</Text>
        </View>
      </View>

      {/* Details link - centered */}
      <View style={styles.detailsLink}>
        <Text style={styles.detailsLinkText}>View details</Text>
      </View>
    </View>
  );
};

// Card component for Rest - no details link
export const RestCard = ({ date = "Today", purpose, icon = "bed-outline" }) => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.blueSoft }]}>
          <Ionicons name={icon} size={18} color={theme.colors.blue} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>Rest Day</Text>
          {purpose && <Text style={styles.purposeTextSmall}>{purpose}</Text>}
        </View>
        <Text style={styles.cardDateRight}>{date}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Content as pill */}
      <View style={styles.pillsContainer}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Recovery time</Text>
        </View>
      </View>

      {/* Details link - centered */}
      <View style={styles.detailsLink}>
        <Text style={styles.detailsLinkText}>View details</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Card base
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardActive: {
    borderColor: theme.colors.border,
  },
  cardHighlighted: {
    borderWidth: 2,
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
  purposeTextSmall: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  purposeTextMuted: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
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
  pillWide: {
    flexBasis: "100%",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },

  // Legacy - kept for compatibility
  effortLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Missed
  missedLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },

  // Rest
  restPlanText: {
    fontSize: 12,
    color: theme.colors.blue,
    marginTop: 2,
  },
  restContent: {
    flex: 1,
  },

  // Card content
  cardContent: {
    gap: theme.spacing.xs,
  },

  // Purpose text
  purposeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  purposeMuted: {
    color: theme.colors.textMuted,
  },

  // Effort row
  effortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },

  // Completed badge
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  completedText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.green,
  },

  // Skipped badge
  skippedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  skippedText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.red,
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

  // Header action icons (Swap/Skip)
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  detailsLinkCentered: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
});

