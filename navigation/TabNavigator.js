import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import theme from "../theme";

import TodayScreen from "../screens/TodayScreen";
import WeekScreen from "../screens/WeekScreen";
import AICoachScreenOptimal from "../screens/AICoachScreenOptimal";

const Tab = createBottomTabNavigator();

const tabs = [
  { name: "Planner", component: WeekScreen, icon: "calendar", iconSet: "Feather" },
  { name: "Home", component: TodayScreen, icon: "home", iconSet: "Feather" },
  { name: "AI", component: AICoachScreenOptimal, icon: "robot-outline", iconSet: "MaterialCommunityIcons" },
];

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const baseTabStyle = {
    ...styles.tabBar,
    minHeight: 56 + insets.bottom,
    paddingBottom: Math.max(insets.bottom, 8),
    paddingTop: 0,
  };

  return (
    <Tab.Navigator
      initialRouteName="AI"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: baseTabStyle,
      }}
    >
      {tabs.map(({ name, component, icon, iconSet }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          listeners={{
            tabPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          }}
          options={{
            tabBarAccessibilityLabel: `${name} tab`,
            tabBarStyle: name === "AI" ? { display: "none" } : baseTabStyle,
            tabBarIcon: ({ focused }) => {
              let IconComponent = Feather;
              if (iconSet === "Ionicons") IconComponent = Ionicons;
              if (iconSet === "MaterialCommunityIcons") IconComponent = MaterialCommunityIcons;
              return (
                <IconComponent
                  name={icon}
                  size={22}
                  color={focused ? theme.colors.text : theme.colors.textMuted}
                />
              );
            },
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
