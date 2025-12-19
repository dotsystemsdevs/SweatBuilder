import React, { memo } from "react";
import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import theme from "../../theme";
import { styles } from "./workoutCardStyles";

const EmptyWorkoutState = memo(({ style }) => {
  return (
    <View style={[styles.emptyCard, style]}>
      <Feather name="calendar" size={22} color={theme.colors.textMuted} />
      <Text style={styles.emptyText}>No workout scheduled</Text>
    </View>
  );
});

EmptyWorkoutState.displayName = "EmptyWorkoutState";

export default EmptyWorkoutState;
