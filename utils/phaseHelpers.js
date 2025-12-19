/**
 * Training phase calculation utilities
 */

import { PLAN_START } from "../constants/trainingPlan";

/**
 * Calculate week number from PLAN_START date
 * @returns Week number (1-16) or null if outside plan range
 */
export const getWeekNumber = (date) => {
  const start = new Date(PLAN_START);
  start.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const diffTime = checkDate - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7) + 1;

  if (weekNum < 1 || weekNum > 16) return null;
  return weekNum;
};

/**
 * Get phase name from week number
 */
export const getPhaseFromWeek = (weekNum) => {
  if (!weekNum) return null;
  if (weekNum <= 4) return "Build Phase";
  if (weekNum <= 8) return "Base Phase";
  if (weekNum <= 12) return "Peak Phase";
  return "Taper Phase";
};

/**
 * Phase configuration for progress bar
 */
export const PHASE_CONFIG = {
  phases: ["Build Phase", "Base Phase", "Peak Phase", "Taper Phase"],
  boundaries: [0, 25, 50, 75, 100],
  totalWeeks: 16,
};

/**
 * Get phase info for a given date
 */
export const getPhaseInfo = (date) => {
  if (!(date instanceof Date)) {
    return {
      weekNum: null,
      phase: "Build Phase",
      progress: 0,
      phaseBoundaries: PHASE_CONFIG.boundaries,
      phases: PHASE_CONFIG.phases,
    };
  }

  const weekNum = getWeekNumber(date);
  const phase = getPhaseFromWeek(weekNum);
  const progress = weekNum ? Math.min((weekNum / PHASE_CONFIG.totalWeeks) * 100, 100) : 0;

  return {
    weekNum,
    phase: phase || "Build Phase",
    progress,
    phaseBoundaries: PHASE_CONFIG.boundaries,
    phases: PHASE_CONFIG.phases,
  };
};
