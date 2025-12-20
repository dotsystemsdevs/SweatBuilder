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
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptic } from "../utils/haptics";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import { useStatusBar } from "../hooks/useStatusBar";
import {
  interpretGoalV2,
  analyzeEvent,
  lookupEvent,
  interpretCurrentState,
  calculateGap,
  generateStrategy,
  generateMasterPlanV2,
  summarizePlanV2,
} from "../services/api";
import { useOnboardingStore } from "../store/onboardingStore";
import { STEPS, STEP_CONFIG, getNextStep, getProgress } from "./onboarding/steps";
import { GOAL_TYPES, COACH_MODE } from "../types/onboardingContract";
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

const ProgressBar = ({ progress }) => (
  <View style={styles.progressContainer}>
    <View style={[styles.progressBar, { width: `${progress}%` }]} />
  </View>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AIOnboardingScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  // Store hooks
  const {
    onboardingData,
    updateGoal,
    updateIntent,
    updateEvent,
    updateConstraints,
    updateBehaviorProfile,
    updateGap,
    setAmbition,
    setGeneratedMasterPlan,
    completeOnboarding,
  } = useOnboardingStore();

  // State
  const [step, setStep] = useState(STEPS.INTRO);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState({});
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [lockedGoal, setLockedGoal] = useState(null);
  const [lockedCurrentState, setLockedCurrentState] = useState(null);

  // Form fields for multi-field steps
  const [formData, setFormData] = useState({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pillsAnim = useRef(new Animated.Value(0)).current;

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Show intro message
    addMessage(
      "Tell me what you want to achieve — and I'll build a plan that fits your life, not the other way around. 💪\n\nNo generic templates. Just a smart plan built around you.",
      true,
      "Let's build something 🔥"
    );
  }, []);

  // Debug: Log step changes
  useEffect(() => {
    console.log("[Onboarding] Step changed to:", step, "showTextInput:", showTextInput);
  }, [step, showTextInput]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  useEffect(() => {
    if (!typingMessageId && step !== STEPS.DONE) {
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

  const progress = getProgress(step, userData);

  // =============================================================================
  // QUICK REPLY OPTIONS
  // =============================================================================

  const eventAmbitionReplies = [
    { label: "Just finish it", value: "COMPLETE" },
    { label: "Achieve a specific result", value: "PERFORMANCE" },
  ];

  const ambitionReplies = [
    { label: "Take it slow", value: "CAUTIOUS", description: "Prioritize consistency" },
    { label: "Balanced approach", value: "BALANCED", description: "Recommended" },
    { label: "Push me", value: "AMBITIOUS", description: "Higher intensity" },
  ];

  const planLengthReplies = [
    { label: "4 weeks", value: 4 },
    { label: "8 weeks (Recommended)", value: 8 },
    { label: "12 weeks", value: 12 },
    { label: "Rolling (no end date)", value: null },
  ];

  const strategyConfirmReplies = [
    { label: "Looks good", value: "accept" },
    { label: "I want to adjust", value: "adjust" },
  ];

  const goalConfirmReplies = [
    { label: "Yes, confirm", value: "confirm" },
    { label: "Edit", value: "change", secondary: true },
  ];

  const currentStateConfirmReplies = [
    { label: "Yes, confirm", value: "confirm" },
    { label: "Edit", value: "change", secondary: true },
  ];

  const summaryReplies = [
    { label: "This looks good", value: "accept" },
    { label: "I want to change something", value: "adjust" },
  ];

  const preferenceModeReplies = [
    { label: "Explain why", value: "EXPLAIN_WHY", description: "Tell me the reasoning" },
    { label: "Just tell me what to do", value: "JUST_TELL_ME", description: "Keep it short" },
  ];

  // =============================================================================
  // STEP HANDLERS
  // =============================================================================

  // Handle continue from INTRO
  const handleIntroContinue = () => {
    haptic("impactLight");
    setStep(STEPS.GOAL_INPUT);
    setShowTextInput(true);
    addMessage(
      "What's your goal? 🎯\n\nThe more specific, the better I can help:\n• \"Run a marathon\" → good\n• \"Run Stockholm Marathon in under 4h\" → even better!\n\nDon't overthink it — just tell me what you're going for.",
      true,
      "Step 1 — Goal"
    );
  };

  // Handle EVENT_AMBITION
  const handleEventAmbition = async (value) => {
    haptic("impactLight");
    const label = eventAmbitionReplies.find((r) => r.value === value)?.label || value;
    addMessage(label, false);

    // If user wants to achieve a specific result, ask them to specify
    if (value === "PERFORMANCE") {
      setUserData((prev) => ({ ...prev, pendingAmbition: value }));
      setShowTextInput(true);
      addMessage("What result are you aiming for?\n\nFor example: \"finish under 4 hours\", \"top 50%\"", true, "Your target");
      return;
    }

    // For "Just finish it" - proceed directly
    await finalizeEventAmbition(value, null);
  };

  // Helper to finalize event ambition and go to GOAL_CONFIRM
  const finalizeEventAmbition = async (ambitionValue, performanceTarget) => {
    const label = eventAmbitionReplies.find((r) => r.value === ambitionValue)?.label || ambitionValue;

    const eventData = {
      ...userData.event,
      ambition: ambitionValue,
      ...(performanceTarget && { performanceTarget }),
    };
    setUserData((prev) => ({ ...prev, event: eventData, pendingAmbition: null }));
    await updateEvent(eventData);

    // Use AI's displayTitle (clean normalized version) for the summary
    // Use eventData directly since state hasn't updated yet
    let summary = userData.goal?.displayTitle || eventData.name || userData.goal?.raw;

    // Add date if available and not already in displayTitle
    if (eventData.date) {
      const dateStr = new Date(eventData.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      summary += `\n📅 ${dateStr}`;
      if (eventData.daysUntil > 0) summary += ` — ${eventData.daysUntil} days`;
    }

    // Add ambition
    summary += `\n🎯 ${performanceTarget || label}`;
    summary += "\n\nLet's make it happen! Is this right?";

    setStep(STEPS.GOAL_CONFIRM);
    addMessage(summary, true, "Your goal 💪");
  };

  // Handle GOAL_CONFIRM
  const handleGoalConfirm = async (value) => {
    console.log("[Onboarding] GOAL_CONFIRM: User chose:", value);
    haptic("impactLight");
    addMessage(value === "confirm" ? "Confirmed" : "Edit", false);

    if (value === "confirm") {
      // Goal locked in - always prefer AI's displayTitle (clean normalized version)
      let goalDisplay = userData.goal?.displayTitle || "";

      // For events, add performance target or ambition if set
      if (userData.event) {
        if (!goalDisplay) goalDisplay = userData.event.name || userData.goal?.raw || "";
        if (userData.event.performanceTarget) {
          goalDisplay += ` — ${userData.event.performanceTarget}`;
        }
      }

      // Fallback
      if (!goalDisplay) {
        goalDisplay = userData.goal?.classification?.direction || userData.goal?.raw || "";
      }

      setLockedGoal(goalDisplay);

      // Goal confirmed - show coming soon (skip current state for now)
      console.log("[Onboarding] GOAL_CONFIRM: Goal confirmed, going to DONE");
      setStep(STEPS.DONE);
      addMessage(
        "Nice! Your goal is locked in. 🎯\n\nComing soon: Current state, constraints, behavior profile, and your personalized training plan.\n\nStay tuned — we're building something great for you! 🚀",
        true,
        "Goal set! 🔥"
      );
    } else {
      // User wants to change - go back to goal input
      console.log("[Onboarding] GOAL_CONFIRM: User wants to change, going back to GOAL_INPUT");
      setLockedGoal(null); // Clear locked goal
      // Clear previous goal data so we start fresh
      setUserData((prev) => ({ ...prev, goal: null, event: null, isEvent: false }));
      setStep(STEPS.GOAL_INPUT);
      setShowTextInput(true);
      setInput(""); // Start fresh, don't pre-fill
      addMessage("No problem — what's your goal?", true, null);
    }
  };

  // Handle CURRENT_STATE_CONFIRM
  const handleCurrentStateConfirm = async (value) => {
    console.log("[Onboarding] CURRENT_STATE_CONFIRM: User chose:", value);
    haptic("impactLight");
    addMessage(value === "confirm" ? "Confirmed" : "Edit", false);

    if (value === "confirm") {
      // Lock the current state for display - use AI's short displaySummary
      const stateDisplay = userData.currentState?.displaySummary || userData.currentState?.summary || userData.currentState?.description || "";
      setLockedCurrentState(stateDisplay);

      // Current state confirmed - show coming soon
      setStep(STEPS.DONE);
      addMessage(
        "Awesome! I've got what I need to start building your plan. 🚀\n\nComing soon: Constraints, behavior profile, and your personalized training plan.",
        true,
        "You're all set! 🎉"
      );
    } else {
      // User wants to change - go back to current state input
      setStep(STEPS.CURRENT_STATE);
      setShowTextInput(true);
      setInput(userData.currentState?.description || "");
      addMessage("No problem — edit below.", true, null);
    }
  };

  // Helper to go to CURRENT_STATE with contextual question
  const goToCurrentState = () => {
    const goal = userData.goal?.raw || "";
    const goalLower = goal.toLowerCase();

    // Build a contextual question based on the goal - conversational with emojis
    let question = "Now let's see where you're starting from 📍\n\nTell me about your current training — what you do, how often, and anything I should know.";

    // Detect goal type and customize question
    if (/marathon|half|10k|5k|run|löp|spring/i.test(goalLower)) {
      question = "Let's talk running 🏃\n\nHow often do you run? What distances? Any injuries or limitations?";
    } else if (/triathlon|ironman|swimrun/i.test(goalLower)) {
      question = "Let's map out your tri-fitness 🏊🚴🏃\n\nWhich discipline is your strongest? Any gaps I should know about?";
    } else if (/swim|sim/i.test(goalLower)) {
      question = "Let's talk swimming 🏊\n\nHow often, what distances, and how's your technique?";
    } else if (/cycl|bike|cykel/i.test(goalLower)) {
      question = "Let's talk cycling 🚴\n\nIndoor or outdoor? Current distances and frequency?";
    } else if (/strength|strong|styrka|lift|bench|squat|deadlift/i.test(goalLower)) {
      question = "Let's talk strength 🏋️\n\nWhat do you do now? Any numbers you know (bench, squat, etc)?";
    } else if (/muscle|hypertrophy|massa|bigger/i.test(goalLower)) {
      question = "Let's talk training 💪\n\nExperience with lifting? Current routine?";
    } else if (/weight|lose|fat|gå ner|viktnedgång/i.test(goalLower)) {
      question = "Let's talk activity 🔥\n\nWhat do you do now? What types of exercise do you enjoy?";
    } else if (/health|hälsa|feel better|må bättre|energy|energi/i.test(goalLower)) {
      question = "Let's see where you're at 🌱\n\nHow active are you now? What's worked for you before?";
    } else if (/flex|mobility|stretch|rörlighet/i.test(goalLower)) {
      question = "Let's talk mobility 🧘\n\nAny tight areas? Current stretching habits?";
    }

    setStep(STEPS.CURRENT_STATE);
    setShowTextInput(true);
    addMessage(question, true, "Step 2 — Current state");
  };

  // Handle AMBITION
  const handleAmbition = async (value) => {
    haptic("impactLight");
    const item = ambitionReplies.find((r) => r.value === value);
    addMessage(item?.label || value, false);

    await setAmbition(value);
    setUserData((prev) => ({ ...prev, ambition: value }));

    // Go to current state with contextual question
    goToCurrentState();
  };

  // Handle BEHAVIOR_PROFILE form
  const handleBehaviorProfileSubmit = async () => {
    haptic("impactLight");
    const { irregularSchedule, energyVaries, perfectionism, stressLevel } = formData;

    const profile = {
      irregularSchedule: irregularSchedule || false,
      energyNotMotivation: energyVaries || false,
      perfectionism: perfectionism || false,
      stressLevel: stressLevel || "MEDIUM",
    };

    addMessage("Got it", false);
    setUserData((prev) => ({ ...prev, behaviorProfile: profile }));
    await updateBehaviorProfile(profile);

    // Branch based on goal type
    if (userData.goal?.type === GOAL_TYPES.EVENT || userData.isEvent) {
      // Calculate gap and generate strategy
      await generateEventStrategy();
    } else {
      setStep(STEPS.PLAN_LENGTH);
      addMessage("How long should your plan be?\n\nRolling means we'll keep going — adjust as we learn what works for you.", true, "Plan duration");
    }
    setFormData({});
  };

  // Handle PLAN_LENGTH
  const handlePlanLength = async (weeks) => {
    haptic("impactLight");
    const label = planLengthReplies.find((r) => r.value === weeks)?.label || `${weeks} weeks`;
    addMessage(label, false);

    setUserData((prev) => ({ ...prev, planWeeks: weeks }));
    await generateNonEventStrategy(weeks);
  };

  // Generate strategy for EVENT goals
  const generateEventStrategy = async () => {
    setLoading(true);
    setStep(STEPS.EVENT_STRATEGY);
    addMessage("Building your preparation strategy...", true, "Strategy");

    try {
      // Calculate gap
      const gapRes = await calculateGap({
        goal: userData.goal,
        currentState: userData.currentState,
        event: userData.event,
      });

      if (gapRes?.ok && gapRes?.data) {
        await updateGap(gapRes.data);
        setUserData((prev) => ({ ...prev, gap: gapRes.data }));
      }

      // Generate strategy
      const strategyRes = await generateStrategy({
        goalType: GOAL_TYPES.EVENT,
        gap: gapRes?.data,
        constraints: userData.constraints,
        event: userData.event,
        ambition: userData.ambition || "BALANCED",
      });

      if (strategyRes?.ok && strategyRes?.data) {
        setUserData((prev) => ({ ...prev, strategy: strategyRes.data }));

        let msg = `${strategyRes.data.totalWeeks} weeks - ${strategyRes.data.strategyType}\n\n`;
        strategyRes.data.phases?.forEach((p) => {
          msg += `${p.name}: Week ${p.weeks[0]}-${p.weeks[p.weeks.length - 1]} - ${p.focus}\n`;
        });
        if (strategyRes.data.explanation) {
          msg += `\n${strategyRes.data.explanation}`;
        }

        addMessage(msg, true, "Your preparation plan");
      }
    } catch (err) {
      console.error(err);
      addMessage("I've created a standard preparation strategy.", true);
      setUserData((prev) => ({
        ...prev,
        strategy: { strategyType: "BASE_BUILD_PEAK_TAPER", totalWeeks: 12 },
      }));
    } finally {
      setLoading(false);
    }
  };

  // Generate strategy for NON-EVENT goals
  const generateNonEventStrategy = async (weeks) => {
    setLoading(true);
    setStep(STEPS.NON_EVENT_STRATEGY);
    addMessage("Building your training strategy...", true, "Strategy");

    try {
      const gapRes = await calculateGap({
        goal: userData.goal,
        currentState: userData.currentState,
      });

      if (gapRes?.ok && gapRes?.data) {
        await updateGap(gapRes.data);
        setUserData((prev) => ({ ...prev, gap: gapRes.data }));
      }

      const strategyRes = await generateStrategy({
        goalType: GOAL_TYPES.NON_EVENT,
        gap: gapRes?.data,
        constraints: userData.constraints,
        ambition: userData.ambition || "BALANCED",
      });

      if (strategyRes?.ok && strategyRes?.data) {
        const strategy = { ...strategyRes.data, totalWeeks: weeks || strategyRes.data.totalWeeks };
        setUserData((prev) => ({ ...prev, strategy }));

        let msg = `${strategy.totalWeeks || "Rolling"} weeks - ${strategy.strategyType}\n\n`;
        strategy.phases?.forEach((p) => {
          msg += `${p.name}: ${p.focus}\n`;
        });
        if (strategy.explanation) {
          msg += `\n${strategy.explanation}`;
        }

        addMessage(msg, true, "Your training structure");
      }
    } catch (err) {
      console.error(err);
      addMessage("I've created a standard training structure.", true);
      setUserData((prev) => ({
        ...prev,
        strategy: { strategyType: "SAFE_BUILD_MAINTAIN_TEST", totalWeeks: weeks || 8 },
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle strategy confirmation
  const handleStrategyConfirm = async (value) => {
    haptic("impactLight");
    addMessage(value === "accept" ? "Looks good" : "I want to adjust", false);

    if (value === "accept") {
      await generateFullPlan();
    } else {
      setShowTextInput(true);
      addMessage("What would you like to change?\n\nTell me and I'll adjust.", true, "Adjustments");
    }
  };

  // Generate full master plan
  const generateFullPlan = async () => {
    setLoading(true);
    setStep(STEPS.GENERATING_PLAN);
    addMessage("Creating your personalized training plan...", true, "Building plan");

    try {
      const planRes = await generateMasterPlanV2({
        goal: userData.goal,
        intent: { primary: userData.goal?.intent || "LIVSSTIL" },
        gap: userData.gap,
        event: userData.event,
        constraints: {
          ...userData.constraints,
          sessionsPerWeek: userData.currentState?.sessionsPerWeek || 3,
          timePerSession: userData.currentState?.timePerSession || 45,
        },
        behaviorProfile: userData.behaviorProfile,
        strategy: userData.strategy,
        ambition: userData.ambition,
      });

      if (planRes?.ok && planRes?.data) {
        await setGeneratedMasterPlan(planRes.data);
        setUserData((prev) => ({ ...prev, masterPlan: planRes.data }));

        // Get summary
        const summaryRes = await summarizePlanV2({
          goal: userData.goal,
          intent: { primary: userData.goal?.intent },
          masterPlan: planRes.data.masterPlan,
          constraints: userData.constraints,
          gap: userData.gap,
          event: userData.event,
        });

        setStep(STEPS.PLAN_SUMMARY);
        if (summaryRes?.ok && summaryRes?.data?.summary) {
          addMessage(summaryRes.data.summary, true, "Your plan");
          if (summaryRes.data.safetyNets?.length) {
            setTimeout(() => {
              addMessage(`Safety nets: ${summaryRes.data.safetyNets.join(", ")}`, true);
            }, 800);
          }
        } else {
          addMessage("Your plan is ready.\n\nEvery workout has 3 versions:\n• Normal — full workout\n• Light — lower intensity\n• Short — time-crunched version", true, "Your plan");
        }
      } else {
        throw new Error("Plan generation failed");
      }
    } catch (err) {
      console.error(err);
      addMessage("Couldn't generate the full plan — let me try a simpler version.", true);
      setStep(STEPS.PLAN_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  // Handle summary confirmation
  const handleSummaryConfirm = (value) => {
    haptic("impactLight");
    addMessage(value === "accept" ? "This looks good" : "I want to change something", false);

    if (value === "accept") {
      setStep(STEPS.PREFERENCE_MODE);
      addMessage("One last thing.\n\nHow do you prefer I communicate with you?", true, "Communication style");
    } else {
      setShowTextInput(true);
      addMessage("What would you like to change?\n\nTell me and I'll adjust.", true, "Adjustments");
    }
  };

  // Handle preference mode
  const handlePreferenceMode = async (value) => {
    haptic("impactLight");
    const label = preferenceModeReplies.find((r) => r.value === value)?.label || value;
    addMessage(label, false);

    await updateBehaviorProfile({ preferredMode: value });
    finishOnboarding();
  };

  // Finish onboarding
  const finishOnboarding = async () => {
    setStep(STEPS.DONE);
    addMessage(
      "You're all set.\n\nRemember — this is just a starting point. We'll adjust as we go.\n\nYour 3 workout versions:\n• Normal — full workout as designed\n• Light — lower intensity for tough days\n• Short — core exercises only\n\nUse whichever fits your day.",
      true,
      "All set"
    );

    await completeOnboarding({
      goal: userData.goal?.raw,
      daysPerWeek: userData.currentState?.sessionsPerWeek || 3,
      sessionDuration: userData.currentState?.timePerSession || 45,
    });
  };

  // =============================================================================
  // TEXT INPUT HANDLER
  // =============================================================================

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    console.log("[Onboarding] handleSubmit called. Current step:", step, "Input:", text);

    haptic("impactLight");
    addMessage(text, false);
    setInput("");
    setShowTextInput(false);
    setLoading(true);

    try {
      // Global intent detection - check if user wants to change their goal from anywhere
      // Be specific to avoid false positives - require explicit phrases
      const changeGoalPhrases = /\b(change\s*(my\s*)?(goal|mål)|ändra\s*(mitt\s*)?(mål|goal)|nytt\s*mål|different\s*goal|go\s*back\s*to\s*(goal|start)|börja\s*om)\b/i;
      const wantsToChangeGoal = changeGoalPhrases.test(text);

      if (wantsToChangeGoal && step !== STEPS.GOAL_INPUT && step !== STEPS.INTRO) {
        console.log("[Onboarding] User wants to change goal, navigating back");
        // Clear previous goal data so we start fresh
        setUserData((prev) => ({ ...prev, goal: null, event: null, isEvent: false }));
        setLockedGoal(null);
        setStep(STEPS.GOAL_INPUT);
        setShowTextInput(true);
        setInput(""); // Start fresh
        addMessage("No problem — what's your new goal?", true, "Change goal");
        setLoading(false);
        return; // Exit early, don't process the step
      }

      switch (step) {
        case STEPS.GOAL_INPUT: {
          console.log("[Onboarding] GOAL_INPUT: Processing goal:", text);

          // Basic validation
          if (text.length < 3) {
            setShowTextInput(true);
            addMessage("Can you tell me a bit more?", true, null);
            break;
          }

          // Combine with previous goal text if this is a follow-up answer
          const previousGoalText = userData.goal?.raw || "";
          const fullGoalText = previousGoalText ? `${previousGoalText}\n${text}` : text;

          // Call AI to interpret and normalize the goal
          let goalData = { raw: fullGoalText, type: GOAL_TYPES.NON_EVENT };
          let aiDisplayTitle = text;
          let needsMoreInfo = false;
          let missingInfoMsg = null;

          try {
            const res = await interpretGoalV2(fullGoalText);
            if (res?.ok && res?.data) {
              const { type, level, intent, direction, displayTitle, confidence, risk, needsEventDetails, needsMoreInfo: apiNeedsMore, missingInfo } = res.data;

              // Check if AI says it needs more info
              if (apiNeedsMore && missingInfo) {
                needsMoreInfo = true;
                missingInfoMsg = missingInfo;
                // Store partial goal so we can accumulate
                goalData = { raw: fullGoalText, type: GOAL_TYPES.NON_EVENT, displayTitle: displayTitle || text };
              } else {
                // AI successfully interpreted - store normalized data
                goalData = {
                  raw: fullGoalText,
                  type: type || GOAL_TYPES.NON_EVENT,
                  level,
                  displayTitle: displayTitle || direction || text,
                  classification: { intent, direction, risk: risk || [] },
                  confidence,
                  needsEventDetails,
                };

                // Use AI's clean displayTitle
                if (displayTitle && displayTitle.length > 1) {
                  aiDisplayTitle = displayTitle;
                } else if (direction && direction.length > 3) {
                  aiDisplayTitle = direction;
                }

                console.log("[Onboarding] AI normalized:", { original: fullGoalText, displayTitle: aiDisplayTitle });
              }
            }
          } catch (apiError) {
            console.log("[Onboarding] API failed, using text directly");
          }

          // If AI needs more info, store partial and ask follow-up
          if (needsMoreInfo && missingInfoMsg) {
            setUserData((prev) => ({ ...prev, goal: goalData }));
            setShowTextInput(true);
            addMessage(missingInfoMsg, true, "One more thing 🎯");
            break;
          }

          // Store goal data
          setUserData((prev) => ({ ...prev, goal: goalData }));
          await updateGoal(goalData);

          // Route to EVENT or NON_EVENT flow
          if (goalData.type === GOAL_TYPES.EVENT) {
            // EVENT FLOW - lookup event details
            let eventData = { name: aiDisplayTitle, type: "other" };
            let eventFound = false;

            // Use clean displayTitle for lookup if shorter
            const lookupQuery = aiDisplayTitle.length < text.length ? aiDisplayTitle : text;

            try {
              const lookupRes = await lookupEvent(lookupQuery);
              if (lookupRes?.ok && lookupRes?.data?.found) {
                const { eventDate, distance, sport, location, eventName } = lookupRes.data;
                const dateObj = eventDate ? new Date(eventDate) : null;
                const daysUntil = dateObj ? Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24)) : null;

                eventData = {
                  name: eventName || aiDisplayTitle,
                  type: sport || "running",
                  date: eventDate,
                  daysUntil,
                  distance,
                  location,
                };
                eventFound = true;
              }
            } catch (e) {
              console.log("[Onboarding] Event lookup failed:", e);
            }

            setUserData((prev) => ({ ...prev, event: eventData, isEvent: true }));
            await updateEvent(eventData);

            // Build summary
            let summary = aiDisplayTitle;
            if (eventData.distance && !summary.includes(eventData.distance)) {
              summary += ` (${eventData.distance})`;
            }
            if (eventData.date) {
              const dateStr = new Date(eventData.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              summary += `\n📅 ${dateStr}`;
              if (eventData.daysUntil > 0) summary += ` — ${eventData.daysUntil} days`;
            }
            if (!eventFound && goalData.needsEventDetails) {
              summary += "\n\n(Add a date if you have one)";
            }
            summary += "\n\nWhat's your ambition? 🎯";

            setStep(STEPS.EVENT_AMBITION);
            addMessage(summary, true, "Nice! Let's do this 🔥");
          } else {
            // NON-EVENT FLOW - show normalized displayTitle for confirmation
            setStep(STEPS.GOAL_CONFIRM);
            addMessage(`${aiDisplayTitle} 💪\n\nLove it. Is this right?`, true, "Confirm your goal");
          }
          break;
        }

        // GOAL_DETAILS and EVENT_INFO are no longer used - flow goes directly to GOAL_CONFIRM
        case STEPS.GOAL_DETAILS:
        case STEPS.EVENT_INFO: {
          console.log("[Onboarding] Deprecated step reached, redirecting to GOAL_CONFIRM");
          setStep(STEPS.GOAL_CONFIRM);
          break;
        }

        // Handle performance target input for EVENT_AMBITION
        case STEPS.EVENT_AMBITION: {
          console.log("[Onboarding] EVENT_AMBITION: Processing performance target:", text);
          if (userData.pendingAmbition === "PERFORMANCE") {
            await finalizeEventAmbition("PERFORMANCE", text);
          }
          break;
        }

        case STEPS.CURRENT_STATE: {
          console.log("[Onboarding] CURRENT_STATE: Processing current state:", text);

          // Build full description (combine with previous if user is adding more info)
          const previousDescription = userData.currentState?.description || "";
          const fullDescription = previousDescription ? `${previousDescription}\n${text}` : text;

          // Call AI to interpret the current state
          let interpretation = null;
          try {
            const res = await interpretCurrentState(fullDescription, userData.goal);
            if (res?.ok && res?.data) {
              interpretation = res.data;
              console.log("[Onboarding] AI interpretation:", interpretation);
            }
          } catch (err) {
            console.log("[Onboarding] Current state interpretation failed:", err);
          }

          // Check if AI needs more information
          if (interpretation?.needsMoreInfo && interpretation?.missingInfo) {
            // AI says info is insufficient - ask follow-up question
            console.log("[Onboarding] AI needs more info:", interpretation.missingInfo);

            // Store cumulative current state
            setUserData((prev) => ({
              ...prev,
              currentState: {
                ...prev.currentState,
                description: fullDescription,
              },
            }));

            // Stay in CURRENT_STATE and ask for more info - JUST the question, no summary
            setShowTextInput(true);
            addMessage(interpretation.missingInfo, true, null);
            break;
          }

          // AI has enough info - store and go to confirm
          const currentState = {
            description: fullDescription,
            ...(interpretation && {
              summary: interpretation.summary,
              displaySummary: interpretation.displaySummary,
              level: interpretation.level,
              frequency: interpretation.frequency,
              experience: interpretation.experience,
              limitations: interpretation.limitations,
              insights: interpretation.insights,
            }),
          };

          setUserData((prev) => ({ ...prev, currentState }));

          // Go to CURRENT_STATE_CONFIRM - show AI's interpretation
          setStep(STEPS.CURRENT_STATE_CONFIRM);

          // Build the confirmation message with AI's interpretation
          const summary = interpretation?.summary || text;
          let confirmMsg = summary;

          if (interpretation?.insights?.length > 0) {
            confirmMsg += `\n\n${interpretation.insights.join("\n")}`;
          }

          confirmMsg += "\n\nDoes this sound right? ✅";

          addMessage(confirmMsg, true, "Got it 📍");
          break;
        }

        case STEPS.CONSTRAINTS: {
          console.log("[Onboarding] CONSTRAINTS: Processing constraints:", text);

          // Parse common patterns from free text
          const sessionsMatch = text.match(/(\d+)\s*(x|times?|gånger?|ggr)/i);
          const timeMatch = text.match(/(\d+)\s*(min|minutes?|minuter)/i);

          const constraints = {
            description: text,
            sessionsPerWeek: sessionsMatch ? parseInt(sessionsMatch[1], 10) : null,
            timePerSession: timeMatch ? parseInt(timeMatch[1], 10) : null,
          };

          setUserData((prev) => ({
            ...prev,
            constraints: { ...prev.constraints, ...constraints },
          }));

          await updateConstraints(constraints);

          // Go to BEHAVIOR_PROFILE
          setStep(STEPS.BEHAVIOR_PROFILE);
          setFormData({});
          addMessage("A few quick questions.\n\nThis helps me adapt the plan to how you actually work.", true, "About you");
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error("[Onboarding] Error:", err);
      addMessage("Something went wrong. Let's try again.", true);
      setShowTextInput(true);
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getCurrentReplies = () => {
    switch (step) {
      case STEPS.GOAL_CONFIRM:
        return goalConfirmReplies;
      case STEPS.CURRENT_STATE_CONFIRM:
        return currentStateConfirmReplies;
      case STEPS.EVENT_AMBITION:
        // Don't show quick replies if waiting for performance target input
        if (userData.pendingAmbition) return null;
        return eventAmbitionReplies;
      case STEPS.AMBITION:
        return ambitionReplies;
      case STEPS.PLAN_LENGTH:
        return planLengthReplies;
      case STEPS.EVENT_STRATEGY:
      case STEPS.NON_EVENT_STRATEGY:
        return strategyConfirmReplies;
      case STEPS.PLAN_SUMMARY:
        return summaryReplies;
      case STEPS.PREFERENCE_MODE:
        return preferenceModeReplies;
      default:
        return null;
    }
  };

  const getCurrentHandler = () => {
    switch (step) {
      case STEPS.GOAL_CONFIRM:
        return handleGoalConfirm;
      case STEPS.CURRENT_STATE_CONFIRM:
        return handleCurrentStateConfirm;
      case STEPS.EVENT_AMBITION:
        return handleEventAmbition;
      case STEPS.AMBITION:
        return handleAmbition;
      case STEPS.PLAN_LENGTH:
        return handlePlanLength;
      case STEPS.EVENT_STRATEGY:
      case STEPS.NON_EVENT_STRATEGY:
        return handleStrategyConfirm;
      case STEPS.PLAN_SUMMARY:
        return handleSummaryConfirm;
      case STEPS.PREFERENCE_MODE:
        return handlePreferenceMode;
      default:
        return () => {};
    }
  };

  const showFormStep = [STEPS.BEHAVIOR_PROFILE].includes(step);
  const showInput = showTextInput && (
    [STEPS.GOAL_INPUT, STEPS.CURRENT_STATE, STEPS.CONSTRAINTS].includes(step) ||
    (step === STEPS.EVENT_AMBITION && userData.pendingAmbition)
  );
  const currentReplies = getCurrentReplies();
  const currentHandler = getCurrentHandler();

  // Debug render state
  console.log("[Onboarding] Render - step:", step, "showInput:", showInput, "showTextInput:", showTextInput, "currentReplies:", currentReplies ? "yes" : "no");

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <DynamicSafeAreaView style={styles.screen}>
      {/* Header - OUTSIDE KeyboardAvoidingView so it stays fixed */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>SweatBuilder</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <ProgressBar progress={progress} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >

        {/* Locked Steps Display */}
        {(lockedGoal || lockedCurrentState) && (
          <View style={styles.lockedContainer}>
            {lockedGoal && (
              <View style={styles.lockedItem}>
                <Text style={styles.lockedNumber}>1</Text>
                <View style={styles.lockedContent}>
                  <Text style={styles.lockedLabel}>Goal</Text>
                  <Text style={styles.lockedText} numberOfLines={2}>{lockedGoal}</Text>
                </View>
              </View>
            )}
            {lockedCurrentState && (
              <View style={styles.lockedItem}>
                <Text style={styles.lockedNumber}>2</Text>
                <View style={styles.lockedContent}>
                  <Text style={styles.lockedLabel}>Current state</Text>
                  <Text style={styles.lockedText} numberOfLines={3}>{lockedCurrentState}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => (
            <View key={msg.id}>
              <View
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
              {/* Divider after Welcome message */}
              {msg.title?.includes("Welcome") && messages[index + 1] && (
                <View style={styles.divider} />
              )}
            </View>
          ))}

          {/* Quick reply pills */}
          {!typingMessageId && !loading && currentReplies && !showFormStep && (
            <Animated.View
              style={[
                styles.inlinePillsContainer,
                {
                  opacity: pillsAnim,
                  transform: [{
                    translateY: pillsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  }],
                },
              ]}
            >
              {currentReplies.map((item) => (
                <TouchableOpacity
                  key={String(item.value)}
                  style={[
                    styles.quickReplyChip,
                    item.secondary && styles.quickReplyChipSecondary,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => currentHandler(item.value)}
                >
                  <Text style={[
                    styles.quickReplyText,
                    item.secondary && styles.quickReplyTextSecondary,
                  ]}>{item.label}</Text>
                  {item.description && (
                    <Text style={styles.quickReplyDescription}>{item.description}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Form steps */}
          {!typingMessageId && !loading && showFormStep && (
            <View style={styles.formContainer}>
              {step === STEPS.BEHAVIOR_PROFILE && (
                <>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabelContainer}>
                      <Text style={styles.toggleLabel}>Unpredictable schedule?</Text>
                      <Text style={styles.toggleDescription}>Work shifts, travel, etc.</Text>
                    </View>
                    <Switch
                      value={formData.irregularSchedule || false}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, irregularSchedule: v }))}
                      trackColor={{ true: theme.colors.yellow }}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabelContainer}>
                      <Text style={styles.toggleLabel}>Energy varies day to day?</Text>
                      <Text style={styles.toggleDescription}>Some days great, others not</Text>
                    </View>
                    <Switch
                      value={formData.energyVaries || false}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, energyVaries: v }))}
                      trackColor={{ true: theme.colors.yellow }}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabelContainer}>
                      <Text style={styles.toggleLabel}>All-or-nothing tendency?</Text>
                      <Text style={styles.toggleDescription}>Perfect or skip entirely</Text>
                    </View>
                    <Switch
                      value={formData.perfectionism || false}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, perfectionism: v }))}
                      trackColor={{ true: theme.colors.yellow }}
                    />
                  </View>

                  <Text style={styles.formLabel}>Current stress level</Text>
                  <View style={styles.selectRow}>
                    {["Low", "Medium", "High"].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.selectChip,
                          formData.stressLevel === level.toUpperCase() && styles.selectChipActive,
                        ]}
                        onPress={() => setFormData((prev) => ({ ...prev, stressLevel: level.toUpperCase() }))}
                      >
                        <Text style={styles.selectChipText}>{level}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.formButton} onPress={handleBehaviorProfileSubmit}>
                    <Text style={styles.formButtonText}>Continue</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
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
              <Text style={styles.doneButtonText}>Start training</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Continue button for INTRO */}
        {step === STEPS.INTRO && !typingMessageId && (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleIntroContinue}
            >
              <Text style={styles.continueButtonText}>Get started</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Text input */}
        {showInput && !typingMessageId && (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={
                  step === STEPS.GOAL_INPUT
                    ? "Type your goal..."
                    : step === STEPS.CURRENT_STATE
                    ? "Describe your current situation..."
                    : step === STEPS.CONSTRAINTS
                    ? "Any constraints..."
                    : step === STEPS.EVENT_AMBITION && userData.pendingAmbition
                    ? "Your target..."
                    : "Type here..."
                }
                placeholderTextColor={theme.colors.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
                editable={!loading}
                multiline={step === STEPS.CURRENT_STATE || step === STEPS.CONSTRAINTS}
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
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
  },
  progressContainer: {
    height: 3,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.screenPadding,
    borderRadius: 2,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.yellow,
    borderRadius: 2,
  },
  lockedContainer: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  lockedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  lockedNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.yellow,
    width: 18,
    height: 18,
    textAlign: "center",
    lineHeight: 18,
    backgroundColor: `${theme.colors.yellow}20`,
    borderRadius: 9,
    overflow: "hidden",
  },
  lockedContent: {
    flex: 1,
  },
  lockedLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  lockedText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: 100,
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
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  userText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  inputArea: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
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
  quickReplyDescription: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  quickReplyChipSecondary: {
    borderColor: theme.colors.border,
  },
  quickReplyTextSecondary: {
    color: theme.colors.textMuted,
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
  // Form styles
  formContainer: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  selectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  selectColumn: {
    flexDirection: "column",
    gap: theme.spacing.xs,
  },
  selectChip: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  selectChipWide: {
    width: "100%",
  },
  selectChipActive: {
    borderColor: theme.colors.yellow,
    backgroundColor: `${theme.colors.yellow}15`,
  },
  selectChipText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  formButton: {
    backgroundColor: theme.colors.yellow,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
    marginTop: theme.spacing.lg,
  },
  formButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.black,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  toggleDescription: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
