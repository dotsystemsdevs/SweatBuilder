/**
 * Validation utilities
 */

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate text length
 */
export const isValidLength = (text, min = 0, max = Infinity) => {
  if (!text) return min === 0;
  return text.length >= min && text.length <= max;
};

/**
 * Validate non-empty string
 */
export const isNonEmpty = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

/**
 * Validate date is valid Date object
 */
export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime());
};























