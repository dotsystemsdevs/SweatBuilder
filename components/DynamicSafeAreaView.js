import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import theme from '../theme';

const DynamicSafeAreaView = memo(function DynamicSafeAreaView({
  backgroundColor = theme.colors.background,
  topBackgroundColor,
  bottomBackgroundColor,
  modalBackgroundColor,
  isModalOpen = false,
  edges = ["top", "bottom"],
  style,
  children,
  ...props
}) {
  const insets = useSafeAreaInsets();

  // Use modal color when modal is open, otherwise use provided colors or fallback
  const topBg = isModalOpen && modalBackgroundColor
    ? modalBackgroundColor
    : (topBackgroundColor || backgroundColor);
  const bottomBg = isModalOpen && modalBackgroundColor
    ? modalBackgroundColor
    : (bottomBackgroundColor || backgroundColor);

  // Check if we need separate top/bottom colors
  const needsSeparateColors = topBackgroundColor || bottomBackgroundColor || isModalOpen;
  
  if (needsSeparateColors) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        {/* Top safe area with custom color */}
        {edges.includes("top") && (
          <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: topBg }]} />
        )}
        
        {/* Main content area */}
        <View style={[styles.content, style]}>
          {children}
        </View>
        
        {/* Bottom safe area with custom color */}
        {edges.includes("bottom") && (
          <View style={[styles.bottomSafeArea, { height: insets.bottom, backgroundColor: bottomBg }]} />
        )}
      </View>
    );
  }
  
  // Simple case: same color everywhere
  return (
    <SafeAreaView style={[{ backgroundColor }, style]} edges={edges} {...props}>
      {children}
    </SafeAreaView>
  );
});

DynamicSafeAreaView.propTypes = {
  backgroundColor: PropTypes.string,
  topBackgroundColor: PropTypes.string,
  bottomBackgroundColor: PropTypes.string,
  modalBackgroundColor: PropTypes.string,
  isModalOpen: PropTypes.bool,
  edges: PropTypes.arrayOf(PropTypes.oneOf(['top', 'bottom', 'left', 'right'])),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  children: PropTypes.node,
};

export default DynamicSafeAreaView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSafeArea: {
    width: '100%',
  },
  content: {
    flex: 1,
  },
  bottomSafeArea: {
    width: '100%',
  },
});
