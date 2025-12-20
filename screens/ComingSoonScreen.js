import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DynamicSafeAreaView from '../components/DynamicSafeAreaView';
import { useStatusBar } from '../hooks/useStatusBar';
import { haptic } from '../utils/haptics';
import theme from '../theme';

export default function ComingSoonScreen({ navigation, route }) {
  useStatusBar('light');
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    haptic('light');
    navigation.goBack();
  };

  const handleGoHome = () => {
    haptic('medium');
    navigation.navigate('Main');
  };

  return (
    <DynamicSafeAreaView style={styles.container} lightContent>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Steg 3</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.colors.orange, theme.colors.purple]}
            style={styles.iconGradient}
          >
            <Feather name="clock" size={60} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Coming Soon</Text>

        <Text style={styles.description}>
          We're working on the next step in your training journey. Your profile
          has been saved and we'll use it to create a personalized plan for you.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={20} color={theme.colors.accent} />
            <Text style={styles.featureText}>Your training profile is saved</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="calendar" size={20} color={theme.colors.accent} />
            <Text style={styles.featureText}>Personalized training plan</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="trending-up" size={20} color={theme.colors.accent} />
            <Text style={styles.featureText}>AI-driven progression</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <LinearGradient
            colors={[theme.colors.orange, theme.colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.homeButtonGradient}
          >
            <Text style={styles.homeButtonText}>Go to app</Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    color: theme.colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featureList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  homeButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  homeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
  },
  homeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
});
