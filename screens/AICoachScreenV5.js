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

// V5: LINES - Underline style, ultra minimal, text-focused
const MessageBubble = memo(({ message }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.messageRow, { opacity: fadeAnim }]}>
      <View style={styles.messageLine}>
        <Text style={styles.messagePrefix}>{message.isAI ? "→" : "←"}</Text>
        <Text style={message.isAI ? styles.aiText : styles.userText}>{message.text}</Text>
      </View>
    </Animated.View>
  );
});

MessageBubble.displayName = "MessageBubbleV5";

export default function AICoachScreenV5() {
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
  const cursorAnim = useRef(new Animated.Value(0)).current;

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
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      cursorAnim.setValue(0);
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color={theme.colors.textTitle} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { haptic("light"); const id = createNewChat(); if (id) selectChat(id); }}
            style={styles.newButton}
          >
            <Text style={styles.newButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {shouldShowWelcome && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>coach_</Text>
              <Text style={styles.welcomeSubtitle}>ask anything</Text>
            </View>
          )}

          {renderedMessages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {loading && (
            <View style={styles.messageRow}>
              <View style={styles.messageLine}>
                <Text style={styles.messagePrefix}>→</Text>
                <Animated.Text style={[styles.cursor, { opacity: cursorAnim }]}>|</Animated.Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputPrefix}>{">"}</Text>
            <TextInput
              style={styles.input}
              placeholder="type here"
              placeholderTextColor={theme.colors.textMuted}
              value={prompt}
              onChangeText={setPrompt}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!prompt.trim() || loading}
            >
              <Text style={[styles.sendText, (!prompt.trim() || loading) && styles.sendTextDisabled]}>
                send
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputLine} />
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
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  newButton: { paddingHorizontal: 16, paddingVertical: 8 },
  newButtonText: { fontSize: 15, fontWeight: "500", color: theme.colors.textMuted },
  messagesContainer: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 16 },
  welcomeContainer: { paddingVertical: 60 },
  welcomeTitle: { fontSize: 32, fontWeight: "300", color: theme.colors.textTitle, marginBottom: 4 },
  welcomeSubtitle: { fontSize: 16, color: theme.colors.textMuted },
  messageRow: { marginBottom: 20 },
  messageLine: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  messagePrefix: { fontSize: 16, color: theme.colors.textMuted, marginTop: 2 },
  aiText: { flex: 1, fontSize: 16, color: theme.colors.textTitle, lineHeight: 24 },
  userText: { flex: 1, fontSize: 16, color: theme.colors.textMuted, lineHeight: 24 },
  cursor: { fontSize: 16, color: theme.colors.textTitle },
  inputArea: { paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 32 : 16 },
  inputContainer: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  inputPrefix: { fontSize: 16, color: theme.colors.textMuted },
  input: { flex: 1, fontSize: 16, color: theme.colors.textTitle },
  inputLine: { height: 1, backgroundColor: theme.colors.outline },
  sendText: { fontSize: 15, fontWeight: "500", color: theme.colors.textTitle },
  sendTextDisabled: { color: theme.colors.textMuted },
});
