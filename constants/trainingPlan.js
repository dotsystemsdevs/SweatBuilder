/**
 * Training plan configuration and utilities
 */

// Plan start date - adjust as needed
export const PLAN_START = new Date("2025-12-01");

// Plan duration
export const PLAN_DURATION_WEEKS = 16;
export const PLAN_DURATION_DAYS = PLAN_DURATION_WEEKS * 7;

// Sport colors for UI
export const SPORT_COLORS = {
  swim: "#00B4D8",
  bike: "#4CAF50",
  run: "#FF6B35",
  strength: "#9C27B0",
  rest: "#6B7280",
};

// Sport icons (Feather icon names)
export const SPORT_ICONS = {
  swim: "droplet",
  bike: "compass",
  run: "activity",
  strength: "zap",
  rest: "moon",
};

// Training plan data structure
// Each week contains workout definitions for each day
export const TRAINING_PLAN = [];

/**
 * Get workout for a specific date from the training plan
 * @param {Date} date - The date to get workout for
 * @returns {Object|null} - Workout object or null if no workout/rest day
 */
export const getWorkoutForDate = (date) => {
  if (!date || !(date instanceof Date)) return null;

  const start = new Date(PLAN_START);
  start.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const diffTime = checkDate - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Outside plan range
  if (diffDays < 0 || diffDays >= PLAN_DURATION_DAYS) return null;

  const weekIndex = Math.floor(diffDays / 7);
  const dayIndex = diffDays % 7;

  if (!TRAINING_PLAN[weekIndex]) return null;

  return TRAINING_PLAN[weekIndex][dayIndex] || null;
};
