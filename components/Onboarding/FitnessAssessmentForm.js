import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../theme';
import { analyzeUserProfile } from '../../services/api';
import { haptic } from '../../utils/haptics';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// QUESTION DATA (English) - Enhanced with emojis and visual design
// =============================================================================

const STANDARD_QUESTIONS = [
  {
    id: 'trainingExperience',
    title: 'Training Experience',
    question: 'How long have you been training regularly?',
    type: 'single',
    layout: 'scale',
    options: [
      { id: 'beginner', label: 'New', emoji: '🌱' },
      { id: '1-6months', label: '1-6m', emoji: '🌿' },
      { id: '6-12months', label: '6-12m', emoji: '🌳' },
      { id: '1-3years', label: '1-3y', emoji: '💪' },
      { id: '3+years', label: '3y+', emoji: '🏆' },
    ],
  },
  {
    id: 'trainingFrequency',
    title: 'Training Frequency',
    question: 'How often do you train right now?',
    type: 'single',
    layout: 'scale',
    options: [
      { id: '0-1', label: '0-1x', emoji: '1️⃣' },
      { id: '2-3', label: '2-3x', emoji: '2️⃣' },
      { id: '4-5', label: '4-5x', emoji: '4️⃣' },
      { id: '6+', label: '6+', emoji: '🔥' },
    ],
  },
  {
    id: 'trainingTypes',
    title: 'Training Types',
    question: 'What do you train? (select all that apply)',
    type: 'multi',
    layout: 'grid',
    options: [
      { id: 'strength', label: 'Strength', emoji: '🏋️' },
      { id: 'running', label: 'Running', emoji: '🏃' },
      { id: 'cycling', label: 'Cycling', emoji: '🚴' },
      { id: 'swimming', label: 'Swimming', emoji: '🏊' },
      { id: 'cardio', label: 'Cardio', emoji: '❤️‍🔥' },
      { id: 'yoga', label: 'Yoga/Pilates', emoji: '🧘' },
      { id: 'sports', label: 'Sports', emoji: '⚽' },
      { id: 'other', label: 'Other', emoji: '✨', hasInput: true, inputPlaceholder: 'Which?' },
    ],
  },
  {
    id: 'perceivedLevel',
    title: 'Current Level',
    question: 'How would you describe your current fitness?',
    type: 'single',
    layout: 'scale',
    important: true,
    options: [
      { id: 'poor', label: '😅', sublabel: 'Starting' },
      { id: 'okay', label: '🙂', sublabel: 'Building' },
      { id: 'good', label: '😊', sublabel: 'Solid' },
      { id: 'great', label: '🔥', sublabel: 'Peak' },
    ],
  },
  {
    id: 'injuries',
    title: 'Injuries & Limitations',
    question: 'Any injuries or limitations I should know about?',
    type: 'multi',
    layout: 'grid',
    options: [
      { id: 'none', label: 'All good!', emoji: '✅', exclusive: true },
      { id: 'knee', label: 'Knee', emoji: '🦵' },
      { id: 'back', label: 'Back', emoji: '🔙' },
      { id: 'shoulder', label: 'Shoulder', emoji: '💪' },
      { id: 'hip', label: 'Hip', emoji: '🦴' },
      { id: 'other', label: 'Other', emoji: '📝', hasInput: true, inputPlaceholder: 'Describe...' },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Daily Activity',
    question: 'What does your typical day look like?',
    type: 'single',
    layout: 'scale',
    options: [
      { id: 'sedentary', label: '🪑', sublabel: 'Desk' },
      { id: 'active', label: '🚶', sublabel: 'Active' },
      { id: 'physical', label: '👷', sublabel: 'Physical' },
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep',
    question: 'How much sleep do you usually get?',
    type: 'single',
    layout: 'scale',
    options: [
      { id: '<6h', label: '< 6h', emoji: '😴' },
      { id: '6-7h', label: '6-7h', emoji: '😐' },
      { id: '7-8h', label: '7-8h', emoji: '😊' },
      { id: '8+h', label: '8h+', emoji: '😇' },
    ],
  },
];

const ADVANCED_SECTIONS = {
  general: {
    id: 'general',
    title: 'General',
    icon: 'activity',
    fields: [
      { id: 'restingHR', label: 'Resting HR (bpm)', type: 'number', placeholder: 'e.g. 55' },
      { id: 'maxHR', label: 'Max HR (bpm)', type: 'number', placeholder: 'e.g. 185' },
      { id: 'wearable', label: 'Wearable', type: 'single', options: [
        { id: 'garmin', label: 'Garmin' },
        { id: 'apple', label: 'Apple Watch' },
        { id: 'polar', label: 'Polar' },
        { id: 'other', label: 'Other' },
        { id: 'none', label: 'None' },
      ]},
    ],
  },
  cycling: {
    id: 'cycling',
    title: 'Cycling',
    icon: 'navigation',
    showWhen: 'cycling',
    fields: [
      { id: 'ftp', label: 'FTP (watts)', type: 'number', placeholder: 'e.g. 250' },
      { id: 'ftpAge', label: 'How old is your FTP?', type: 'single', options: [
        { id: '<1month', label: '< 1 month' },
        { id: '1-3months', label: '1–3 months' },
        { id: '3+months', label: '3+ months' },
      ]},
    ],
  },
  running: {
    id: 'running',
    title: 'Running',
    icon: 'trending-up',
    showWhen: 'running',
    fields: [
      { id: 'pb5k', label: '5K PB', type: 'text', placeholder: 'e.g. 22:30' },
      { id: 'pb10k', label: '10K PB', type: 'text', placeholder: 'e.g. 48:00' },
    ],
  },
  strength: {
    id: 'strength',
    title: 'Strength',
    icon: 'target',
    showWhen: 'strength',
    fields: [
      { id: 'squat', label: 'Squat max (kg)', type: 'number', placeholder: 'Approx.' },
      { id: 'bench', label: 'Bench max (kg)', type: 'number', placeholder: 'Approx.' },
      { id: 'deadlift', label: 'Deadlift max (kg)', type: 'number', placeholder: 'Approx.' },
    ],
  },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// AI Message Bubble with typewriter effect and fade-in animation
const AIBubble = ({ title, text = '', isNew, compact }) => {
  const safeText = text || '';
  const [displayedText, setDisplayedText] = useState(isNew ? '' : safeText);
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(isNew ? 10 : 0)).current;

  useEffect(() => {
    if (!safeText) return;

    if (!isNew) {
      setDisplayedText(safeText);
      return;
    }

    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Typewriter effect
    let index = 0;
    const interval = setInterval(() => {
      if (index < safeText.length) {
        setDisplayedText(safeText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [safeText, isNew]);

  return (
    <Animated.View style={[
      compact ? styles.aiBubbleCompact : styles.aiBubble,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    ]}>
      {title && <Text style={compact ? styles.aiBubbleTitleCompact : styles.aiBubbleTitle}>{title}</Text>}
      <Text style={compact ? styles.aiBubbleTextCompact : styles.aiBubbleText}>{displayedText}</Text>
    </Animated.View>
  );
};

// Option Chip - supports list, grid, scale and card layouts with animations
const OptionChip = ({ option, selected, onPress, type, layout, disabled, index = 0, totalOptions = 1 }) => {
  const isMulti = type === 'multi';
  const isGrid = layout === 'grid';
  const isCard = layout === 'cards';
  const isScale = layout === 'scale';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    haptic('impactLight');
    onPress();
  };

  // Scale layout - horizontal row with all options
  if (isScale) {
    const isFirst = index === 0;
    const isLast = index === totalOptions - 1;
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], flex: 1 }}>
        <TouchableOpacity
          style={[
            styles.scaleOption,
            isFirst && styles.scaleOptionFirst,
            isLast && styles.scaleOptionLast,
            selected && styles.scaleOptionSelected,
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
        >
          <Text style={[styles.scaleEmoji, selected && styles.scaleEmojiSelected]}>
            {option.emoji || option.label}
          </Text>
          {option.sublabel && (
            <Text style={[styles.scaleSublabel, selected && styles.scaleSublabelSelected]}>
              {option.sublabel}
            </Text>
          )}
          {!option.sublabel && option.emoji && (
            <Text style={[styles.scaleLabel, selected && styles.scaleLabelSelected]}>
              {option.label}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (isCard) {
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.cardOption, selected && styles.cardOptionSelected]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
        >
          <Text style={styles.cardEmoji}>{option.emoji}</Text>
          <View style={styles.cardContent}>
            <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>{option.label}</Text>
            {option.sublabel && (
              <Text style={[styles.cardSublabel, selected && styles.cardSublabelSelected]}>{option.sublabel}</Text>
            )}
          </View>
          {selected && (
            <View style={styles.cardCheckmark}>
              <Feather name="check" size={12} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (isGrid) {
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.gridOption, selected && styles.gridOptionSelected]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
        >
          <Text style={styles.gridEmoji}>{option.emoji}</Text>
          <Text style={[styles.gridLabel, selected && styles.gridLabelSelected]}>{option.label}</Text>
          {option.sublabel && (
            <Text style={[styles.gridSublabel, selected && styles.gridSublabelSelected]}>{option.sublabel}</Text>
          )}
          {isMulti && selected && (
            <View style={styles.gridCheckmark}>
              <Feather name="check" size={10} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Default list layout
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.optionChip, selected && styles.optionChipSelected]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        {option.emoji && <Text style={styles.chipEmoji}>{option.emoji}</Text>}
        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
          {option.label}
        </Text>
        {isMulti && (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && <Feather name="check" size={10} color="#fff" />}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Advanced Section Accordion
const AdvancedSection = ({ section, answers, onChange, expanded, onToggle }) => {
  const animatedHeight = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  return (
    <View style={styles.advancedSection}>
      <TouchableOpacity style={styles.advancedHeader} onPress={onToggle}>
        <View style={styles.advancedHeaderLeft}>
          <Feather name={section.icon} size={18} color={theme.colors.purple} />
          <Text style={styles.advancedTitle}>{section.title}</Text>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
      </TouchableOpacity>

      <Animated.View style={[
        styles.advancedContent,
        {
          maxHeight: animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }),
          opacity: animatedHeight,
        },
      ]}>
        {section.fields.map((field) => (
          <View key={field.id} style={styles.advancedField}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            {(field.type === 'number' || field.type === 'text') ? (
              <TextInput
                style={styles.fieldInput}
                placeholder={field.placeholder}
                placeholderTextColor="#666"
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                value={answers[field.id] || ''}
                onChangeText={(text) => onChange({ ...answers, [field.id]: text })}
              />
            ) : field.type === 'single' ? (
              <View style={styles.fieldChips}>
                {field.options.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.fieldChip, answers[field.id] === opt.id && styles.fieldChipSelected]}
                    onPress={() => onChange({ ...answers, [field.id]: opt.id })}
                  >
                    <Text style={[styles.fieldChipText, answers[field.id] === opt.id && styles.fieldChipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// Steps: questions -> advanced_prompt -> advanced -> analyzing -> summary
const STEP_QUESTIONS = 'questions';
const STEP_ADVANCED_PROMPT = 'advanced_prompt';
const STEP_ADVANCED = 'advanced';
const STEP_ANALYZING = 'analyzing';
const STEP_SUMMARY = 'summary';

const FitnessAssessmentForm = forwardRef(({ goal, onComplete, onIntroStateChange, renderButtonExternally }, ref) => {
  const insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState({});
  const [advancedAnswers, setAdvancedAnswers] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [step, setStep] = useState(STEP_QUESTIONS);
  const [aiSummary, setAiSummary] = useState(null);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [inputValues, setInputValues] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showIntro, setShowIntro] = useState(true);
  const [introCompleted, setIntroCompleted] = useState(false);

  // Notify parent of intro state changes
  useEffect(() => {
    if (onIntroStateChange) {
      onIntroStateChange(showIntro);
    }
  }, [showIntro, onIntroStateChange]);

  // Expose startQuestions method to parent via ref
  useImperativeHandle(ref, () => ({
    startQuestions: () => {
      haptic('impactMedium');
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowIntro(false);
      setIntroCompleted(true);
    }
  }));

  const currentQuestion = STANDARD_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= STANDARD_QUESTIONS.length - 1;

  // Get selected training types for showing relevant advanced sections
  const selectedTypes = answers.trainingTypes || [];
  const visibleAdvancedSections = Object.values(ADVANCED_SECTIONS).filter(section => {
    if (!section.showWhen) return true;
    return selectedTypes.includes(section.showWhen);
  });

  const handleSelect = (optionId) => {
    const question = currentQuestion;

    if (question.type === 'single') {
      // Single select - set answer and move to next
      setAnswers(prev => ({ ...prev, [question.id]: optionId }));

      // Mark as answered and move to next after short delay
      setTimeout(() => {
        setAnsweredQuestions(prev => [...prev, { ...question, answer: optionId }]);

        if (isLastQuestion) {
          setStep(STEP_ADVANCED_PROMPT);
        } else {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      }, 300);
    } else {
      // Multi-select - toggle selection
      const current = answers[question.id] || [];
      const option = question.options.find(o => o.id === optionId);

      if (option?.exclusive) {
        setAnswers(prev => ({ ...prev, [question.id]: [optionId] }));
      } else {
        const filtered = current.filter(id => {
          const opt = question.options.find(o => o.id === id);
          return !opt?.exclusive;
        });

        if (filtered.includes(optionId)) {
          setAnswers(prev => ({ ...prev, [question.id]: filtered.filter(id => id !== optionId) }));
        } else {
          setAnswers(prev => ({ ...prev, [question.id]: [...filtered, optionId] }));
        }
      }
    }
  };

  const handleMultiConfirm = () => {
    const question = currentQuestion;
    setAnsweredQuestions(prev => [...prev, { ...question, answer: answers[question.id] }]);

    if (isLastQuestion) {
      setStep(STEP_ADVANCED_PROMPT);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const isSelected = (optionId) => {
    const question = currentQuestion;
    if (question.type === 'single') return answers[question.id] === optionId;
    return (answers[question.id] || []).includes(optionId);
  };

  const generateFallbackSummary = () => {
    const exp = answers.trainingExperience;
    const freq = answers.trainingFrequency;
    const types = answers.trainingTypes || [];
    const level = answers.perceivedLevel;
    const injuries = answers.injuries || [];
    const lifestyle = answers.lifestyle;
    const sleep = answers.sleep;

    let parts = [];

    // Experience + frequency context
    if (exp === 'beginner' || exp === '1-6months') {
      parts.push("You're relatively new to training");
    } else if (exp === '3+years') {
      parts.push("You have solid experience");
    }

    if (freq === '0-1' || freq === '2-3') {
      parts.push("with room to build consistency");
    } else if (freq === '6+') {
      parts.push("and train frequently");
    }

    // Training types
    if (types.length > 0) {
      const typeLabels = types.slice(0, 3).map(t =>
        STANDARD_QUESTIONS.find(q => q.id === 'trainingTypes')?.options.find(o => o.id === t)?.label
      ).filter(Boolean);
      if (typeLabels.length > 0) {
        parts.push(`focusing on ${typeLabels.join(', ')}`);
      }
    }

    // Level assessment
    let levelText = '';
    if (level === 'poor') {
      levelText = "We'll start with foundational work and build gradually.";
    } else if (level === 'okay') {
      levelText = "The focus will be on building consistency and confidence.";
    } else if (level === 'good') {
      levelText = "You have a solid base to build on.";
    } else {
      levelText = "You're in great shape - we can push for optimization.";
    }

    // Injuries consideration
    let injuryText = '';
    if (injuries.length > 0 && !injuries.includes('none')) {
      const injuryLabels = injuries.filter(i => i !== 'other').map(i =>
        STANDARD_QUESTIONS.find(q => q.id === 'injuries')?.options.find(o => o.id === i)?.label?.toLowerCase()
      ).filter(Boolean);
      if (injuryLabels.length > 0) {
        injuryText = ` I'll keep your ${injuryLabels.join(' and ')} in mind when planning.`;
      }
    }

    // Lifestyle/recovery context
    let recoveryText = '';
    if (sleep === '<6h' || sleep === '6-7h') {
      recoveryText = ' Recovery will be a priority given your sleep patterns.';
    }
    if (lifestyle === 'physical') {
      recoveryText += ' Your physical job means managing total load carefully.';
    }

    return `${parts.join(', ')}. ${levelText}${injuryText}${recoveryText}`.trim();
  };

  const handleAnalyze = async () => {
    setStep(STEP_ANALYZING);
    try {
      const result = await analyzeUserProfile({
        standard: answers,
        advanced: advancedAnswers,
        inputValues,
        goal,
      });
      setAiSummary(result.summary);
      setFollowUpQuestions(result.followUpQuestions || []);
    } catch (error) {
      console.error('Analysis error:', error);
      setAiSummary(generateFallbackSummary());
    }
    setStep(STEP_SUMMARY);
  };

  const handleContinue = () => {
    onComplete({
      standard: answers,
      advanced: advancedAnswers,
      inputValues,
      aiSummary,
      followUpAnswers,
    });
  };

  const handleSkipAdvanced = () => {
    handleAnalyze();
  };

  const handleShowAdvanced = () => {
    setStep(STEP_ADVANCED);
  };

  const handleAdvancedDone = () => {
    handleAnalyze();
  };

  // Get answer label with emoji for display
  const getAnswerDisplay = (question, answer) => {
    if (question.type === 'single') {
      const opt = question.options.find(o => o.id === answer);
      return opt ? { emoji: opt.emoji, label: opt.label } : { emoji: '', label: answer };
    }
    if (Array.isArray(answer)) {
      const opts = answer.map(a => question.options.find(o => o.id === a)).filter(Boolean);
      // Include "Other" input value if present
      let labels = opts.map(o => {
        if (o.hasInput && inputValues[o.id]) {
          return `${o.label}: ${inputValues[o.id]}`;
        }
        return o.label;
      });
      return {
        emoji: opts.map(o => o.emoji).join(' '),
        label: labels.join(', '),
      };
    }
    return { emoji: '', label: answer };
  };

  const handleStartQuestions = () => {
    haptic('impactMedium');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowIntro(false);
    setIntroCompleted(true);
  };

  // Reset everything and start over
  const handleReset = () => {
    haptic('impactMedium');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAnswers({});
    setAdvancedAnswers({});
    setExpandedSections({});
    setCurrentQuestionIndex(0);
    setStep(STEP_QUESTIONS);
    setAiSummary(null);
    setFollowUpQuestions([]);
    setFollowUpAnswers({});
    setInputValues({});
    setAnsweredQuestions([]);
    setShowIntro(true);
    setIntroCompleted(false);
  };

  return (
    <View style={styles.container}>
      {/* Step Header with Reset button */}
      <View style={styles.stepHeaderRow}>
        <View style={styles.stepHeaderCenter}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>STEP 2</Text>
          </View>
          <Text style={styles.stepTitle}>Current Status</Text>
        </View>
        {/* Reset button - top right */}
        {!showIntro && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
            <Feather name="rotate-ccw" size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Intro - full screen with button at bottom like Step 1 */}
      {showIntro && (
        <>
          <AIBubble
            text="A few quick questions about your training background. This helps me create a plan that fits you."
            isNew={true}
          />
          {/* Only render button here if not rendered externally */}
          {!renderButtonExternally && (
            <>
              <View style={styles.introSpacer} />
              <View style={[styles.introButtonArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity onPress={handleStartQuestions} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[theme.colors.purple, theme.colors.blue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.letsGoButton}
                  >
                    <Text style={styles.letsGoButtonText}>Let's go</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}

      {/* "Let's go" user message after intro */}
      {introCompleted && !showIntro && (
        <View style={styles.letsGoMessage}>
          <Text style={styles.letsGoMessageText}>Let's go</Text>
        </View>
      )}

      {/* Already answered questions - compact view */}
      {!showIntro && answeredQuestions.map((q, idx) => {
        const display = getAnswerDisplay(q, q.answer);
        return (
          <View key={q.id} style={styles.answeredBlock}>
            <AIBubble title={q.title} text={q.question} isNew={false} compact />
            <View style={styles.userBubble}>
              {display.emoji && <Text style={styles.userBubbleEmoji}>{display.emoji}</Text>}
              <Text style={styles.userBubbleText}>{display.label}</Text>
            </View>
          </View>
        );
      })}

      {/* Current question */}
      {!showIntro && step === STEP_QUESTIONS && currentQuestion && (
        <View style={styles.questionBlock}>
          <AIBubble
            title={currentQuestion.important ? `⭐ ${currentQuestion.title}` : currentQuestion.title}
            text={currentQuestion.question}
            isNew={true}
          />
          <View style={[
            styles.optionsContainer,
            currentQuestion.layout === 'grid' && styles.optionsGrid,
            currentQuestion.layout === 'cards' && styles.optionsCards,
            currentQuestion.layout === 'scale' && styles.optionsScale,
          ]}>
            {currentQuestion.options.map((option, optIdx) => (
              <View key={option.id} style={
                currentQuestion.layout === 'grid' ? styles.gridItem :
                currentQuestion.layout === 'scale' ? styles.scaleItem :
                { width: '100%' }
              }>
                <OptionChip
                  option={option}
                  selected={isSelected(option.id)}
                  onPress={() => handleSelect(option.id)}
                  totalOptions={currentQuestion.options.length}
                  type={currentQuestion.type}
                  layout={currentQuestion.layout}
                  index={optIdx}
                />
                {option.hasInput && isSelected(option.id) && (
                  <TextInput
                    style={styles.optionInput}
                    placeholder={option.inputPlaceholder}
                    placeholderTextColor="#666"
                    value={inputValues[option.id] || ''}
                    onChangeText={(text) => setInputValues(prev => ({ ...prev, [option.id]: text }))}
                    autoFocus
                  />
                )}
              </View>
            ))}
          </View>

          {/* Confirm button for multi-select */}
          {currentQuestion.type === 'multi' && (answers[currentQuestion.id]?.length > 0) && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => { haptic('impactMedium'); handleMultiConfirm(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>Continue →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Advanced prompt */}
      {step === STEP_ADVANCED_PROMPT && (
        <View style={styles.questionBlock}>
          <AIBubble
            title="Advanced (Optional)"
            text="Do you have training data like heart rate, FTP, or personal bests? Adding them gives me more to work with."
            isNew={true}
          />
          <View style={styles.advancedPromptButtons}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => { haptic('impactLight'); handleSkipAdvanced(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.showAdvancedButton}
              onPress={() => { haptic('impactMedium'); handleShowAdvanced(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.showAdvancedButtonText}>Add data →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Advanced settings */}
      {step === STEP_ADVANCED && (
        <View style={styles.questionBlock}>
          <AIBubble
            title="Advanced Settings"
            text="Fill in what you know. Everything is optional."
            isNew={false}
          />
          <View style={styles.advancedContainer}>
            {visibleAdvancedSections.map((section) => (
              <AdvancedSection
                key={section.id}
                section={section}
                answers={advancedAnswers[section.id] || {}}
                onChange={(values) => setAdvancedAnswers(prev => ({ ...prev, [section.id]: values }))}
                expanded={expandedSections[section.id]}
                onToggle={() => setExpandedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => { haptic('impactMedium'); handleAdvancedDone(); }}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonText}>Analyze my profile →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Analyzing */}
      {step === STEP_ANALYZING && (
        <View style={styles.analyzingBlock}>
          <View style={styles.analyzingIconContainer}>
            <ActivityIndicator size="large" color={theme.colors.purple} />
          </View>
          <Text style={styles.analyzingTitle}>Analyzing your profile</Text>
          <Text style={styles.analyzingText}>Creating personalized recommendations...</Text>
        </View>
      )}

      {/* Summary */}
      {step === STEP_SUMMARY && (
        <View style={styles.questionBlock}>
          <AIBubble
            title="My Assessment"
            text={aiSummary}
            isNew={true}
          />

          {followUpQuestions.length > 0 && (
            <View style={styles.followUpContainer}>
              <Text style={styles.followUpTitle}>I need a bit more info:</Text>
              {followUpQuestions.map((q, idx) => (
                <View key={idx} style={styles.followUpItem}>
                  <Text style={styles.followUpQuestion}>{q.question || q}</Text>
                  <TextInput
                    style={styles.followUpInput}
                    placeholder="Your answer..."
                    placeholderTextColor="#666"
                    value={followUpAnswers[idx] || ''}
                    onChangeText={(text) => setFollowUpAnswers(prev => ({ ...prev, [idx]: text }))}
                  />
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => { haptic('impactMedium'); handleContinue(); }}
            activeOpacity={0.7}
          >
            <Text style={styles.continueText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default FitnessAssessmentForm;

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },

  // Step header with reset button
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: theme.spacing.lg,
    position: 'relative',
  },
  stepHeaderCenter: {
    alignItems: 'flex-start',
  },
  resetButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    backgroundColor: theme.colors.purple + '20',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: theme.spacing.xs,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.purple,
    letterSpacing: 1.5,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Intro - matches Step 1 layout
  introText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  introSpacer: {
    flex: 1,
    minHeight: 40,
  },
  introButtonArea: {
    paddingTop: theme.spacing.sm,
  },
  letsGoButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  letsGoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.black,
  },
  // "Let's go" user message - matches userBubble style exactly
  letsGoMessage: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.sm,
  },
  letsGoMessageText: {
    fontSize: 14,
    color: theme.colors.text,
  },

  questionBlock: {
    marginBottom: 20,
  },
  answeredBlock: {
    marginBottom: 16,
  },
  // AI bubble - matches AIOnboardingScreen exactly
  aiBubble: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    marginBottom: theme.spacing.sm,
  },
  aiBubbleCompact: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    marginBottom: 8,
    opacity: 0.7,
  },
  aiBubbleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  aiBubbleTitleCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  aiBubbleText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
    fontWeight: '400',
  },
  aiBubbleTextCompact: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  // User answer - matches AIOnboardingScreen userBubble exactly (but purple)
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  userBubbleEmoji: {
    fontSize: 16,
  },
  userBubbleText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  // Options container layouts
  optionsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionsCards: {
    flexDirection: 'column',
    gap: 10,
  },
  optionsScale: {
    flexDirection: 'row',
    gap: 0,
  },
  gridItem: {
    width: '47%',
  },
  scaleItem: {
    flex: 1,
  },

  // Scale layout - horizontal row
  scaleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 70,
  },
  scaleOptionFirst: {
    borderTopLeftRadius: theme.radius.sm,
    borderBottomLeftRadius: theme.radius.sm,
  },
  scaleOptionLast: {
    borderTopRightRadius: theme.radius.sm,
    borderBottomRightRadius: theme.radius.sm,
  },
  scaleOptionSelected: {
    backgroundColor: theme.colors.purple + '30',
    borderColor: theme.colors.purple,
    borderWidth: 2,
  },
  scaleEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  scaleEmojiSelected: {
    transform: [{ scale: 1.1 }],
  },
  scaleLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  scaleLabelSelected: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  scaleSublabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  scaleSublabelSelected: {
    color: theme.colors.textSecondary,
  },

  // Grid layout option - matches quickReplyChip exactly (but purple)
  gridOption: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    width: '100%',
  },
  gridOptionSelected: {
    borderWidth: 2,
    borderColor: theme.colors.purple,
  },
  gridEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  gridLabelSelected: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  gridSublabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  gridSublabelSelected: {
    color: theme.colors.textSecondary,
  },
  gridCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card layout option - matches quickReplyChip style
  cardOption: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOptionSelected: {
    borderWidth: 2,
  },
  cardEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  cardLabelSelected: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  cardSublabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  cardSublabelSelected: {
    color: theme.colors.textSecondary,
  },
  cardCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },

  // List layout option - exactly matches quickReplyChip
  optionChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  optionChipSelected: {
    borderWidth: 2,
  },
  chipEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  optionChipTextSelected: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.purple,
  },
  optionInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    marginLeft: 24,
    color: '#fff',
    fontSize: 13,
  },
  confirmButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  confirmButtonText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  advancedPromptButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  skipButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  skipButtonText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  showAdvancedButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  showAdvancedButtonText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  advancedContainer: {
    marginTop: 10,
  },
  advancedSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  advancedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advancedTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  advancedContent: {
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  advancedField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 13,
  },
  fieldChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fieldChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldChipSelected: {
    backgroundColor: theme.colors.purple + '20',
    borderColor: theme.colors.purple,
  },
  fieldChipText: {
    fontSize: 12,
    color: '#fff',
  },
  fieldChipTextSelected: {
    color: theme.colors.purple,
    fontWeight: '600',
  },
  doneButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  doneButtonText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  analyzingBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    gap: 16,
    backgroundColor: theme.colors.purpleSoft + '30',
    borderRadius: 20,
    marginVertical: 20,
  },
  analyzingIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  analyzingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  analyzingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  followUpContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  followUpTitle: {
    fontSize: 13,
    color: theme.colors.purple,
    fontWeight: '600',
    marginBottom: 10,
  },
  followUpItem: {
    marginBottom: 10,
  },
  followUpQuestion: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  followUpInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 13,
  },
  continueButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.purple,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  continueText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
