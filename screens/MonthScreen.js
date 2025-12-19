import React, { useState, useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
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
import {
  PLAN_START,
  PLAN_DURATION_DAYS,
  getWorkoutForDate,
} from "../constants/trainingPlan";

const PLAN_END = new Date(PLAN_START);
PLAN_END.setDate(PLAN_END.getDate() + PLAN_DURATION_DAYS - 1);

// Helper function to check if date is last day of plan
const isLastDayOfPlan = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  const lastDayStr = PLAN_END.toISOString().split('T')[0];
  return dateStr === lastDayStr;
};

export default function MonthScreen() {
  useStatusBar(theme.colors.background);
  const { workoutHistory } = useWorkoutStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const today = new Date();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                     "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[selectedMonth];
  
  const firstDay = new Date(selectedYear, selectedMonth, 1);
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check workout history for this date
      const workoutEntry = workoutHistory.find((w) => {
        const wDate = new Date(w.date);
        return wDate.toISOString().split('T')[0] === dateStr;
      });
      
      // Get workout from training plan
      const plannedWorkout = getWorkoutForDate(date);
      const isRaceDay = plannedWorkout?.type === "Test / Race";
      const isLastDay = isLastDayOfPlan(date);
      
      const isToday = date.getDate() === today.getDate() && 
                     date.getMonth() === today.getMonth() && 
                     date.getFullYear() === today.getFullYear();
      
      const plannedWorkoutData = plannedWorkout ? {
        sport: plannedWorkout.sport,
        type: plannedWorkout.type,
      } : null;
      
      days.push({
        day,
        date,
        status: workoutEntry?.status || null,
        isToday,
        isRaceDay,
        isLastDay,
        workoutEntry,
        plannedWorkout: plannedWorkoutData,
      });
    }
    
    return days;
  }, [selectedMonth, selectedYear, daysInMonth, adjustedStartDay, workoutHistory, today]);

  const monthStats = useMemo(() => {
    const startOfMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    const monthWorkouts = workoutHistory.filter((w) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= startOfMonth && workoutDate <= endOfMonth;
    });
    
    const completed = monthWorkouts.filter((w) => w.status === "completed").length;
    const skipped = monthWorkouts.filter((w) => w.status === "skipped").length;
    const total = completed + skipped;
    
    return { completed, total };
  }, [selectedMonth, selectedYear, workoutHistory]);

  const goToPreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    setSelectedDate(null);
  };

  // Single letter day labels (consistent with WeekScreen)
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  // Get status color (simple colored dots - unified across app)
  const getStatusColor = (status, isRaceDay, isLastDay) => {
    if (status === "completed") return theme.colors.green;
    if (status === "skipped") return theme.colors.textMuted;
    if (isRaceDay || isLastDay) return theme.colors.yellow;
    return null;
  };

  return (
    <DynamicSafeAreaView style={styles.screen} backgroundColor={theme.colors.background}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - matches WeekScreen layout */}
        <View style={styles.header}>
          <View>
            <Text style={styles.monthLabel}>{monthName}</Text>
            <Text style={styles.yearLabel}>{selectedYear}</Text>
          </View>
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={goToPreviousMonth}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={goToToday}
              activeOpacity={0.7}
            >
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={goToNextMonth}
              activeOpacity={0.7}
            >
              <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Day Labels */}
        <View style={styles.dayLabels}>
          {dayLabels.map((day, index) => (
            <View key={index} style={styles.dayLabel}>
              <Text style={styles.dayLabelText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((dayData, index) => {
            if (!dayData) {
              return <View key={index} style={styles.calendarDayEmpty} />;
            }

            const { day, status, isToday, isRaceDay, isLastDay } = dayData;
            const statusColor = getStatusColor(status, isRaceDay, isLastDay);

            const isSelected = selectedDate && selectedDate.getTime() === dayData.date.getTime();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  isToday && !isSelected && styles.calendarDayToday,
                  isSelected && styles.calendarDaySelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDate(isSelected ? null : dayData.date);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.calendarDayNumber,
                  isToday && !isSelected && styles.calendarDayNumberToday,
                  isSelected && styles.calendarDayNumberSelected,
                ]}>
                  {day}
                </Text>
                {statusColor && (
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Month Stats Card - matches card design system */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="bar-chart-2" size={18} color={theme.colors.textMuted} />
            <Text style={styles.cardTitle}>This Month</Text>
            {monthStats.total > 0 && (
              <Text style={styles.rateText}>
                {Math.round((monthStats.completed / monthStats.total) * 100)}%
              </Text>
            )}
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthStats.completed}</Text>
              <Text style={styles.statLabel}>done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthStats.total - monthStats.completed}</Text>
              <Text style={styles.statLabel}>skipped</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthStats.total}</Text>
              <Text style={styles.statLabel}>total</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Workout Card */}
        {selectedDate && (() => {
          const selectedDayData = calendarDays.find(d => d && d.date.getTime() === selectedDate.getTime());
          if (!selectedDayData) return null;

          const { status, workoutEntry, plannedWorkout, date } = selectedDayData;

          // Format date for display
          const formatDisplayDate = (d) => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (d.toDateString() === today.toDateString()) return "Today";
            if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          };

          // Get workout title and subtitle
          const title = workoutEntry?.workout?.title || plannedWorkout?.sport || "Workout";
          const subtitle = workoutEntry?.workout?.subtitle || plannedWorkout?.type || "";
          const purpose = workoutEntry?.workout?.purpose || "";
          const displayDate = formatDisplayDate(date);

          // Build reflection data from workout entry
          const reflection = workoutEntry ? {
            effort: workoutEntry.mood || 5,
            tags: workoutEntry.tags || [],
            notes: workoutEntry.notes || null,
          } : null;

          // Check if date is in the past
          const isPast = date < today && date.toDateString() !== today.toDateString();

          // Render appropriate card based on status
          if (status === "completed") {
            return (
              <View style={styles.selectedDayCard}>
                <CompletedCard
                  title={title}
                  purpose={purpose}
                  date={displayDate}
                  reflection={reflection}
                />
              </View>
            );
          }

          if (status === "skipped") {
            return (
              <View style={styles.selectedDayCard}>
                <SkippedCard
                  title={title}
                  purpose={purpose}
                  date={displayDate}
                  reflection={reflection}
                />
              </View>
            );
          }

          if (plannedWorkout?.sport === "Rest" || plannedWorkout?.type === "Rest") {
            return (
              <View style={styles.selectedDayCard}>
                <RestCard date={displayDate} />
              </View>
            );
          }

          // Past day without status = missed
          if (isPast && (plannedWorkout || workoutEntry) && !status) {
            return (
              <View style={styles.selectedDayCard}>
                <MissedCard
                  title={title}
                  purpose={purpose}
                  date={displayDate}
                />
              </View>
            );
          }

          // Future or today with planned workout
          if ((plannedWorkout || workoutEntry) && !status) {
            return (
              <View style={styles.selectedDayCard}>
                <TodayCard
                  status="pending"
                  title={title}
                  subtitle={subtitle}
                  purpose={purpose}
                  targetEffort={7}
                />
              </View>
            );
          }

          return null;
        })()}
      </ScrollView>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 3,
    paddingHorizontal: theme.spacing.screenPadding,
  },

  // Header - matches WeekScreen
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

  // Card styles - matches design system
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
    marginHorizontal: -theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  rateText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginLeft: "auto",
  },

  // Stats Row - matches TodayScreen/WeekScreen
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
    marginTop: 2,
  },

  // Day Labels
  dayLabels: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },

  // Calendar Grid
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: theme.spacing.lg,
  },
  calendarDay: {
    width: "13.5%",
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  calendarDayEmpty: {
    width: "13.5%",
    aspectRatio: 1,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: theme.colors.yellow,
  },
  calendarDaySelected: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  calendarDayNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  calendarDayNumberToday: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  calendarDayNumberSelected: {
    color: theme.colors.background,
  },
  statusDot: {
    position: "absolute",
    bottom: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Selected Day Card
  selectedDayCard: {
    marginTop: theme.spacing.md,
  },
});
