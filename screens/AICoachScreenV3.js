import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { haptic } from "../utils/haptics";
import { useChatStore } from "../store/chatStore";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import useAICoachSubmit from "../hooks/useAICoachSubmit";
import theme from "../theme";

// V3: INLINE - Clean inline messages, no bubbles, just text
const MessageBubble = memo(({ message }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.messageRow, { opacity: fadeAnim }]}>
      <Text style={styles.messageLabel}>{message.isAI ? "Coach" : "You"}</Text>
      <Text style={message.isAI ? styles.aiText : styles.userText}>{message.text}</Text>
    </Animated.View>
  );
});

MessageBubble.displayName = "MessageBubbleV3";

export default function AICoachScreenV3() {
  useStatusBar(theme.colors.screenBackground);
  const navigation = useNavigation();
  const { getCurrentChat, addMessage, createNewChat, selectChat, currentChatId, loadChats, chats } = useChatStore();

  const [prompt, setPrompt] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  const { sendMessage, loading } = useAICoachSubmit({
    addMessage,
    createNewChat,
    selectChat,
    currentChatId,
  });

  const scrollViewRef = useRef(null);
  const dotAnims = useRef([...Array(3)].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingChats(true);
      try { await loadChats(); } catch (e) { /* ignore */ }
      setIsLoadingChats(false);
    };
    loadData();
  }, [loadChats]);

  useEffect(() => {
    if (isLoadingChats) return;
    if (!currentChatId && chats?.length === 0) {
      const newId = createNewChat();
      if (newId) selectChat(newId);
    } else if (!currentChatId && chats?.length > 0) {
      selectChat(chats[0].id);
    }
  }, [currentChatId, chats, isLoadingChats, createNewChat, selectChat]);

  useEffect(() => {
    if (loading) {
      dotAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 200),
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ])
        ).start();
      });
    } else {
      dotAnims.forEach(anim => anim.setValue(0.3));
    }
  }, [loading]);

  const currentChat = getCurrentChat();
  const messages = useMemo(() => currentChat?.messages || [], [currentChat]);
  const renderedMessages = useMemo(() => messages.filter(m => m?.id && m.id !== "welcome"), [messages]);
  const shouldShowWelcome = !isLoadingChats && renderedMessages.length === 0 && !loading;

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const handleSubmit = useCallback(() => {
    const text = prompt?.trim();
    if (!text || loading) return;
    haptic("light");
    setPrompt("");
    sendMessage(text);
  }, [prompt, loading, sendMessage]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <DynamicSafeAreaView style={styles.screen} backgroundColor={theme.colors.screenBackground}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Feather name="x" size={24} color={theme.colors.textTitle} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Coach</Text>
          <TouchableOpacity
            onPress={() => { haptic("light"); const id = createNewChat(); if (id) selectChat(id); }}
            style={styles.iconButton}
          >
            <Feather name="plus" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {shouldShowWelcome && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>How can I help?</Text>
              <Text style={styles.welcomeSubtitle}>Ask me anything about training, nutrition, or recovery.</Text>
            </View>
          )}

          {renderedMessages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {loading && (
            <View style={styles.messageRow}>
              <Text style={styles.messageLabel}>Coach</Text>
              <View style={styles.loadingDots}>
                {dotAnims.map((anim, i) => (
                  <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask a question..."
              placeholderTextColor={theme.colors.textMuted}
              value={prompt}
              onChangeText={setPrompt}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!prompt.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={!prompt.trim() || loading}
            >
              <Feather name="send" size={18} color={prompt.trim() && !loading ? theme.colors.white : theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </DynamicSafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.screenBackground },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600", color: theme.colors.textTitle },
  divider: { height: 1, backgroundColor: theme.colors.outline, marginHorizontal: 16 },
  messagesContainer: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  welcomeContainer: { paddingBottom: 32 },
  welcomeTitle: { fontSize: 28, fontWeight: "700", color: theme.colors.textTitle, marginBottom: 8 },
  welcomeSubtitle: { fontSize: 16, color: theme.colors.textMuted, lineHeight: 22 },
  messageRow: { marginBottom: 24 },
  messageLabel: { fontSize: 13, fontWeight: "600", color: theme.colors.textMuted, marginBottom: 6 },
  aiText: { fontSize: 16, color: theme.colors.textTitle, lineHeight: 24 },
  userText: { fontSize: 16, color: theme.colors.textTitle, lineHeight: 24, fontWeight: "500" },
  loadingDots: { flexDirection: "row", gap: 6, paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textMuted },
  inputArea: { paddingHorizontal: 16, paddingBottom: Platform.OS === "ios" ? 32 : 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: theme.colors.sectionBackground,
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textTitle,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.textTitle,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { backgroundColor: "transparent" },
});
