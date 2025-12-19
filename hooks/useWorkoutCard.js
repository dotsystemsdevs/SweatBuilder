/**
 * Custom hook for workout card logic
 * Handles workout status, phase info, and card rendering logic
 */

import { useMemo } from "react";
import { isSameDay } from "../utils/dateHelpers";
import { getPhaseFromWeek, getWeekNumber } from "../utils/phaseHelpers";
import { WORKOUT_STATUS } from "../constants/appConstants";

/**
 * Hook for workout card data and logic
 * @param {Object} workout - Workout data
 * @param {Date} date - Date for the workout
 * @param {Array} workoutHistory - Array of workout history entries
 */
export const useWorkoutCard = (workout, date, workoutHistory = []) => {
  // Get workout status for the date
  const status = useMemo(() => {
    if (!date) return WORKOUT_STATUS.PENDING;
    
    const historyEntry = workoutHistory.find((entry) => {
      const entryDate = new Date(entry.date);
      return isSameDay(entryDate, date);
    });

    return historyEntry?.status || WORKOUT_STATUS.PENDING;
  }, [date, workoutHistory]);

  // Get phase info
  const phaseInfo = useMemo(() => {
    if (!date) return { phase: "Workout", weekNum: null };
    
    const weekNum = getWeekNumber(date);
    return {
      weekNum,
      phase: getPhaseFromWeek(weekNum) || "Workout",
    };
  }, [date]);

  // Determine if workout is completed
  const isCompleted = status === WORKOUT_STATUS.COMPLETED;
  
  // Determine if workout is skipped
  const isSkipped = status === WORKOUT_STATUS.SKIPPED;
  
  // Determine if it's a rest day
  const isRest = workout?.type === "rest" || status === WORKOUT_STATUS.REST;

  return {
    status,
    phaseInfo,
    isCompleted,
    isSkipped,
    isRest,
  };
};























