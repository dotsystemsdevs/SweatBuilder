/**
 * Comprehensive training program data for development/testing
 * A realistic 4-week mixed fitness program (strength + cardio)
 */

// Exercise database with proper sets/reps/duration
export const EXERCISE_DATABASE = {
  // Strength - Push
  benchPress: { id: "bench-press", name: "Bench Press", info: "4x8 @ 70 kg", category: "main" },
  inclinePress: { id: "incline-press", name: "Incline Dumbbell Press", info: "3x10 @ 24 kg", category: "main" },
  overheadPress: { id: "overhead-press", name: "Overhead Press", info: "3x10 @ 30 kg", category: "main" },
  dips: { id: "dips", name: "Triceps Dips", info: "3x12", category: "main" },
  tricepPushdown: { id: "tricep-pushdown", name: "Tricep Pushdown", info: "3x15 @ 25 kg", category: "main" },
  lateralRaise: { id: "lateral-raise", name: "Lateral Raises", info: "3x15 @ 8 kg", category: "main" },

  // Strength - Pull
  deadlift: { id: "deadlift", name: "Deadlift", info: "4x5 @ 100 kg", category: "main" },
  bentOverRow: { id: "bent-row", name: "Bent-over Row", info: "3x10 @ 50 kg", category: "main" },
  pullUps: { id: "pull-ups", name: "Pull-ups", info: "3x8", category: "main" },
  latPulldown: { id: "lat-pulldown", name: "Lat Pulldown", info: "3x12 @ 55 kg", category: "main" },
  facepulls: { id: "face-pulls", name: "Face Pulls", info: "3x15 @ 20 kg", category: "main" },
  bicepCurl: { id: "bicep-curl", name: "Bicep Curls", info: "3x12 @ 12 kg", category: "main" },
  hammerCurl: { id: "hammer-curl", name: "Hammer Curls", info: "3x12 @ 14 kg", category: "main" },

  // Strength - Legs
  squat: { id: "squat", name: "Barbell Squat", info: "4x6 @ 90 kg", category: "main" },
  legPress: { id: "leg-press", name: "Leg Press", info: "3x12 @ 140 kg", category: "main" },
  romanianDeadlift: { id: "rdl", name: "Romanian Deadlift", info: "3x10 @ 60 kg", category: "main" },
  legCurl: { id: "leg-curl", name: "Leg Curl", info: "3x12 @ 35 kg", category: "main" },
  legExtension: { id: "leg-ext", name: "Leg Extension", info: "3x12 @ 40 kg", category: "main" },
  calfRaise: { id: "calf-raise", name: "Calf Raises", info: "4x15 @ 60 kg", category: "main" },
  lunges: { id: "lunges", name: "Walking Lunges", info: "3x12 each", category: "main" },

  // Core
  plank: { id: "plank", name: "Plank", info: "3x45 sec", category: "main" },
  russianTwist: { id: "russian-twist", name: "Russian Twists", info: "3x20", category: "main" },
  legRaises: { id: "leg-raises", name: "Hanging Leg Raises", info: "3x12", category: "main" },
  cableCrunch: { id: "cable-crunch", name: "Cable Crunches", info: "3x15 @ 30 kg", category: "main" },

  // Cardio
  treadmillRun: { id: "treadmill", name: "Treadmill Run", info: "25 min @ zone 2", category: "main" },
  intervalSprints: { id: "sprints", name: "Interval Sprints", info: "8x30 sec on/30 sec off", category: "main" },
  rowingMachine: { id: "rowing", name: "Rowing Machine", info: "15 min @ moderate", category: "main" },
  stairMaster: { id: "stairs", name: "StairMaster", info: "15 min", category: "main" },
  jumpRope: { id: "jump-rope", name: "Jump Rope", info: "10 min", category: "main" },

  // Warmup
  lightCardio: { id: "light-cardio", name: "Light Cardio", info: "5 min", category: "warmup" },
  dynamicStretches: { id: "dynamic-stretch", name: "Dynamic Stretches", info: "5 min", category: "warmup" },
  armCircles: { id: "arm-circles", name: "Arm Circles", info: "2x20", category: "warmup" },
  legSwings: { id: "leg-swings", name: "Leg Swings", info: "2x15 each", category: "warmup" },

  // Cooldown
  staticStretches: { id: "static-stretch", name: "Static Stretches", info: "5 min", category: "cooldown" },
  foamRolling: { id: "foam-roll", name: "Foam Rolling", info: "5 min", category: "cooldown" },
  breathingExercise: { id: "breathing", name: "Breathing Exercise", info: "3 min", category: "cooldown" },
};

// Workout templates
export const WORKOUT_TEMPLATES = {
  pushDay: {
    id: "push-day",
    title: "Push Day",
    subtitle: "Chest, Shoulders & Triceps",
    duration: "55 min",
    exercises: [
      EXERCISE_DATABASE.lightCardio,
      EXERCISE_DATABASE.dynamicStretches,
      EXERCISE_DATABASE.benchPress,
      EXERCISE_DATABASE.overheadPress,
      EXERCISE_DATABASE.inclinePress,
      EXERCISE_DATABASE.dips,
      EXERCISE_DATABASE.lateralRaise,
      EXERCISE_DATABASE.staticStretches,
    ],
  },
  pullDay: {
    id: "pull-day",
    title: "Pull Day",
    subtitle: "Back & Biceps",
    duration: "50 min",
    exercises: [
      EXERCISE_DATABASE.lightCardio,
      EXERCISE_DATABASE.armCircles,
      EXERCISE_DATABASE.deadlift,
      EXERCISE_DATABASE.bentOverRow,
      EXERCISE_DATABASE.pullUps,
      EXERCISE_DATABASE.facepulls,
      EXERCISE_DATABASE.bicepCurl,
      EXERCISE_DATABASE.foamRolling,
    ],
  },
  legDay: {
    id: "leg-day",
    title: "Leg Day",
    subtitle: "Quads, Hamstrings & Glutes",
    duration: "60 min",
    exercises: [
      EXERCISE_DATABASE.lightCardio,
      EXERCISE_DATABASE.legSwings,
      EXERCISE_DATABASE.squat,
      EXERCISE_DATABASE.legPress,
      EXERCISE_DATABASE.romanianDeadlift,
      EXERCISE_DATABASE.legCurl,
      EXERCISE_DATABASE.calfRaise,
      EXERCISE_DATABASE.staticStretches,
    ],
  },
  upperBody: {
    id: "upper-body",
    title: "Upper Body",
    subtitle: "Full Upper Workout",
    duration: "55 min",
    exercises: [
      EXERCISE_DATABASE.lightCardio,
      EXERCISE_DATABASE.dynamicStretches,
      EXERCISE_DATABASE.benchPress,
      EXERCISE_DATABASE.bentOverRow,
      EXERCISE_DATABASE.overheadPress,
      EXERCISE_DATABASE.latPulldown,
      EXERCISE_DATABASE.tricepPushdown,
      EXERCISE_DATABASE.bicepCurl,
      EXERCISE_DATABASE.foamRolling,
    ],
  },
  lowerBody: {
    id: "lower-body",
    title: "Lower Body",
    subtitle: "Legs & Core",
    duration: "50 min",
    exercises: [
      EXERCISE_DATABASE.lightCardio,
      EXERCISE_DATABASE.legSwings,
      EXERCISE_DATABASE.squat,
      EXERCISE_DATABASE.lunges,
      EXERCISE_DATABASE.legCurl,
      EXERCISE_DATABASE.legExtension,
      EXERCISE_DATABASE.plank,
      EXERCISE_DATABASE.staticStretches,
    ],
  },
  cardioHiit: {
    id: "cardio-hiit",
    title: "HIIT Cardio",
    subtitle: "High Intensity Intervals",
    duration: "35 min",
    exercises: [
      EXERCISE_DATABASE.lightCardio,
      EXERCISE_DATABASE.dynamicStretches,
      EXERCISE_DATABASE.jumpRope,
      EXERCISE_DATABASE.intervalSprints,
      EXERCISE_DATABASE.rowingMachine,
      EXERCISE_DATABASE.breathingExercise,
      EXERCISE_DATABASE.staticStretches,
    ],
  },
  cardioSteady: {
    id: "cardio-steady",
    title: "Steady State Cardio",
    subtitle: "Zone 2 Training",
    duration: "40 min",
    exercises: [
      EXERCISE_DATABASE.lightCardio,
      EXERCISE_DATABASE.legSwings,
      EXERCISE_DATABASE.treadmillRun,
      EXERCISE_DATABASE.stairMaster,
      EXERCISE_DATABASE.staticStretches,
      EXERCISE_DATABASE.foamRolling,
    ],
  },
  fullBody: {
    id: "full-body",
    title: "Full Body",
    subtitle: "Compound Movements",
    duration: "60 min",
    exercises: [
      EXERCISE_DATABASE.lightCardio,
      EXERCISE_DATABASE.dynamicStretches,
      EXERCISE_DATABASE.squat,
      EXERCISE_DATABASE.benchPress,
      EXERCISE_DATABASE.bentOverRow,
      EXERCISE_DATABASE.overheadPress,
      EXERCISE_DATABASE.plank,
      EXERCISE_DATABASE.staticStretches,
    ],
  },
  coreDay: {
    id: "core-day",
    title: "Core & Abs",
    subtitle: "Core Strengthening",
    duration: "30 min",
    exercises: [
      EXERCISE_DATABASE.lightCardio,
      EXERCISE_DATABASE.dynamicStretches,
      EXERCISE_DATABASE.plank,
      EXERCISE_DATABASE.russianTwist,
      EXERCISE_DATABASE.legRaises,
      EXERCISE_DATABASE.cableCrunch,
      EXERCISE_DATABASE.breathingExercise,
    ],
  },
};

// 4-week program schedule (0 = Monday, 6 = Sunday)
// null = rest day
const WEEKLY_SCHEDULE = [
  // Week 1 - Introduction
  {
    week: 1,
    focus: "Introduction Week",
    days: {
      0: "pushDay",      // Monday
      1: "cardioSteady", // Tuesday
      2: "pullDay",      // Wednesday
      3: null,           // Thursday - Rest
      4: "legDay",       // Friday
      5: "cardioHiit",   // Saturday
      6: null,           // Sunday - Rest
    },
  },
  // Week 2 - Building
  {
    week: 2,
    focus: "Building Phase",
    days: {
      0: "upperBody",    // Monday
      1: "lowerBody",    // Tuesday
      2: null,           // Wednesday - Rest
      3: "pushDay",      // Thursday
      4: "pullDay",      // Friday
      5: "cardioHiit",   // Saturday
      6: null,           // Sunday - Rest
    },
  },
  // Week 3 - Intensity
  {
    week: 3,
    focus: "Intensity Week",
    days: {
      0: "fullBody",     // Monday
      1: "cardioHiit",   // Tuesday
      2: "pushDay",      // Wednesday
      3: "pullDay",      // Thursday
      4: null,           // Friday - Rest
      5: "legDay",       // Saturday
      6: "coreDay",      // Sunday
    },
  },
  // Week 4 - Deload/Recovery
  {
    week: 4,
    focus: "Recovery Week",
    days: {
      0: "upperBody",    // Monday
      1: "cardioSteady", // Tuesday
      2: "fullBody",     // Wednesday - Changed from rest
      3: "lowerBody",    // Thursday
      4: "cardioSteady", // Friday
      5: null,           // Saturday - Rest
      6: "coreDay",      // Sunday
    },
  },
];

/**
 * Get workout for a specific date
 * @param {Date} date - The date to get workout for
 * @param {Date} programStartDate - When the program started
 * @returns {Object|null} Workout object or null for rest day
 */
export const getWorkoutForDate = (date, programStartDate) => {
  const startDate = new Date(programStartDate);
  startDate.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Calculate days since program start
  const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) return null; // Before program start

  // Calculate which week (1-4, then repeat)
  const weekIndex = Math.floor(daysDiff / 7) % 4;
  const dayOfWeek = targetDate.getDay();
  // Convert Sunday=0 to Monday=0 format
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekSchedule = WEEKLY_SCHEDULE[weekIndex];
  const workoutKey = weekSchedule.days[adjustedDay];

  if (!workoutKey) return null; // Rest day

  const workout = WORKOUT_TEMPLATES[workoutKey];
  return workout ? { ...workout } : null;
};

/**
 * Get today's workout
 * @param {Date} programStartDate - When the program started
 * @returns {Object|null} Today's workout or null for rest day
 */
export const getTodayWorkout = (programStartDate) => {
  return getWorkoutForDate(new Date(), programStartDate);
};

/**
 * Generate default marathon training program (legacy support)
 * @returns {Object} Default program object
 */
export const generateDefaultProgram = () => {
  // Program started 3 weeks ago for testing
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 21);

  return {
    id: "ironman-703-prep",
    name: "Ironman 70.3 Prep",
    goal: "Ironman 70.3",
    duration: 8,
    currentWeek: 4,
    startDate: startDate.toISOString(),
    isActive: true,
    weeklySchedule: WEEKLY_SCHEDULE,
    createdAt: startDate.toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Get initial programs state
 * @returns {Array} Array containing default program
 */
export const getInitialPrograms = () => [generateDefaultProgram()];

/**
 * Get default active program ID
 * @returns {string} Default program ID
 */
export const getDefaultProgramId = () => "ironman-703-prep";

/**
 * Get program start date
 * @returns {Date} Program start date (3 weeks ago)
 */
export const getProgramStartDate = () => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 21);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};
