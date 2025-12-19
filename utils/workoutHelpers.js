/**
 * Workout-related utility functions
 */

import { WORKOUT_STATUS } from "../constants/appConstants";
import { isSameDay } from "./dateHelpers";

/**
 * Get workout status for a specific date
 */
export const getWorkoutStatusForDate = (date, workoutHistory = []) => {
  if (!date || !workoutHistory.length) {
    return WORKOUT_STATUS.PENDING;
  }

  const historyEntry = workoutHistory.find((entry) => {
    const entryDate = new Date(entry.date);
    return isSameDay(entryDate, date);
  });

  return historyEntry?.status || WORKOUT_STATUS.PENDING;
};

/**
 * Get workout entry for a specific date
 */
export const getWorkoutEntryForDate = (date, workoutHistory = []) => {
  if (!date || !workoutHistory.length) {
    return null;
  }

  return workoutHistory.find((entry) => {
    const entryDate = new Date(entry.date);
    return isSameDay(entryDate, date);
  });
};

/**
 * Check if a workout is completed
 */
export const isWorkoutCompleted = (status) => {
  return status === WORKOUT_STATUS.COMPLETED;
};

/**
 * Check if a workout is skipped
 */
export const isWorkoutSkipped = (status) => {
  return status === WORKOUT_STATUS.SKIPPED;
};

/**
 * Check if it's a rest day
 */
export const isRestDay = (workout) => {
  return workout?.type === "rest" || workout?.status === WORKOUT_STATUS.REST;
};

/**
 * Format workout duration
 */
export const formatWorkoutDuration = (duration) => {
  if (!duration) return "";
  if (typeof duration === "string") return duration;
  if (typeof duration === "number") return `${duration} min`;
  return "";
};

/**
 * Get set count for an exercise based on info string
 * Range reps (e.g. "3x8-12") = 1 circle total (one for the whole exercise)
 * Fixed reps (e.g. "3x10") = multiple circles (one per set, max 4)
 * Time-based (e.g. "5 min") = 1 circle total
 */
export const getSetsCount = (info) => {
  if (!info) return 1;
  
  // Check if it's time-based (contains "min" or "sec" or just a number without "x")
  const infoLower = info.toLowerCase();
  if (infoLower.includes("min") || infoLower.includes("sec") || !info.includes("x")) {
    return 1;
  }
  
  const [setsStr, repsStr] = info.split("x");
  const sets = parseInt(setsStr, 10) || 1;
  
  // If reps contains a range (dash), use 1 circle total
  if (repsStr && repsStr.includes("-")) {
    return 1;
  }
  
  // Max 4 circles per row
  return Math.min(sets, 4);
};











