import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import theme from '../theme';

/**
 * Hook to manage translucent status bar and navigation bar for modals
 * @param {boolean} isVisible - Whether modal is visible
 * @param {string} statusBarStyle - Status bar style: 'light' | 'dark' | 'auto' (default: 'light')
 * @param {string} navBarStyle - Navigation bar style: 'light' | 'dark' (default: 'light')
 * @param {string} backgroundColor - Navigation bar background color when modal is open (default: theme.colors.overlay)
 * @param {string} resetColor - Navigation bar color to reset to when modal closes (default: theme.colors.white)
 */
export function useTranslucentBars(
  isVisible,
  statusBarStyle = 'light',
  navBarStyle = 'light',
  backgroundColor = theme.colors.overlay,
  resetColor = theme.colors.white
) {
  useEffect(() => {
    if (isVisible) {
      // Set navigation bar to match modal overlay
      if (Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync(backgroundColor);
        NavigationBar.setButtonStyleAsync(navBarStyle);
      }
    } else {
      // Reset navigation bar when modal closes
      if (Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync(resetColor);
        // Determine if reset color is light or dark
        const isLight = isColorLight(resetColor);
        NavigationBar.setButtonStyleAsync(isLight ? 'dark' : 'light');
      }
    }
  }, [isVisible, navBarStyle, backgroundColor, resetColor]);
}

/**
 * Helper function to determine if a color is light or dark
 */
function isColorLight(color) {
  if (typeof color === 'string' && color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  }
  return true;
}







