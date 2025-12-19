/**
 * Custom hook for calendar navigation logic
 * Handles day/month navigation, date selection, and swipe gestures
 */

import { useState, useCallback, useMemo } from "react";
import { formatDate, isSameDay, getStartOfWeek } from "../utils/dateHelpers";
import { getWeekNumber, getPhaseFromWeek } from "../utils/phaseHelpers";

/**
 * Hook for managing calendar navigation state and logic
 * @param {Date} initialDate - Initial selected date
 * @param {Function} onDateChange - Callback when date changes
 */
export const useCalendarNavigation = (initialDate = new Date(), onDateChange) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  const selectedDateKey = useMemo(() => formatDate(selectedDate), [selectedDate]);
  const todayKey = useMemo(() => formatDate(new Date()), []);

  // Navigate to next day
  const goToNextDay = useCallback(() => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
    onDateChange?.(nextDay);
  }, [selectedDate, onDateChange]);

  // Navigate to previous day
  const goToPrevDay = useCallback(() => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
    onDateChange?.(prevDay);
  }, [selectedDate, onDateChange]);

  // Navigate to next month
  const goToNextMonth = useCallback(() => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  }, [currentMonth]);

  // Navigate to previous month
  const goToPrevMonth = useCallback(() => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  }, [currentMonth]);

  // Select a specific date
  const selectDate = useCallback((date) => {
    setSelectedDate(date);
    onDateChange?.(date);
  }, [onDateChange]);

  // Get phase info for selected date
  const phaseInfo = useMemo(() => {
    const weekNum = getWeekNumber(selectedDate);
    return {
      weekNum,
      phase: getPhaseFromWeek(weekNum),
    };
  }, [selectedDate]);

  return {
    selectedDate,
    selectedDateKey,
    todayKey,
    currentMonth,
    phaseInfo,
    goToNextDay,
    goToPrevDay,
    goToNextMonth,
    goToPrevMonth,
    selectDate,
    setCurrentMonth,
  };
};























