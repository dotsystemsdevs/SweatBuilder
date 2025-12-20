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
  Keyboard,
  Image,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import WheelDatePicker from "../components/WheelDatePicker";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptic } from "../utils/haptics";
import { useKeyboardBehavior } from "../hooks/useKeyboardBehavior";
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
import { RACE_DATABASE, filterRaces as filterRacesFromDB, findRace } from "../data/raceDatabase";
import theme from "../theme";
import FitnessAssessmentForm from "../components/Onboarding/FitnessAssessmentForm";

// Bot icon
const botIcon = require("../bot.png");

// =============================================================================
// HELPERS
// =============================================================================

const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Parse date from free-form text input
const parseDateFromText = (text) => {
  if (!text) return null;
  const dateText = text.toLowerCase().trim();

  // Swedish/English month mapping
  const monthMap = {
    'januari': 'january', 'jan': 'january',
    'februari': 'february', 'feb': 'february',
    'mars': 'march', 'mar': 'march',
    'april': 'april', 'apr': 'april',
    'maj': 'may',
    'juni': 'june', 'jun': 'june',
    'juli': 'july', 'jul': 'july',
    'augusti': 'august', 'aug': 'august',
    'september': 'september', 'sep': 'september', 'sept': 'september',
    'oktober': 'october', 'okt': 'october',
    'november': 'november', 'nov': 'november',
    'december': 'december', 'dec': 'december',
  };

  // Normalize text
  let normalized = dateText;
  for (const [foreign, english] of Object.entries(monthMap)) {
    normalized = normalized.replace(new RegExp(`\\b${foreign}\\b`, 'gi'), english);
  }

  try {
    // Try direct parse first (handles "june 2025", "march 15 2025", etc.)
    const parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) {
      const daysDiff = Math.ceil((parsed - new Date()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 0) {
        return parsed.toISOString().split("T")[0];
      }
    }

    // Try extracting month/year
    const monthMatch = normalized.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
    const yearMatch = normalized.match(/20\d{2}/);
    const dayMatch = normalized.match(/\b(\d{1,2})\b/);

    if (monthMatch) {
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
      const day = dayMatch ? parseInt(dayMatch[1]) : 15;
      const monthIndex = new Date(`${monthMatch[0]} 1, 2000`).getMonth();

      let targetYear = year;
      if (!yearMatch) {
        const testDate = new Date(year, monthIndex, day);
        if (testDate < new Date()) targetYear = year + 1;
      }

      const dateObj = new Date(targetYear, monthIndex, Math.min(day, 28));
      const daysDiff = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 0) {
        return dateObj.toISOString().split("T")[0];
      }
    }

    // Handle relative dates ("in X months/weeks")
    const monthsMatch = normalized.match(/(?:om|in)\s*(\d+)\s*(?:månader?|months?)/i);
    if (monthsMatch) {
      const dateObj = new Date();
      dateObj.setMonth(dateObj.getMonth() + parseInt(monthsMatch[1]));
      return dateObj.toISOString().split("T")[0];
    }

    const weeksMatch = normalized.match(/(?:om|in)\s*(\d+)\s*(?:veckor?|weeks?)/i);
    if (weeksMatch) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + (parseInt(weeksMatch[1]) * 7));
      return dateObj.toISOString().split("T")[0];
    }

    // Handle "next spring/summer/fall/winter"
    const seasonMatch = normalized.match(/(?:next\s+)?(spring|summer|fall|autumn|winter|vår|sommar|höst|vinter)/i);
    if (seasonMatch) {
      const seasonMonths = {
        spring: 4, vår: 4,
        summer: 7, sommar: 7,
        fall: 10, autumn: 10, höst: 10,
        winter: 1, vinter: 1,
      };
      const month = seasonMonths[seasonMatch[1].toLowerCase()];
      let year = new Date().getFullYear();
      const dateObj = new Date(year, month - 1, 15);
      if (dateObj <= new Date()) {
        dateObj.setFullYear(year + 1);
      }
      return dateObj.toISOString().split("T")[0];
    }

  } catch (e) {
    console.log("[parseDateFromText] Error:", e);
  }

  return null;
};

// =============================================================================
// LOCATION AUTOCOMPLETE
// =============================================================================

const RACE_LOCATIONS = [
  // Major marathon cities
  { city: "Boston", country: "USA", display: "Boston, USA" },
  { city: "New York", country: "USA", display: "New York, USA" },
  { city: "Chicago", country: "USA", display: "Chicago, USA" },
  { city: "Berlin", country: "Germany", display: "Berlin, Germany" },
  { city: "London", country: "UK", display: "London, UK" },
  { city: "Tokyo", country: "Japan", display: "Tokyo, Japan" },
  { city: "Paris", country: "France", display: "Paris, France" },
  { city: "Amsterdam", country: "Netherlands", display: "Amsterdam, Netherlands" },
  { city: "Rotterdam", country: "Netherlands", display: "Rotterdam, Netherlands" },
  { city: "Valencia", country: "Spain", display: "Valencia, Spain" },
  { city: "Barcelona", country: "Spain", display: "Barcelona, Spain" },
  { city: "Vienna", country: "Austria", display: "Vienna, Austria" },
  { city: "Munich", country: "Germany", display: "Munich, Germany" },
  { city: "Frankfurt", country: "Germany", display: "Frankfurt, Germany" },
  { city: "Hamburg", country: "Germany", display: "Hamburg, Germany" },
  { city: "Copenhagen", country: "Denmark", display: "Copenhagen, Denmark" },
  { city: "Oslo", country: "Norway", display: "Oslo, Norway" },
  { city: "Helsinki", country: "Finland", display: "Helsinki, Finland" },
  // Sweden
  { city: "Stockholm", country: "Sweden", display: "Stockholm, Sweden" },
  { city: "Gothenburg", country: "Sweden", display: "Gothenburg, Sweden" },
  { city: "Malmö", country: "Sweden", display: "Malmö, Sweden" },
  { city: "Uppsala", country: "Sweden", display: "Uppsala, Sweden" },
  { city: "Sälen", country: "Sweden", display: "Sälen, Sweden" },
  { city: "Mora", country: "Sweden", display: "Mora, Sweden" },
  { city: "Lidingö", country: "Sweden", display: "Lidingö, Sweden" },
  // Ironman locations
  { city: "Kona", country: "Hawaii", display: "Kona, Hawaii" },
  { city: "Nice", country: "France", display: "Nice, France" },
  { city: "Zürich", country: "Switzerland", display: "Zürich, Switzerland" },
  { city: "Kalmar", country: "Sweden", display: "Kalmar, Sweden" },
  { city: "Copenhagen", country: "Denmark", display: "Copenhagen, Denmark" },
  { city: "Lake Placid", country: "USA", display: "Lake Placid, USA" },
  { city: "Cairns", country: "Australia", display: "Cairns, Australia" },
  // Other popular locations
  { city: "Dubai", country: "UAE", display: "Dubai, UAE" },
  { city: "Singapore", country: "Singapore", display: "Singapore" },
  { city: "Sydney", country: "Australia", display: "Sydney, Australia" },
  { city: "Melbourne", country: "Australia", display: "Melbourne, Australia" },
  { city: "Cape Town", country: "South Africa", display: "Cape Town, South Africa" },
  { city: "Rio de Janeiro", country: "Brazil", display: "Rio de Janeiro, Brazil" },
  // Countries (for those who just type country)
  { city: "", country: "Sweden", display: "Sweden" },
  { city: "", country: "Norway", display: "Norway" },
  { city: "", country: "Denmark", display: "Denmark" },
  { city: "", country: "Finland", display: "Finland" },
  { city: "", country: "Germany", display: "Germany" },
  { city: "", country: "USA", display: "USA" },
  { city: "", country: "UK", display: "UK" },
  { city: "", country: "France", display: "France" },
  { city: "", country: "Spain", display: "Spain" },
  { city: "", country: "Italy", display: "Italy" },
  { city: "", country: "Switzerland", display: "Switzerland" },
  { city: "", country: "Netherlands", display: "Netherlands" },
  { city: "", country: "Australia", display: "Australia" },
  { city: "", country: "Japan", display: "Japan" },
];

// =============================================================================
// TYPO CORRECTION & FUZZY MATCHING
// =============================================================================

// Common training goals with common misspellings
const GOAL_CORRECTIONS = {
  // Running
  "maraton": "marathon",
  "maratong": "marathon",
  "maratonn": "marathon",
  "halvmaraton": "half marathon",
  "halv maraton": "half marathon",
  "halvmaratong": "half marathon",
  "10 km": "10k",
  "5 km": "5k",
  "springa": "running",
  "löpa": "running",
  "löping": "running",
  "jogga": "running",

  // Strength
  "styrka": "strength",
  "styrketräning": "strength training",
  "bänkpress": "bench press",
  "bänk": "bench press",
  "knäböj": "squat",
  "squats": "squat",
  "marklyft": "deadlift",
  "lyfta": "lifting",
  "lyft": "lifting",

  // Weight/Muscle
  "viktnedgång": "weight loss",
  "gå ner i vikt": "weight loss",
  "bygga muskler": "build muscle",
  "muskel": "muscle",
  "hypertrofi": "hypertrophy",

  // Other
  "träna": "training",
  "träning": "training",
  "fitness": "fitness",
  "kondition": "cardio",
  "konditionsträning": "cardio",
  "flexibilitet": "flexibility",
  "mobilitet": "mobility",
  "uthållighet": "endurance",
  "stamina": "endurance",
};

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[len2][len1];
};

// Find closest match with fuzzy matching
const findClosestMatch = (input, threshold = 0.7) => {
  const inputLower = input.toLowerCase().trim();

  // Direct match in corrections
  if (GOAL_CORRECTIONS[inputLower]) {
    return GOAL_CORRECTIONS[inputLower];
  }

  // Check each word in input
  const words = inputLower.split(/\s+/);
  const correctedWords = words.map(word => {
    // Direct match
    if (GOAL_CORRECTIONS[word]) {
      return GOAL_CORRECTIONS[word];
    }

    // Fuzzy match
    let bestMatch = null;
    let bestScore = threshold;

    for (const [wrong, correct] of Object.entries(GOAL_CORRECTIONS)) {
      const distance = levenshteinDistance(word, wrong);
      const maxLen = Math.max(word.length, wrong.length);
      const similarity = 1 - (distance / maxLen);

      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = correct;
      }
    }

    return bestMatch || word;
  });

  const corrected = correctedWords.join(" ");
  return corrected !== inputLower ? corrected : null;
};

// Smart typo correction that preserves user intent
const correctTypos = (text) => {
  const corrected = findClosestMatch(text);
  return corrected || text;
};

// Check if text looks like it might have typos
const mightHaveTypos = (text) => {
  const textLower = text.toLowerCase().trim();

  // Check against known corrections
  if (GOAL_CORRECTIONS[textLower]) {
    return true;
  }

  // Check for common typo patterns
  const words = textLower.split(/\s+/);
  for (const word of words) {
    if (word.length >= 4) {
      // Check if word is close to any known goal
      for (const [wrong] of Object.entries(GOAL_CORRECTIONS)) {
        const distance = levenshteinDistance(word, wrong);
        const maxLen = Math.max(word.length, wrong.length);
        const similarity = 1 - (distance / maxLen);

        if (similarity >= 0.6 && similarity < 1.0) {
          return true;
        }
      }
    }
  }

  return false;
};

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

// Rotating loading messages with emojis
const LOADING_MESSAGES = [
  "🌱 Analyzing your goal...",
  "💪 Understanding your vision...",
  "🎯 Mapping your path...",
  "🧠 Processing...",
  "✨ Almost there...",
  "🌿 Building your foundation...",
  "🚀 Preparing your journey...",
  "🏁 Checking the details...",
];

const TypingIndicator = ({ message }) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate through loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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

  // Use provided message or rotating messages
  const displayMessage = message || LOADING_MESSAGES[messageIndex];

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={{ fontSize: 14, color: theme.colors.textMuted, fontStyle: "italic" }}>
        {displayMessage}
      </Text>
      <View style={{ flexDirection: "row", gap: 4 }}>
        <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
      </View>
    </View>
  );
};

const ProgressBar = ({ progress }) => (
  <View style={styles.progressContainer}>
    <LinearGradient
      colors={[theme.colors.orange, theme.colors.purple]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.progressBar, { width: `${progress}%` }]}
    />
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
  const inputRef = useRef(null);
  const selectedRaceRef = useRef(null); // Sync ref for race selection
  const keyboardBehavior = useKeyboardBehavior();

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
  const [loadingMessage, setLoadingMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState({});
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [lockedGoal, setLockedGoal] = useState(null);
  const [lockedCurrentState, setLockedCurrentState] = useState(null);
  const [goalInputAttempts, setGoalInputAttempts] = useState(0);
  const [needsMoreInfoAttempts, setNeedsMoreInfoAttempts] = useState(0);
  const [lowConfidenceAttempts, setLowConfidenceAttempts] = useState(0);
  const [pendingQuestionAttempts, setPendingQuestionAttempts] = useState(0);
  const [currentStateAttempts, setCurrentStateAttempts] = useState(0);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to 3 months from now
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  });

  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Race/event autocomplete state
  const [raceSuggestions, setRaceSuggestions] = useState([]);
  const [showRaceSuggestions, setShowRaceSuggestions] = useState(false);

  // Filter locations based on input
  const filterLocations = useCallback((text) => {
    if (!text || text.length < 1) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    const query = text.toLowerCase();
    const matches = RACE_LOCATIONS.filter(loc =>
      loc.city.toLowerCase().startsWith(query) ||
      loc.country.toLowerCase().startsWith(query) ||
      loc.display.toLowerCase().includes(query)
    ).slice(0, 5); // Max 5 suggestions

    setLocationSuggestions(matches);
    setShowLocationSuggestions(matches.length > 0);
  }, []);

  // Handle location suggestion tap
  const handleLocationSelect = (location) => {
    setInput(location.display);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    // Auto-submit after selecting
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  // Filter races based on input (uses imported database)
  const filterRaces = useCallback((text) => {
    if (!text || text.length < 1) {
      setRaceSuggestions([]);
      setShowRaceSuggestions(false);
      return;
    }

    const matches = filterRacesFromDB(text, 5);
    setRaceSuggestions(matches);
    setShowRaceSuggestions(matches.length > 0);
  }, []);

  // Handle race suggestion tap - stores race data and auto-submits
  const handleRaceSelect = (race) => {
    const displayName = race.location ? `${race.name} (${race.location})` : race.name;

    // Store in ref synchronously (so handleSubmit can access it immediately)
    selectedRaceRef.current = race;

    // Also store in state for later use
    setUserData(prev => ({
      ...prev,
      selectedRace: race,
    }));

    // Set input and trigger submit
    setInput(displayName);
    setShowRaceSuggestions(false);
    setRaceSuggestions([]);

    // Auto-submit after a brief delay
    setTimeout(() => {
      handleSubmit();
    }, 50);
  };

  // Constants for loop protection
  const MAX_GOAL_ATTEMPTS = 3;
  const MAX_NEEDS_MORE_INFO = 2;
  const MAX_LOW_CONFIDENCE = 2;
  const MAX_PENDING_QUESTION = 2;
  const MAX_CURRENT_STATE_ATTEMPTS = 3;
  const MAX_FULL_GOAL_LENGTH = 1000;

  // Helper to reset all goal-related attempts
  const resetGoalAttempts = () => {
    setGoalInputAttempts(0);
    setNeedsMoreInfoAttempts(0);
    setLowConfidenceAttempts(0);
    setPendingQuestionAttempts(0);
    setCurrentStateAttempts(0);
  };

  // Helper to set loading with message
  const startLoading = (message = null) => {
    setLoading(true);
    setLoadingMessage(message);
  };

  const stopLoading = () => {
    setLoading(false);
    setLoadingMessage(null);
  };

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

    // Show intro message - short and punchy
    addMessage(
      "Hey! 🌱 I'm Kettle, your training coach.\n\nTogether we'll build something that fits your life and gets you moving. Let's go! 💪",
      true,
      "Welcome"
    );
  }, []);

  // Debug: Log step changes
  useEffect(() => {
    console.log("[Onboarding] Step changed to:", step, "showTextInput:", showTextInput);
  }, [step, showTextInput]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const keyboardShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        // Multiple scrolls to ensure content stays visible during keyboard animation
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 500);
      }
    );
    return () => keyboardShow.remove();
  }, []);

  useEffect(() => {
    if (!typingMessageId && step !== STEPS.DONE) {
      Animated.timing(pillsAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [step, typingMessageId]);

  // Auto-focus input when text input becomes visible
  useEffect(() => {
    if (showTextInput && !typingMessageId) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showTextInput, typingMessageId]);

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
    { label: "🏁 Just finish", value: "COMPLETE" },
    { label: "⏱️ Time goal", value: "PERFORMANCE" },
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
    { label: "Looks good! 👍", value: "accept" },
    { label: "I want to adjust", value: "adjust" },
  ];

  const goalConfirmReplies = [
    { label: "LOCK IT IN 🔒", value: "confirm" },
    { label: "Edit ✏️", value: "change", secondary: true },
  ];

  // Dynamic edit options based on what data exists
  const getEditReplies = () => {
    const replies = [];

    // Always allow editing the goal text
    replies.push({ label: "Edit goal text", value: "edit_goal" });

    // If there's an event, allow editing event details
    if (userData.event) {
      replies.push({ label: "Edit event date", value: "edit_event" });
    }

    // If there's a performance target, allow editing it
    if (userData.event?.performanceTarget || userData.goal?.target) {
      replies.push({ label: "Edit target", value: "edit_target" });
    }

    // Always allow starting fresh - make it clear and visible
    replies.push({ label: "🔄 Start over", value: "start_fresh", secondary: true });

    return replies;
  };

  const currentStateConfirmReplies = [
    { label: "LOCK IT IN 🔒", value: "confirm" },
    { label: "Edit ✏️", value: "change", secondary: true },
  ];

  const summaryReplies = [
    { label: "Love it! 🎉", value: "accept" },
    { label: "Change something", value: "adjust" },
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
    addMessage("Let's go", false); // User message
    setStep(STEPS.GOAL_TYPE);
    addMessage(
      "What do you want to train for?",
      true,
      "Your goal"
    );
  };

  // Quick replies for GOAL_TYPE
  const goalTypeReplies = [
    { label: "🏁 For a race", value: "event" },
    { label: "🎯 Other goal", value: "other" },
    { label: "🌱 No specific goal", value: "no_goal" },
  ];

  // Handle GOAL_TYPE selection
  const handleGoalType = async (value) => {
    haptic("impactLight");
    const labels = {
      event: "🏁 For a race",
      other: "🎯 Other goal",
      no_goal: "🌱 No specific goal",
    };
    addMessage(labels[value] || value, false);

    if (value === "event") {
      // EVENT branch - ask about the specific event
      setStep(STEPS.EVENT_INPUT);
      setShowTextInput(true);
      setUserData((prev) => ({ ...prev, isEvent: true }));
      addMessage(
        "🏁 What event are you preparing for?",
        true,
        "Your event"
      );
    } else if (value === "other") {
      // OTHER branch - go to normal goal input
      setStep(STEPS.GOAL_INPUT);
      setShowTextInput(true);
      addMessage(
        "🎯 What's your goal?\n\nBe specific — the more I know, the better I can help.",
        true,
        "Your goal"
      );
    } else if (value === "no_goal") {
      // NO GOAL branch - set a generic goal and confirm it
      const genericGoal = {
        raw: "General fitness improvement",
        type: GOAL_TYPES.NON_EVENT,
        displayTitle: "Get fitter & feel better",
        classification: { intent: "IMPROVE", direction: "HEALTH" },
      };
      setUserData((prev) => ({ ...prev, goal: genericGoal }));
      await updateGoal(genericGoal);

      // Go to GOAL_CONFIRM to let user approve the generated goal
      setStep(STEPS.GOAL_CONFIRM);
      addMessage(
        "I set a goal for you:\n\n🌱 Get fitter & feel better\n\nDoes this work?",
        true,
        "Your goal"
      );
    }
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

  // Helper to finalize event ambition
  const finalizeEventAmbition = async (ambitionValue, performanceTarget) => {
    const label = eventAmbitionReplies.find((r) => r.value === ambitionValue)?.label || ambitionValue;

    const eventData = {
      ...userData.event,
      ambition: ambitionValue,
      ...(performanceTarget && { performanceTarget }),
    };
    setUserData((prev) => ({ ...prev, event: eventData, pendingAmbition: null }));
    await updateEvent(eventData);

    // If goal is already confirmed (came from GOAL_CONFIRM → EVENT_AMBITION),
    // go directly to CURRENT_STATE
    if (lockedGoal) {
      console.log("[Onboarding] Event ambition finalized, goal already confirmed, going to CURRENT_STATE");

      // Update goal with event info and save to store
      const updatedGoal = {
        ...userData.goal,
        event: eventData,
      };
      setUserData((prev) => ({ ...prev, goal: updatedGoal }));
      await updateGoal(updatedGoal);

      // Update locked goal display with the target
      const updatedGoalDisplay = `${lockedGoal}\nTarget: ${performanceTarget || label}`;
      setLockedGoal(updatedGoalDisplay);

      resetGoalAttempts();
      goToCurrentState(true); // true = goal already confirmed
      return;
    }

    // Otherwise, goal is not confirmed yet - go to GOAL_CONFIRM first
    // Use AI's displayTitle (clean normalized version) for the summary
    let summary = userData.goal?.displayTitle || eventData.name || userData.goal?.raw;

    // Add date if available and not already in displayTitle
    if (eventData.date) {
      const dateStr = new Date(eventData.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      summary += `\n${dateStr}`;
      if (eventData.daysUntil > 0) summary += ` — ${eventData.daysUntil} days`;
    }

    // Add ambition
    summary += `\nTarget: ${performanceTarget || label}`;
    summary += "\n\nSound good?";

    resetGoalAttempts();
    setUserData((prev) => ({ ...prev, skipTypoCheck: false }));
    setStep(STEPS.GOAL_CONFIRM);
    addMessage(summary, true, "Your goal");
    stopLoading();
  };

  // Handle date picker selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Process the selected date and proceed
  const processSelectedDate = async (date) => {
    setShowDatePicker(false);
    haptic("impactLight");

    const eventDate = date.toISOString().split("T")[0];
    const daysUntil = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));

    // Show selected date as user message
    const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    addMessage(dateStr, false);

    // Update event data
    const updatedEvent = {
      ...userData.event,
      date: eventDate,
      daysUntil,
      location: userData.event?.location,
    };
    setUserData((prev) => ({ ...prev, event: updatedEvent, pendingEventDetails: false, eventDetailsAttempts: 0 }));
    await updateEvent(updatedEvent);

    // Build summary for ambition question
    let summary = userData.goal?.displayTitle || updatedEvent.name || userData.goal?.raw;
    if (updatedEvent.distance) summary += ` (${updatedEvent.distance})`;
    summary += `\n📅 ${dateStr}`;
    if (daysUntil > 0) summary += ` — ${daysUntil} days`;
    if (updatedEvent.location) summary += `\n📍 ${updatedEvent.location}`;
    summary += "\n\nWhat's your ambition?";

    setStep(STEPS.EVENT_AMBITION);
    addMessage(summary, true, "Locked in! 🔒");
  };

  // Confirm iOS date picker
  const handleDatePickerConfirm = () => {
    processSelectedDate(selectedDate);
  };

  // Handle GOAL_CONFIRM
  const handleGoalConfirm = async (value) => {
    console.log("[Onboarding] GOAL_CONFIRM: User chose:", value);
    haptic("impactLight");
    addMessage(value === "confirm" ? "Locked in" : "Edit", false);

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

      // Ensure goal is saved to store before proceeding
      if (userData.goal) {
        await updateGoal(userData.goal);
      }

      // Goal confirmed - go straight to CURRENT_STATE
      // No more goal-related questions after confirmation
      console.log("[Onboarding] GOAL_CONFIRM: Goal locked, going to CURRENT_STATE");
      goToCurrentState(true); // true = we just locked the goal
      stopLoading();
    } else {
      // User wants to change - show edit options
      console.log("[Onboarding] GOAL_CONFIRM: User wants to change, showing edit options");
      setUserData((prev) => ({ ...prev, pendingEditChoice: true }));

      // Build a summary of what they can edit
      const editOptions = [];
      if (userData.goal?.displayTitle || userData.goal?.raw) {
        editOptions.push(`• Goal: "${userData.goal?.displayTitle || userData.goal?.raw}"`);
      }
      if (userData.event?.date) {
        editOptions.push(`• Event date: ${userData.event.date}`);
      }
      if (userData.event?.performanceTarget || userData.goal?.target) {
        editOptions.push(`• Target: ${userData.event?.performanceTarget || userData.goal?.target}`);
      }

      const summary = editOptions.length > 0
        ? `What would you like to change?\n\n${editOptions.join("\n")}`
        : "What would you like to change?";

      addMessage(summary, true, "Edit options");
      setShowTextInput(false); // Hide text input, show buttons instead
    }
  };

  // Handle edit choice (after user clicks "Edit" on GOAL_CONFIRM)
  const handleEditChoice = (value) => {
    console.log("[Onboarding] handleEditChoice:", value);
    haptic("impactLight");
    stopLoading(); // Ensure loading is cleared

    // Clear the pending edit state
    setUserData((prev) => ({ ...prev, pendingEditChoice: false }));

    if (value === "edit_goal") {
      // Edit goal text - pre-fill with current goal
      addMessage("Edit goal text", false);
      setLockedGoal(null); // Clear locked goal so new one can be set
      resetGoalAttempts(); // Reset attempts for fresh start
      setUserData((prev) => ({
        ...prev,
        event: null,
        isEvent: false,
        pendingEventQuestion: false,
        pendingPreferenceQuestion: false,
        skipTypoCheck: false,
      }));
      setStep(STEPS.GOAL_INPUT);
      setShowTextInput(true);
      setInput(userData.goal?.raw || "");
      addMessage("What's your updated goal?", true, null);
    } else if (value === "edit_event") {
      // Edit event date
      addMessage("Edit event date", false);
      resetGoalAttempts();
      setUserData((prev) => ({ ...prev, pendingEventQuestion: true }));
      setShowTextInput(true);
      setInput("");
      addMessage(`When is ${userData.event?.name || "your event"}? (e.g., "June 15" or "in 3 months")`, true, "Event date");
    } else if (value === "edit_target") {
      // Edit performance target
      addMessage("Edit target", false);
      resetGoalAttempts();
      setUserData((prev) => ({ ...prev, pendingPreferenceQuestion: true }));
      setShowTextInput(true);
      setInput(userData.event?.performanceTarget || userData.goal?.target || "");
      addMessage("What's your target? (e.g., \"under 4 hours\" or \"run the whole way\")", true, "Your target");
    } else if (value === "start_fresh") {
      // Start completely fresh - go back to GOAL_TYPE
      addMessage("Start fresh", false);
      setLockedGoal(null);
      resetGoalAttempts();
      setUserData((prev) => ({
        ...prev,
        goal: null,
        event: null,
        isEvent: false,
        pendingAmbition: null,
        pendingEventDate: null,
        pendingPreferenceQuestion: false,
        pendingEventQuestion: false,
        pendingEventLocationQuestion: false,
        pendingGenericEvent: null,
        skipTypoCheck: false,
      }));
      setStep(STEPS.GOAL_TYPE);
      setShowTextInput(false);
      setInput("");
      addMessage("What do you want to train for?", true, "Your goal");
    }
  };

  // Handle CURRENT_STATE_CONFIRM
  const handleCurrentStateConfirm = async (value) => {
    console.log("[Onboarding] CURRENT_STATE_CONFIRM: User chose:", value);
    haptic("impactLight");
    addMessage(value === "confirm" ? "Locked in" : "Edit", false);

    if (value === "confirm") {
      // Lock the current state for display - use AI's short displaySummary
      const stateDisplay = userData.currentState?.displaySummary || userData.currentState?.summary || userData.currentState?.description || "";
      setLockedCurrentState(stateDisplay);

      // Go to CONSTRAINTS step
      console.log("[Onboarding] CURRENT_STATE_CONFIRM: Current state locked in, going to CONSTRAINTS");
      setStep(STEPS.CONSTRAINTS);
      setShowTextInput(true);

      // Determine step number for constraints
      const constraintStepNumber = userData.isEvent || userData.goal?.type === GOAL_TYPES.EVENT ? 3 : 4;

      addMessage("Any constraints?\n\nE.g. \"3 times per week\", \"45 min sessions\", or \"no running\"", true, "Constraints");
    } else {
      // User wants to change - go back to current state input (Problem 4)
      setStep(STEPS.CURRENT_STATE);
      setShowTextInput(true);
      setInput(userData.currentState?.description || "");
      setCurrentStateAttempts(0); // Reset attempts for fresh edit
      addMessage(
        "No problem! ✏️ Edit your answer below.\n\nYou can add more detail or change what you wrote.",
        true,
        "Edit your starting point"
      );
      stopLoading();
    }
  };

  // Helper to go to CURRENT_STATE with contextual question
  // Optional goalJustLocked param bypasses the lockedGoal check (for when we just set it)
  const goToCurrentState = (goalJustLocked = false) => {
    // Safety check: ensure goal exists
    if (!userData.goal) {
      console.error("[Onboarding] ERROR: Trying to go to CURRENT_STATE without goal!");
      setStep(STEPS.GOAL_INPUT);
      setShowTextInput(true);
      addMessage("Let's start with your goal first. What do you want to achieve?", true, "Your goal");
      return;
    }

    // Safety check: ensure goal is confirmed (lockedGoal exists)
    // Skip this check if we just locked the goal (state hasn't updated yet)
    if (!goalJustLocked && !lockedGoal) {
      console.error("[Onboarding] ERROR: Trying to go to CURRENT_STATE without confirmed goal!");
      const goalDisplay = userData.goal?.displayTitle || userData.goal?.raw || "your goal";
      setStep(STEPS.GOAL_CONFIRM);
      addMessage(`${goalDisplay}\n\nSound good?`, true, "Your goal");
      return;
    }

    // Clear messages to make CURRENT_STATE its own page
    setMessages([]);

    setStep(STEPS.CURRENT_STATE);
    setFormData({}); // Reset form data
    // FitnessAssessmentForm has its own Step 2 header
  };

  // Handle AMBITION
  const handleAmbition = async (value) => {
    haptic("impactLight");
    const item = ambitionReplies.find((r) => r.value === value);
    addMessage(item?.label || value, false);

    await setAmbition(value);
    setUserData((prev) => ({ ...prev, ambition: value }));

    // Update locked goal to include ambition
    if (lockedGoal && item?.label) {
      setLockedGoal(`${lockedGoal}\nPace: ${item.label}`);
    }

    // Go to CURRENT_STATE to ask about their current training
    console.log("[Onboarding] AMBITION: Selected", value, "going to CURRENT_STATE");
    goToCurrentState(true);
  };

  // Handle CURRENT_STATE form submission (legacy)
  const handleCurrentStateFormSubmit = async () => {
    haptic("impactLight");
    const { sessionsPerWeek, timePerSession, trainingBackground, injuries } = formData;

    // Build current state object
    const currentState = {
      sessionsPerWeek: sessionsPerWeek || 3,
      timePerSession: timePerSession || 45,
      trainingBackground: trainingBackground || "on_off",
      injuries: injuries || null,
      // Build a summary for display
      displaySummary: `${sessionsPerWeek || 3}x/week, ${timePerSession || 45} min sessions`,
    };

    addMessage("Got it!", false);
    setUserData((prev) => ({ ...prev, currentState }));

    // Go directly to CONSTRAINTS - no AI interpretation needed
    setStep(STEPS.CONSTRAINTS);
    setShowTextInput(true);
    addMessage("Any constraints?\n\nE.g. \"only gym\", \"no running\", or \"mornings only\"", true, "Constraints");
    setFormData({});
  };

  // Handle new FitnessAssessmentForm completion
  const handleFitnessAssessmentComplete = (assessmentData) => {
    haptic("impactLight");
    console.log("[Onboarding] FitnessAssessment complete:", assessmentData);

    // Extract data from assessment
    const { standard, advanced, aiSummary, followUpAnswers } = assessmentData;

    // Map to current state format
    const frequencyMap = {
      '0-1': 1,
      '2-3': 3,
      '4-5': 5,
      '6+': 6,
    };

    const currentState = {
      sessionsPerWeek: frequencyMap[standard.trainingFrequency] || 3,
      trainingExperience: standard.trainingExperience,
      trainingTypes: standard.trainingTypes || [],
      perceivedLevel: standard.perceivedLevel,
      injuries: standard.injuries,
      lifestyle: standard.lifestyle,
      sleep: standard.sleep,
      advanced: advanced || {},
      aiSummary: aiSummary,
      followUpAnswers: followUpAnswers,
      displaySummary: aiSummary || `${frequencyMap[standard.trainingFrequency] || 3}x/week`,
    };

    setUserData((prev) => ({ ...prev, currentState, fitnessAssessment: assessmentData }));

    // Navigate to Coming Soon (Step 3)
    navigation.navigate("ComingSoon", { assessmentData });
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
      addMessage("How long should your plan be?", true, "Plan length");
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
    startLoading("Analyzing your goal...");
    setStep(STEPS.EVENT_STRATEGY);
    addMessage("Mapping your path to race day... 🏁", true, "Your roadmap");

    try {
      // Calculate gap
      setLoadingMessage("Calculating gap...");
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
      setLoadingMessage("Creating strategy...");
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
      stopLoading();
    }
  };

  // Generate strategy for NON-EVENT goals
  const generateNonEventStrategy = async (weeks) => {
    startLoading("Analyzing your goal...");
    setStep(STEPS.NON_EVENT_STRATEGY);
    addMessage("Designing your training path... 🎯", true, "Your roadmap");

    try {
      setLoadingMessage("Calculating gap...");
      const gapRes = await calculateGap({
        goal: userData.goal,
        currentState: userData.currentState,
      });

      if (gapRes?.ok && gapRes?.data) {
        await updateGap(gapRes.data);
        setUserData((prev) => ({ ...prev, gap: gapRes.data }));
      }

      setLoadingMessage("Creating strategy...");
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
      stopLoading();
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
    startLoading("Building your plan...");
    setStep(STEPS.GENERATING_PLAN);
    addMessage("Crafting your plan... 🔥\n\nThis is going to be good.", true, "Building your journey");

    try {
      setLoadingMessage("Generating workouts...");
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
        setLoadingMessage("Summarizing...");
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
          addMessage("Done! 🎯\n\nEvery workout comes in 3 versions to match your day:\n• Full power — give it everything\n• Lighter touch — when energy is lower\n• Quick hit — when time is tight", true, "Your plan");
        }
      } else {
        throw new Error("Plan generation failed");
      }
    } catch (err) {
      console.error(err);
      addMessage("Couldn't generate the full plan — let me try a simpler version.", true);
      setStep(STEPS.PLAN_SUMMARY);
    } finally {
      stopLoading();
    }
  };

  // Handle summary confirmation
  const handleSummaryConfirm = (value) => {
    haptic("impactLight");
    addMessage(value === "accept" ? "This looks good" : "I want to change something", false);

    if (value === "accept") {
      setStep(STEPS.PREFERENCE_MODE);
      addMessage("Almost there! 🙌\n\nHow do you like to be coached?", true, "Your style");
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
    addMessage("You're ready! 🚀\n\nYour journey starts now. I'll be with you every step.", true, "Let's go");

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

    // Use selected race display name if available (for EVENT_INPUT)
    // Check ref first (sync), then state (async fallback)
    let userMessageText = text;
    const selectedRace = selectedRaceRef.current || userData.selectedRace;
    if (step === STEPS.EVENT_INPUT && selectedRace) {
      userMessageText = selectedRace.location ? `${selectedRace.name} (${selectedRace.location})` : selectedRace.name;
      // Clear the ref after using it
      selectedRaceRef.current = null;
    }

    haptic("impactLight");
    addMessage(userMessageText, false);
    setInput("");
    setShowTextInput(false);
    startLoading("Thinking...");

    try {
      // Global intent detection - check if user wants to change their goal from anywhere
      // Be specific to avoid false positives - require explicit phrases
      const changeGoalPhrases = /\b(change\s*(my\s*)?(goal|mål)|ändra\s*(mitt\s*)?(mål|goal)|nytt\s*mål|different\s*goal|go\s*back\s*to\s*(goal|start)|börja\s*om|start\s*over|restart|reset|byt\s*mål|annat\s*mål)\b/i;
      const wantsToChangeGoal = changeGoalPhrases.test(text);

      // Also detect "help" or confusion
      const needsHelp = /^(help|hjälp|what|vad|\?+|i don't know|vet inte|confused|förvirrad)$/i.test(text.trim());
      if (needsHelp && step !== STEPS.INTRO) {
        setShowTextInput(true);
        addMessage("I've got you! 💪\n\nTell me what you're working towards:\n• Run a marathon\n• Build strength\n• Feel more energized\n\nOr say \"start over\" to begin fresh.", true, "Let's figure it out");
        stopLoading();
        return;
      }

      if (wantsToChangeGoal && step !== STEPS.GOAL_INPUT && step !== STEPS.INTRO) {
        console.log("[Onboarding] User wants to change goal, navigating back");
        // Clear ALL goal-related data for a fresh start
        setUserData((prev) => ({
          ...prev,
          goal: null,
          event: null,
          isEvent: false,
          pendingAmbition: null,
          pendingEventDate: null,
          pendingPreferenceQuestion: false,
          pendingEventQuestion: false,
          pendingEditChoice: false,
          skipTypoCheck: false,
          ambition: null,
        }));
        setLockedGoal(null);
        setLockedCurrentState(null);
        resetGoalAttempts();
        setStep(STEPS.GOAL_INPUT);
        setShowTextInput(true);
        setInput(""); // Start fresh
        addMessage("Clean slate! ✨\n\nWhat's driving you? What do you want to achieve?", true, "New beginning");
        stopLoading();
        return; // Exit early, don't process the step
      }

      switch (step) {
        // EVENT_INPUT - User typed their event name OR event date (if pendingEventQuestion)
        case STEPS.EVENT_INPUT: {
          console.log("[Onboarding] EVENT_INPUT: Processing:", text, "pendingEventQuestion:", userData.pendingEventQuestion);

          // Handle event date response (second input after event name)
          if (userData.pendingEventQuestion) {
            const cleanAnswer = text.trim();
            const isSkip = /^(no|nej|nope|nah|skip|hoppa|vet inte|don't know|unsure|later|senare)$/i.test(cleanAnswer.toLowerCase());

            if (isSkip) {
              // User wants to skip date - proceed without it
              setUserData((prev) => ({ ...prev, pendingEventQuestion: false }));

              // Go to GOAL_CONFIRM
              const goalDisplay = userData.goal?.displayTitle || userData.goal?.raw || "your event";
              setStep(STEPS.GOAL_CONFIRM);
              addMessage(`${goalDisplay}\n\n(No date set yet)\n\nSound good?`, true, "Your goal");
              stopLoading();
              break;
            }

            // Parse the date
            let eventDate = null;
            let daysUntil = null;
            const normalizedDate = cleanAnswer.toLowerCase();

            // Swedish month mapping
            const swedishMonths = {
              'januari': 'january', 'jan': 'january',
              'februari': 'february', 'feb': 'february',
              'mars': 'march', 'mar': 'march',
              'april': 'april', 'apr': 'april',
              'maj': 'may',
              'juni': 'june', 'jun': 'june',
              'juli': 'july', 'jul': 'july',
              'augusti': 'august', 'aug': 'august',
              'september': 'september', 'sep': 'september',
              'oktober': 'october', 'okt': 'october',
              'november': 'november', 'nov': 'november',
              'december': 'december', 'dec': 'december',
            };

            // Convert Swedish months to English
            let englishDate = normalizedDate;
            for (const [swedish, english] of Object.entries(swedishMonths)) {
              const regex = new RegExp(`\\b${swedish}\\b`, 'gi');
              englishDate = englishDate.replace(regex, english);
            }

            try {
              // Try direct parse first
              const parsed = new Date(englishDate);
              if (!isNaN(parsed.getTime())) {
                const daysDiff = Math.ceil((parsed - new Date()) / (1000 * 60 * 60 * 24));
                if (daysDiff > 0) {
                  eventDate = parsed.toISOString().split("T")[0];
                  daysUntil = daysDiff;
                }
              }

              // Try "om X månader/months"
              if (!eventDate) {
                const monthsMatch = englishDate.match(/(?:om|in)\s*(\d+)\s*(?:månader?|months?)/i);
                if (monthsMatch) {
                  const months = parseInt(monthsMatch[1]);
                  const dateObj = new Date();
                  dateObj.setMonth(dateObj.getMonth() + months);
                  eventDate = dateObj.toISOString().split("T")[0];
                  daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
                }
              }

              // Try "om X veckor/weeks"
              if (!eventDate) {
                const weeksMatch = englishDate.match(/(?:om|in)\s*(\d+)\s*(?:veckor?|weeks?)/i);
                if (weeksMatch) {
                  const weeks = parseInt(weeksMatch[1]);
                  const dateObj = new Date();
                  dateObj.setDate(dateObj.getDate() + (weeks * 7));
                  eventDate = dateObj.toISOString().split("T")[0];
                  daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
                }
              }

              // Try month + year
              if (!eventDate) {
                const monthMatch = englishDate.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
                const yearMatch = englishDate.match(/20\d{2}/);
                if (monthMatch) {
                  const monthStr = monthMatch[0];
                  const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
                  const monthIndex = new Date(`${monthStr} 1, 2000`).getMonth();
                  let targetYear = year;
                  if (!yearMatch) {
                    const testDate = new Date(year, monthIndex, 15);
                    if (testDate < new Date()) targetYear = year + 1;
                  }
                  const dateObj = new Date(targetYear, monthIndex, 15);
                  const daysDiff = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
                  if (daysDiff > 0) {
                    eventDate = dateObj.toISOString().split("T")[0];
                    daysUntil = daysDiff;
                  }
                }
              }
            } catch (e) {
              console.log("[Onboarding] Date parsing failed:", e);
            }

            if (!eventDate) {
              // Couldn't parse - ask again
              setShowTextInput(true);
              addMessage("Try something like \"June 2025\" or \"in 3 months\".\n\nOr 'skip' to continue without a date.", true, null);
              stopLoading();
              break;
            }

            // Successfully parsed date - store event data
            const eventData = {
              name: userData.goal?.displayTitle || userData.goal?.raw,
              date: eventDate,
              daysUntil: daysUntil,
            };

            setUserData((prev) => ({
              ...prev,
              event: eventData,
              pendingEventQuestion: false,
            }));

            // Format date for display
            const dateStr = new Date(eventDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });

            // Go to GOAL_CONFIRM
            let summary = userData.goal?.displayTitle || eventData.name;
            summary += `\n📅 ${dateStr}`;
            if (daysUntil) summary += ` — ${daysUntil} days`;

            setStep(STEPS.GOAL_CONFIRM);
            addMessage(`${summary}\n\nSound good?`, true, "Your goal");
            stopLoading();
            break;
          }

          // First input - event name
          const eventText = text.trim();

          // Basic validation
          if (eventText.length < 2) {
            setShowTextInput(true);
            addMessage("What event or race?", true, null);
            stopLoading();
            break;
          }

          // Check if this is a generic event type that needs more details
          const genericEvents = /^(a\s+)?(marathon|half\s*marathon|ironman|triathlon|10k|5k|ultra|trail\s*run|cycling\s*race|swim\s*race)s?$/i;
          const isGeneric = genericEvents.test(eventText);

          if (isGeneric && !userData.pendingEventLocationQuestion) {
            // Generic event - ask for more details
            console.log("[Onboarding] Generic event detected, asking for location:", eventText);
            setUserData((prev) => ({
              ...prev,
              pendingEventLocationQuestion: true,
              pendingGenericEvent: eventText,
            }));
            setShowTextInput(true);
            addMessage(`Which ${eventText.toLowerCase().replace(/^a\s+/, "")}? 🏁`, true, null);
            stopLoading();
            break;
          }

          // If we're answering the location question, combine with the generic event
          let searchText = eventText;
          if (userData.pendingEventLocationQuestion && userData.pendingGenericEvent) {
            searchText = `${eventText} ${userData.pendingGenericEvent}`;
            setUserData((prev) => ({
              ...prev,
              pendingEventLocationQuestion: false,
              pendingGenericEvent: null,
            }));
          }

          let eventGoal;
          let foundEvent = null;

          // Check if user selected from our race database (has date already)
          const selectedRace = userData.selectedRace;
          if (selectedRace?.date) {
            console.log("[Onboarding] Using race from database:", selectedRace);
            foundEvent = {
              eventName: selectedRace.name,
              eventDate: selectedRace.date,
              location: selectedRace.location,
              sport: selectedRace.type,
              found: true,
              fromDatabase: true,
            };
            eventGoal = {
              raw: searchText,
              type: GOAL_TYPES.EVENT,
              displayTitle: selectedRace.name,
              needsEventDetails: false,
              sport: selectedRace.type,
              location: selectedRace.location,
              lookupDate: selectedRace.date,
              confidence: 1.0, // 100% confidence since it's from our database
            };
            // Clear selectedRace after using it
            setUserData((prev) => ({ ...prev, selectedRace: null }));
          } else {
            // No pre-selected race - try to find in database first, then API
            const dbMatch = findRace(searchText);

            if (dbMatch?.date) {
              console.log("[Onboarding] Found race in database:", dbMatch);
              foundEvent = {
                eventName: dbMatch.name,
                eventDate: dbMatch.date,
                location: dbMatch.location,
                sport: dbMatch.type,
                found: true,
                fromDatabase: true,
              };
              eventGoal = {
                raw: searchText,
                type: GOAL_TYPES.EVENT,
                displayTitle: dbMatch.name,
                needsEventDetails: false,
                sport: dbMatch.type,
                location: dbMatch.location,
                lookupDate: dbMatch.date,
                confidence: 1.0,
              };
            } else {
              // Not in database - search using API
              console.log("[Onboarding] Looking up event via API:", searchText);
              const lookupResult = await lookupEvent(searchText);
              console.log("[Onboarding] Lookup result:", lookupResult);

              if (lookupResult?.ok && lookupResult?.data?.found) {
                // Event was found via API
                foundEvent = lookupResult.data;
                console.log("[Onboarding] Found event via API:", foundEvent);

                eventGoal = {
                  raw: searchText,
                  type: GOAL_TYPES.EVENT,
                  displayTitle: foundEvent.eventName || capitalizeFirstLetter(searchText),
                  needsEventDetails: !foundEvent.eventDate,
                  sport: foundEvent.sport,
                  distance: foundEvent.distance,
                  location: foundEvent.location,
                  lookupDate: foundEvent.eventDate,
                  confidence: foundEvent.confidence,
                };
              } else {
                // Event not found - use what user typed
                eventGoal = {
                  raw: searchText,
                  type: GOAL_TYPES.EVENT,
                  displayTitle: capitalizeFirstLetter(searchText),
                  needsEventDetails: true,
                };
              }
            }
          }

          setUserData((prev) => ({
            ...prev,
            goal: eventGoal,
            isEvent: true,
            pendingEventQuestion: !foundEvent?.eventDate, // Skip date question if we have it
            event: foundEvent ? {
              name: foundEvent.eventName,
              date: foundEvent.eventDate,
              sport: foundEvent.sport,
              distance: foundEvent.distance,
              location: foundEvent.location,
            } : null,
          }));

          // If we found the event with a date, ask about ambition
          if (foundEvent?.eventDate) {
            const eventDate = new Date(foundEvent.eventDate);
            const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
            const dateStr = eventDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });

            let summary = eventGoal.displayTitle;
            if (foundEvent.distance) summary += ` (${foundEvent.distance})`;
            summary += `\n📅 ${dateStr}`;
            if (daysUntil > 0) summary += ` — ${daysUntil} days`;
            if (foundEvent.location) summary += `\n📍 ${foundEvent.location}`;

            // Store summary for later and ask about ambition
            setUserData((prev) => ({
              ...prev,
              eventSummary: summary,
              pendingEventAmbitionQuestion: true,
            }));
            setStep(STEPS.EVENT_AMBITION);
            addMessage(`${summary}\n\nWhat's your goal?`, true, "Your ambition");
          } else {
            // Ask for location first - we'll try to find the date via API
            setStep(STEPS.EVENT_DATE);
            setShowTextInput(true);
            let message = eventGoal.displayTitle;
            if (foundEvent?.distance) message += ` (${foundEvent.distance})`;
            message += "\n\nWhere is it?";
            setUserData((prev) => ({
              ...prev,
              pendingEventDetails: true,
              pendingEventName: eventGoal.displayTitle,
              waitingForLocation: true,
            }));
            addMessage(message, true, "Event location");
          }
          stopLoading();
          break;
        }

        case STEPS.GOAL_INPUT: {
          console.log("[Onboarding] GOAL_INPUT: Processing goal:", text);

          // Handle preference question response
          if (userData.pendingPreferenceQuestion) {
            const cleanAnswer = text.trim().toLowerCase();
            const isNo = /^(no|nej|nope|nah|inte|inget|inga|skip|hoppa)$/i.test(cleanAnswer);

            // Get current goal title
            const currentTitle = userData.goal?.displayTitle || userData.goal?.raw || "";

            if (isNo) {
              // User doesn't have a target - proceed to confirm
              setUserData((prev) => ({ ...prev, pendingPreferenceQuestion: false, skipTypoCheck: false }));
              resetGoalAttempts();
              setStep(STEPS.GOAL_CONFIRM);
              addMessage(`${currentTitle}\n\nSound good?`, true, "Your goal");
            } else if (text.trim().length < 2) {
              // Too short - check if we've hit max attempts
              if (pendingQuestionAttempts >= MAX_PENDING_QUESTION) {
                // Accept without target and move on
                setUserData((prev) => ({ ...prev, pendingPreferenceQuestion: false, skipTypoCheck: false }));
                resetGoalAttempts();
                setStep(STEPS.GOAL_CONFIRM);
                addMessage(`${currentTitle}\n\nSound good?`, true, "Your goal");
              } else {
                // Ask again with helpful message
                setPendingQuestionAttempts(prev => prev + 1);
                setShowTextInput(true);
                addMessage("Could you tell me a bit more? Or just say 'no' if you don't have a target.", true, null);
              }
            } else {
              // User gave a target - add it to the goal
              const updatedTitle = `${currentTitle} — ${text.trim()}`;
              const updatedGoal = {
                ...userData.goal,
                displayTitle: updatedTitle,
                target: text.trim(),
              };
              setUserData((prev) => ({ ...prev, goal: updatedGoal, pendingPreferenceQuestion: false, skipTypoCheck: false }));
              resetGoalAttempts();
              await updateGoal(updatedGoal);
              setStep(STEPS.GOAL_CONFIRM);
              addMessage(`${updatedTitle}\n\nSound good?`, true, "Your goal");
            }
            stopLoading();
            break;
          }

          // Handle event date question response
          if (userData.pendingEventQuestion) {
            const cleanAnswer = text.trim();
            const isSkip = /^(no|nej|nope|nah|skip|hoppa|vet inte|don't know|unsure|later|senare)$/i.test(cleanAnswer.toLowerCase());

            // Get current goal title
            const currentTitle = userData.goal?.displayTitle || userData.goal?.raw || "";

            if (isSkip) {
              // User doesn't know the date - proceed to confirm
              setUserData((prev) => ({ ...prev, pendingEventQuestion: false, skipTypoCheck: false }));
              resetGoalAttempts();
              setStep(STEPS.GOAL_CONFIRM);
              addMessage(`${currentTitle}\n\n(No date set yet)\n\nSound good?`, true, "Your goal");
            } else if (cleanAnswer.length < 2) {
              // Too short - check if we've hit max attempts
              if (pendingQuestionAttempts >= MAX_PENDING_QUESTION) {
                // Accept without date and move on
                setUserData((prev) => ({ ...prev, pendingEventQuestion: false, skipTypoCheck: false }));
                resetGoalAttempts();
                setStep(STEPS.GOAL_CONFIRM);
                addMessage(`${currentTitle}\n\nWe can set the date later.\n\nSound good?`, true, "Your goal");
              } else {
                // Ask again
                setPendingQuestionAttempts(prev => prev + 1);
                setShowTextInput(true);
                addMessage("When is the event?\n\nOr 'skip' if you're not sure.", true, null);
              }
            } else {
              // Try to parse the date - Swedish and English support
              const swedishMonths = {
                'januari': 'january', 'jan': 'january',
                'februari': 'february', 'feb': 'february',
                'mars': 'march', 'mar': 'march',
                'april': 'april', 'apr': 'april',
                'maj': 'may',
                'juni': 'june', 'jun': 'june',
                'juli': 'july', 'jul': 'july',
                'augusti': 'august', 'aug': 'august',
                'september': 'september', 'sep': 'september',
                'oktober': 'october', 'okt': 'october',
                'november': 'november', 'nov': 'november',
                'december': 'december', 'dec': 'december',
              };

              let normalizedDate = cleanAnswer.toLowerCase();
              for (const [swedish, english] of Object.entries(swedishMonths)) {
                normalizedDate = normalizedDate.replace(new RegExp(`\\b${swedish}\\b`, 'gi'), english);
              }

              // Try to parse the date
              let parsedDate = null;
              let daysUntil = null;

              // Try direct parse
              const parsed = new Date(normalizedDate);
              if (!isNaN(parsed.getTime()) && parsed > new Date()) {
                parsedDate = parsed.toISOString().split("T")[0];
                daysUntil = Math.ceil((parsed - new Date()) / (1000 * 60 * 60 * 24));
              }

              // Try month extraction
              if (!parsedDate) {
                const monthMatch = normalizedDate.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
                const yearMatch = normalizedDate.match(/20\d{2}/);
                const dayMatch = normalizedDate.match(/\b(\d{1,2})\b/);

                if (monthMatch) {
                  const monthIndex = new Date(`${monthMatch[0]} 1, 2000`).getMonth();
                  let year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
                  const day = dayMatch ? parseInt(dayMatch[1]) : 15;

                  // If no year and month is past, use next year
                  if (!yearMatch) {
                    const testDate = new Date(year, monthIndex, day);
                    if (testDate < new Date()) year++;
                  }

                  const dateObj = new Date(year, monthIndex, Math.min(day, 28));
                  if (dateObj > new Date()) {
                    parsedDate = dateObj.toISOString().split("T")[0];
                    daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
                  }
                }
              }

              // Try "om X månader/veckor"
              if (!parsedDate) {
                const monthsMatch = normalizedDate.match(/(?:om|in)\s*(\d+)\s*(?:månader?|months?)/i);
                const weeksMatch = normalizedDate.match(/(?:om|in)\s*(\d+)\s*(?:veckor?|weeks?)/i);

                if (monthsMatch) {
                  const dateObj = new Date();
                  dateObj.setMonth(dateObj.getMonth() + parseInt(monthsMatch[1]));
                  parsedDate = dateObj.toISOString().split("T")[0];
                  daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
                } else if (weeksMatch) {
                  const dateObj = new Date();
                  dateObj.setDate(dateObj.getDate() + (parseInt(weeksMatch[1]) * 7));
                  parsedDate = dateObj.toISOString().split("T")[0];
                  daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
                }
              }

              // If we couldn't parse, ask again
              if (!parsedDate) {
                setPendingQuestionAttempts(prev => prev + 1);
                setShowTextInput(true);
                addMessage("Try again — e.g. \"June 2025\" or \"in 3 months\".\n\nOr 'skip' if unsure.", true, null);
                stopLoading();
                break;
              }

              // Date parsed successfully
              const updatedGoal = {
                ...userData.goal,
                eventDate: parsedDate,
              };
              setUserData((prev) => ({
                ...prev,
                goal: updatedGoal,
                event: { date: parsedDate, daysUntil, name: currentTitle },
                pendingEventQuestion: false,
                skipTypoCheck: false,
              }));
              resetGoalAttempts();
              await updateGoal(updatedGoal);
              setStep(STEPS.GOAL_CONFIRM);

              // Format the date nicely
              const dateStr = new Date(parsedDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
              const daysText = daysUntil ? ` — ${daysUntil} days` : "";
              addMessage(`${currentTitle}\n📅 ${dateStr}${daysText}\n\nSound good?`, true, "Your goal");
            }
            stopLoading();
            break;
          }

          // Handle typo correction suggestion response
          let inputText = text; // Mutable copy for potential correction
          if (userData.suggestedCorrection) {
            const userResponse = text.trim().toLowerCase();

            // Check if user accepts the suggestion (yes, yep, correct, etc.)
            const acceptsSuggestion = /^(yes|yep|yeah|y|correct|right|ja|japp|j|korrekt|rätt|ok|okay)$/i.test(userResponse);

            if (acceptsSuggestion) {
              // Use the corrected version
              console.log("[Onboarding] User accepted typo correction:", userData.suggestedCorrection);
              inputText = userData.suggestedCorrection;
              setUserData((prev) => ({
                ...prev,
                suggestedCorrection: null,
                originalInput: null,
                skipTypoCheck: true // Skip typo check for the corrected text
              }));

              // Show quick confirmation that we're using the corrected version
              addMessage(`Got it, using "${inputText}"`, true, null);
            } else {
              // User rejected or provided new input - clear suggestion and process normally
              console.log("[Onboarding] User rejected typo correction, processing new input");
              setUserData((prev) => ({
                ...prev,
                suggestedCorrection: null,
                originalInput: null
              }));
              // Continue with normal processing below
            }
          }

          // Clear pendingEditChoice if user is giving new goal (not answering pending questions)
          if (userData.pendingEditChoice) {
            setUserData((prev) => ({ ...prev, pendingEditChoice: false }));
          }

          // Comprehensive validation
          const cleanText = inputText.trim();

          // Loop protection - after MAX_GOAL_ATTEMPTS, accept whatever user provided
          if (goalInputAttempts >= MAX_GOAL_ATTEMPTS) {
            console.log("[Onboarding] Max attempts reached, accepting input as-is");
            // Reset all attempts and accept
            resetGoalAttempts();
            setUserData((prev) => ({ ...prev, skipTypoCheck: false }));
            // Accept the input and move on - don't validate further
            const goalData = { raw: cleanText, type: GOAL_TYPES.NON_EVENT, displayTitle: capitalizeFirstLetter(cleanText) };
            setUserData((prev) => ({ ...prev, goal: goalData }));
            await updateGoal(goalData);
            setStep(STEPS.GOAL_CONFIRM);
            addMessage(`${capitalizeFirstLetter(cleanText)}\n\nSound good?`, true, "Your goal");
            stopLoading();
            break;
          }

          // Helper function to increment attempts and show error
          const showValidationError = (message) => {
            setGoalInputAttempts(prev => prev + 1);
            setShowTextInput(true);
            addMessage(message, true, null);
            stopLoading(); // Ensure loading is stopped on validation errors
          };

          // Too short
          if (cleanText.length < 3) {
            showValidationError("Tell me more. E.g. \"Run a marathon\" or \"Get stronger\"");
            break;
          }

          // Just punctuation or special characters
          if (/^[^a-zA-Z0-9åäöÅÄÖ]+$/.test(cleanText)) {
            showValidationError("What's your goal?\n\nE.g. \"Run 5k\" or \"Build muscle\"");
            break;
          }

          // Just numbers (not a goal)
          if (/^\d+$/.test(cleanText)) {
            showValidationError("What does that number mean?\n\nE.g. \"Run 10k\" or \"Bench 100kg\"");
            break;
          }

          // Check for meaningful words - must contain at least one word with 3+ letters
          const words = cleanText.split(/\s+/).filter(w => w.length >= 3);
          if (words.length === 0) {
            showValidationError("Tell me more.\n\nE.g. \"Train for a half marathon\" or \"Get back in shape\"");
            break;
          }

          // Check for repeated characters (like "rroro", "aaaa", "testtesttest")
          const hasRepeatedPattern = /(.)\1{2,}/.test(cleanText) ||
            /^(.{1,3})\1{2,}$/.test(cleanText);
          if (hasRepeatedPattern && cleanText.length < 10) {
            showValidationError("What would you like to achieve?\n\nE.g. \"Run faster\" or \"Get stronger\"");
            break;
          }

          // Check for and suggest typo corrections (skip if already corrected to prevent loops)
          if (!userData.skipTypoCheck && mightHaveTypos(cleanText)) {
            const suggestedCorrection = correctTypos(cleanText);

            // If we found a correction that's different, suggest it to user
            if (suggestedCorrection && suggestedCorrection.toLowerCase() !== cleanText.toLowerCase()) {
              console.log("[Onboarding] Suggested typo correction:", cleanText, "->", suggestedCorrection);

              // Store original for user choice
              setUserData((prev) => ({ ...prev, suggestedCorrection, originalInput: cleanText }));

              setShowTextInput(true);
              addMessage(
                `Did you mean "${suggestedCorrection}"?\n\nIf yes, I'll use that. If not, just type your goal again!`,
                true,
                "Did you mean..."
              );
              stopLoading();
              break; // Exit early, wait for user confirmation
            }
          }
          // Clear skip flag after check
          if (userData.skipTypoCheck) {
            setUserData((prev) => ({ ...prev, skipTypoCheck: false }));
          }

          // Too long (truncate for API but still process)
          const maxLength = 500;
          const processedText = cleanText.length > maxLength
            ? cleanText.slice(0, maxLength) + "..."
            : cleanText;

          // Combine with previous goal text if this is a follow-up answer
          // Limit total length to prevent infinite growth
          const previousGoalText = userData.goal?.raw || "";
          let fullGoalText = previousGoalText ? `${previousGoalText}\n${processedText}` : processedText;
          if (fullGoalText.length > MAX_FULL_GOAL_LENGTH) {
            // Keep only the most recent text to stay under limit
            fullGoalText = processedText.slice(0, MAX_FULL_GOAL_LENGTH);
          }

          // Call AI to interpret and normalize the goal
          let goalData = { raw: fullGoalText, type: GOAL_TYPES.NON_EVENT };
          let aiDisplayTitle = processedText;

          try {
            setLoadingMessage("🎯 Analyzing your goal...");
            const res = await interpretGoalV2(fullGoalText);
            console.log("[Onboarding] INTERPRET_GOAL_V2 raw response:", JSON.stringify(res, null, 2));

            if (res?.ok && res?.data) {
              const { type, level, intent, direction, displayTitle, confidence, risk, needsEventDetails, needsMoreInfo, missingInfo } = res.data;

              console.log("[Onboarding] Parsed goal data:", {
                input: fullGoalText,
                displayTitle,
                direction,
                type,
                needsMoreInfo,
                missingInfo,
                confidence,
              });

              // Check if AI needs more information (like for vague goals)
              // IMPORTANT: Questions about experience/current state belong in CURRENT_STATE step, NOT here!
              // Only ask about goal-specific details (target time, event date, etc.)

              // Check if missingInfo contains experience/current state questions - these should be BLOCKED
              const isExperienceQuestion = missingInfo && (
                /\b(experience|erfarenhet|current|nuvarande|how\s*(long|often|much|far)|hur\s*(långt|ofta|mycket)|before|tidigare|now|nu|level|nivå|fitness|kondition|trained|tränat|training\s*history|träningshistorik|background|bakgrund|ability|förmåga|can\s*you|kan\s*du|have\s*you|har\s*du)\b/i.test(missingInfo)
              );

              // Goal is specific enough if it has an activity mentioned
              const hasActivity = /\b(deadlift|squat|bench|run|running|sprint|jog|swim|swimming|cycle|cycling|bike|lift|lifting|train|training|workout|exercise|yoga|pilates|crossfit|hiit|cardio|strength|pull.?up|push.?up|dip|row|press|curl|marathon|half.?marathon|10k|5k|triathlon|ironman|race|lopp|tävling|muscle|muskler|weight|vikt|fat|fett|lose|gå\s*ner|build|bygga|get\s*stronger|bli\s*starkare|improve|förbättra|faster|snabbare|endurance|uthållighet|flexibility|rörlighet|mobility|health|hälsa|energy|energi|feel\s*better|må\s*bättre)\b/i.test(fullGoalText);

              // Skip needsMoreInfo if:
              // 1. It's an experience/current state question (belongs in CURRENT_STATE)
              // 2. The goal already has an activity mentioned (we have enough to proceed)
              const shouldSkipNeedsMoreInfo = isExperienceQuestion || hasActivity;

              if (needsMoreInfo && shouldSkipNeedsMoreInfo) {
                console.log("[Onboarding] Skipping needsMoreInfo - experience question or goal has activity:", {
                  isExperienceQuestion,
                  hasActivity,
                  missingInfo
                });
              }

              if (needsMoreInfo && missingInfo && !shouldSkipNeedsMoreInfo) {
                console.log("[Onboarding] AI needs more info (goal-specific only):", missingInfo);

                // Loop protection - after MAX_NEEDS_MORE_INFO, accept what we have
                if (needsMoreInfoAttempts >= MAX_NEEDS_MORE_INFO) {
                  console.log("[Onboarding] Max needsMoreInfo attempts reached, accepting");
                  // Accept what we have and move on
                  const acceptedGoal = {
                    raw: fullGoalText,
                    type: type || GOAL_TYPES.NON_EVENT,
                    level,
                    displayTitle: displayTitle || direction || processedText,
                    classification: { intent, direction, risk: risk || [] },
                  };
                  setUserData((prev) => ({ ...prev, goal: acceptedGoal, skipTypoCheck: false }));
                  resetGoalAttempts();
                  await updateGoal(acceptedGoal);
                  setStep(STEPS.GOAL_CONFIRM);
                  addMessage(`${displayTitle || direction || processedText}\n\nSound good?`, true, "Your goal");
                  stopLoading();
                  break;
                }

                // Increment attempts counter
                setNeedsMoreInfoAttempts(prev => prev + 1);
                setGoalInputAttempts(prev => prev + 1);

                // Store cumulative goal data
                setUserData((prev) => ({
                  ...prev,
                  goal: {
                    raw: fullGoalText,
                    type: type || GOAL_TYPES.NON_EVENT,
                    level,
                    displayTitle: displayTitle || direction || processedText,
                    classification: { intent, direction, risk: risk || [] },
                    confidence,
                    needsEventDetails,
                  },
                }));

                // Stay in GOAL_INPUT and ask for more info with acknowledgment and attempt indicator
                setShowTextInput(true);
                const attemptIndicator = needsMoreInfoAttempts > 0
                  ? `\n\n(${needsMoreInfoAttempts + 1}/${MAX_NEEDS_MORE_INFO + 1} - almost there!)`
                  : "";
                addMessage(`${missingInfo}${attemptIndicator}`, true, null);
                stopLoading();
                break; // Exit early, don't proceed to GOAL_CONFIRM
              }

              // AI successfully interpreted - store normalized data
              goalData = {
                raw: fullGoalText,
                type: type || GOAL_TYPES.NON_EVENT,
                level,
                displayTitle: displayTitle || direction || processedText,
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

              // Check confidence - if too low, ask for clarification
              const MIN_CONFIDENCE = 0.4;
              if (confidence !== undefined && confidence < MIN_CONFIDENCE) {
                console.log("[Onboarding] Low confidence detected:", confidence);

                // Loop protection - after MAX_LOW_CONFIDENCE, accept what we have
                if (lowConfidenceAttempts >= MAX_LOW_CONFIDENCE) {
                  console.log("[Onboarding] Max low confidence attempts reached, accepting");
                  // Accept what we have and move on
                  setUserData((prev) => ({ ...prev, goal: goalData, skipTypoCheck: false }));
                  resetGoalAttempts();
                  await updateGoal(goalData);
                  setStep(STEPS.GOAL_CONFIRM);
                  addMessage(`${aiDisplayTitle}\n\nSound good?`, true, "Your goal");
                  stopLoading();
                  break;
                }

                // Increment attempts counter
                setLowConfidenceAttempts(prev => prev + 1);
                setGoalInputAttempts(prev => prev + 1);

                // Store what we have so far
                setUserData((prev) => ({ ...prev, goal: goalData }));

                // Ask user to clarify with attempt indicator
                setShowTextInput(true);
                const lowConfAttemptIndicator = lowConfidenceAttempts > 0
                  ? `\n\n(${lowConfidenceAttempts + 1}/${MAX_LOW_CONFIDENCE + 1} - one more detail!)`
                  : "";
                addMessage(`Tell me more about your goal.${lowConfAttemptIndicator}`, true, null);
                stopLoading();
                break; // Exit early, don't proceed to GOAL_CONFIRM
              }
            } else {
              // API returned but no data - check if max attempts reached
              console.log("[Onboarding] API returned no data");

              if (goalInputAttempts >= MAX_GOAL_ATTEMPTS - 1) {
                // Max attempts reached - accept what user provided
                console.log("[Onboarding] Max attempts reached on API no-data, accepting input");
                resetGoalAttempts();
                const fallbackGoal = { raw: cleanText, type: GOAL_TYPES.NON_EVENT, displayTitle: capitalizeFirstLetter(cleanText) };
                setUserData((prev) => ({ ...prev, goal: fallbackGoal, skipTypoCheck: false }));
                await updateGoal(fallbackGoal);
                setStep(STEPS.GOAL_CONFIRM);
                addMessage(`${capitalizeFirstLetter(cleanText)}\n\nSound good?`, true, "Your goal");
                stopLoading();
                break;
              }

              setGoalInputAttempts(prev => prev + 1);
              setShowTextInput(true);
              addMessage("Could you rephrase that?\n\nE.g. \"Run a marathon\" or \"Get stronger\"", true, null);
              stopLoading();
              break; // Exit early, don't proceed
            }
          } catch (apiError) {
            console.log("[Onboarding] API failed:", apiError.message || apiError);

            // Check if max attempts reached - fallback gracefully
            if (goalInputAttempts >= MAX_GOAL_ATTEMPTS - 1) {
              console.log("[Onboarding] Max attempts reached on API failure, accepting input");
              resetGoalAttempts();
              const fallbackGoal = { raw: cleanText, type: GOAL_TYPES.NON_EVENT, displayTitle: capitalizeFirstLetter(cleanText) };
              setUserData((prev) => ({ ...prev, goal: fallbackGoal, skipTypoCheck: false }));
              await updateGoal(fallbackGoal);
              setStep(STEPS.GOAL_CONFIRM);
              addMessage(`${capitalizeFirstLetter(cleanText)}\n\nSound good?`, true, "Your goal");
              stopLoading();
              break;
            }

            // Not max attempts yet - ask user to try again
            setGoalInputAttempts(prev => prev + 1);
            setShowTextInput(true);
            addMessage("Let's try again. How would you describe your goal?", true, null);
            stopLoading();
            break; // Exit early, don't proceed
          }

          // Store goal data
          setUserData((prev) => ({ ...prev, goal: goalData }));
          await updateGoal(goalData);

          // Check if goal could have a target/preference (running distance, lifting, etc.)
          const goalLower = fullGoalText.toLowerCase();

          // Expanded target detection - includes more sports and activities
          const couldHaveTarget = /\b(run|running|springa|löpa|jogga|10k|5k|21k|42k|half|marathon|maraton|halvmaraton|triathlon|ironman|bench|squat|deadlift|lift|press|pull.?up|push.?up|chin.?up|dip|row|curl|snatch|clean|jerk|olympic|powerlifting|styrkelyft|cycling|cykling|cykla|swim|swimming|simma|simning|race|lopp|tävling|kg|lbs|reps|repetitioner)\b/i.test(goalLower);

          // Already has a target (time, weight, distance, etc.)
          const alreadyHasTarget = /\b(sub|under|inom|min|minutes|minuter|sekunder|seconds|sec|km\/h|mph|pace|tempo|kg|lbs|pounds|kilo|gram|\d+\s*(kg|lbs|min|sec|km|m|miles|reps))\b/i.test(goalLower);

          // Check for event detection - if goal mentions a specific event/race
          const eventPatterns = /\b(stockholm|göteborg|gothenburg|malmö|boston|berlin|london|new york|chicago|tokyo|paris|amsterdam|rotterdam|copenhagen|oslo|helsinki|midnattsloppet|göteborgsvarvet|lidingöloppet|vasaloppet|ironman|spartan|tough mudder|crossfit games|powerlifting meet|sm|em|vm|olympics?|olympiska)\b/i;
          const hasEventMention = eventPatterns.test(goalLower);

          // If goal mentions a specific event, switch to EVENT_DATE flow
          if (hasEventMention && !userData.event) {
            console.log("[Onboarding] Event detected in goal:", goalLower);
            setUserData((prev) => ({
              ...prev,
              goal: goalData,
              isEvent: true,
              pendingEventDetails: true,
              pendingEventName: aiDisplayTitle,
            }));
            setStep(STEPS.EVENT_DATE);
            setShowTextInput(true);
            setUserData((prev) => ({ ...prev, waitingForLocation: true }));
            addMessage(`${aiDisplayTitle}\n\nWhere is it?`, true, "Event location");
            stopLoading();
            break;
          }

          // If goal could have a target but doesn't, ask about preference
          if (couldHaveTarget && !alreadyHasTarget) {
            setUserData((prev) => ({ ...prev, pendingPreferenceQuestion: true }));
            setShowTextInput(true);
            addMessage(`${aiDisplayTitle}\n\nDo you have a specific target? (time, weight, etc.)\n\nIf not, just say "no".`, true, null);
            stopLoading();
            break;
          }

          // Go to GOAL_CONFIRM with warm message
          resetGoalAttempts();
          setUserData((prev) => ({ ...prev, skipTypoCheck: false }));
          setStep(STEPS.GOAL_CONFIRM);
          addMessage(`${aiDisplayTitle}\n\nSound good?`, true, "Your goal");
          stopLoading();
          break;
        }

        // GOAL_DETAILS and EVENT_INFO are no longer used - flow goes directly to GOAL_CONFIRM
        case STEPS.GOAL_DETAILS:
        case STEPS.EVENT_INFO: {
          console.log("[Onboarding] Deprecated step reached, redirecting to GOAL_CONFIRM");
          resetGoalAttempts();
          setStep(STEPS.GOAL_CONFIRM);
          const goalDisplay = userData.goal?.displayTitle || userData.goal?.raw || "your goal";
          addMessage(`${goalDisplay}\n\nSound good?`, true, "Your goal");
          stopLoading();
          break;
        }

        // Handle event details (location → date) input
        case STEPS.EVENT_DATE: {
          console.log("[Onboarding] EVENT_DATE: Processing input:", text);

          const inputText = text.trim();

          // Check if user wants to skip
          if (/^(skip|later|don't know|not sure|idk|vet inte|hoppa)$/i.test(inputText.toLowerCase())) {
            const updatedEvent = { ...userData.event };
            setUserData((prev) => ({ ...prev, event: updatedEvent, pendingEventDetails: false, waitingForLocation: false }));

            let summary = userData.goal?.displayTitle || updatedEvent.name || userData.goal?.raw;
            summary += "\n\n(Details pending — you can add them later)";
            summary += "\n\nWhat's your ambition?";

            setStep(STEPS.EVENT_AMBITION);
            addMessage(summary, true, "Got it!");
            stopLoading();
            break;
          }

          // Try to lookup event with combined info (original event + user's location input)
          const eventName = userData.pendingEventName || userData.goal?.displayTitle || userData.goal?.raw || "";
          const combinedSearch = `${eventName} ${inputText}`;
          console.log("[Onboarding] Looking up event with location:", combinedSearch);

          const lookupResult = await lookupEvent(combinedSearch);
          console.log("[Onboarding] Lookup result:", lookupResult);

          let eventDate = null;
          let daysUntil = null;
          let location = inputText; // User's input is treated as location
          let foundEvent = null;

          if (lookupResult?.ok && lookupResult?.data?.found) {
            // AI found the event with details
            foundEvent = lookupResult.data;
            console.log("[Onboarding] Found event with details:", foundEvent);

            if (foundEvent.eventDate) {
              const dateObj = new Date(foundEvent.eventDate);
              eventDate = foundEvent.eventDate;
              daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
            }
            if (foundEvent.location) {
              location = foundEvent.location;
            }
          }

          // If we have a date, proceed to ambition!
          if (eventDate) {
            const updatedEvent = {
              ...userData.event,
              date: eventDate,
              daysUntil,
              location: location,
              name: foundEvent?.eventName || userData.event?.name || eventName,
              sport: foundEvent?.sport || userData.event?.sport,
              distance: foundEvent?.distance || userData.event?.distance,
            };
            setUserData((prev) => ({
              ...prev,
              event: updatedEvent,
              pendingEventDetails: false,
              waitingForLocation: false,
            }));
            await updateEvent(updatedEvent);

            // Build summary for ambition question
            let summary = foundEvent?.eventName || userData.goal?.displayTitle || updatedEvent.name || userData.goal?.raw;
            if (updatedEvent.distance) summary += ` (${updatedEvent.distance})`;
            const dateStr = new Date(eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            summary += `\n📅 ${dateStr}`;
            if (daysUntil > 0) summary += ` — ${daysUntil} days`;
            if (updatedEvent.location) summary += `\n📍 ${updatedEvent.location}`;
            summary += "\n\nWhat's your ambition?";

            setStep(STEPS.EVENT_AMBITION);
            addMessage(summary, true, "Event found!");
            stopLoading();
            break;
          }

          // No date found via API - save location and show date picker
          setUserData((prev) => ({
            ...prev,
            event: {
              ...prev.event,
              location: location,
              name: foundEvent?.eventName || prev.event?.name || eventName,
            },
            waitingForLocation: false, // Done waiting for location
          }));

          // Show message and auto-open date picker
          setShowTextInput(false); // Hide text input, show picker instead
          addMessage(`${location}\n\nNow pick the date.`, true, "Event date");

          setTimeout(() => {
            setShowDatePicker(true);
          }, 400);

          stopLoading();
          break;
        }

        // Handle performance target input for EVENT_AMBITION
        case STEPS.EVENT_AMBITION: {
          console.log("[Onboarding] EVENT_AMBITION: Processing performance target:", text);
          if (userData.pendingAmbition === "PERFORMANCE") {
            await finalizeEventAmbition("PERFORMANCE", text);
          }
          stopLoading();
          break;
        }

        // CURRENT_STATE is now a form, handled by handleCurrentStateFormSubmit

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
          addMessage("A few quick questions about you.", true, "About you");
          stopLoading();
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
      stopLoading();
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getCurrentReplies = () => {
    // If pending edit choice, show edit options
    if (userData.pendingEditChoice) {
      return getEditReplies();
    }

    switch (step) {
      case STEPS.GOAL_TYPE:
        return goalTypeReplies;
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
    // If pending edit choice, use the edit handler
    if (userData.pendingEditChoice) {
      return handleEditChoice;
    }

    switch (step) {
      case STEPS.GOAL_TYPE:
        return handleGoalType;
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

  const showFormStep = [STEPS.CURRENT_STATE, STEPS.CONSTRAINTS, STEPS.BEHAVIOR_PROFILE].includes(step);
  const showInput = showTextInput && (
    [STEPS.GOAL_INPUT, STEPS.EVENT_INPUT, STEPS.CONSTRAINTS, STEPS.EVENT_DATE].includes(step) ||
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
        <View style={styles.headerIconContainer}>
          <Image source={botIcon} style={styles.headerBotIcon} />
        </View>
      </View>

      {/* Progress */}
      <ProgressBar progress={progress} />

      <KeyboardAvoidingView
        behavior={keyboardBehavior}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >

        {/* Locked Steps Display */}
        {(lockedGoal || lockedCurrentState) && (
          <View style={styles.lockedContainer}>
            {lockedGoal && (
              <View style={styles.lockedItem}>
                <Text style={styles.lockedNumber}>1</Text>
                <View style={styles.lockedContent}>
                  <Text style={styles.lockedLabel}>Goal 🎯</Text>
                  <Text style={styles.lockedText} numberOfLines={2}>{lockedGoal}</Text>
                </View>
              </View>
            )}
            {lockedCurrentState && (
              <View style={styles.lockedItem}>
                <Text style={styles.lockedNumber}>2</Text>
                <View style={styles.lockedContent}>
                  <Text style={styles.lockedLabel}>Starting point 📍</Text>
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
          {messages.map((msg, index) => {
            // Hide "Your goal" title since Step 1 header shows it
            const showTitle = msg.title && msg.title !== "Your goal" && msg.title !== "Your event";

            return (
              <View key={msg.id}>
                {msg.isAI ? (
                  <View style={[styles.messageBubble, styles.aiBubble]}>
                    {showTitle && (
                      <Text style={styles.aiTitle}>{msg.title}</Text>
                    )}
                    {msg.id === typingMessageId ? (
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
                      <Text style={[styles.messageText, styles.aiText]}>
                        {msg.text}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={[styles.messageBubble, styles.userBubble]}>
                    <Text style={[styles.messageText, styles.userText]}>
                      {msg.text}
                    </Text>
                  </View>
                )}
                {/* Step 1 header after user's "Let's go" message */}
                {!msg.isAI && msg.text === "Let's go" && step !== STEPS.INTRO && (
                  <View style={styles.stepHeader}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>STEP 1</Text>
                    </View>
                    <Text style={styles.stepTitle}>Your Goal</Text>
                  </View>
                )}
              </View>
            );
          })}

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
              {step === STEPS.CURRENT_STATE && (
                <FitnessAssessmentForm
                  goal={userData.goal}
                  onComplete={handleFitnessAssessmentComplete}
                />
              )}

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
                      trackColor={{ true: theme.colors.orange }}
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
                      trackColor={{ true: theme.colors.orange }}
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
                      trackColor={{ true: theme.colors.orange }}
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

                  <TouchableOpacity onPress={handleBehaviorProfileSubmit} activeOpacity={0.8}>
                    <LinearGradient
                      colors={[theme.colors.orange, theme.colors.purple]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.formButton}
                    >
                      <Text style={styles.formButtonText}>Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <TypingIndicator message={loadingMessage} />
            </View>
          )}

          {step === STEPS.DONE && (
            <TouchableOpacity
              onPress={() => {
                haptic("impactMedium");
                navigation.goBack();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.orange, theme.colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.doneButton}
              >
                <Text style={styles.doneButtonText}>Start my journey 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Continue button for INTRO */}
        {step === STEPS.INTRO && !typingMessageId && (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              onPress={handleIntroContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.orange, theme.colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButton}
              >
                <Text style={styles.continueButtonText}>Let's go</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Text input */}
        {showInput && !typingMessageId && (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Date picker section - only show when NOT waiting for location */}
            {step === STEPS.EVENT_DATE && !userData.waitingForLocation && (
              <View style={styles.datePickerSection}>
                {/* Date display/input - click to open picker */}
                <TouchableOpacity
                  style={styles.dateDisplayInput}
                  onPress={() => {
                    haptic("impactLight");
                    Keyboard.dismiss();
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather name="calendar" size={18} color={theme.colors.orange} />
                  <Text style={styles.dateDisplayText}>
                    {selectedDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </Text>
                  <Feather name="chevron-down" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>

                {/* I don't know button */}
                <TouchableOpacity
                  style={styles.iDontKnowButton}
                  onPress={() => {
                    haptic("impactLight");
                    // Set date to null/unknown and proceed
                    setUserData(prev => ({
                      ...prev,
                      eventDate: null,
                      eventDateUnknown: true,
                    }));
                    // Add message and proceed
                    addMessage({
                      id: Date.now(),
                      type: "user",
                      text: "I don't know the exact date yet",
                    });
                    // Move to next step
                    setTimeout(() => {
                      goToStep(STEPS.EVENT_AMBITION);
                    }, 300);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.iDontKnowText}>I don't know yet</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Race suggestions dropdown */}
            {showRaceSuggestions && step === STEPS.EVENT_INPUT && (
              <View style={styles.locationSuggestionsContainer}>
                {raceSuggestions.map((race, index) => {
                  // Format date nicely if available
                  let dateDisplay = null;
                  if (race.date) {
                    const d = new Date(race.date);
                    dateDisplay = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                  }
                  return (
                    <TouchableOpacity
                      key={`${race.name}-${index}`}
                      style={styles.locationSuggestionItem}
                      onPress={() => handleRaceSelect(race)}
                      activeOpacity={0.7}
                    >
                      <Feather name="flag" size={14} color={theme.colors.orange} />
                      <View style={styles.raceSuggestionContent}>
                        <Text style={styles.locationSuggestionText}>{race.name}</Text>
                        <Text style={styles.raceSuggestionLocation}>
                          {race.location && `${race.location} · `}{race.type}{dateDisplay && ` · ${dateDisplay}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {/* Location suggestions dropdown */}
            {showLocationSuggestions && step === STEPS.EVENT_DATE && userData.waitingForLocation && (
              <View style={styles.locationSuggestionsContainer}>
                {locationSuggestions.map((loc, index) => (
                  <TouchableOpacity
                    key={`${loc.display}-${index}`}
                    style={styles.locationSuggestionItem}
                    onPress={() => handleLocationSelect(loc)}
                    activeOpacity={0.7}
                  >
                    <Feather name="map-pin" size={14} color={theme.colors.orange} />
                    <Text style={styles.locationSuggestionText}>{loc.display}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                keyboardAppearance="dark"
                placeholder={
                  step === STEPS.GOAL_INPUT
                    ? "Type your goal..."
                    : step === STEPS.EVENT_INPUT
                    ? "e.g. Boston Marathon, Ironman..."
                    : step === STEPS.CONSTRAINTS
                    ? "Any constraints..."
                    : step === STEPS.EVENT_DATE && userData.waitingForLocation
                    ? "e.g. Boston, Stockholm, Berlin..."
                    : step === STEPS.EVENT_DATE
                    ? "Or type a date..."
                    : step === STEPS.EVENT_AMBITION && userData.pendingAmbition
                    ? "Your target..."
                    : "Type here..."
                }
                placeholderTextColor={theme.colors.textMuted}
                value={input}
                onChangeText={(text) => {
                  setInput(text);
                  // Filter races when on event input step
                  if (step === STEPS.EVENT_INPUT) {
                    filterRaces(text);
                  }
                  // Filter locations when waiting for location input
                  if (step === STEPS.EVENT_DATE && userData.waitingForLocation) {
                    filterLocations(text);
                  }
                }}
                onSubmitEditing={handleSubmit}
                onFocus={() => {
                  // Scroll to bottom when keyboard opens
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
                }}
                onBlur={() => {
                  // Hide suggestions after a delay (allows tap to fully register)
                  setTimeout(() => {
                    setShowLocationSuggestions(false);
                    setShowRaceSuggestions(false);
                  }, 400);
                }}
                returnKeyType="send"
                editable={!loading}
                multiline={step === STEPS.CONSTRAINTS}
              />
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!input.trim() || loading}
                activeOpacity={0.8}
              >
                {input.trim() && !loading ? (
                  <LinearGradient
                    colors={[theme.colors.orange, theme.colors.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sendButton}
                  >
                    <Feather name="arrow-up" size={18} color={theme.colors.black} />
                  </LinearGradient>
                ) : (
                  <View style={[styles.sendButton, styles.sendButtonDisabled]}>
                    <Feather name="arrow-up" size={18} color={theme.colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Date Picker Modal */}
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.datePickerModal}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={styles.datePickerContainer}
            >
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={handleDatePickerConfirm}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <WheelDatePicker
                value={selectedDate}
                onChange={handleDateSelect}
                minimumDate={new Date()}
                maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 3))}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
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
    alignItems: "center",
    justifyContent: "center",
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBotIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  progressContainer: {
    height: 3,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.md,
    borderRadius: 2,
  },
  progressBar: {
    height: "100%",
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
    color: theme.colors.orange,
    width: 18,
    height: 18,
    textAlign: "center",
    lineHeight: 18,
    backgroundColor: `${theme.colors.orange}20`,
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
  // Step header for GOAL_TYPE (Step 1)
  stepHeader: {
    alignItems: "flex-start",
    marginBottom: 20,
  },
  stepBadge: {
    backgroundColor: theme.colors.orange + "20",
    borderWidth: 1,
    borderColor: theme.colors.orange,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.orange,
    letterSpacing: 1.5,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    padding: theme.spacing.screenPadding,
    paddingBottom: 100,
  },
  messageBubble: {
    marginBottom: theme.spacing.sm,
  },
  aiBubble: {
    alignSelf: "flex-start",
    maxWidth: "90%",
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.orange,
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
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceHover,
  },
  continueButton: {
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
    borderColor: theme.colors.orange,
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
    flex: 1,
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
    borderColor: theme.colors.orange,
    backgroundColor: `${theme.colors.orange}15`,
  },
  selectChipText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  formTextInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  formButton: {
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
  // Date picker styles
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.orange,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  datePickerButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.orange,
  },
  datePickerSection: {
    marginBottom: theme.spacing.sm,
  },
  dateDisplayInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  dateDisplayText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  iDontKnowButton: {
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  iDontKnowText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textDecorationLine: "underline",
  },
  datePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  datePickerContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 34,
  },
  datePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  datePickerCancel: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  datePickerDone: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.orange,
  },
  // Location suggestions styles
  locationSuggestionsContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs,
    overflow: "hidden",
    zIndex: 10,
    elevation: 10,
  },
  locationSuggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationSuggestionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  raceSuggestionContent: {
    flex: 1,
  },
  raceSuggestionLocation: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
