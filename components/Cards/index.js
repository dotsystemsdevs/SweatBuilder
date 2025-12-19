// New Workout Card Components (consistent design system)
export {
  TodayCard,
  CompletedCard,
  SkippedCard,
  MissedCard,
  RestCard,
  getStatusColor,
  getEffortColor,
} from "../WorkoutCards";

// Re-export MissedCard with alias for flexibility
export { MissedCard as MissedWorkoutCard } from "../WorkoutCards";

// Legacy exports - mapped to new components for backwards compatibility
export { TodayCard as UpcomingWorkoutCard } from "../WorkoutCards";
export { CompletedCard as CompletedWorkoutCard } from "../WorkoutCards";
export { SkippedCard as SkippedWorkoutCard } from "../WorkoutCards";
export { RestCard as RestDayCard } from "../WorkoutCards";

// Shared Components (for custom card compositions)
export {
  MoodDisplay,
  ExerciseList,
  ExerciseToggle,
  ExpandableNotes,
} from "./SharedCardComponents";

// Styles and utilities (for custom styling/theming)
export {
  styles as workoutCardStyles,
  STATUS_COLORS,
  getMoodConfig,
  formatScheduledDate,
  configureLayoutAnimation,
  NOTES_EXPANSION_THRESHOLD,
  SKIP_REASON_MAX_LENGTH,
  ANIMATION_DURATION,
} from "./workoutCardStyles";
