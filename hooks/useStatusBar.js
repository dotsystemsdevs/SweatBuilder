import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import theme from '../theme';

/**
 * Hook to dynamically set status bar style based on background color
 * @param {string} backgroundColor - The background color of the screen (default: theme.colors.background)
 * @param {string} style - Override style: 'auto', 'light-content', or 'dark-content' (default: 'auto')
 */
export function useStatusBar(backgroundColor = theme.colors.background, style = 'auto') {
  // Determine if background is light or dark
  const isLightBackground = (bgColor) => {
    if (!bgColor) return true;
    
    // Handle theme color references
    if (bgColor === theme.colors.background || 
        bgColor === theme.colors.screenBackground ||
        bgColor === theme.colors.cardBackground ||
        bgColor === theme.colors.white) {
      return true;
    }
    
    // Handle dark colors
    if (bgColor === theme.colors.primary ||
        bgColor === theme.colors.textTitle ||
        bgColor === theme.colors.primarySoft) {
      return false;
    }
    
    // Default to light
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      if (style === 'auto') {
        const isLight = isLightBackground(backgroundColor);
        // Light background = dark content, dark background = light content
        StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content', true);
      } else {
        StatusBar.setBarStyle(style, true);
      }
    }, [backgroundColor, style])
  );
}

