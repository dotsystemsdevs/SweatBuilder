import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Pressable,
  Modal,
  ActivityIndicator,
  PanResponder,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { haptic } from "../utils/haptics";
import { useChatStore } from "../store/chatStore";
import { useWorkoutStore } from "../store/workoutStore";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import useAICoachSubmit from "../hooks/useAICoachSubmit";
import { isRestDay, getWorkoutByDate } from "../__mocks__/workoutData";
import { WORKOUT_STATUS } from "../constants/appConstants";
import theme from "../theme";

// Quick prompt button - outline default, fills purple on press
const QuickPromptButton = memo(({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
      <Animated.View
        style={[
          styles.quickPromptChip,
          isPressed && styles.quickPromptChipPressed,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.quickPromptText, isPressed && styles.quickPromptTextPressed]}>
          {item.text}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

QuickPromptButton.displayName = "QuickPromptButton";

// AI Message Bubble - Minimal glassmorphic design (no avatar)
const MessageBubble = memo(({ message, onCopy, showCopied }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 12,
      }),
    ]).start();
  }, []);

  const handleLongPress = useCallback(() => {
    if (message.isAI) {
      haptic("impactMedium");
      onCopy(message.text, message.id);
    }
  }, [message, onCopy]);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        message.isAI ? styles.aiMessageContainer : styles.userMessageContainer,
        { opacity: opacityAnim, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={message.isAI ? handleLongPress : undefined}
        delayLongPress={350}
        disabled={!message.isAI}
      >
        <View style={[styles.bubble, message.isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.bubbleText, message.isAI ? styles.aiText : styles.userText]}>
            {message.text}
          </Text>
          {message.isAI && showCopied === message.id && (
            <View style={styles.copiedIndicator}>
              <Feather name="check" size={10} color={theme.colors.green} />
              <Text style={styles.copiedText}>Copied</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

MessageBubble.displayName = "MessageBubble";

// Typing indicator - minimal dots
const TypingIndicator = memo(() => {
  const dots = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const dotAnims = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 120),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      )
    );
    dotAnims.forEach((a) => a.start());
    return () => dotAnims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={[styles.messageContainer, styles.aiMessageContainer]}>
      <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
        <View style={styles.dotsRow}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.typingDot,
                {
                  opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                  transform: [
                    { translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
});

TypingIndicator.displayName = "TypingIndicator";

// Helper: Get relative time label - human readable
const getRelativeTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "Last week";
  return `${Math.floor(diffDays / 7)} weeks ago`;
};

// Helper: Get first user message as preview (not AI response)
const getPreviewText = (messages) => {
  if (!messages?.length) return null; // Return null for empty chats
  const userMsg = messages.find(m => m && !m.isAI);
  if (userMsg) return userMsg.text?.slice(0, 35) + (userMsg.text?.length > 35 ? "..." : "");
  return null; // Return null if no user messages
};

// Helper: Check if chat has actual content
const hasContent = (messages) => {
  return messages?.some(m => m && !m.isAI);
};

// Chat list item - minimal Apple-style with swipe to delete
const ChatItem = memo(({ chat, isActive, onSelect, onDelete }) => {
  const chatIsEmpty = !hasContent(chat.messages);
  const translateX = useRef(new Animated.Value(0)).current;
  const [showDelete, setShowDelete] = useState(false);

  // Don't render empty chats unless they're the active one
  if (chatIsEmpty && !isActive) return null;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -40) {
          Animated.spring(translateX, {
            toValue: -70,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          setShowDelete(true);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          setShowDelete(false);
        }
      },
    })
  ).current;

  const handleDelete = () => {
    haptic("impactMedium");
    Animated.timing(translateX, {
      toValue: -300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDelete(chat.id);
    });
  };

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setShowDelete(false);
  };

  return (
    <View style={styles.chatItemWrapper}>
      {/* Delete button behind */}
      {showDelete && (
        <TouchableOpacity
          style={styles.chatItemDeleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={[{ transform: [{ translateX }] }]}
      >
        <TouchableOpacity
          style={[
            styles.chatItem,
            isActive && styles.chatItemActive,
            chatIsEmpty && styles.chatItemEmpty,
          ]}
          onPress={() => {
            if (showDelete) {
              resetSwipe();
            } else {
              onSelect();
            }
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chatItemTitle,
              isActive && styles.chatItemTitleActive,
              chatIsEmpty && styles.chatItemTitleEmpty,
            ]}
            numberOfLines={1}
          >
            {chatIsEmpty ? "New chat" : chat.title}
          </Text>
          {!chatIsEmpty && (
            <Text style={styles.chatItemTime}>
              {getRelativeTime(chat.updatedAt)}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

ChatItem.displayName = "ChatItem";

// Get contextual greeting based on workout status
const getContextualGreeting = (todayStatus, todayWorkout, lastSkippedWorkout) => {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  switch (todayStatus) {
    case "skipped":
      return {
        emoji: "💭",
        title: lastSkippedWorkout
          ? `Missed ${lastSkippedWorkout.title}?`
          : "Missed a session?",
        subtitle: "Let's adjust your plan",
      };
    case "rest":
      return {
        emoji: "😌",
        title: "Rest day",
        subtitle: "Recovery is part of the plan",
      };
    case "completed":
      return {
        emoji: "💪",
        title: "Nice work today!",
        subtitle: "How did it feel?",
      };
    default: // planned
      return {
        emoji: "👋",
        title: todayWorkout
          ? `Ready for ${todayWorkout.title}?`
          : `Good ${timeGreeting}`,
        subtitle: todayWorkout
          ? `${todayWorkout.duration} • ${todayWorkout.exercises?.length || 0} exercises`
          : "How can I help you today?",
      };
  }
};

// Get contextual placeholder based on workout status
const getInputPlaceholder = (todayStatus, todayWorkout) => {
  switch (todayStatus) {
    case "skipped":
      return "Ask about rescheduling...";
    case "rest":
      return "Ask about recovery...";
    case "completed":
      return "Reflect on your session...";
    default:
      return todayWorkout
        ? `Ask about ${todayWorkout.title.toLowerCase()}...`
        : "Ask about today's session...";
  }
};

export default function AICoachScreenOptimal({ route }) {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { workoutHistory } = useWorkoutStore();
  const {
    getCurrentChat,
    addMessage,
    createNewChat,
    selectChat,
    deleteChat,
    currentChatId,
    loadChats,
    chats,
  } = useChatStore();

  // Get initial prompt from navigation params (from Goal card tap)
  const initialPrompt = route?.params?.prompt;

  const [prompt, setPrompt] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showChatList, setShowChatList] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const { sendMessage, loading, error, errorMessage, setError } = useAICoachSubmit({
    addMessage,
    createNewChat,
    selectChat,
    currentChatId,
  });

  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const copiedTimeoutRef = useRef(null);
  const chatListAnim = useRef(new Animated.Value(0)).current;
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const welcomeSlide = useRef(new Animated.Value(20)).current;
  const sidebarSlideX = useRef(new Animated.Value(300)).current;

  // Sidebar swipe-to-close
  const sidebarPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 10 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          sidebarSlideX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80 || gestureState.vx > 0.5) {
          closeSidebar();
        } else {
          Animated.spring(sidebarSlideX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const openSidebar = useCallback(() => {
    setShowChatList(true);
    Animated.spring(sidebarSlideX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, []);

  const closeSidebar = useCallback(() => {
    Animated.timing(sidebarSlideX, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowChatList(false);
    });
  }, []);

  // Get real workout status from store and schedule
  const { todayStatus, todayWorkout, lastSkippedWorkout } = useMemo(() => {
    const today = new Date();
    const workout = getWorkoutByDate(today);
    const isRest = isRestDay(today);

    // Check if today is completed or skipped
    const todayEntry = workoutHistory.find(w => {
      const wDate = new Date(w.date);
      return wDate.toDateString() === today.toDateString();
    });

    // Find last skipped workout (for context)
    const lastSkipped = workoutHistory
      .filter(w => w.status === WORKOUT_STATUS.SKIPPED)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let status = "planned";
    if (isRest) status = "rest";
    else if (todayEntry?.status === WORKOUT_STATUS.COMPLETED) status = "completed";
    else if (todayEntry?.status === WORKOUT_STATUS.SKIPPED) status = "skipped";
    else if (lastSkipped && (new Date() - new Date(lastSkipped.date)) < 48 * 60 * 60 * 1000) {
      // If skipped within last 48h, show skipped context
      status = "skipped";
    }

    return {
      todayStatus: status,
      todayWorkout: workout,
      lastSkippedWorkout: lastSkipped?.workout,
    };
  }, [workoutHistory]);

  // Get contextual greeting and placeholder
  const greeting = useMemo(
    () => getContextualGreeting(todayStatus, todayWorkout, lastSkippedWorkout),
    [todayStatus, todayWorkout, lastSkippedWorkout]
  );
  const inputPlaceholder = useMemo(
    () => getInputPlaceholder(todayStatus, todayWorkout),
    [todayStatus, todayWorkout]
  );

  // Dynamic quick prompts based on workout status
  const quickPrompts = useMemo(() => {
    switch (todayStatus) {
      case "rest":
        return [
          { text: "Recovery protocol" },
          { text: "Active recovery" },
          { text: "Upcoming session" },
          { text: "Mobility routine" },
        ];
      case "missed":
        return [
          { text: "Revise plan" },
          { text: "Alternative session" },
          { text: "Reschedule" },
          { text: "Refocus strategy" },
        ];
      case "completed":
        return [
          { text: "Session review" },
          { text: "Recovery protocol" },
          { text: "Next session prep" },
          { text: "Progress metrics" },
        ];
      default: // planned
        return [
          { text: "Session guidance" },
          { text: "Warm-up protocol" },
          { text: "Modify session" },
          { text: "Technique check" },
        ];
    }
  }, [todayStatus]);


  useEffect(() => {
    const loadData = async () => {
      setIsLoadingChats(true);
      try {
        await loadChats();
      } catch (e) {}
      setIsLoadingChats(false);
    };
    loadData();
  }, [loadChats]);

  // Always start with a fresh chat (welcome screen)
  useEffect(() => {
    if (isLoadingChats) return;
    if (!currentChatId) {
      const newId = createNewChat();
      if (newId) selectChat(newId);
    }
  }, [isLoadingChats]);

  // Handle initial prompt from navigation (e.g., from Goal card)
  useEffect(() => {
    if (initialPrompt && !isLoadingChats && currentChatId) {
      // Small delay to ensure chat is ready
      const timer = setTimeout(() => {
        sendMessage(initialPrompt);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, isLoadingChats, currentChatId]);


  useEffect(() => {
    Animated.spring(chatListAnim, {
      toValue: showChatList ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [showChatList]);

  const currentChat = getCurrentChat();
  const messages = useMemo(() => currentChat?.messages || [], [currentChat]);

  // Check if user has sent any messages (not just AI welcome)
  const hasUserMessages = useMemo(
    () => messages.some((m) => m && !m.isAI),
    [messages]
  );

  // Filter out system welcome messages for rendering
  const renderedMessages = useMemo(
    () => hasUserMessages ? messages.filter((m) => m?.id) : [],
    [messages, hasUserMessages]
  );

  // Show welcome UI if no user messages yet
  const shouldShowWelcome = !isLoadingChats && !hasUserMessages && !loading;

  // Welcome animation
  useEffect(() => {
    if (shouldShowWelcome) {
      welcomeAnim.setValue(0);
      welcomeSlide.setValue(20);
      Animated.parallel([
        Animated.timing(welcomeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(welcomeSlide, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldShowWelcome]);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  const handleSubmit = useCallback(
    (quickPromptText = null) => {
      const text = quickPromptText || prompt?.trim();
      if (!text || loading) return;
      haptic("impactLight");
      setPrompt("");
      sendMessage(text);
    },
    [prompt, loading, sendMessage]
  );

  const handleCopyMessage = useCallback(async (text, messageId) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedMessageId(messageId);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (e) {
      haptic("notificationError");
    }
  }, []);

  const handleNewChat = useCallback(() => {
    haptic("impactLight");
    const id = createNewChat();
    if (id) selectChat(id);
    closeSidebar();
  }, [createNewChat, selectChat, closeSidebar]);

  const handleSelectChat = useCallback(
    (chatId) => {
      haptic("impactLight");
      selectChat(chatId);
      closeSidebar();
    },
    [selectChat, closeSidebar]
  );

  const handleDeleteChat = useCallback(
    async (chatId) => {
      await deleteChat(chatId);
      // If we deleted the current chat, select the first available
      if (chatId === currentChatId && chats.length > 1) {
        const nextChat = chats.find(c => c.id !== chatId);
        if (nextChat) selectChat(nextChat.id);
      }
    },
    [deleteChat, currentChatId, chats, selectChat]
  );

  return (
    <DynamicSafeAreaView style={styles.screen} backgroundColor={theme.colors.background}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => {
                haptic("impactLight");
                navigation.navigate("Home");
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerTitleIcon}>
                <MaterialCommunityIcons name="robot-outline" size={18} color={theme.colors.purple} />
              </View>
              <Text style={styles.headerTitle}>AI Coach</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              haptic("impactLight");
              openSidebar();
            }}
            style={styles.menuButton}
            activeOpacity={0.7}
            accessibilityLabel="Chat history"
          >
            <Feather name="clock" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sidebar Panel */}
        <Modal
          visible={showChatList}
          transparent
          animationType="fade"
          onRequestClose={closeSidebar}
          statusBarTranslucent
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <View style={styles.sidebarOverlay}>
            {/* Backdrop - lighter */}
            <Pressable
              style={styles.sidebarBackdrop}
              onPress={closeSidebar}
            />

            {/* Panel with swipe gesture - minimal Apple style */}
            <Animated.View
              style={[
                styles.sidebarPanel,
                { transform: [{ translateX: sidebarSlideX }], paddingTop: insets.top }
              ]}
              {...sidebarPanResponder.panHandlers}
            >
              {/* Top bar with new chat and close */}
              <View style={styles.sidebarTopBar}>
                <TouchableOpacity
                  style={styles.sidebarNewButton}
                  onPress={handleNewChat}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sidebarCloseButton}
                  onPress={() => {
                    haptic("impactLight");
                    closeSidebar();
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Chat list */}
              <ScrollView
                style={styles.sidebarChatList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sidebarChatListContent}
              >
                {chats?.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === currentChatId}
                    onSelect={() => handleSelectChat(chat.id)}
                    onDelete={handleDeleteChat}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Content area */}
        <View style={styles.contentArea}>
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {/* Loading state */}
          {isLoadingChats && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.purple} />
            </View>
          )}

          {/* Welcome State - Contextual and focused */}
          {shouldShowWelcome && (
            <Animated.View
              style={[
                styles.welcomeContainer,
                {
                  opacity: welcomeAnim,
                  transform: [{ translateY: welcomeSlide }],
                },
              ]}
            >
              {/* Context-aware emoji */}
              <Text style={styles.welcomeEmoji}>{greeting.emoji}</Text>

              {/* Contextual greeting */}
              <Text style={styles.welcomeTitle}>{greeting.title}</Text>
              <Text style={styles.welcomeSubtitle}>
                {greeting.subtitle}
              </Text>

              {/* Proactive coach hint when relevant */}
              {todayStatus === "skipped" && lastSkippedWorkout && (
                <TouchableOpacity
                  style={styles.proactiveHint}
                  onPress={() => handleSubmit("Help me reschedule my missed workout")}
                  activeOpacity={0.7}
                >
                  <Feather name="refresh-cw" size={14} color={theme.colors.purple} />
                  <Text style={styles.proactiveHintText}>
                    Tap to reschedule
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          {/* Messages */}
          {renderedMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onCopy={handleCopyMessage}
              showCopied={copiedMessageId}
            />
          ))}

          {loading && <TypingIndicator />}

          {/* Error with retry */}
          {error && errorMessage && (
            <View style={styles.errorContainer}>
              <View style={styles.errorBubble}>
                <View style={styles.errorTop}>
                  <Feather name="alert-circle" size={16} color={theme.colors.red} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
                <View style={styles.errorActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setError(false);
                      // Get last user message and retry
                      const lastUserMsg = [...messages].reverse().find(m => m && !m.isAI);
                      if (lastUserMsg?.text) {
                        sendMessage(lastUserMsg.text);
                      }
                    }}
                    style={styles.errorRetry}
                    accessibilityLabel="Retry sending message"
                    accessibilityRole="button"
                  >
                    <Feather name="refresh-cw" size={12} color={theme.colors.red} />
                    <Text style={styles.errorRetryText}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setError(false)}
                    style={styles.errorDismiss}
                    accessibilityLabel="Dismiss error"
                    accessibilityRole="button"
                  >
                    <Text style={styles.errorDismissText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Prompts - always visible in welcome state */}
        {shouldShowWelcome && !loading && (
          <Animated.View
            style={[
              styles.quickPromptsContainer,
              {
                opacity: welcomeAnim,
                transform: [{ translateY: welcomeSlide }],
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPromptsRow}
            >
              {quickPrompts.map((item, i) => (
                <QuickPromptButton
                  key={i}
                  item={item}
                  onPress={() => {
                    haptic("impactMedium");
                    handleSubmit(item.text);
                  }}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={[styles.inputContainer, inputFocused && styles.inputContainerFocused]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={inputPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={prompt}
              onChangeText={(t) => t.length <= 500 && setPrompt(t)}
              onFocus={() => {
                setInputFocused(true);
                setShowChatList(false);
              }}
              onBlur={() => setInputFocused(false)}
              onSubmitEditing={() => handleSubmit()}
              returnKeyType="send"
              maxLength={500}
              accessibilityLabel="Message input"
              accessibilityHint="Type your message to the AI Coach"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!prompt.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => handleSubmit()}
              disabled={!prompt.trim() || loading}
              activeOpacity={0.7}
              accessibilityLabel="Send message"
              accessibilityRole="button"
              accessibilityState={{ disabled: !prompt.trim() || loading }}
            >
              <Feather
                name="arrow-up"
                size={20}
                color={prompt.trim() && !loading ? theme.colors.white : theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
        </View>

    </DynamicSafeAreaView>
  );
}


const styles = StyleSheet.create({
  contentArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header - matches app pattern
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  headerTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.purpleSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Sidebar Panel - minimal Apple style
  sidebarOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  sidebarPanel: {
    width: 260,
    backgroundColor: theme.colors.background,
  },
  sidebarTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  sidebarNewButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
  },
  sidebarCloseButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarChatList: {
    flex: 1,
  },
  sidebarChatListContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  chatItemWrapper: {
    position: "relative",
    marginBottom: theme.spacing.xs,
  },
  chatItemDeleteButton: {
    position: "absolute",
    right: theme.spacing.sm,
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: theme.colors.red,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    backgroundColor: "transparent",
    borderRadius: theme.radius.sm,
  },
  chatItemActive: {
    backgroundColor: theme.colors.surface,
  },
  chatItemEmpty: {
    opacity: 0.5,
  },
  chatItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: theme.colors.textSecondary,
    letterSpacing: -0.1,
  },
  chatItemTitleActive: {
    color: theme.colors.text,
    fontWeight: "500",
  },
  chatItemTitleEmpty: {
    color: theme.colors.textMuted,
    fontStyle: "italic",
  },
  chatItemTime: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
  },

  // Messages - matches app screen padding
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxl,
  },
  messageContainer: {
    marginBottom: theme.spacing.sm,
  },
  aiMessageContainer: {
    alignItems: "flex-start",
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  aiBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
    borderBottomLeftRadius: theme.radius.xs,
  },
  userBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.xs,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiText: {
    color: theme.colors.text,
  },
  userText: {
    color: theme.colors.text,
  },
  copiedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: theme.spacing.sm,
    opacity: 0.7,
  },
  copiedText: {
    fontSize: 11,
    color: theme.colors.green,
    fontWeight: "500",
  },

  // Typing indicator - flat
  typingBubble: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 5,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textMuted,
  },

  // Welcome - Clean and minimal
  welcomeContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  proactiveHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.purpleSoft,
    borderRadius: theme.radius.full,
  },
  proactiveHintText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.purple,
  },

  // Error - Subtle inline
  errorContainer: {
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  errorBubble: {
    backgroundColor: theme.colors.redSoft,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
    gap: theme.spacing.sm,
  },
  errorTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.red,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  errorRetry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: theme.radius.sm,
  },
  errorRetryText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.red,
  },
  errorDismiss: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
  },
  errorDismissText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(239, 68, 68, 0.7)",
  },

  // Quick Prompts - pill style
  quickPromptsContainer: {
    paddingBottom: theme.spacing.md,
  },
  quickPromptsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  quickPromptChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickPromptChipPressed: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.purple,
  },
  quickPromptText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  quickPromptTextPressed: {
    color: theme.colors.black,
    fontWeight: "600",
  },

  // Input - stable layout, no jumping
  inputArea: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
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
  inputContainerFocused: {
    borderColor: theme.colors.purple,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    paddingRight: theme.spacing.sm,
    paddingVertical: 0,
    textAlignVertical: "center",
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
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
