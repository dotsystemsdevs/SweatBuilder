import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { WORKOUT_STATUS } from "../constants/appConstants";
import { getStorageItem, setStorageItem, getMultipleStorageItems } from "../utils/storage";
import { logError } from "../utils/errorHandler";
import { generateNumericId } from "../utils/idGenerator";
import { getCurrentTimestamp } from "../utils/dateFormatters";
import { generateDefaultWorkout, generateExampleHistory, getInitialStats } from "../__mocks__/workoutData";

const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const [workout, setWorkout] = useState(() => generateDefaultWorkout());
  const [favoriteExercises, setFavoriteExercises] = useState([]);
  const toggleFavoriteExercise = useCallback((id) => {
    setFavoriteExercises((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);
  const [status, setStatus] = useState(WORKOUT_STATUS.PENDING);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [notes, setNotes] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState({});
  const [mood, setMood] = useState(null);
  const [skipReason, setSkipReason] = useState("");
  const [streak, setStreak] = useState(0);
  const [reflections, setReflections] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [stats, setStats] = useState(() => getInitialStats());
  const [reflectionData, setReflectionData] = useState({});
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storageData = await getMultipleStorageItems([
          STORAGE_KEYS.WORKOUT_HISTORY,
          STORAGE_KEYS.WORKOUT_STREAK,
          STORAGE_KEYS.WORKOUT_STATS,
        ]);

        const historyData = storageData[STORAGE_KEYS.WORKOUT_HISTORY];
        const streakData = storageData[STORAGE_KEYS.WORKOUT_STREAK];
        const statsData = storageData[STORAGE_KEYS.WORKOUT_STATS];

        // In DEV mode, always regenerate example history to include today's workout
        if (__DEV__) {
          const exampleHistory = generateExampleHistory();
          if (exampleHistory.length > 0) {
            setWorkoutHistory(exampleHistory);
            await setStorageItem(STORAGE_KEYS.WORKOUT_HISTORY, exampleHistory);
          }
        } else if (historyData) {
          setWorkoutHistory(historyData);
        }
        if (streakData !== null && streakData !== undefined) {
          setStreak(parseInt(streakData, 10) || 0);
        }
        if (statsData) {
          setStats(statsData);
        }
      } catch (error) {
        logError("WorkoutStore", error, { context: "loadData" });
      }
    };
    loadData();
  }, []);

  // Save workout history
  const saveWorkoutHistory = useCallback(async (workoutEntry) => {
    const newHistory = [workoutEntry, ...workoutHistory];
    const success = await setStorageItem(STORAGE_KEYS.WORKOUT_HISTORY, newHistory);
    if (success) {
      setWorkoutHistory(newHistory);
    } else {
      logError("WorkoutStore", new Error("Failed to save workout history"));
    }
  }, [workoutHistory]);

  // Update stats
  const updateStats = useCallback(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthWorkouts = workoutHistory.filter(
      (w) => new Date(w.date) >= startOfMonth && w.status === WORKOUT_STATUS.COMPLETED
    ).length;

    const totalCompleted = workoutHistory.filter((w) => w.status === WORKOUT_STATUS.COMPLETED).length;
    const totalSkipped = workoutHistory.filter((w) => w.status === WORKOUT_STATUS.SKIPPED).length;
    const total = totalCompleted + totalSkipped;
    const completionRate = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

    const newStats = {
      totalWorkouts: totalCompleted,
      thisMonth: thisMonthWorkouts,
      completionRate,
    };

    const success = await setStorageItem(STORAGE_KEYS.WORKOUT_STATS, newStats);
    if (success) {
      setStats(newStats);
    } else {
      logError("WorkoutStore", new Error("Failed to save stats"));
    }
  }, [workoutHistory]);

  const progress = useMemo(() => {
    if (!workout.exercises.length) {
      return 0;
    }
    return completedExercises.length / workout.exercises.length;
  }, [completedExercises.length, workout.exercises.length]);

  const toggleExercise = useCallback((id) => {
    setCompletedExercises((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const setWorkoutAndReset = useCallback((nextWorkout) => {
    setWorkout(nextWorkout);
    setStatus(WORKOUT_STATUS.PENDING);
    setCompletedExercises([]);
    setMood(null);
    setSkipReason("");
    setNotes("");
    setExerciseNotes({});
  }, []);

  const startWorkout = useCallback(() => {
    setStatus(WORKOUT_STATUS.ACTIVE);
    setCompletedExercises([]);
    setSkipReason("");
  }, []);

  const completeWorkout = useCallback(async (exerciseProgress) => {
    setStatus(WORKOUT_STATUS.COMPLETED);
    const newStreak = streak + 1;
    setStreak(newStreak);

    // Save streak
    const streakSuccess = await setStorageItem(STORAGE_KEYS.WORKOUT_STREAK, newStreak);
    if (!streakSuccess) {
      logError("WorkoutStore", new Error("Failed to save streak"));
    }

    // Save to history
    const workoutEntry = {
      id: generateNumericId(),
      date: getCurrentTimestamp(),
      workout: { ...workout },
      status: WORKOUT_STATUS.COMPLETED,
      mood,
      notes,
      exerciseNotes,
      streak: newStreak,
      reflectionData: reflectionData || {},
      exerciseProgress: exerciseProgress || null,
    };

    await saveWorkoutHistory(workoutEntry);
    await updateStats();
  }, [streak, workout, mood, notes, exerciseNotes, reflectionData, saveWorkoutHistory, updateStats]);

  const skipWorkout = useCallback(async (reason, reflectionDataParam = null) => {
    setStatus(WORKOUT_STATUS.SKIPPED);
    setSkipReason(reason);
    setCompletedExercises([]);
    setStreak(0);

    // Save streak reset
    const streakSuccess = await setStorageItem(STORAGE_KEYS.WORKOUT_STREAK, 0);
    if (!streakSuccess) {
      logError("WorkoutStore", new Error("Failed to save streak"));
    }

    // Use reflectionData from parameter if provided, otherwise from state
    const dataToSave = reflectionDataParam || reflectionData || {};

    // Save to history with reflection data
    const workoutEntry = {
      id: generateNumericId(),
      date: getCurrentTimestamp(),
      workout: { ...workout },
      status: WORKOUT_STATUS.SKIPPED,
      skipReason: reason,
      streak: 0,
      reflectionData: dataToSave,
    };

    await saveWorkoutHistory(workoutEntry);
    await updateStats();
  }, [workout, reflectionData, saveWorkoutHistory, updateStats]);

  const resetWorkout = useCallback(async () => {
    setStatus(WORKOUT_STATUS.PENDING);
    setCompletedExercises([]);
    setMood(null);
    setNotes("");
    setExerciseNotes({});
    setSkipReason("");

    // Remove today's workout from history
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const updatedHistory = workoutHistory.filter((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() !== today.getTime();
    });

    if (updatedHistory.length !== workoutHistory.length) {
      const success = await setStorageItem(STORAGE_KEYS.WORKOUT_HISTORY, updatedHistory);
      if (success) {
        setWorkoutHistory(updatedHistory);
        await updateStats();
      } else {
        logError("WorkoutStore", new Error("Failed to reset workout history"));
      }
    }
  }, [workoutHistory, updateStats]);

  const addReflection = useCallback((nextMood, nextNotes) => {
    setMood(nextMood);
    setNotes(nextNotes);
  }, []);

  const setReflection = useCallback(async (data) => {
    setReflectionData(data || {});
    if (data?.notes !== undefined) {
      setNotes(data.notes);
    }

    // Update the most recent workout entry in history with reflection data
    if (workoutHistory.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find the most recent entry for today - match by date and workout ID if available
      let foundEntry = false;
      const updatedHistory = workoutHistory.map((entry, index) => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        
        // Update today's entry - prioritize first entry (most recent) that matches today
        // Also check if workout ID matches current workout to ensure correct entry
        const isToday = entryDate.getTime() === today.getTime();
        const workoutMatches = !workout?.id || entry.workout?.id === workout.id;
        
        // Only update if it's today and (it's the first entry OR workout ID matches) and we haven't updated one yet
        if (isToday && (index === 0 || workoutMatches) && !foundEntry) {
          foundEntry = true;
          return {
            ...entry,
            reflectionData: data || {},
          };
        }
        return entry;
      });

      const success = await setStorageItem(STORAGE_KEYS.WORKOUT_HISTORY, updatedHistory);
      if (success) {
        setWorkoutHistory(updatedHistory);
      }
    }
  }, [workoutHistory, workout]);

  const applySuggestion = useCallback((suggestion) => {
    setAppliedSuggestions((prev) => {
      if (prev.some((s) => s.id === suggestion.id)) return prev;
      return [...prev, { ...suggestion, appliedAt: new Date().toISOString() }];
    });
  }, []);

  const clearAppliedSuggestions = useCallback(() => {
    setAppliedSuggestions([]);
  }, []);

  const value = useMemo(
    () => ({
      workout,
      status,
      completedExercises,
      progress,
      notes,
      exerciseNotes,
      mood,
      skipReason,
      streak,
      reflections,
      reflectionData,
      favoriteExercises,
      workoutHistory,
      stats,
      appliedSuggestions,
      toggleExercise,
      toggleFavoriteExercise,
      setWorkout: setWorkoutAndReset,
      startWorkout,
      completeWorkout,
      skipWorkout,
      setNotes,
      setExerciseNotes,
      setMood,
      resetWorkout,
      addReflection,
      setReflection,
      applySuggestion,
      clearAppliedSuggestions,
      updateStats,
    }),
    [
      workout,
      status,
      completedExercises,
      progress,
      notes,
      exerciseNotes,
      mood,
      skipReason,
      streak,
      reflections,
      reflectionData,
      favoriteExercises,
      workoutHistory,
      stats,
      appliedSuggestions,
      toggleExercise,
      toggleFavoriteExercise,
      setWorkoutAndReset,
      startWorkout,
      completeWorkout,
      skipWorkout,
      setNotes,
      setExerciseNotes,
      setMood,
      resetWorkout,
      addReflection,
      setReflection,
      applySuggestion,
      clearAppliedSuggestions,
      updateStats,
    ],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkoutStore() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error("useWorkoutStore must be used within WorkoutProvider");
  }
  return ctx;
}
