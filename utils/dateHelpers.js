/**
 * Date utility functions for the SheetFit app
 */

import { formatDateToISO, formatDisplayDate } from "./dateFormatters";

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1, date2) => {
  if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
    return false;
  }
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @deprecated Use formatDateToISO from dateFormatters instead
 */
export const formatDate = (d) => {
  if (!(d instanceof Date)) {
    return "";
  }
  return formatDateToISO(d);
};

/**
 * Format today's date as readable label
 */
export const formatTodayLabel = () => {
  return formatDisplayDate(new Date());
};

/**
 * Get start of week (Monday) for a given date
 */
export const getStartOfWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diffToMonday);
  return d;
};

/**
 * Get end of week (Sunday) for a given date
 */
export const getEndOfWeek = (date) => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
};

/**
 * Add days to a date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get days between two dates
 */
export const getDaysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
};
