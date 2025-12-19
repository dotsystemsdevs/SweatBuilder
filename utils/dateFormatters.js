/**
 * Date formatting utilities
 */

import { format } from "date-fns";

/**
 * Format timestamp for messages (HH:mm)
 */
export const formatMessageTimestamp = (date = new Date()) => {
  return format(date, "HH:mm");
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export const formatDateToISO = (date) => {
  if (!(date instanceof Date)) {
    return "";
  }
  return date.toISOString().slice(0, 10);
};

/**
 * Format date for display
 */
export const formatDisplayDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
};

/**
 * Get current timestamp in ISO format
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

