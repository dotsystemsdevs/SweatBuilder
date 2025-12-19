/**
 * Centralized error handling utilities
 */

/**
 * Log error with context
 */
export const logError = (context, error, additionalInfo = {}) => {
  if (__DEV__) {
    console.error(`[${context}] Error:`, error, additionalInfo);
  }
  // In production, you could send to error tracking service
  // e.g., Sentry, Crashlytics, etc.
};

/**
 * Create a user-friendly error message
 */
export const getUserFriendlyError = (error) => {
  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

/**
 * Handle async errors with fallback
 */
export const handleAsyncError = async (asyncFn, fallbackValue = null, context = "Unknown") => {
  try {
    return await asyncFn();
  } catch (error) {
    logError(context, error);
    return fallbackValue;
  }
};























