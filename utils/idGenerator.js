/**
 * ID generation utilities
 */

/**
 * Generate a unique ID based on timestamp and random string
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Generate a simple numeric ID
 */
export const generateNumericId = () => {
  return Date.now().toString();
};























