import React, { useMemo, useState, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import theme from "../theme";
import { useWorkoutStore } from "../store/workoutStore";
import { useStatusBar } from "../hooks/useStatusBar";
import { WORKOUT_STATUS } from "../constants/appConstants";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import { isRestDay, getWorkoutsByDate, getWorkoutByDate } from "../__mocks__/workoutData";
import { generateDefaultProgram } from "../__mocks__/programData";

import {
  TodayCard,
  RestCard,
  CompletedCard,
  SkippedCard,
} from "../components/Cards/index";
import WorkoutPreviewModal from "../modals/WorkoutPreviewModal";

// Get program goal
const getGoal = () => {
  const program = generateDefaultProgram();
  return program.goal || "Build strength & stay consistent";
};

// Get days left in program
const getDaysLeft = () => {
  const program = generateDefaultProgram();
  const startDate = new Date(program.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (program.duration * 7)); // duration in weeks
  const today = new Date();
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Format today's date
const formatDate = () => {
  const now = new Date();
  const options = { weekday: "long", month: "short", day: "numeric" };
  return now.toLocaleDateString("en-US", options);
};

// Get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Get emotional message based on week stats
const getWeekMessage = (done, skipped, left) => {
  const total = done + skipped + left;
  const completionRate = total > 0 ? done / (done + skipped) : 1;

  if (done === 0 && skipped === 0) {
    return { text: "Fresh start this week", icon: "sunrise", color: "textMuted" };
  }
  if (completionRate >= 0.8 && done >= 2) {
    return { text: "Strong week so far!", icon: "trending-up", color: "green" };
  }
  if (completionRate >= 0.5) {
    return { text: "You're on track", icon: "check-circle", color: "blue" };
  }
  if (skipped > done) {
    return { text: "Let's get back on track", icon: "refresh-cw", color: "orange" };
  }
  return { text: "Keep it going", icon: "arrow-right", color: "textMuted" };
};

// Get workout intensity/load
const getWorkoutLoad = (workout) => {
  if (!workout) return null;
  const exerciseCount = workout.exercises?.length || 0;
  const durationMin = parseInt(workout.duration) || 45;

  if (durationMin >= 55 || exerciseCount >= 8) {
    return { level: "high", label: "High intensity", color: "orange" };
  }
  if (durationMin >= 40 || exerciseCount >= 6) {
    return { level: "normal", label: "Normal load", color: "blue" };
  }
  return { level: "low", label: "Light session", color: "green" };
};

// Get personalized insight based on recent activity
const getInsight = (workoutHistory, todayWorkout, isRest) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Find yesterday's workout
  const yesterdayEntry = workoutHistory.find(w => {
    const wDate = new Date(w.date);
    return wDate.toDateString() === yesterday.toDateString();
  });

  // Check if yesterday was hard (high effort)
  const yesterdayEffort = yesterdayEntry?.reflectionData?.effort || 0;
  const yesterdayCompleted = yesterdayEntry?.status === "completed";

  // Count recent workouts
  const lastWeek = workoutHistory.filter(w => {
    const wDate = new Date(w.date);
    const diffDays = (today - wDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && w.status === "completed";
  }).length;

  // Generate insight
  if (yesterdayCompleted && yesterdayEffort >= 7) {
    return "Tough session yesterday! Stay hydrated and get good sleep tonight.";
  }
  if (yesterdayCompleted && yesterdayEffort >= 5) {
    return "Nice work yesterday. Keep your energy up with good food and rest.";
  }
  if (isRest) {
    return "Rest day today. Perfect time to stretch and recover.";
  }
  if (lastWeek >= 4) {
    return "Strong week! You're building great momentum, keep it up.";
  }
  if (lastWeek === 0) {
    return "New week, new opportunities. One workout at a time!";
  }
  if (todayWorkout?.title?.toLowerCase().includes("leg")) {
    return "Leg day builds your foundation. Don't skip the warmup!";
  }
  return "Focus on form today. Quality over quantity.";
};

export default function TodayScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const { workoutHistory, activeWorkout } = useWorkoutStore();

  // Get today's workouts (can be multiple)
  const todayData = useMemo(() => {
    const today = new Date();
    const workouts = getWorkoutsByDate(today);
    const isRest = isRestDay(today);

    // Check status for each workout
    const workoutsWithStatus = workouts.map((workout) => {
      const todayEntry = workoutHistory.find(w => {
        const wDate = new Date(w.date);
        return wDate.toDateString() === today.toDateString() && w.workout?.id === workout.id;
      });

      return {
        workout,
        status: todayEntry?.status || (activeWorkout?.id === workout.id ? "active" : "pending"),
        isCompleted: todayEntry?.status === WORKOUT_STATUS.COMPLETED,
        isSkipped: todayEntry?.status === WORKOUT_STATUS.SKIPPED,
      };
    });

    return {
      workouts: workoutsWithStatus,
      isRest,
      // For backwards compatibility
      workout: workouts[0] || null,
    };
  }, [workoutHistory, activeWorkout]);

  // Sort workouts: pending first, then completed/skipped
  const sortedWorkouts = useMemo(() => {
    return [...todayData.workouts].sort((a, b) => {
      const aCompleted = a.isCompleted || a.isSkipped ? 1 : 0;
      const bCompleted = b.isCompleted || b.isSkipped ? 1 : 0;
      return aCompleted - bCompleted;
    });
  }, [todayData.workouts]);

  // Track active card index for dots
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Calculate this week's stats: done, skipped, left
  const weekStats = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // Get Monday
    monday.setHours(0, 0, 0, 0);

    // Get this week's history
    const thisWeekWorkouts = workoutHistory.filter((w) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= monday;
    });

    const done = thisWeekWorkouts.filter((w) => w.status === WORKOUT_STATUS.COMPLETED).length;
    const skipped = thisWeekWorkouts.filter((w) => w.status === WORKOUT_STATUS.SKIPPED).length;

    // Calculate remaining workouts this week (Mon-Sun)
    let left = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      // Only count future days (including today if not done)
      if (date >= today || date.toDateString() === today.toDateString()) {
        const scheduledWorkout = getWorkoutByDate(date);
        const isRest = isRestDay(date);
        const hasEntry = thisWeekWorkouts.some(
          (w) => new Date(w.date).toDateString() === date.toDateString()
        );

        if (scheduledWorkout && !isRest && !hasEntry) {
          left++;
        }
      }
    }

    return { done, skipped, left };
  }, [workoutHistory]);

  // Calculate current streak
  const streak = useMemo(() => {
    if (workoutHistory.length === 0) return 0;

    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sorted = [...workoutHistory]
      .filter((w) => w.status === WORKOUT_STATUS.COMPLETED)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    for (let i = 0; i < sorted.length; i++) {
      const workoutDate = new Date(sorted[i].date);
      workoutDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (workoutDate.getTime() === expectedDate.getTime()) {
        count++;
      } else if (i === 0 && workoutDate.getTime() === today.getTime() - 86400000) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [workoutHistory]);

  // AI typing animation state
  const [isAiTyping, setIsAiTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const [showTapHint, setShowTapHint] = useState(false);
  const [aiIconIndex, setAiIconIndex] = useState(0);
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const fullMessageRef = useRef("");
  const typeIntervalRef = useRef(null);

  // AI robot icon variants with individual opacity animations for smooth crossfade
  const aiIcons = ["robot-outline", "robot-happy-outline", "robot-excited-outline", "robot-love-outline"];
  const iconAnims = useRef(aiIcons.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  // Start button shimmer animation
  const buttonGlow = useRef(new Animated.Value(0)).current;

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);


  // Open preview for a specific workout
  const openPreview = (workout) => {
    setSelectedWorkout(workout);
    setShowPreview(true);
  };

  // Trigger typing animation on screen focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset state
      setIsAiTyping(true);
      setDisplayedText("");
      setShowTapHint(false);

      // Get the full message
      fullMessageRef.current = getInsight(workoutHistory, todayData.workout, todayData.isRest);

      // Animate typing dots
      const animateDots = () => {
        const dotAnimation = (anim, delay) =>
          Animated.sequence([
            Animated.delay(delay),
            Animated.loop(
              Animated.sequence([
                Animated.timing(anim, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(anim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ])
            ),
          ]);

        Animated.parallel([
          dotAnimation(dot1Anim, 0),
          dotAnimation(dot2Anim, 150),
          dotAnimation(dot3Anim, 300),
        ]).start();
      };

      animateDots();

      // After delay, start typewriter effect
      const timer = setTimeout(() => {
        setIsAiTyping(false);
        dot1Anim.stopAnimation();
        dot2Anim.stopAnimation();
        dot3Anim.stopAnimation();

        // Typewriter effect - character by character
        let charIndex = 0;
        typeIntervalRef.current = setInterval(() => {
          if (charIndex < fullMessageRef.current.length) {
            setDisplayedText(fullMessageRef.current.slice(0, charIndex + 1));
            charIndex++;
          } else {
            clearInterval(typeIntervalRef.current);
            setShowTapHint(true);
          }
        }, 25); // 25ms per character
      }, 1200);

      return () => {
        clearTimeout(timer);
        if (typeIntervalRef.current) {
          clearInterval(typeIntervalRef.current);
        }
        dot1Anim.stopAnimation();
        dot2Anim.stopAnimation();
        dot3Anim.stopAnimation();
      };
    }, [workoutHistory, todayData.workout, todayData.isRest])
  );

  // Animate AI icon with smooth crossfade
  React.useEffect(() => {
    let currentIndex = 0;
    const iconInterval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % aiIcons.length;

      // Crossfade: fade out current, fade in next simultaneously
      Animated.parallel([
        Animated.timing(iconAnims[currentIndex], {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(iconAnims[nextIndex], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      currentIndex = nextIndex;
    }, 3000);

    return () => clearInterval(iconInterval);
  }, []);

  // Gentle bounce-in animation for start button
  React.useEffect(() => {
    buttonGlow.setValue(0.8);
    Animated.spring(buttonGlow, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <DynamicSafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{formatDate()}</Text>
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("Settings");
            }}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Goal Card */}
        <View style={styles.goalCard}>
          {/* Header */}
          <View style={styles.goalCardHeader}>
            <Text style={styles.goalCardTitle}>Your Goal</Text>
            <Text style={styles.goalDaysText}>{getDaysLeft()} days left</Text>
          </View>
          {/* Divider */}
          <View style={styles.goalCardDivider} />
          {/* Goal text */}
          <Text style={styles.goalCardText}>{getGoal()}</Text>
          {/* Progress bar */}
          <View style={styles.goalProgressContainer}>
            <View style={styles.goalProgressBar}>
              <View style={[styles.goalProgressFill, { width: `${Math.min(100, Math.max(5, 100 - (getDaysLeft() / 56) * 100))}%` }]} />
            </View>
          </View>
        </View>

        {/* AI Coach Card */}
        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("AI");
          }}
          activeOpacity={0.7}
          disabled={isAiTyping}
        >
          <View style={styles.aiCardRow}>
            <View style={styles.aiAvatar}>
              {aiIcons.map((iconName, index) => (
                <Animated.View
                  key={iconName}
                  style={[
                    styles.aiIconOverlay,
                    { opacity: iconAnims[index] },
                  ]}
                >
                  <MaterialCommunityIcons name={iconName} size={18} color={theme.colors.purple} />
                </Animated.View>
              ))}
            </View>
            {/* Speech bubble with pointer */}
            <View style={styles.aiBubbleContainer}>
              <View style={styles.aiBubblePointer} />
              <View style={styles.aiBubble}>
            {isAiTyping ? (
              <View style={styles.typingIndicator}>
                <Animated.View
                  style={[
                    styles.typingDot,
                    {
                      opacity: dot1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                      transform: [
                        {
                          scale: dot1Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    {
                      opacity: dot2Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                      transform: [
                        {
                          scale: dot2Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    {
                      opacity: dot3Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                      transform: [
                        {
                          scale: dot3Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            ) : (
              <Text style={styles.aiBubbleText}>
                {displayedText}
              </Text>
            )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Today's Workout Cards */}
        {todayData.isRest ? (
          <RestCard
            date="Today"
            purpose="Recovery is part of the plan"
          />
        ) : sortedWorkouts.length > 0 ? (
          <>
            {/* Horizontal scroll for workout cards */}
            {sortedWorkouts.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const cardWidth = SCREEN_WIDTH - (theme.spacing.screenPadding * 2) - 24;
                  const snapWidth = cardWidth + theme.spacing.md;
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / snapWidth);
                  if (newIndex !== activeCardIndex && newIndex >= 0 && newIndex < sortedWorkouts.length) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveCardIndex(newIndex);
                  }
                }}
                scrollEventThrottle={16}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.horizontalScrollContent}
                decelerationRate="fast"
                snapToInterval={SCREEN_WIDTH - (theme.spacing.screenPadding * 2) - 24 + theme.spacing.md}
                snapToAlignment="start"
              >
                {sortedWorkouts.map((workoutData, index) => {
                  const cardWidth = SCREEN_WIDTH - (theme.spacing.screenPadding * 2) - 24;
                  const isActiveCard = index === activeCardIndex;

                  if (workoutData.isCompleted) {
                    return (
                      <View key={workoutData.workout?.id || index} style={{ width: cardWidth, marginRight: theme.spacing.md }}>
                        <CompletedCard
                          title={workoutData.workout?.title || "Workout"}
                          purpose={workoutData.workout?.purpose || ""}
                          date="Today"
                          isActive={isActiveCard}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            openPreview(workoutData.workout);
                          }}
                        />
                      </View>
                    );
                  } else if (workoutData.isSkipped) {
                    return (
                      <View key={workoutData.workout?.id || index} style={{ width: cardWidth, marginRight: theme.spacing.md }}>
                        <SkippedCard
                          title={workoutData.workout?.title || "Workout"}
                          purpose={workoutData.workout?.purpose || ""}
                          date="Today"
                          isActive={isActiveCard}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            openPreview(workoutData.workout);
                          }}
                        />
                      </View>
                    );
                  } else {
                    return (
                      <View key={workoutData.workout?.id || index} style={{ width: cardWidth, marginRight: theme.spacing.md }}>
                        <TodayCard
                          status={workoutData.status}
                          title={workoutData.workout.title}
                          subtitle={workoutData.workout.subtitle}
                          purpose={workoutData.workout.purpose}
                          targetEffort={workoutData.workout.targetEffort || 7}
                          isActive={isActiveCard}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            openPreview(workoutData.workout);
                          }}
                        />
                      </View>
                    );
                  }
                })}
              </ScrollView>
            ) : (
              /* Single workout - no scroll needed */
              (() => {
                const workoutData = sortedWorkouts[0];
                if (!workoutData) return null;

                if (workoutData.isCompleted) {
                  return (
                    <CompletedCard
                      title={workoutData.workout?.title || "Workout"}
                      purpose={workoutData.workout?.purpose || ""}
                      date="Today"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        openPreview(workoutData.workout);
                      }}
                    />
                  );
                } else if (workoutData.isSkipped) {
                  return (
                    <SkippedCard
                      title={workoutData.workout?.title || "Workout"}
                      purpose={workoutData.workout?.purpose || ""}
                      date="Today"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        openPreview(workoutData.workout);
                      }}
                    />
                  );
                } else {
                  return (
                    <TodayCard
                      status={workoutData.status}
                      title={workoutData.workout.title}
                      subtitle={workoutData.workout.subtitle}
                      purpose={workoutData.workout.purpose}
                      targetEffort={workoutData.workout.targetEffort || 7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        openPreview(workoutData.workout);
                      }}
                    />
                  );
                }
              })()
            )}

            {/* Swap/Skip actions - always same position below cards */}
            <View style={styles.cardActionsRow}>
              {sortedWorkouts[activeCardIndex] &&
               !sortedWorkouts[activeCardIndex].isCompleted &&
               !sortedWorkouts[activeCardIndex].isSkipped ? (
                <>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate("AI", { prompt: "I want to swap this workout for something else" });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="swap-horizontal" size={16} color={theme.colors.textMuted} />
                    <Text style={styles.cardActionText}>Swap</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate("Reflection", { mode: "skip", workout: sortedWorkouts[activeCardIndex].workout });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={16} color={theme.colors.textMuted} />
                    <Text style={styles.cardActionText}>Skip</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.cardActionsPlaceholder} />
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Floating Start Button - shows for active workout */}
      {!todayData.isRest && sortedWorkouts.length > 0 && sortedWorkouts[activeCardIndex] &&
       !sortedWorkouts[activeCardIndex].isCompleted && !sortedWorkouts[activeCardIndex].isSkipped && (
        <View style={styles.floatingButtonContainer}>
          <Animated.View style={{ transform: [{ scale: buttonGlow }] }}>
            <TouchableOpacity
              style={styles.floatingStartButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.navigate("WorkoutMode", { workout: sortedWorkouts[activeCardIndex].workout });
              }}
              activeOpacity={0.85}
            >
              <Feather name="play" size={20} color={theme.colors.black} />
              <Text style={styles.floatingStartButtonText}>
                {sortedWorkouts[activeCardIndex].status === "active" ? "Continue" : "Start"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Workout Preview Modal */}
      <WorkoutPreviewModal
        visible={showPreview}
        workout={selectedWorkout}
        onClose={() => {
          setShowPreview(false);
          setSelectedWorkout(null);
        }}
      />
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 3,
    paddingHorizontal: theme.spacing.screenPadding,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xl,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Section headers
  sectionHeader: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },

  // Card Base
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardFlex1: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  goalText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  goalTextCompact: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  goalTextFull: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  // Goal Card - Simple
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  goalCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  goalCardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  goalDaysText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
    marginLeft: "auto",
  },
  goalCardText: {
    fontSize: 17,
    fontWeight: "500",
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  goalProgressContainer: {
    marginTop: theme.spacing.md,
  },
  goalProgressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  goalProgressFill: {
    height: "100%",
    backgroundColor: theme.colors.blue,
    borderRadius: 2,
  },

  // AI Coach Card
  aiCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  aiCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.purpleSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.purple,
  },
  aiIconOverlay: {
    position: "absolute",
  },
  aiCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  aiBubbleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  aiBubblePointer: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: theme.colors.border,
    marginRight: -1,
  },
  aiBubble: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  aiBubbleText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  daysLeftText: {
    marginLeft: "auto",
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.textMuted,
  },
  daysLeftBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.green,
    marginLeft: "auto",
  },
  weekStatusText: {
    marginLeft: "auto",
    fontSize: 13,
    fontWeight: "500",
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  chevron: {
    marginLeft: "auto",
  },

  // Cards Row
  cardsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },

  // Compact card styles
  cardSmall: {
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  cardHeaderCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  cardTitleSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  logCount: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    marginLeft: "auto",
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  // Week message row
  weekMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  weekMessageText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Streak Badge (inside stats card)
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.orangeSoft,
    borderRadius: theme.radius.full,
  },
  streakBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.orange,
  },

  // Card row layout
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardDateRight: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginLeft: "auto",
  },
  cardActive: {
    borderColor: theme.colors.yellow,
  },


  // Workout info row with load badge
  workoutInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loadBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radius.full,
  },
  loadBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Coach hint
  coachHintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  coachHintText: {
    flex: 1,
    fontSize: 12,
    fontStyle: "italic",
    color: theme.colors.textMuted,
    lineHeight: 18,
  },

  // Details link
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: theme.spacing.sm,
    gap: 2,
  },
  detailsLinkText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },

  // Floating Start Button
  floatingButtonContainer: {
    position: "absolute",
    bottom: theme.spacing.xl,
    left: theme.spacing.screenPadding,
    right: theme.spacing.screenPadding,
  },
  floatingStartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.yellow,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.radius.xl,
  },
  floatingStartButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.black,
  },

  // Week Stats Row
  weekStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  weekStat: {
    alignItems: "center",
  },
  weekStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  weekStatLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weekStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
  },
  streakValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  // Action pills (below workout card)
  actionPills: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },

  // Typing indicator
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: theme.spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.purple,
  },

  // Horizontal scroll for cards
  horizontalScroll: {
    marginHorizontal: -theme.spacing.screenPadding,
  },
  horizontalScrollContent: {
    paddingHorizontal: theme.spacing.screenPadding,
  },

  // Card actions row (Swap/Skip below card)
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    height: 40, // Fixed height so it doesn't jump
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    height: 36,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
  },
  cardActionsPlaceholder: {
    height: 40, // Match container height exactly
  },
});
