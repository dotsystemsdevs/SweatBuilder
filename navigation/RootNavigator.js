import { useEffect } from "react";
import { DefaultTheme as NavigationDefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from "@react-navigation/stack";
import { Easing, ActivityIndicator, View } from "react-native";
import TabNavigator from "./TabNavigator";
import WorkoutModeScreen from "../screens/WorkoutModeScreen";
import ReflectionScreen from "../screens/ReflectionScreen";
import ReflectionLogScreen from "../screens/ReflectionLogScreen";
import SettingsScreen from "../screens/SettingsScreen";
import NotificationsSettingsScreen from "../screens/NotificationsSettingsScreen";
import AppearanceSettingsScreen from "../screens/AppearanceSettingsScreen";
import UnitsSettingsScreen from "../screens/UnitsSettingsScreen";
import MonthScreen from "../screens/MonthScreen";
import SummaryView from "../screens/SummaryView";
import CardTestScreen from "../screens/CardTestScreen";
import ThemeScreen from "../screens/ThemeScreen";
import WorkoutCardsScreen from "../screens/WorkoutCardsScreen";
import WorkoutUIScreen from "../screens/WorkoutUIScreen";
import DesignSystemScreen from "../screens/DesignSystemScreen";
import AIOnboardingScreen from "../screens/AIOnboardingScreen";
import ComingSoonScreen from "../screens/ComingSoonScreen";
import { useOnboardingStore } from "../store/onboardingStore";
import theme from "../theme";

// Smooth slide transition config (Apple-style)
const slideTransition = {
  gestureEnabled: true,
  gestureDirection: "horizontal",
  transitionSpec: {
    open: {
      animation: "timing",
      config: {
        duration: 300,
        easing: Easing.out(Easing.poly(4)),
      },
    },
    close: {
      animation: "timing",
      config: {
        duration: 250,
        easing: Easing.in(Easing.poly(4)),
      },
    },
  },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

// Modal slide-up transition
const modalTransition = {
  gestureEnabled: true,
  gestureDirection: "vertical",
  ...TransitionPresets.ModalSlideFromBottomIOS,
};

const Stack = createStackNavigator();

const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.background,
    text: theme.colors.textPrimary,
    border: theme.colors.lightAccent,
  },
};

export default function RootNavigator() {
  const { isLoading, hasCompletedOnboarding, completeOnboarding } = useOnboardingStore();

  // Auto-complete onboarding to skip welcome screen and go directly to AI chat
  useEffect(() => {
    if (!isLoading && !hasCompletedOnboarding) {
      completeOnboarding({
        startedAt: new Date().toISOString(),
        onboardingMode: "ai_guided",
      });
    }
  }, [isLoading, hasCompletedOnboarding, completeOnboarding]);

  // Show loading while checking onboarding status
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.yellow} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background },
          ...slideTransition,
        }}
        initialRouteName="Tabs"
      >
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="WorkoutMode"
          component={WorkoutModeScreen}
          options={modalTransition}
        />
        <Stack.Screen
          name="Reflection"
          component={ReflectionScreen}
          options={modalTransition}
        />
        <Stack.Screen name="ReflectionLog" component={ReflectionLogScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
        <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
        <Stack.Screen name="UnitsSettings" component={UnitsSettingsScreen} />
        <Stack.Screen name="Month" component={MonthScreen} />
        <Stack.Screen name="SummaryView" component={SummaryView} />
        <Stack.Screen name="CardTest" component={CardTestScreen} />
        <Stack.Screen name="Theme" component={ThemeScreen} />
        <Stack.Screen name="WorkoutCards" component={WorkoutCardsScreen} />
        <Stack.Screen name="WorkoutUI" component={WorkoutUIScreen} />
        <Stack.Screen name="DesignSystem" component={DesignSystemScreen} />
        <Stack.Screen
          name="AIOnboarding"
          component={AIOnboardingScreen}
          options={modalTransition}
        />
        <Stack.Screen
          name="ComingSoon"
          component={ComingSoonScreen}
          options={slideTransition}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
