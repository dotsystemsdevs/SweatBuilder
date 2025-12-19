import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../theme";
import { haptic } from "../utils/haptics";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

const AI_STYLE_KEY = "ai_coach_style";

const styles_list = [
  {
    id: "optimal",
    name: "Optimal",
    description: "Premium Apple-inspired design",
    preview: {
      bg: theme.colors.screenBackground,
      accent: theme.colors.textTitle,
      text: theme.colors.textMuted,
    },
    recommended: true,
  },
  {
    id: "v1",
    name: "Classic",
    description: "Original clean design",
    preview: {
      bg: theme.colors.screenBackground,
      accent: theme.colors.textTitle,
      text: theme.colors.textMuted,
    },
  },
  {
    id: "v2",
    name: "Cards",
    description: "Subtle shadows & cards",
    preview: {
      bg: theme.colors.screenBackground,
      accent: theme.colors.textTitle,
      text: theme.colors.textMuted,
    },
  },
  {
    id: "v3",
    name: "Inline",
    description: "Clean labeled messages",
    preview: {
      bg: theme.colors.screenBackground,
      accent: theme.colors.textTitle,
      text: theme.colors.textMuted,
    },
  },
  {
    id: "v4",
    name: "Dots",
    description: "Minimal with indicators",
    preview: {
      bg: theme.colors.screenBackground,
      accent: theme.colors.textTitle,
      text: theme.colors.textMuted,
    },
  },
  {
    id: "v5",
    name: "Lines",
    description: "Ultra minimal text-focus",
    preview: {
      bg: theme.colors.screenBackground,
      accent: theme.colors.textTitle,
      text: theme.colors.textMuted,
    },
  },
];

export default function AICoachSelector() {
  useStatusBar(theme.colors.screenBackground);
  const navigation = useNavigation();
  const [selectedStyle, setSelectedStyle] = useState("optimal");

  useEffect(() => {
    loadSavedStyle();
  }, []);

  const loadSavedStyle = async () => {
    try {
      const saved = await AsyncStorage.getItem(AI_STYLE_KEY);
      if (saved) setSelectedStyle(saved);
    } catch (e) {
      // ignore
    }
  };

  const handleSelectStyle = async (styleId) => {
    haptic("impactLight");
    setSelectedStyle(styleId);
    try {
      await AsyncStorage.setItem(AI_STYLE_KEY, styleId);
    } catch (e) {
      // ignore
    }
  };

  const handleOpenChat = () => {
    haptic("impactMedium");
    const screenMap = {
      optimal: "AIChatOptimal",
      v1: "AIChat",
      v2: "AIChatV2",
      v3: "AIChatV3",
      v4: "AIChatV4",
      v5: "AIChatV5",
    };
    navigation.navigate(screenMap[selectedStyle] || "AIChatOptimal");
  };

  return (
    <DynamicSafeAreaView style={styles.screen} backgroundColor={theme.colors.screenBackground}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textTitle} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Coach Style</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Choose your preferred chat style</Text>

        <View style={styles.grid}>
          {styles_list.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                selectedStyle === style.id && styles.styleCardSelected,
              ]}
              onPress={() => handleSelectStyle(style.id)}
              activeOpacity={0.7}
            >
              {/* Preview */}
              <View style={[styles.preview, { backgroundColor: style.preview.bg }]}>
                <View style={[styles.previewHeader, { backgroundColor: style.preview.accent }]} />
                <View style={styles.previewMessages}>
                  <View style={[styles.previewBubbleAI, { backgroundColor: style.preview.accent + "20" }]} />
                  <View style={[styles.previewBubbleUser, { backgroundColor: style.preview.accent }]} />
                </View>
                <View style={[styles.previewInput, { borderColor: style.preview.accent + "40" }]} />
              </View>

              {/* Info */}
              <View style={styles.styleInfo}>
                <View style={styles.styleNameRow}>
                  <Text style={styles.styleName}>{style.name}</Text>
                  {style.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.styleDescription}>{style.description}</Text>
              </View>

              {/* Selected indicator */}
              {selectedStyle === style.id && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Open Chat Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.openButton} onPress={handleOpenChat}>
          <Text style={styles.openButtonText}>Open Chat</Text>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.screenBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.textTitle,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: theme.spacing.screenPadding,
    paddingTop: 0,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
  },
  grid: {
    gap: theme.spacing.md,
  },
  styleCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  styleCardSelected: {
    borderColor: theme.colors.textTitle,
  },
  preview: {
    height: 120,
    padding: theme.spacing.sm,
    justifyContent: "space-between",
  },
  previewHeader: {
    height: 8,
    borderRadius: 4,
    width: "40%",
    opacity: 0.8,
  },
  previewMessages: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
    paddingVertical: theme.spacing.sm,
  },
  previewBubbleAI: {
    height: 16,
    width: "60%",
    borderRadius: 8,
  },
  previewBubbleUser: {
    height: 16,
    width: "50%",
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  previewInput: {
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  styleInfo: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.sectionBackground,
  },
  styleNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  styleName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
  },
  recommendedBadge: {
    backgroundColor: theme.colors.textTitle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  styleDescription: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  selectedBadge: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
  },
  footer: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.xl,
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.textTitle,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
  },
  openButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.white,
  },
});
