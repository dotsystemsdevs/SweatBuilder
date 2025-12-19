import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import { useWorkoutStore } from "../store/workoutStore";
import {
  TodayCard,
  CompletedCard,
  SkippedCard,
  MissedCard,
  RestCard,
} from "../components/Cards/index";
import { getWorkoutsByDate, isRestDay } from "../__mocks__/workoutData";
import { getProgramStartDate } from "../__mocks__/programData";
import WorkoutPreviewModal from "../modals/WorkoutPreviewModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_SIZE = Math.floor((SCREEN_WIDTH - theme.spacing.screenPadding * 2 - 6 * 4) / 7);
const CARD_WIDTH_SINGLE = SCREEN_WIDTH - theme.spacing.screenPadding * 2;
const CARD_WIDTH_MULTI = SCREEN_WIDTH - theme.spacing.screenPadding * 2 - 40;

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Check if same day
const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Get week number of year
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Get training phase insight based on month stats
const getPhaseInsight = (stats) => {
  const { completed, skipped, planned } = stats;
  const total = completed + skipped;
  const rate = total > 0 ? completed / total : 1;

  // No history yet
  if (completed === 0 && skipped === 0) {
    if (planned >= 5) return "Building phase";
    if (planned <= 2) return "Light phase";
    return "Getting started";
  }

  // Great progress
  if (rate >= 0.8 && completed >= 3) {
    return "On track";
  }

  // Struggling
  if (skipped > completed) {
    return "Tough period";
  }

  // Normal progress
  if (planned >= 5) return "Push phase";
  if (planned <= 2) return "Recovery phase";
  return "Steady progress";
};

export default function WeekScreen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const { workoutHistory } = useWorkoutStore();

  useStatusBar(theme.colors.background);

  // Open preview for a workout
  const openPreview = (workout) => {
    setSelectedWorkout(workout);
    setShowPreview(true);
  };

  // Program bounds - limit navigation to program duration
  const programBounds = useMemo(() => {
    const programStart = getProgramStartDate();
    // Program is 4 weeks, allow viewing 1 week into future
    const programEnd = new Date(programStart);
    programEnd.setDate(programEnd.getDate() + 28 + 7); // 4 weeks + 1 week buffer

    return {
      minMonth: programStart.getMonth(),
      minYear: programStart.getFullYear(),
      maxMonth: programEnd.getMonth(),
      maxYear: programEnd.getFullYear(),
    };
  }, []);

  // Check if we can navigate
  const canGoPrev = currentYear > programBounds.minYear ||
    (currentYear === programBounds.minYear && currentMonth > programBounds.minMonth);
  const canGoNext = currentYear < programBounds.maxYear ||
    (currentYear === programBounds.maxYear && currentMonth < programBounds.maxMonth);

  // Animation for month transitions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animation for selected day card
  const cardAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = useCallback((direction) => {
    // direction: -1 for prev, 1 for next
    const startX = direction * -30;
    slideAnim.setValue(startX);
    fadeAnim.setValue(0.3);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      days.push({ isEmpty: true, key: `empty-start-${i}` });
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);

      // Check history for completed/skipped status
      const historyEntry = workoutHistory.find(w => {
        const wDate = new Date(w.date);
        return isSameDay(wDate, date);
      });

      // Get scheduled workouts from program (can be multiple)
      const scheduledWorkouts = getWorkoutsByDate(date);
      const scheduledWorkout = scheduledWorkouts[0] || null;
      const workoutCount = scheduledWorkouts.length;
      const isRest = isRestDay(date);

      // Determine workout status
      let workoutStatus = historyEntry?.status || null;
      let workoutData = historyEntry?.workout || scheduledWorkout;

      // Check if this day is in the current week
      const isCurrentWeek = getWeekNumber(date) === getWeekNumber(today) &&
                            date.getFullYear() === today.getFullYear();

      days.push({
        date,
        day: d,
        isToday: isSameDay(date, today),
        isSelected: isSameDay(date, selectedDate),
        isPast: date < today && !isSameDay(date, today),
        isFuture: date > today,
        hasWorkout: !!workoutData && !isRest,
        isRestDay: isRest,
        isCurrentWeek,
        workoutStatus,
        workout: workoutData,
        workoutCount, // Number of workouts for this day
        historyEntry,
        key: `day-${d}`,
      });
    }

    // Fill remaining to complete grid
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        days.push({ isEmpty: true, key: `empty-end-${i}` });
      }
    }

    return days;
  }, [currentMonth, currentYear, selectedDate, today, workoutHistory]);

  // Month stats
  const monthStats = useMemo(() => {
    const monthDays = calendarDays.filter(d => !d.isEmpty);
    const completed = monthDays.filter(d => d.workoutStatus === "completed").length;
    const skipped = monthDays.filter(d => d.workoutStatus === "skipped").length;
    const total = completed + skipped;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Count planned workouts (future + today with workout, not yet done)
    const planned = monthDays.filter(d =>
      d.hasWorkout && !d.workoutStatus && (d.isFuture || d.isToday)
    ).length;

    // Count rest days
    const restDays = monthDays.filter(d => d.isRestDay).length;

    // Calculate current streak
    let streak = 0;
    const sortedCompleted = monthDays
      .filter(d => d.workoutStatus === "completed")
      .sort((a, b) => b.date - a.date);

    for (let i = 0; i < sortedCompleted.length; i++) {
      const daysDiff = Math.floor((today - sortedCompleted[i].date) / (1000 * 60 * 60 * 24));
      if (daysDiff === i || (i === 0 && daysDiff <= 1)) {
        streak++;
      } else {
        break;
      }
    }

    return { completed, skipped, total, rate, planned, restDays, streak, hasHistory: total > 0 };
  }, [calendarDays]);

  // Selected day data
  const selectedDayData = useMemo(() => {
    return calendarDays.find(d => d.isSelected && !d.isEmpty);
  }, [calendarDays]);

  // Navigation with animation - respects program bounds
  const handlePrevMonth = useCallback(() => {
    if (!canGoPrev) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition(-1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }, [currentMonth, currentYear, animateTransition, canGoPrev]);

  const handleNextMonth = useCallback(() => {
    if (!canGoNext) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition(1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }, [currentMonth, currentYear, animateTransition, canGoNext]);

  // Swipe gesture for changing months
  const swipeHandlers = useRef({ prev: handlePrevMonth, next: handleNextMonth });
  swipeHandlers.current = { prev: handlePrevMonth, next: handleNextMonth };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture clearly horizontal gestures (ratio 2:1)
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const hasMovedEnough = Math.abs(gestureState.dx) > 20;
        return isHorizontal && hasMovedEnough;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        // Trigger on distance OR velocity
        if (dx > 50 || vx > 0.3) {
          swipeHandlers.current.prev();
        } else if (dx < -50 || vx < -0.3) {
          swipeHandlers.current.next();
        }
      },
    })
  ).current;

  const handleToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  // Check if we're already viewing today
  const isViewingToday = currentMonth === today.getMonth() &&
                          currentYear === today.getFullYear() &&
                          isSameDay(selectedDate, today);

  const handleDatePress = (day) => {
    if (day.isEmpty) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate card
    cardAnim.setValue(0);
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();

    setSelectedDate(day.date);
    setActiveWorkoutIndex(0); // Reset to first workout when selecting new date
  };

  // Get workouts for selected date
  const selectedDateWorkouts = useMemo(() => {
    if (!selectedDate) return [];
    return getWorkoutsByDate(selectedDate);
  }, [selectedDate]);

  // Card width based on number of workouts
  const selectedCardWidth = selectedDateWorkouts.length > 1 ? CARD_WIDTH_MULTI : CARD_WIDTH_SINGLE;

  // Handle workout card scroll in calendar
  const handleCalendarWorkoutScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (selectedCardWidth + theme.spacing.md));
    if (index !== activeWorkoutIndex && index >= 0 && index < selectedDateWorkouts.length) {
      setActiveWorkoutIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Get status indicator (simple colored dots) - no dot for rest days
  const getStatusColor = (day) => {
    if (day.workoutStatus === "completed") return theme.colors.green;
    if (day.workoutStatus === "skipped") return theme.colors.textMuted;
    if (day.isRestDay) return null; // No dot for rest days - cleaner look
    if (day.hasWorkout && !day.isPast) return theme.colors.yellow; // Planned - yellow
    if (day.hasWorkout && day.isPast && !day.workoutStatus) return theme.colors.textMuted; // Missed - muted
    return null;
  };

  return (
    <DynamicSafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.swipeContainer} {...panResponder.panHandlers}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.yearLabel}>{currentYear}</Text>
            <Text style={styles.monthLabel}>{MONTHS[currentMonth]}</Text>
          </View>
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
              onPress={handlePrevMonth}
              activeOpacity={canGoPrev ? 0.7 : 1}
              disabled={!canGoPrev}
            >
              <Feather name="chevron-left" size={20} color={canGoPrev ? theme.colors.textMuted : theme.colors.border} />
            </TouchableOpacity>
            {!isViewingToday && (
              <TouchableOpacity
                style={styles.todayButton}
                onPress={handleToday}
                activeOpacity={0.7}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
              onPress={handleNextMonth}
              activeOpacity={canGoNext ? 0.7 : 1}
              disabled={!canGoNext}
            >
              <Feather name="chevron-right" size={20} color={canGoNext ? theme.colors.textMuted : theme.colors.border} />
            </TouchableOpacity>
          </View>
        </View>

        {/* This Month Card */}
        {(() => {
          const phaseInsight = getPhaseInsight(monthStats);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="calendar" size={18} color={theme.colors.textMuted} />
                <Text style={styles.cardTitle}>This Month</Text>
                <Text style={styles.insightBadge}>{phaseInsight}</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{monthStats.planned}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.yellow }]}>planned</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{monthStats.completed}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.green }]}>done</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{monthStats.skipped}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>missed</Text>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day, index) => (
            <View key={index} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid with animation */}
        <Animated.View
          style={[
            styles.calendarGrid,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {calendarDays.map((day) => {
            if (day.isEmpty) {
              return <View key={day.key} style={styles.dayCell} />;
            }

            const statusColor = getStatusColor(day);

            // Dim non-selected, non-today cells when something is selected
            const isDimmed = !day.isSelected && !day.isToday && selectedDate;

            // Selection color matches status color (blue for rest/empty days)
            const selectionColor = statusColor || (day.isRestDay || !day.hasWorkout ? theme.colors.blue : theme.colors.yellow);

            // Today border color - green if done, yellow if pending
            const todayBorderColor = statusColor || theme.colors.yellow;

            return (
              <TouchableOpacity
                key={day.key}
                style={[
                  styles.dayCell,
                  styles.dayCellActive,
                  day.isCurrentWeek && !day.isSelected && styles.dayCellCurrentWeek,
                  day.isSelected && { backgroundColor: selectionColor, borderColor: selectionColor },
                  day.isToday && !day.isSelected && { borderWidth: 2, borderColor: todayBorderColor },
                  isDimmed && styles.dayCellDimmed,
                ]}
                onPress={() => handleDatePress(day)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayNumber,
                  day.isSelected && styles.dayNumberSelected,
                  day.isToday && !day.isSelected && styles.dayNumberToday,
                  day.isPast && !day.isSelected && !day.isToday && styles.dayNumberPast,
                ]}>
                  {day.day}
                </Text>

                {/* Status Dots - hide when selected, show multiple for multiple workouts */}
                {statusColor && !day.isSelected && (
                  <View style={styles.statusDotsContainer}>
                    {Array(Math.min(day.workoutCount || 1, 3)).fill(null).map((_, i) => (
                      <View key={i} style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Selected Day Card(s) */}
        <Animated.View
          style={{
            opacity: cardAnim,
            transform: [{
              scale: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
              }),
            }],
          }}
        >
          {selectedDayData && (() => {
            const formattedDate = selectedDayData.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            const displayDate = selectedDayData.isToday ? "Today" : formattedDate;

            // Rest day - single card
            if (selectedDayData.isRestDay) {
              return <RestCard date={displayDate} />;
            }

            // Past day without scheduled workout
            if (selectedDayData.isPast && !selectedDayData.hasWorkout) {
              return <RestCard date={displayDate} />;
            }

            // Future without workout
            if (!selectedDayData.hasWorkout) {
              return <RestCard date={displayDate} />;
            }

            // Has workouts - show horizontal scroll if multiple
            const workouts = selectedDateWorkouts;

            if (workouts.length === 0) {
              return <RestCard date={displayDate} />;
            }

            // Get reflection data from history entry
            const historyEntry = selectedDayData.historyEntry;
            const reflection = historyEntry?.reflectionData ? {
              effort: historyEntry.reflectionData.effort || 5,
              tags: historyEntry.reflectionData.tags || [],
              notes: historyEntry.reflectionData.notes || historyEntry.notes || null,
            } : null;

            // Render card for a workout
            const renderWorkoutCard = (workout, index) => {
              const title = workout?.title || "Workout";
              const subtitle = workout?.subtitle || "";
              const purpose = workout?.purpose || "";
              const isCardActive = workouts.length > 1 && index === activeWorkoutIndex;

              // Completed workout
              if (selectedDayData.workoutStatus === "completed") {
                return (
                  <View
                    key={workout.id || index}
                    style={[
                      styles.calendarCardWrapper,
                      { width: selectedCardWidth },
                    ]}
                  >
                    <CompletedCard
                      title={title}
                      purpose={purpose}
                      date={displayDate}
                      reflection={reflection}
                      isActive={isCardActive}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        openPreview(workout);
                      }}
                    />
                  </View>
                );
              }

              // Skipped workout
              if (selectedDayData.workoutStatus === "skipped") {
                return (
                  <View
                    key={workout.id || index}
                    style={[
                      styles.calendarCardWrapper,
                      { width: selectedCardWidth },
                    ]}
                  >
                    <SkippedCard
                      title={title}
                      purpose={purpose}
                      date={displayDate}
                      reflection={reflection}
                      isActive={isCardActive}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        openPreview(workout);
                      }}
                    />
                  </View>
                );
              }

              // Past day without workout logged (missed)
              if (selectedDayData.isPast && !selectedDayData.workoutStatus) {
                return (
                  <View
                    key={workout.id || index}
                    style={[
                      styles.calendarCardWrapper,
                      { width: selectedCardWidth },
                    ]}
                  >
                    <MissedCard
                      title={title}
                      purpose={purpose}
                      date={displayDate}
                      isActive={isCardActive}
                      onDetailsPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        openPreview(workout);
                      }}
                    />
                  </View>
                );
              }

              // Today or future with scheduled workout
              return (
                <View
                  key={workout.id || index}
                  style={[
                    styles.calendarCardWrapper,
                    { width: selectedCardWidth },
                  ]}
                >
                  <TodayCard
                    status={selectedDayData.isToday ? "pending" : "pending"}
                    title={title}
                    subtitle={subtitle}
                    purpose={purpose}
                    targetEffort={workout?.targetEffort || 7}
                    isActive={isCardActive}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      openPreview(workout);
                    }}
                  />
                </View>
              );
            };

            // Single workout - render directly
            if (workouts.length === 1) {
              return renderWorkoutCard(workouts[0], 0);
            }

            // Multiple workouts - horizontal scroll
            return (
              <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleCalendarWorkoutScroll}
                  contentContainerStyle={styles.calendarCardsContainer}
                  decelerationRate="fast"
                  snapToInterval={selectedCardWidth + theme.spacing.md}
                  snapToAlignment="start"
                >
                  {workouts.map((workout, index) => renderWorkoutCard(workout, index))}
                </ScrollView>
            );
          })()}
        </Animated.View>
        </ScrollView>
      </View>

      {/* Workout Preview Modal */}
      <WorkoutPreviewModal
        visible={showPreview}
        workout={selectedWorkout}
        onClose={() => {
          setShowPreview(false);
          setSelectedWorkout(null);
        }}
      />
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  swipeContainer: {
    flex: 1,
  },
  content: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 3,
    paddingHorizontal: theme.spacing.screenPadding,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  monthLabel: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -1,
  },
  yearLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xxs,
  },
  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  todayButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },

  // Card styles (matching TodayScreen)
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  // Stats Row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xxs,
  },
  insightBadge: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
    marginLeft: "auto",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.orangeSoft,
    borderRadius: theme.radius.full,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.orange,
  },

  // Weekday Headers
  weekdayRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
  },
  weekdayCell: {
    width: CELL_SIZE,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },

  // Calendar Grid
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: theme.spacing.sm,
  },

  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellActive: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayCellCurrentWeek: {
    backgroundColor: theme.colors.surfaceHover,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.yellow,
    borderColor: theme.colors.yellow,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: theme.colors.yellow,
  },
  dayCellDimmed: {
    opacity: 0.7,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  dayNumberSelected: {
    color: theme.colors.black,
  },
  dayNumberToday: {
    color: theme.colors.text,
  },
  dayNumberPast: {
    color: theme.colors.textMuted,
  },
  statusDotsContainer: {
    position: "absolute",
    bottom: 5,
    flexDirection: "row",
    gap: 2,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Multiple workouts in calendar
  multiWorkoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  multiWorkoutText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
  },
  calendarCardsContainer: {
    paddingRight: theme.spacing.screenPadding,
  },
  calendarCardWrapper: {
    marginRight: theme.spacing.md,
  },
});
