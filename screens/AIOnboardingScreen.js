import { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptic } from "../utils/haptics";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import { useStatusBar } from "../hooks/useStatusBar";
import {
  interpretGoal,
  generatePlan,
  getSummary,
  confirmPlan,
  lookupEvent,
} from "../services/api";
import theme from "../theme";

// =============================================================================
// COMPONENTS
// =============================================================================

const TypewriterText = ({ text, style, onComplete, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  return <Text style={style}>{displayedText}</Text>;
};

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
    </View>
  );
};

// =============================================================================
// STEPS - THE DEFINITIVE FLOW
// =============================================================================

const STEPS = {
  // Start
  WELCOME: "welcome",
  INTRO: "intro",

  // Goal type
  GOAL_TYPE: "goal_type",

  // Event path
  EVENT_NAME: "event_name",
  EVENT_CONFIRM: "event_confirm",
  EVENT_DISTANCE: "event_distance",
  EVENT_DATE: "event_date",

  // Non-event path (optional target)
  TARGET_GOAL: "target_goal",
  TARGET_TYPE: "target_type",
  TARGET_DETAILS: "target_details",

  // Common steps
  PLAN_LENGTH: "plan_length",
  STARTING_POINT: "starting_point",
  ADVANCED_SETTINGS: "advanced_settings",

  // Generation
  PLAN: "plan",
  SUMMARY: "summary",
  DONE: "done",
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AIOnboardingScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  // State
  const [step, setStep] = useState(STEPS.WELCOME);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState({});
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);

  // Pending data
  const [pendingEventData, setPendingEventData] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const continueButtonAnim = useRef(new Animated.Value(0)).current;
  const pillsAnim = useRef(new Animated.Value(0)).current;

  // =============================================================================
  // QUICK REPLY OPTIONS
  // =============================================================================

  const goalTypeReplies = [
    { label: "A race or event 🏁", value: "event" },
    { label: "Get stronger 💪", value: "strength" },
    { label: "General fitness 🧘", value: "fitness" },
    { label: "Something else ✏️", value: "other" },
  ];

  const eventConfirmReplies = [
    { label: "Yes, use this ✅", value: "confirm" },
    { label: "I'll enter it manually ✏️", value: "manual" },
  ];

  const targetGoalReplies = [
    { label: "Yes, set a target 🎯", value: "yes" },
    { label: "Skip — just get started ➡️", value: "skip" },
  ];

  const targetTypeReplies = [
    { label: "Strength 💪", value: "strength" },
    { label: "Endurance 🏃", value: "endurance" },
    { label: "Consistency 📅", value: "consistency" },
  ];

  const planLengthReplies = [
    { label: "4 weeks", value: "4" },
    { label: "8 weeks", value: "8" },
    { label: "12 weeks", value: "12" },
    { label: "Let it adapt", value: "adaptive" },
  ];

  const startingPointReplies = [
    { label: "Training regularly 💪", value: "regular" },
    { label: "On and off 🔄", value: "on_off" },
    { label: "Just getting back 🚀", value: "returning" },
    { label: "Not training at all 😴", value: "not_training" },
  ];

  const advancedSettingsReplies = [
    { label: "Yes, fine-tune it ⚙️", value: "yes" },
    { label: "No, use defaults 👍", value: "no" },
  ];

  const summaryReplies = [
    { label: "Looks good ✅", value: "confirm" },
    { label: "I want changes ✏️", value: "change" },
  ];

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  useEffect(() => {
    if (step === STEPS.INTRO && !typingMessageId) {
      Animated.timing(continueButtonAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [step, typingMessageId]);

  useEffect(() => {
    if (!typingMessageId && step !== STEPS.WELCOME && step !== STEPS.INTRO && step !== STEPS.DONE) {
      Animated.timing(pillsAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [step, typingMessageId]);

  // =============================================================================
  // HELPERS
  // =============================================================================

  const messageCounter = useRef(0);
  const addMessage = useCallback((text, isAI = false, title = null) => {
    messageCounter.current += 1;
    const id = `${Date.now()}-${messageCounter.current}`;
    setMessages((prev) => [...prev, { id, text, isAI, title }]);
    if (isAI) {
      setTypingMessageId(id);
      pillsAnim.setValue(0);
    }
  }, []);

  const goToStep = (nextStep, aiMessage, aiTitle) => {
    setTimeout(() => {
      setStep(nextStep);
      if (aiMessage) addMessage(aiMessage, true, aiTitle);
    }, 400);
  };

  // =============================================================================
  // STEP HANDLERS
  // =============================================================================

  const handleStart = () => {
    haptic("impactLight");
    setStep(STEPS.INTRO);
    continueButtonAnim.setValue(0);
    addMessage(
      "I'm your training coach 🤝\n\nI'll help you build a realistic training plan — based on your goal, where you're starting from, and how much time you have.",
      true,
      "Welcome"
    );
  };

  const handleContinue = () => {
    haptic("impactLight");
    addMessage("Let's do it", false);
    goToStep(STEPS.GOAL_TYPE, "Pick the one that fits you best 👇", "What are you training for?");
  };

  // Goal Type
  const handleGoalType = (value) => {
    haptic("impactLight");
    const selected = goalTypeReplies.find((r) => r.value === value);
    addMessage(selected?.label || value, false);

    if (value === "other") {
      setShowTextInput(true);
      return;
    }

    setUserData((prev) => ({ ...prev, goal_type: value }));

    if (value === "event") {
      goToStep(STEPS.EVENT_NAME, "Type the name below and I'll look it up.", "Which event? 🏁");
      setShowTextInput(true);
    } else {
      // Non-event: offer optional target
      goToStep(
        STEPS.TARGET_GOAL,
        "If you want, we can lock the plan to a specific target.\nThis makes the progression much more precise.",
        "Set a target?"
      );
    }
  };

  // Event Confirm
  const handleEventConfirm = (value) => {
    haptic("impactLight");
    const selected = eventConfirmReplies.find((r) => r.value === value);
    addMessage(selected?.label || value, false);

    if (value === "confirm" && pendingEventData) {
      setUserData((prev) => ({ ...prev, ...pendingEventData }));
      setPendingEventData(null);
      goToStep(STEPS.PLAN_LENGTH, "Pick what works for you 👇", "How long should the plan be?");
    } else {
      setPendingEventData(null);
      setStep(STEPS.EVENT_DISTANCE);
      setShowTextInput(true);
      goToStep(STEPS.EVENT_DISTANCE, "What's the distance?", "Distance 🏃");
    }
  };

  // Target Goal (optional)
  const handleTargetGoal = (value) => {
    haptic("impactLight");
    const selected = targetGoalReplies.find((r) => r.value === value);
    addMessage(selected?.label || value, false);

    if (value === "yes") {
      goToStep(STEPS.TARGET_TYPE, "What kind of target do you want?", "Target type");
    } else {
      // Skip target, go to plan length
      setUserData((prev) => ({ ...prev, hasTarget: false }));
      goToStep(STEPS.PLAN_LENGTH, "Pick what works for you 👇", "How long should the plan be?");
    }
  };

  // Target Type
  const handleTargetType = (value) => {
    haptic("impactLight");
    const selected = targetTypeReplies.find((r) => r.value === value);
    addMessage(selected?.label || value, false);
    setUserData((prev) => ({ ...prev, target_type: value, hasTarget: true }));

    let prompt = "";
    if (value === "strength") {
      prompt = "What lift do you want to improve?\n\nExample: Bench 80 kg → 90 kg";
    } else if (value === "endurance") {
      prompt = "What does success look like?\n\nExample: 5 km in under 25 min";
    } else {
      prompt = "What would success look like for you?\n\nExample: Train 3x/week for 8 weeks";
    }

    setShowTextInput(true);
    goToStep(STEPS.TARGET_DETAILS, prompt, "Your target 🎯");
  };

  // Plan Length
  const handlePlanLength = (value) => {
    haptic("impactLight");
    const selected = planLengthReplies.find((r) => r.value === value);
    addMessage(selected?.label || value, false);

    const weeks = value === "adaptive" ? null : parseInt(value);
    setUserData((prev) => ({ ...prev, plan_weeks: weeks, adaptive: value === "adaptive" }));

    goToStep(STEPS.STARTING_POINT, "Pick the one that fits you best 👇", "Where are you starting from?");
  };

  // Starting Point
  const handleStartingPoint = (value) => {
    haptic("impactLight");
    const selected = startingPointReplies.find((r) => r.value === value);
    addMessage(selected?.label || value, false);
    setUserData((prev) => ({ ...prev, starting_point: value }));

    goToStep(
      STEPS.ADVANCED_SETTINGS,
      "Want to fine-tune things with numbers like FTP, paces, or lifting weights?",
      "Advanced settings ⚙️"
    );
  };

  // Advanced Settings
  const handleAdvancedSettings = (value) => {
    haptic("impactLight");
    const selected = advancedSettingsReplies.find((r) => r.value === value);
    addMessage(selected?.label || value, false);

    if (value === "yes") {
      setUserData((prev) => ({ ...prev, wantsAdvanced: true }));
      // For now, skip advanced input and go to plan
      // TODO: Add advanced input fields
    }

    // Generate plan
    proceedToPlan();
  };

  // Summary
  const handleSummary = (value) => {
    haptic("impactLight");
    const selected = summaryReplies.find((r) => r.value === value);
    addMessage(selected?.label || value, false);

    if (value === "confirm") {
      confirmPlan();
      setStep(STEPS.DONE);
      addMessage("Your plan is saved. Let's get to work!", true, "You're all set! ✅");
    } else {
      addMessage("Tell me what you'd like to change.", true, "Adjustments");
      setShowTextInput(true);
    }
  };

  // =============================================================================
  // PLAN GENERATION
  // =============================================================================

  const proceedToPlan = async () => {
    const planData = {
      goal_type: userData.goal_type || "fitness",
      sport: userData.sport || "general",
      target_type: userData.target_type,
      target_details: userData.target_details,
      plan_weeks: userData.plan_weeks || 8,
      starting_point: userData.starting_point || "on_off",
      event_name: userData.eventName,
      weeks_until_event: userData.weeksToEvent,
      days_per_week: 3, // Default, can be made configurable
    };

    console.log("[Plan inputs]", planData);

    setStep(STEPS.PLAN);
    setLoading(true);

    try {
      const planRes = await generatePlan(planData);

      if (planRes?.ok && planRes?.data) {
        setUserData((prev) => ({ ...prev, plan: planRes.data }));
        addMessage(formatPlan(planRes.data), true, "Your training plan 📋");

        setStep(STEPS.SUMMARY);
        const summaryRes = await getSummary(planRes.data);
        if (summaryRes?.ok && summaryRes?.data?.summary) {
          addMessage(summaryRes.data.summary, true, "Summary");
        }
      } else {
        addMessage("Could not generate plan. Let's try again.", true);
      }
    } catch (err) {
      addMessage("Something went wrong. Try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const formatPlan = (data) => {
    if (!data) return "Could not create plan.";
    if (typeof data === "string") return data;

    const plan = data.plan || data;
    let text = "";

    if (plan.schedule && Array.isArray(plan.schedule)) {
      text += "Weekly schedule:\n";
      plan.schedule.slice(0, 1).forEach((week) => {
        if (week.days) {
          week.days.forEach((day) => {
            if (day.type === "training") {
              text += `• ${day.day}: ${day.description}\n`;
            }
          });
        }
      });
    }

    if (data.explanation) {
      text += `\n${data.explanation}`;
    }
    if (plan.weeks) {
      text += `\n\n${plan.weeks} weeks, ${plan.days_per_week || 3} days/week`;
    }

    return text || "Plan created.";
  };

  // =============================================================================
  // TEXT INPUT HANDLER
  // =============================================================================

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    haptic("impactLight");
    addMessage(text, false);
    setInput("");
    setShowTextInput(false);
    setLoading(true);

    try {
      switch (step) {
        case STEPS.GOAL_TYPE: {
          // Free text goal
          const res = await interpretGoal(text);
          if (res?.ok && res?.data) {
            setUserData((prev) => ({ ...prev, goal: text, ...res.data }));
            if (res.data.needs_followup) {
              setStep(STEPS.EVENT_NAME);
              setShowTextInput(true);
              addMessage("Type the name below and I'll look it up.", true, "Which event? 🏁");
            } else {
              goToStep(STEPS.TARGET_GOAL, "If you want, we can lock the plan to a specific target.", "Set a target?");
            }
          }
          break;
        }

        case STEPS.EVENT_NAME: {
          const eventRes = await lookupEvent(text);

          if (eventRes?.ok && eventRes?.data?.found) {
            const { eventName, eventDate, location, distance, sport } = eventRes.data;
            const dateObj = new Date(eventDate);
            const today = new Date();
            const weeksToEvent = Math.ceil((dateObj - today) / (1000 * 60 * 60 * 24 * 7));

            setPendingEventData({ eventName, eventDate, weeksToEvent, sport, distance });

            const formattedDate = dateObj.toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            });

            let msg = `${eventName}`;
            if (distance) msg += `\n${distance}`;
            msg += ` · ${formattedDate}`;
            if (location) msg += ` · ${location}`;
            msg += `\n\nDoes this look right?`;

            setStep(STEPS.EVENT_CONFIRM);
            addMessage(msg, true, "I found this event 🔍");
          } else {
            setUserData((prev) => ({ ...prev, eventName: text }));
            setStep(STEPS.EVENT_DISTANCE);
            setShowTextInput(true);
            addMessage(
              "I couldn't confidently identify this event.\n\nThat's totally fine — let's fill in the details manually.",
              true,
              "No worries 👍"
            );
            setTimeout(() => addMessage("What's the distance?", true, "Distance 🏃"), 800);
          }
          break;
        }

        case STEPS.EVENT_DISTANCE: {
          setUserData((prev) => ({ ...prev, distance: text }));
          setStep(STEPS.EVENT_DATE);
          setShowTextInput(true);
          addMessage("When is the event?", true, "Date 📅");
          break;
        }

        case STEPS.EVENT_DATE: {
          const dateObj = new Date(text);
          if (!isNaN(dateObj.getTime())) {
            const today = new Date();
            const weeksToEvent = Math.ceil((dateObj - today) / (1000 * 60 * 60 * 24 * 7));
            setUserData((prev) => ({ ...prev, eventDate: text, weeksToEvent }));
          }
          goToStep(STEPS.PLAN_LENGTH, "Pick what works for you 👇", "How long should the plan be?");
          break;
        }

        case STEPS.TARGET_DETAILS: {
          setUserData((prev) => ({ ...prev, target_details: text }));
          goToStep(STEPS.PLAN_LENGTH, "Pick what works for you 👇", "How long should the plan be?");
          break;
        }

        case STEPS.SUMMARY: {
          // User wants changes
          addMessage("Let me adjust the plan for you.", true, "Adjusting...");
          // TODO: Implement plan adjustment
          break;
        }

        default:
          break;
      }
    } catch (err) {
      addMessage("Something went wrong. Try again.", true);
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  const getCurrentReplies = () => {
    switch (step) {
      case STEPS.GOAL_TYPE: return showTextInput ? null : goalTypeReplies;
      case STEPS.EVENT_CONFIRM: return eventConfirmReplies;
      case STEPS.TARGET_GOAL: return targetGoalReplies;
      case STEPS.TARGET_TYPE: return targetTypeReplies;
      case STEPS.PLAN_LENGTH: return planLengthReplies;
      case STEPS.STARTING_POINT: return startingPointReplies;
      case STEPS.ADVANCED_SETTINGS: return advancedSettingsReplies;
      case STEPS.SUMMARY: return summaryReplies;
      default: return null;
    }
  };

  const getCurrentHandler = () => {
    switch (step) {
      case STEPS.GOAL_TYPE: return handleGoalType;
      case STEPS.EVENT_CONFIRM: return handleEventConfirm;
      case STEPS.TARGET_GOAL: return handleTargetGoal;
      case STEPS.TARGET_TYPE: return handleTargetType;
      case STEPS.PLAN_LENGTH: return handlePlanLength;
      case STEPS.STARTING_POINT: return handleStartingPoint;
      case STEPS.ADVANCED_SETTINGS: return handleAdvancedSettings;
      case STEPS.SUMMARY: return handleSummary;
      default: return () => {};
    }
  };

  const getPlaceholder = () => {
    switch (step) {
      case STEPS.GOAL_TYPE: return "Describe your goal...";
      case STEPS.EVENT_NAME: return "🏁 Event name...";
      case STEPS.EVENT_DISTANCE: return "🏃 e.g. 10 km, Half marathon...";
      case STEPS.EVENT_DATE: return "📅 e.g. June 15, 2025";
      case STEPS.TARGET_DETAILS: {
        // Dynamic placeholder based on target type
        if (userData.target_type === "strength") {
          return "💪 e.g. Bench 80 kg → 90 kg";
        } else if (userData.target_type === "endurance") {
          return "🏃 e.g. 5 km in under 25 min";
        } else {
          return "📅 e.g. Train 3x/week for 8 weeks";
        }
      }
      default: return "Type here...";
    }
  };

  const currentReplies = getCurrentReplies();
  const currentHandler = getCurrentHandler();
  const showInput = showTextInput && [STEPS.GOAL_TYPE, STEPS.EVENT_NAME, STEPS.EVENT_DISTANCE, STEPS.EVENT_DATE, STEPS.TARGET_DETAILS, STEPS.SUMMARY].includes(step);

  return (
    <DynamicSafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>🤖</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {step === STEPS.WELCOME && (
            <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
              <Text style={styles.welcomeEmoji}>👋</Text>
              <Text style={styles.welcomeTitle}>Welcome</Text>
              <Text style={styles.welcomeSubtitle}>
                Let me help you create a personal training plan
              </Text>
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <Text style={styles.startButtonText}>Start planning</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.isAI ? styles.aiBubble : styles.userBubble,
              ]}
            >
              {msg.isAI && msg.title && (
                <Text style={styles.aiTitle}>{msg.title}</Text>
              )}
              {msg.isAI && msg.id === typingMessageId ? (
                <TypewriterText
                  text={msg.text}
                  style={[styles.messageText, styles.aiText]}
                  speed={15}
                  onComplete={() => {
                    setTypingMessageId(null);
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }}
                />
              ) : (
                <Text style={[styles.messageText, msg.isAI ? styles.aiText : styles.userText]}>
                  {msg.text}
                </Text>
              )}
            </View>
          ))}

          {/* Quick reply pills */}
          {!typingMessageId && !loading && currentReplies && (
            <Animated.View
              style={[
                styles.inlinePillsContainer,
                {
                  opacity: pillsAnim,
                  transform: [{
                    translateY: pillsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    })
                  }],
                }
              ]}
            >
              {currentReplies.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.quickReplyChip}
                  activeOpacity={0.7}
                  onPress={() => currentHandler(item.value)}
                >
                  <Text style={styles.quickReplyText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <TypingIndicator />
            </View>
          )}

          {step === STEPS.DONE && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                haptic("impactMedium");
                navigation.goBack();
              }}
            >
              <Text style={styles.doneButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Continue button for INTRO */}
        {step === STEPS.INTRO && !typingMessageId && (
          <Animated.View
            style={[
              styles.inputArea,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                opacity: continueButtonAnim,
                transform: [{ translateY: continueButtonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })}],
              }
            ]}
          >
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Text input */}
        {showInput && !typingMessageId && (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={getPlaceholder()}
                placeholderTextColor={theme.colors.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
                onPress={handleSubmit}
                disabled={!input.trim() || loading}
              >
                <Feather
                  name="arrow-up"
                  size={18}
                  color={input.trim() && !loading ? theme.colors.black : theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </DynamicSafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: 200,
  },
  welcomeContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  startButton: {
    backgroundColor: theme.colors.yellow,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.black,
  },
  messageBubble: {
    marginBottom: theme.spacing.sm,
  },
  aiBubble: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingRight: theme.spacing.lg,
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.yellow,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.sm,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiText: {
    color: theme.colors.text,
    fontWeight: "400",
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  doneButton: {
    alignSelf: "center",
    backgroundColor: theme.colors.yellow,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.black,
  },
  inputArea: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingLeft: theme.spacing.sm,
    paddingRight: 4,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    paddingRight: theme.spacing.xs,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceHover,
  },
  continueButton: {
    backgroundColor: theme.colors.yellow,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.black,
  },
  quickReplyChip: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.yellow,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  inlinePillsContainer: {
    flexDirection: "column",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textMuted,
  },
});
