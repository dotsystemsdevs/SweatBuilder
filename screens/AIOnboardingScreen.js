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

// Typewriter component for AI messages
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

// Typing indicator with animated dots
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

// Onboarding steps
const STEPS = {
  WELCOME: "welcome",
  INTRO: "intro",
  GOAL: "goal",
  FOLLOWUP: "followup",
  EVENT_CONFIRM: "event_confirm",
  EVENT_DATE: "event_date",
  CURRENT_FORM: "current_form",
  ADVANCED_DATA: "advanced_data",
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
  const [typingMessageId, setTypingMessageId] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const continueButtonAnim = useRef(new Animated.Value(0)).current;
  const pillsAnim = useRef(new Animated.Value(0)).current;

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

  const messageCounter = useRef(0);
  const addMessage = useCallback((text, isAI = false, title = null) => {
    messageCounter.current += 1;
    const id = `${Date.now()}-${messageCounter.current}`;
    setMessages((prev) => [...prev, { id, text, isAI, title }]);
    if (isAI) {
      setTypingMessageId(id);
      // Reset pills animation when new AI message starts
      pillsAnim.setValue(0);
    }
  }, []);

  const handleStart = () => {
    haptic("impactLight");
    setStep(STEPS.INTRO);
    continueButtonAnim.setValue(0);

    // Add intro message to chat
    const introText = `I'm your AI training coach. I help turn goals into realistic plans — built around your life, not the other way around.

I'll ask a few quick questions. Takes about 2 minutes ⏱️`;

    addMessage(introText, true, "Welcome 👋");
  };

  // Animate continue button when typing is done (INTRO step)
  useEffect(() => {
    if (step === STEPS.INTRO && !typingMessageId) {
      Animated.timing(continueButtonAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [step, typingMessageId]);

  // Animate pills when typing is done (other steps)
  useEffect(() => {
    if (!typingMessageId && step !== STEPS.WELCOME && step !== STEPS.INTRO && step !== STEPS.DONE) {
      Animated.timing(pillsAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [step, typingMessageId]);

  const handleContinue = () => {
    haptic("impactLight");
    setStep(STEPS.GOAL);
    addMessage("Let's get started", false);
    addMessage("Pick the one that fits you best 👇", true, "What are you training for?");
  };

  const quickReplies = [
    { label: "A race or event 🏁", value: "A race or event" },
    { label: "General fitness 💪", value: "General fitness" },
    { label: "Other ✏️", value: "other" },
  ];

  const [showGoalInput, setShowGoalInput] = useState(false);

  const eventDateQuickReplies = [
    { label: "I don't have a date yet 🤷", value: "no_date" },
    { label: "Just exploring for now 👀", value: "exploring" },
    { label: "Other ✏️", value: "other" },
  ];

  const eventConfirmQuickReplies = [
    { label: "Yes, that's it! ✅", value: "confirm" },
    { label: "No, let me enter manually ✏️", value: "manual" },
  ];

  const [showEventDateInput, setShowEventDateInput] = useState(false);
  const [pendingEventData, setPendingEventData] = useState(null);

  const currentFormQuickReplies = [
    { label: "Training regularly 💪", value: "regular" },
    { label: "On and off 🔄", value: "on_off" },
    { label: "Just getting back 🚀", value: "returning" },
    { label: "Not training right now 😴", value: "not_training" },
  ];

  const advancedDataQuickReplies = [
    { label: "Yes, let's fine-tune it ⚙️", value: "yes" },
    { label: "No, use generic values for now 👍", value: "no" },
  ];

  const [showAdvancedModal, setShowAdvancedModal] = useState(false);

  const handleEventConfirmQuickReply = (value) => {
    haptic("impactLight");

    if (value === "confirm" && pendingEventData) {
      // User confirmed the event data
      addMessage("Yes, that's it!", false);

      const { eventName, eventDate, weeksToEvent } = pendingEventData;
      setUserData((prev) => ({ ...prev, eventName, eventDate, weeksToEvent }));
      setPendingEventData(null);

      // Go to CURRENT_FORM
      setTimeout(() => {
        setStep(STEPS.CURRENT_FORM);
        addMessage("Pick the one that fits you best 👇", true, "How are you training right now?");
      }, 400);
    } else {
      // User wants to enter manually
      addMessage("No, let me enter manually", false);
      setPendingEventData(null);

      setTimeout(() => {
        setStep(STEPS.EVENT_DATE);
        addMessage("Enter the date or pick an option 👇", true, "When is your event?");
      }, 400);
    }
  };

  const handleEventDateQuickReply = async (value) => {
    haptic("impactLight");

    // Om "Other" - visa input-fältet
    if (value === "other") {
      setShowEventDateInput(true);
      return;
    }

    const displayText = value === "no_date" ? "I don't have a date yet" : "Just exploring for now";
    addMessage(displayText, false);

    // Spara eventDate som null och visa system-meddelande
    setUserData((prev) => ({ ...prev, eventDate: null }));

    // System-meddelande (inte AI)
    setTimeout(() => {
      messageCounter.current += 1;
      setMessages((prev) => [...prev, {
        id: `${Date.now()}-${messageCounter.current}`,
        text: "No problem. We'll plan without a fixed date for now.",
        isAI: false,
        isSystem: true
      }]);
    }, 300);

    // Gå vidare till CURRENT_FORM
    setTimeout(() => {
      setStep(STEPS.CURRENT_FORM);
      addMessage("Pick the one that fits you best 👇", true, "How are you training right now?");
    }, 800);
  };

  const handleCurrentFormQuickReply = (value) => {
    haptic("impactLight");

    // Hitta rätt label för visning
    const selectedOption = currentFormQuickReplies.find((item) => item.value === value);
    addMessage(selectedOption?.label || value, false);

    // Spara currentForm direkt
    setUserData((prev) => ({ ...prev, currentForm: value }));

    // Gå vidare till ADVANCED_DATA
    setTimeout(() => {
      setStep(STEPS.ADVANCED_DATA);
      addMessage("I can fine-tune your plan with FTP, threshold pace, or lifting weights. This is optional — skip it and I'll use safe starting values.", true, "Want to fine-tune? ⚙️");
    }, 400);
  };

  const handleAdvancedDataQuickReply = async (value) => {
    haptic("impactLight");

    // Visa användarens val
    const selectedOption = advancedDataQuickReplies.find((item) => item.value === value);
    addMessage(selectedOption?.label || value, false);

    if (value === "yes") {
      // Öppna Advanced settings modal
      setShowAdvancedModal(true);
    } else {
      // Sätt advancedData = null och fortsätt till PLAN
      setUserData((prev) => ({ ...prev, advancedData: null }));
      proceedToPlan();
    }
  };

  const proceedToPlan = async () => {
    setStep(STEPS.PLAN);
    setLoading(true);

    try {
      const planRes = await generatePlan(userData);

      if (planRes?.ok && planRes?.data) {
        setUserData((prev) => ({ ...prev, plan: planRes.data }));
        addMessage(formatPlan(planRes.data), true, "Your training plan 📋");
        setStep(STEPS.SUMMARY);
        const summaryRes = await getSummary(planRes.data);
        if (summaryRes?.ok && summaryRes?.data?.summary) {
          addMessage(summaryRes.data.summary, true, "Summary");
        }
      }
    } catch (err) {
      addMessage("Something went wrong. Try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (value) => {
    haptic("impactLight");

    // Om "Other" - visa input-fältet
    if (value === "other") {
      setShowGoalInput(true);
      return;
    }

    addMessage(value, false);
    setLoading(true);

    interpretGoal(value).then((res) => {
      if (res?.ok && res?.data) {
        const data = res.data;
        setUserData((prev) => ({ ...prev, goal: value, ...data }));
        setLoading(false);

        // Om needs_followup === true → gå till FOLLOWUP först
        if (data.needs_followup === true) {
          setStep(STEPS.FOLLOWUP);
          addMessage("To build your plan, I need one more detail.", true, "Which event? 🏁");
        } else {
          // Annars gå direkt till CURRENT_FORM (alla ska genom detta steg)
          setStep(STEPS.CURRENT_FORM);
          addMessage("Pick the one that fits you best 👇", true, "How are you training right now?");
        }
      } else {
        addMessage("Hmm, try describing your goal again.", true);
        setLoading(false);
      }
    }).catch(() => {
      addMessage("Something went wrong. Try again.", true);
      setLoading(false);
    });
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

            // KRITISK LOGIK: Endast om needs_followup === true går vi till FOLLOWUP
            if (data.needs_followup === true) {
              setStep(STEPS.FOLLOWUP);
              addMessage("To build your plan, I need one more detail.", true, "Which event? 🏁");
            } else {
              // needs_followup === false → gå till CURRENT_FORM (alla ska igenom detta steg)
              setStep(STEPS.CURRENT_FORM);
              addMessage("Pick the one that fits you best 👇", true, "How are you training right now?");
            }
          } else {
            addMessage("Hmm, try describing your goal again.", true);
          }
          break;
        }

        case STEPS.FOLLOWUP: {
          // Look up the event online
          const eventRes = await lookupEvent(text);

          if (eventRes?.ok && eventRes?.data?.found) {
            const { eventName, eventDate, location, distance } = eventRes.data;

            // Calculate weeks to event
            const dateObj = new Date(eventDate);
            const today = new Date();
            const diffTime = dateObj.getTime() - today.getTime();
            const weeksToEvent = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

            // Store pending data for confirmation
            setPendingEventData({ eventName, eventDate, weeksToEvent });

            // Format the date nicely
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            // Build confirmation message
            let confirmMsg = `📅 ${eventName}\n🗓️ ${formattedDate}`;
            if (location) confirmMsg += `\n📍 ${location}`;
            if (distance) confirmMsg += `\n🏃 ${distance}`;

            setStep(STEPS.EVENT_CONFIRM);
            addMessage(confirmMsg, true, "I found it! 🔍");
          } else {
            // Event not found, ask for manual date entry
            setUserData((prev) => ({ ...prev, eventName: text }));
            setStep(STEPS.EVENT_DATE);
            addMessage("Enter the date or pick an option 👇", true, "When is your event?");
          }
          break;
        }

        case STEPS.EVENT_DATE: {
          // Spara eventDate och beräkna veckor
          setShowEventDateInput(false);

          // Beräkna veckor till event (enkel beräkning)
          const eventDate = new Date(text);
          const today = new Date();
          const diffTime = eventDate.getTime() - today.getTime();
          const weeksToEvent = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

          setUserData((prev) => ({ ...prev, eventDate: text, weeksToEvent }));

          // System-meddelande (inte AI)
          if (weeksToEvent > 0) {
            messageCounter.current += 1;
            setMessages((prev) => [...prev, {
              id: `${Date.now()}-${messageCounter.current}`,
              text: `We have ${weeksToEvent} weeks to work with.\nThat's enough time to build a solid plan.`,
              isAI: false,
              isSystem: true
            }]);
          }

          // Gå vidare till CURRENT_FORM
          setTimeout(() => {
            setStep(STEPS.CURRENT_FORM);
            addMessage("Pick the one that fits you best 👇", true, "How are you training right now?");
          }, 500);
          break;
        }

        case STEPS.SUMMARY: {
          if (text.toLowerCase().includes("yes") || text.toLowerCase().includes("ok") || text.toLowerCase().includes("good") || text.toLowerCase().includes("looks good")) {
            await confirmPlan();
            setStep(STEPS.DONE);
            addMessage("Your plan is saved. Let's get to work! 💪", true, "You're all set! ✅");
          } else {
            addMessage("Tell me what you'd like to change.", true, "Adjustments");
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
    <DynamicSafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
                <Text style={styles.startButtonText}>Get started</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.isSystem ? styles.systemBubble : msg.isAI ? styles.aiBubble : styles.userBubble,
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
                <Text style={[styles.messageText, msg.isSystem ? styles.systemText : msg.isAI ? styles.aiText : styles.userText]}>
                  {msg.text}
                </Text>
              )}
            </View>
          ))}

          {/* Quick reply pills - visas direkt under senaste meddelandet */}
          {!typingMessageId && !loading && (
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
              {step === STEPS.GOAL && !showGoalInput && quickReplies.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.quickReplyChip}
                  activeOpacity={0.7}
                  onPress={() => handleQuickReply(item.value)}
                >
                  <Text style={styles.quickReplyText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              {step === STEPS.EVENT_CONFIRM && eventConfirmQuickReplies.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.quickReplyChip}
                  activeOpacity={0.7}
                  onPress={() => handleEventConfirmQuickReply(item.value)}
                >
                  <Text style={styles.quickReplyText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              {step === STEPS.EVENT_DATE && !showEventDateInput && eventDateQuickReplies.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.quickReplyChip}
                  activeOpacity={0.7}
                  onPress={() => handleEventDateQuickReply(item.value)}
                >
                  <Text style={styles.quickReplyText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              {step === STEPS.CURRENT_FORM && currentFormQuickReplies.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.quickReplyChip}
                  activeOpacity={0.7}
                  onPress={() => handleCurrentFormQuickReply(item.value)}
                >
                  <Text style={styles.quickReplyText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              {step === STEPS.ADVANCED_DATA && advancedDataQuickReplies.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.quickReplyChip}
                  activeOpacity={0.7}
                  onPress={() => handleAdvancedDataQuickReply(item.value)}
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

        {/* Continue button for INTRO step (fade in when typing is done) */}
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
            pointerEvents="auto"
          >
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Let's get started</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Input - bara för FOLLOWUP eller när "Other" klickades */}
        {(step === STEPS.FOLLOWUP || (step === STEPS.GOAL && showGoalInput) || (step === STEPS.EVENT_DATE && showEventDateInput) || step === STEPS.SUMMARY) && !typingMessageId && (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={
                  step === STEPS.GOAL
                    ? "For example: a race, getting fitter, coming back after a break…"
                    : step === STEPS.FOLLOWUP
                    ? "For example: Berlin Marathon, Half marathon in October…"
                    : step === STEPS.EVENT_DATE
                    ? "For example: October 12, 2025"
                    : "Type here..."
                }
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
      </KeyboardAvoidingView>
    </DynamicSafeAreaView>
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
    paddingBottom: 200,
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
    marginBottom: theme.spacing.md,
  },
  aiBubble: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingRight: theme.spacing.lg,
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: theme.colors.purple,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.full,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  aiText: {
    color: theme.colors.text,
    fontWeight: "400",
  },
  aiTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  userText: {
    color: theme.colors.text,
  },
  systemBubble: {
    alignSelf: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    maxWidth: "90%",
  },
  systemText: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
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
  quickRepliesContainer: {
    marginBottom: theme.spacing.sm,
  },
  quickRepliesContent: {
    gap: theme.spacing.sm,
  },
  quickReplyChip: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.purple,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  quickReplyText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  inlinePillsContainer: {
    flexDirection: "column",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textSecondary,
  },
});
