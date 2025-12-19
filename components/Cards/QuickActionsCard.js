import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import theme from "../../theme";

const QuickActionsCard = memo(({
  onStartWorkout,
  onViewProgress,
  onAskCoach,
  onLogFood,
  style,
}) => {
  const actions = [
    { icon: "play", color: theme.colors.accentYellow, onPress: onStartWorkout },
    { icon: "trending-up", color: theme.colors.accentGreen, onPress: onViewProgress },
    { icon: "cpu", color: theme.colors.purple, onPress: onAskCoach },
    { icon: "edit-3", color: theme.colors.accentBlue, onPress: onLogFood },
  ];

  const handlePress = (fn) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn?.();
  };

  return (
    <View style={[styles.card, style]}>
      {actions.map((a, i) => (
        <TouchableOpacity
          key={i}
          style={styles.button}
          onPress={() => handlePress(a.onPress)}
          activeOpacity={0.6}
        >
          <Feather name={a.icon} size={22} color={a.color} />
        </TouchableOpacity>
      ))}
    </View>
  );
});

QuickActionsCard.displayName = "QuickActionsCard";

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default QuickActionsCard;









