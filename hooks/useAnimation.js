/**
 * Custom hook for common animation patterns
 */

import { useRef, useCallback } from "react";
import { Animated, Easing } from "react-native";

/**
 * Hook for slide animations
 */
export const useSlideAnimation = (initialValue = 0) => {
  const animValue = useRef(new Animated.Value(initialValue)).current;

  const slideIn = useCallback((direction = "right", duration = 300) => {
    const toValue = direction === "right" ? 0 : 0;
    const fromValue = direction === "right" ? -1000 : 1000;
    
    animValue.setValue(fromValue);
    Animated.spring(animValue, {
      toValue,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [animValue]);

  const slideOut = useCallback((direction = "left", duration = 300) => {
    const toValue = direction === "left" ? -1000 : 1000;
    
    Animated.timing(animValue, {
      toValue,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animValue]);

  return {
    animValue,
    slideIn,
    slideOut,
  };
};

/**
 * Hook for fade animations
 */
export const useFadeAnimation = () => {
  const opacity = useRef(new Animated.Value(1)).current;

  const fadeIn = useCallback((duration = 200) => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const fadeOut = useCallback((duration = 200) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return {
    opacity,
    fadeIn,
    fadeOut,
  };
};

/**
 * Hook for scale animations
 */
export const useScaleAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const scaleUp = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1.05,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start();
    });
  }, [scale]);

  return {
    scale,
    scaleUp,
  };
};























