/**
 * Workout data for development/testing
 * Generates realistic workout history based on the training program
 */

import { WORKOUT_STATUS } from "../constants/appConstants";
import {
  getWorkoutForDate,
  getProgramStartDate,
  getTodayWorkout,
  WORKOUT_TEMPLATES,
} from "./programData";

// Reflection tags for variety
const POSITIVE_TAGS = ["Felt strong", "Good form", "New PR", "Focused", "High energy"];
const NEGATIVE_TAGS = ["Tired", "Low energy", "Sore", "Rushed"];
const NEUTRAL_TAGS = ["Focused", "Good form"];

// Realistic notes for completed workouts
const COMPLETED_NOTES = [
  "Great session! Felt strong throughout.",
  "Pushed through the last few sets.",
  "Good form today, really focused on mind-muscle connection.",
  "Energy was a bit low but still got it done.",
  "Personal best on bench press!",
  "Felt the burn, solid workout.",
  "Recovery day workout, kept it light.",
  "Legs are going to be sore tomorrow.",
  "Cardio felt easier than last week.",
  "Strong finish to the week!",
  "Good pump, feeling motivated.",
  "Struggled with the last exercise but completed it.",
  "Focused on technique today.",
  "Quick session but effective.",
  "",
  "",
  "", // Some without notes
];

// Skip reasons with realistic notes
const SKIP_DATA = [
  { reason: "sick", notes: "Not feeling well, need rest to recover." },
  { reason: "busy", notes: "Work deadline, couldn't make time." },
  { reason: "tired", notes: "Exhausted from poor sleep, taking a rest day." },
  { reason: "injury", notes: "Knee feeling off, playing it safe." },
  { reason: "travel", notes: "On the road, no gym access." },
  { reason: "mental_health", notes: "Needed a mental break today." },
];

/**
 * Generate exercise progress for a workout
 * Shows which sets were completed (all true for completed workouts)
 */
const generateExerciseProgress = (exercises) => {
  const progress = {};
  exercises.forEach((ex) => {
    // Parse sets from info (e.g., "4x8" -> 4 sets)
    let sets = 1;
    if (ex.info) {
      const match = ex.info.match(/^(\d+)x/);
      if (match) {
        sets = Math.min(parseInt(match[1], 10), 4);
      }
    }
    progress[ex.id] = Array(sets).fill(true);
  });
  return progress;
};

/**
 * Generate default workout for today
 * Uses the program schedule to determine today's workout
 * @returns {Object} Today's workout object
 */
export const generateDefaultWorkout = () => {
  const programStart = getProgramStartDate();
  const todayWorkout = getTodayWorkout(programStart);

  // If it's a rest day, return a default workout anyway for testing
  if (!todayWorkout) {
    return WORKOUT_TEMPLATES.fullBody;
  }

  return todayWorkout;
};

/**
 * Generate realistic workout history for the past weeks
 * Based on the actual program schedule with realistic completion patterns
 * Ensures all status colors are visible for testing
 * @returns {Array} Array of workout history entries
 */
export const generateExampleHistory = () => {
  if (typeof __DEV__ !== "undefined" && !__DEV__) {
    return [];
  }

  const history = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const programStart = getProgramStartDate();

  // Force specific statuses for recent days to ensure all colors show
  // This guarantees: green (completed), red (skipped), yellow (planned/future)
  const forcedStatus = {
    1: WORKOUT_STATUS.COMPLETED,  // Yesterday - GREEN dot
    2: WORKOUT_STATUS.SKIPPED,    // 2 days ago - RED dot
    3: WORKOUT_STATUS.COMPLETED,  // 3 days ago - GREEN dot
    4: WORKOUT_STATUS.COMPLETED,  // 4 days ago - GREEN dot
    5: WORKOUT_STATUS.SKIPPED,    // 5 days ago - RED dot
    6: WORKOUT_STATUS.COMPLETED,  // 6 days ago - GREEN dot
    7: WORKOUT_STATUS.COMPLETED,  // 7 days ago - GREEN dot
  };

  // Generate history for past 21 days (3 weeks of the program)
  for (let daysAgo = 1; daysAgo <= 21; daysAgo++) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    const scheduledWorkout = getWorkoutForDate(date, programStart);

    // Skip rest days - they don't appear in history
    if (!scheduledWorkout) continue;

    // Use forced status for recent days, random for older
    let status;
    if (forcedStatus[daysAgo]) {
      status = forcedStatus[daysAgo];
    } else {
      // Random with ~15% skip chance for older entries
      const isSkipped = Math.random() < 0.15;
      status = isSkipped ? WORKOUT_STATUS.SKIPPED : WORKOUT_STATUS.COMPLETED;
    }

    // Generate entry based on status
    if (status === WORKOUT_STATUS.COMPLETED) {
      // Random effort between 5-9, weighted towards 7
      const effort = Math.min(10, Math.max(1, Math.round(Math.random() * 3 + 5 + Math.random() * 2)));

      // Select appropriate tags based on effort
      const tags = [];
      if (effort >= 8) {
        tags.push(POSITIVE_TAGS[Math.floor(Math.random() * POSITIVE_TAGS.length)]);
        if (Math.random() > 0.5) {
          tags.push(POSITIVE_TAGS[Math.floor(Math.random() * POSITIVE_TAGS.length)]);
        }
      } else if (effort <= 5) {
        tags.push(NEGATIVE_TAGS[Math.floor(Math.random() * NEGATIVE_TAGS.length)]);
      } else {
        tags.push(NEUTRAL_TAGS[Math.floor(Math.random() * NEUTRAL_TAGS.length)]);
      }
      // Remove duplicates
      const uniqueTags = [...new Set(tags)];

      const notes = COMPLETED_NOTES[Math.floor(Math.random() * COMPLETED_NOTES.length)];
      const weekNum = Math.floor(daysAgo / 7);

      history.push({
        id: Date.now() - daysAgo * 86400000 + Math.random() * 1000,
        date: date.toISOString(),
        status: WORKOUT_STATUS.COMPLETED,
        workout: { ...scheduledWorkout },
        mood: effort >= 7 ? "Great" : effort >= 5 ? "Good" : "OK",
        notes: notes || null,
        streak: Math.max(1, 5 - (weekNum * 2) + Math.floor(Math.random() * 3)),
        reflectionData: {
          effort,
          tags: uniqueTags,
          notes: notes || null,
          timestamp: date.toISOString(),
        },
        exerciseProgress: generateExerciseProgress(scheduledWorkout.exercises),
      });
    } else {
      // Skipped workout
      const skipInfo = SKIP_DATA[Math.floor(Math.random() * SKIP_DATA.length)];

      history.push({
        id: Date.now() - daysAgo * 86400000 + Math.random() * 1000,
        date: date.toISOString(),
        status: WORKOUT_STATUS.SKIPPED,
        workout: { ...scheduledWorkout },
        skipReason: skipInfo.reason,
        streak: 0,
        reflectionData: {
          effort: null,
          tags: [NEGATIVE_TAGS[Math.floor(Math.random() * NEGATIVE_TAGS.length)]],
          notes: skipInfo.notes,
          skipReason: skipInfo.reason,
          timestamp: date.toISOString(),
        },
      });
    }
  }

  // Sort by date descending (most recent first)
  history.sort((a, b) => new Date(b.date) - new Date(a.date));

  return history;
};

/**
 * Get initial stats state
 * Calculated from example history
 * @returns {Object} Initial stats object
 */
export const getInitialStats = () => {
  const history = generateExampleHistory();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthCompleted = history.filter(
    (w) => new Date(w.date) >= startOfMonth && w.status === WORKOUT_STATUS.COMPLETED
  ).length;

  const totalCompleted = history.filter((w) => w.status === WORKOUT_STATUS.COMPLETED).length;
  const totalSkipped = history.filter((w) => w.status === WORKOUT_STATUS.SKIPPED).length;
  const total = totalCompleted + totalSkipped;
  const completionRate = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

  return {
    totalWorkouts: totalCompleted,
    thisMonth: thisMonthCompleted,
    completionRate,
  };
};

/**
 * Check if a date is a scheduled rest day
 * @param {Date} date - Date to check
 * @returns {boolean} True if rest day
 */
export const isRestDay = (date) => {
  const programStart = getProgramStartDate();
  return getWorkoutForDate(date, programStart) === null;
};

/**
 * Get workout for any date
 * @param {Date} date - Date to get workout for
 * @returns {Object|null} Workout or null for rest day
 */
export const getWorkoutByDate = (date) => {
  const programStart = getProgramStartDate();
  return getWorkoutForDate(date, programStart);
};

/**
 * Get all workouts for a date (supports multiple workouts per day)
 * @param {Date} date - Date to get workouts for
 * @returns {Array} Array of workouts for the day
 */
export const getWorkoutsByDate = (date) => {
  const programStart = getProgramStartDate();
  const mainWorkout = getWorkoutForDate(date, programStart);

  if (!mainWorkout) return [];

  // For demo: Add a second workout on today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate.getTime() === today.getTime()) {
    // Today has 2 workouts for demo
    const secondWorkout = {
      id: "evening-cardio",
      title: "Evening Cardio",
      subtitle: "30 min session",
      duration: "30 min",
      purpose: "Active recovery and cardio conditioning",
      targetEffort: 6,
      exercises: [
        { id: "ec1", name: "Treadmill Jog", info: "15 min", category: "main" },
        { id: "ec2", name: "Rowing Machine", info: "10 min", category: "main" },
        { id: "ec3", name: "Stretching", info: "5 min", category: "cooldown" },
      ],
    };
    return [mainWorkout, secondWorkout];
  }

  return [mainWorkout];
};
