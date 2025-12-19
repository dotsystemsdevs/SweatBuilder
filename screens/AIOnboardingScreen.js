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
  eventFollowup,
  generatePlan,
  getSummary,
  confirmPlan,
} from "../services/api";
import theme from "../theme";

// Onboarding steps
const STEPS = {
  WELCOME: "welcome",
  INTRO: "intro",
  GOAL: "goal",
  FOLLOWUP: "followup",
  PLAN: "plan",
  SUMMARY: "summary",
  DONE: "done",
};

export default function AIOnboardingScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [step, setStep] = useState(STEPS.WELCOME);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const addMessage = useCallback((text, isAI = false) => {
    setMessages((prev) => [...prev, { id: Date.now(), text, isAI }]);
  }, []);

  const handleStart = () => {
    haptic("impactLight");
    setStep(STEPS.INTRO);

    // STEP 1 - Intro message (no question, just Continue button)
    const introMessage = `Hi — I'm your training coach.

I'll ask you a few short questions to understand your goal and your current situation.

Based on that, I'll create a realistic training plan that fits your life — not a perfect one.

Nothing is locked in. We can always adjust things later.`;

    addMessage(introMessage, true);
  };

  const handleContinue = () => {
    haptic("impactLight");
    setStep(STEPS.GOAL);
    addMessage("Tell me about your training goal. What do you want to achieve?", true);
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    haptic("impactLight");
    addMessage(text, false);
    setInput("");
    setLoading(true);

    try {
      switch (step) {
        case STEPS.GOAL: {
          const res = await interpretGoal(text);
          if (res?.ok && res?.data) {
            const data = res.data;
            setUserData((prev) => ({ ...prev, goal: text, ...data }));

            if (data.needs_followup) {
              setStep(STEPS.FOLLOWUP);
              const followupRes = await eventFollowup("event_name");
              if (followupRes?.ok && followupRes?.data?.question) {
                addMessage(followupRes.data.question, true);
              } else {
                addMessage("Can you tell me a bit more about your situation?", true);
              }
            } else {
              setStep(STEPS.PLAN);
              addMessage("Perfect! I'm creating a plan for you...", true);
              const planRes = await generatePlan(data);
              if (planRes?.ok && planRes?.data) {
                setUserData((prev) => ({ ...prev, plan: planRes.data }));
                addMessage(formatPlan(planRes.data), true);
                setStep(STEPS.SUMMARY);
                const summaryRes = await getSummary(planRes.data);
                if (summaryRes?.ok && summaryRes?.data?.summary) {
                  addMessage(summaryRes.data.summary, true);
                }
              }
            }
          } else {
            addMessage("Hmm, try describing your goal again.", true);
          }
          break;
        }

        case STEPS.FOLLOWUP: {
          setUserData((prev) => ({ ...prev, followup: text }));
          setStep(STEPS.PLAN);
          addMessage("Thanks! Now I'm creating your plan...", true);

          const planRes = await generatePlan({
            ...userData,
            followup: text,
          });

          if (planRes?.ok && planRes?.data) {
            setUserData((prev) => ({ ...prev, plan: planRes.data }));
            addMessage(formatPlan(planRes.data), true);
            setStep(STEPS.SUMMARY);
            const summaryRes = await getSummary(planRes.data);
            if (summaryRes?.ok && summaryRes?.data?.summary) {
              addMessage(summaryRes.data.summary, true);
            }
          }
          break;
        }

        case STEPS.SUMMARY: {
          if (text.toLowerCase().includes("yes") || text.toLowerCase().includes("ok") || text.toLowerCase().includes("good") || text.toLowerCase().includes("looks good")) {
            await confirmPlan();
            setStep(STEPS.DONE);
            addMessage("Your plan is saved! Good luck with your training.", true);
          } else {
            addMessage("Want to adjust something? Tell me what you'd like to change.", true);
          }
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

  const formatPlan = (data) => {
    if (!data) return "Could not create plan.";
    if (typeof data === "string") return data;

    const plan = data.plan || data;
    let text = "";

    if (plan.schedule && Array.isArray(plan.schedule)) {
      text += "Weekly schedule:\n";
      plan.schedule.forEach((day) => {
        text += `• ${day.day || day}: ${day.focus || day.activity || "Rest"}\n`;
      });
    } else if (plan.weeklySchedule) {
      text += "Weekly schedule:\n";
      plan.weeklySchedule.forEach((day) => {
        text += `• ${day.day}: ${day.focus || "Rest"}\n`;
      });
    }

    if (data.explanation) {
      text += `\n${data.explanation}`;
    }
    if (plan.weeks) {
      text += `\n${plan.weeks} weeks, ${plan.days_per_week || 3} days/week`;
    }

    return text || "Plan created.";
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <DynamicSafeAreaView style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              haptic("impactLight");
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Feather name="x" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Onboarding</Text>
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
                <Text style={styles.startButtonText}>Get started</Text>
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
              <Text style={[styles.messageText, msg.isAI ? styles.aiText : styles.userText]}>
                {msg.text}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Text style={styles.aiText}>...</Text>
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

        {/* Continue button for INTRO step */}
        {step === STEPS.INTRO && (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input for other steps */}
        {step !== STEPS.WELCOME && step !== STEPS.INTRO && step !== STEPS.DONE && (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type here..."
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
                  size={20}
                  color={input.trim() && !loading ? theme.colors.white : theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </DynamicSafeAreaView>
    </KeyboardAvoidingView>
  );
}

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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
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
    paddingBottom: theme.spacing.xl,
  },
  welcomeContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxl * 2,
  },
  welcomeEmoji: {
    fontSize: 56,
    marginBottom: theme.spacing.lg,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  startButton: {
    backgroundColor: theme.colors.purple,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.white,
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.sm,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.purple,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiText: {
    color: theme.colors.text,
  },
  userText: {
    color: theme.colors.white,
  },
  doneButton: {
    alignSelf: "center",
    backgroundColor: theme.colors.green,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
    marginTop: theme.spacing.lg,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.white,
  },
  inputArea: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingLeft: theme.spacing.md,
    paddingRight: 6,
    height: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    paddingRight: theme.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceHover,
  },
  continueButton: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.white,
  },
});
