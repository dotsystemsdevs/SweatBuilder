/**
 * Custom hook for handling swipe gestures
 * Provides reusable swipe detection logic for horizontal swipes
 */

import { useRef, useCallback } from "react";
import { PanResponder } from "react-native";

/**
 * Hook for handling horizontal swipe gestures
 * @param {Object} config - Configuration object
 * @param {Function} config.onSwipeLeft - Callback for left swipe
 * @param {Function} config.onSwipeRight - Callback for right swipe
 * @param {number} config.threshold - Minimum swipe distance (default: 15)
 * @param {number} config.velocityThreshold - Minimum swipe velocity (default: 0.3)
 * @param {Function} config.shouldHandleSwipe - Optional function to determine if swipe should be handled
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 15,
  velocityThreshold = 0.3,
  shouldHandleSwipe,
}) => {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > threshold;
      },
      onPanResponderGrant: (evt) => {
        // Check if swipe should be handled based on touch location
        if (shouldHandleSwipe && !shouldHandleSwipe(evt.nativeEvent.pageY)) {
          return false;
        }
      },
      onPanResponderMove: () => {
        // Allow movement
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Check if swipe should be handled based on touch location
        if (shouldHandleSwipe && !shouldHandleSwipe(evt.nativeEvent.pageY)) {
          return;
        }

        const { dx, vx } = gestureState;

        // Check if swipe meets threshold requirements
        if (Math.abs(dx) > threshold && Math.abs(vx) > velocityThreshold) {
          if (dx > 0) {
            // Swipe right
            onSwipeRight?.();
          } else {
            // Swipe left
            onSwipeLeft?.();
          }
        }
      },
    })
  ).current;

  return panResponder;
};























